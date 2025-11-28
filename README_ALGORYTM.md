# Jak działa rozpoznawanie polskich tablic rejestracyjnych

## Podsumowanie w jednym zdaniu

**Wrzucasz zdjęcie → filtrujemy śmieci → zostawiamy tylko litery → Tesseract je czyta → sprawdzamy czy to polska tablica.**

---

## Krok 1: Wczytanie obrazu

```
Użytkownik wybiera plik → ładujemy go do elementu <canvas>
```

Po prostu bierzemy zdjęcie i rysujemy je na płótnie (canvas), żeby móc manipulować pikselami.

---

## Krok 2: Zamiana na odcienie szarości (Grayscale)

```
Kolorowy obraz → szary obraz
```

Każdy piksel ma 3 wartości: R (czerwony), G (zielony), B (niebieski).
Zamieniamy je na jedną wartość szarości wzorem:

```
Szarość = 0.299 × R + 0.587 × G + 0.114 × B
```

**Dlaczego takie wagi?** Bo ludzkie oko jest najbardziej wrażliwe na zieleń, mniej na czerwień, najmniej na niebieski.

**Wynik:** Obraz z wartościami 0-255 (0 = czarny, 255 = biały).

---

## Krok 3: Otsu Threshold (automatyczny próg)

```
Szary obraz → czarno-biały obraz
```

**Problem:** Musimy zdecydować, co jest "ciemne" (tekst), a co "jasne" (tło). Ale jaki próg wybrać? 100? 150? 200?

**Otsu:** Algorytm automatycznie znajduje najlepszy próg.

**Jak działa (uproszczenie)?**

1. Testuje wszystkie możliwe progi (0-255)
2. Dla każdego progu dzieli piksele na 2 grupy: "ciemne" i "jasne"
3. Wybiera próg, który najlepiej rozdziela te grupy (maksymalna różnica między średnimi)

**Wynik:** Np. próg = 127. Wszystko poniżej = czarne, powyżej = białe.

---

## Krok 4: Binaryzacja z inwersją

```
Szary obraz + próg → czarno-biały obraz
```

Dla każdego piksela:

- Jeśli szarość < próg → piksel = **BIAŁY** (255)
- Jeśli szarość >= próg → piksel = **CZARNY** (0)

**Uwaga:** Robimy inwersję! Ciemny tekst staje się biały, jasne tło staje się czarne.

**Dlaczego?** OCR lepiej działa z białym tekstem na czarnym tle.

---

## Krok 5: Connected Components (szukanie regionów)

```
Czarno-biały obraz → każdy "blob" (plama) dostaje numer
```

**Problem:** Mamy biały tekst, ale też białe śmieci (odbicia, ramka tablicy, inne elementy).

**Connected Components:** Algorytm przechodzi przez cały obraz i nadaje każdej "plamie" białych pikseli unikalny numer.

```
Przykład:
  ■■■    ■■
  ■ ■    ■■     →   111  22
  ■■■           →   1 1  22
                    111
```

Plama 1 = "O", Plama 2 = jakiś śmieć.

**Jak działa?**

1. Przechodzimy piksel po pikselu (od lewej-góry)
2. Jeśli piksel jest biały:
   - Sprawdź czy sąsiad z góry lub z lewej ma już etykietę
   - Jeśli tak → weź tę samą etykietę
   - Jeśli nie → nadaj nową etykietę
3. Jeśli sąsiad z góry i z lewej mają różne etykiety → połącz je (Union-Find)

---

## Krok 6: Filtrowanie regionów (zostawiamy tylko litery)

```
Wszystkie plamy → tylko te o kształcie liter
```

Dla każdej plamy obliczamy:

- **Bounding box** - prostokąt okalający (minX, maxX, minY, maxY)
- **Szerokość i wysokość** tego prostokąta
- **Aspect ratio** = szerokość / wysokość
- **Rozmiar** = liczba pikseli

**Warunki dla litery:**
| Warunek | Wartość | Dlaczego? |
|---------|---------|-----------|
| Aspect ratio | 0.2 - 2.0 | Litery nie są ani ekstremalnie wąskie, ani szerokie |
| Względna wysokość | 5% - 80% obrazu | Litery na tablicy mają rozsądny rozmiar |
| Minimalny rozmiar | 0.05% obrazu | Odrzucamy drobny szum |
| Maksymalny rozmiar | 15% obrazu | Odrzucamy wielkie plamy (tło tablicy) |

**Wynik:** Zostają tylko regiony, które wyglądają jak litery.

---

## Krok 7: Generowanie obrazu dla OCR

