import { useCallback, useState } from "react";
import { Upload } from "lucide-react";

type OnFileSelect = (file: File) => void | Promise<void>;

interface Props {
  onFileSelect: OnFileSelect;
  disabled?: boolean;
}

export default function ImageUpload({ onFileSelect, disabled }: Props) {
  const [error, setError] = useState<string | null>(null);
  const MAX_SIZE = 3.5 * 1024 * 1024; // 3.5MB in bytes

  const handleChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > MAX_SIZE) {
        setError("Zdjęcie jest za duże (max 3.5MB)");
        return;
      }
      setError(null);
      await onFileSelect(file);
    },
    [onFileSelect]
  );

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      if (file.size > MAX_SIZE) {
        setError("Zdjęcie jest za duże (max 3.5MB)");
        return;
      }
      setError(null);
      await onFileSelect(file);
    },
    [onFileSelect]
  );

  return (
    <label
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`
        flex flex-col items-center justify-center w-full h-48 mb-8
        border-2 border-dashed border-gray-300 rounded-xl
        bg-gray-50 dark:bg-zinc-800 dark:hover:border-zinc-300 dark:border-zinc-500
        cursor-pointer transition-colors
        hover:border-blue-400 hover:bg-blue-50
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
      `}
    >
      <Upload className="w-10 h-10 text-gray-400 mb-2" />
      <p className="text-gray-600 font-medium">Kliknij lub upuść zdjęcie</p>
      <p className="text-gray-400 text-sm">PNG, JPG do 3.5MB</p>
      {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
      <input
        type="file"
        accept="image/*"
        onChange={handleChange}
        disabled={disabled}
        className="hidden"
      />
    </label>
  );
}
