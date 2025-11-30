export function preprocessImage(
  file: File,
): Promise<{ canvas: HTMLCanvasElement; debugUrl: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement("canvas");
      const w = img.width;
      const h = img.height;
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, w, h);
      const data = imageData.data;

      // 1. GRAYSCALE - zamień na odcienie szarości
      const gray = new Uint8Array(w * h);
      for (let i = 0; i < data.length; i += 4) {
        gray[i / 4] = Math.round(
          0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2],
        );
      }

      // 2. OTSU THRESHOLD - znajdź optymalny próg binaryzacji
      const threshold = otsuThreshold(gray);

      // 3. BINARYZACJA - czarny tekst na białym tle -> biały tekst na czarnym tle
      const binary = new Uint8Array(w * h);
      for (let i = 0; i < gray.length; i++) {
        binary[i] = gray[i] < threshold ? 255 : 0;
      }

      // 4. CONNECTED COMPONENTS - znajdź i ofiltruj regiony (tylko litery)
      const labels = connectedComponents(binary, w, h);
      const validRoots = filterLetterRegions(labels, w, h);

      // 5. WYNIK - czarne tło, białe litery
      for (let i = 0; i < data.length; i += 4) {
        const v = validRoots.has(labels[i / 4]) ? 255 : 0;
        data[i] = data[i + 1] = data[i + 2] = v;
        data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);

      resolve({ canvas, debugUrl: canvas.toDataURL("image/png") });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// Otsu - automatyczny próg binaryzacji
export function otsuThreshold(gray: Uint8Array): number {
  const hist = new Array(256).fill(0);
  for (const v of gray) hist[v]++;

  const total = gray.length;
  let sum = 0;
  for (let t = 0; t < 256; t++) sum += t * hist[t];

  let sumB = 0,
    wB = 0,
    varMax = 0,
    threshold = 128;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (wB === 0) continue;
    const wF = total - wB;
    if (wF === 0) break;
    sumB += t * hist[t];
    const varBetween = wB * wF * (sumB / wB - (sum - sumB) / wF) ** 2;
    if (varBetween > varMax) {
      varMax = varBetween;
      threshold = t;
    }
  }
  return threshold;
}

// Connected Components (Union-Find)
export function connectedComponents(
  binary: Uint8Array,
  w: number,
  h: number,
): Int32Array {
  const labels = new Int32Array(w * h);
  const parent: number[] = [0];
  let label = 0;

  const find = (x: number): number => {
    while (parent[x] !== x) {
      parent[x] = parent[parent[x]];
      x = parent[x];
    }
    return x;
  };

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const idx = y * w + x;
      if (binary[idx] === 0) continue;
      const up = y > 0 ? labels[idx - w] : 0;
      const left = x > 0 ? labels[idx - 1] : 0;
      if (up === 0 && left === 0) {
        label++;
        labels[idx] = label;
        parent.push(label);
      } else if (up && !left) {
        labels[idx] = up;
      } else if (!up && left) {
        labels[idx] = left;
      } else {
        labels[idx] = up;
        if (up !== left) parent[find(up)] = find(left);
      }
    }
  }

  // Flatten labels
  for (let i = 0; i < labels.length; i++) {
    if (labels[i]) labels[i] = find(labels[i]);
  }
  return labels;
}

// Filtruj regiony - zachowaj tylko te o kształcie liter
export function filterLetterRegions(
  labels: Int32Array,
  w: number,
  h: number,
): Set<number> {
  const bounds = new Map<
    number,
    { minX: number; maxX: number; minY: number; maxY: number; size: number }
  >();

  for (let i = 0; i < labels.length; i++) {
    const root = labels[i];
    if (!root) continue;
    const x = i % w,
      y = Math.floor(i / w);
    const b = bounds.get(root) || {
      minX: x,
      maxX: x,
      minY: y,
      maxY: y,
      size: 0,
    };
    b.minX = Math.min(b.minX, x);
    b.maxX = Math.max(b.maxX, x);
    b.minY = Math.min(b.minY, y);
    b.maxY = Math.max(b.maxY, y);
    b.size++;
    bounds.set(root, b);
  }

  const valid = new Set<number>();
  for (const [root, b] of bounds) {
    const bw = b.maxX - b.minX + 1;
    const bh = b.maxY - b.minY + 1;
    const aspect = bw / bh;
    const relHeight = bh / h;
    const minSize = w * h * 0.0005;
    const maxSize = w * h * 0.15;
    // Litery: aspect 0.2-2.0, wysokość 5-80%, rozmiar w zakresie
    if (
      aspect >= 0.2 &&
      aspect <= 2.0 &&
      relHeight >= 0.05 &&
      relHeight <= 0.8 &&
      b.size >= minSize &&
      b.size <= maxSize
    ) {
      valid.add(root);
    }
  }
  return valid;
}