```
Oryginalne piksele → czarne tło + białe litery
```

Przechodzimy przez każdy piksel:

- Jeśli należy do "ważnego" regionu → biały
- W przeciwnym razie → czarny

**Wynik:** Czyste, czarno-białe zdjęcie tylko z literami.

---

## Krok 8: Tesseract OCR

```
Obraz → tekst
```

Tesseract.js to biblioteka OCR (Optical Character Recognition). Bierze nasz przetworzony obraz i zwraca tekst.

**Ustawienia:**

- Język: angielski (litery A-Z działają tak samo)
- Whitelist: `ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789` - ignoruj wszystko inne

**Wynik:** Np. `"WA 12345"` lub `"0A12345"` (może być błąd!)

---

## Krok 9: Walidacja polskiej tablicy

```
Surowy tekst → poprawny numer tablicy lub null
```

**Regex dla polskich tablic:**

```
/^[A-Z]{2,3}[A-Z0-9]{2,5}$/
```

**Co to znaczy?**

- 2-3 litery na początku (prefiks powiatu/miasta)
- 2-5 znaków alfanumerycznych

**Przykłady poprawnych:**

- `WA12345` ✓
- `ZSW1234` ✓
- `SK5AB12` ✓

---

## Krok 10: Korekta błędów OCR

```
Cyfry pomylone z literami → poprawione
```

**Problem:** OCR często myli:

- `0` z `O`
- `1` z `I` lub `L`
- `8` z `B`
- itd.

**Rozwiązanie:** Prefiks (pierwsze 2-3 znaki) MUSI być literami. Jeśli jest tam cyfra, zamieniamy ją na najpodobniejszą literę:

| Cyfra | Litera |
| ----- | ------ |
| 0     | O      |
| 1     | I      |
| 2     | Z      |
| 4     | A      |
| 5     | S      |
| 6     | G      |
| 7     | T      |
| 8     | B      |
| 9     | G      |

**Przykład:**

- OCR zwrócił: `0A12345`
- Prefix `0A` zawiera cyfrę → zamieniamy `0` na `O`
- Wynik: `OA12345` ✓

---

## Diagram przepływu

```
┌──────────────┐
│   Zdjęcie    │
└──────┬───────┘
       ↓
┌──────────────┐
│  Grayscale   │  ← Kolory → Szarość
└──────┬───────┘
       ↓
┌──────────────┐
│    Otsu      │  ← Znajdź optymalny próg
└──────┬───────┘
       ↓
┌──────────────┐
│ Binaryzacja  │  ← Szary → Czarno-biały
└──────┬───────┘
       ↓
┌──────────────┐
│  Connected   │  ← Znajdź wszystkie plamy
│  Components  │
└──────┬───────┘
       ↓
┌──────────────┐
│  Filtrowanie │  ← Zostaw tylko kształty liter
└──────┬───────┘
       ↓
┌──────────────┐
│  Tesseract   │  ← Obraz → Tekst
│     OCR      │
└──────┬───────┘
       ↓
┌──────────────┐
│  Walidacja   │  ← Sprawdź regex + popraw błędy
│     PL       │
└──────┬───────┘
       ↓
┌──────────────┐
│   Wynik!     │
└──────────────┘
```

---

## Słowniczek

| Termin                   | Znaczenie                                                     |
| ------------------------ | ------------------------------------------------------------- |
| **Canvas**               | Element HTML do rysowania i manipulowania pikselami           |
| **Grayscale**            | Obraz w odcieniach szarości (bez kolorów)                     |
| **Threshold**            | Próg - wartość graniczna do podziału                          |
| **Binaryzacja**          | Zamiana obrazu na czarno-biały (tylko 0 lub 255)              |
| **Connected Components** | Algorytm do znajdowania połączonych grup pikseli              |
| **Bounding Box**         | Prostokąt okalający obiekt                                    |
| **Aspect Ratio**         | Stosunek szerokości do wysokości                              |
| **OCR**                  | Optical Character Recognition - rozpoznawanie tekstu z obrazu |
| **Regex**                | Wyrażenie regularne - wzorzec do dopasowania tekstu           |

---

## Podsumowanie

1. **Grayscale** - upraszczamy obraz do jednego kanału
2. **Otsu** - automatycznie znajdujemy próg jasność/ciemność
3. **Binaryzacja** - dzielimy na czarne i białe
4. **Connected Components** - znajdujemy plamy
5. **Filtrowanie** - zostawiamy tylko te o kształcie liter
6. **Tesseract** - czytamy tekst
7. **Walidacja** - sprawdzamy i poprawiamy

**Koniec!** 🎉
