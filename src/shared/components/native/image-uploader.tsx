import React, { useCallback, useEffect, useRef, useState } from 'react';

interface ImageUploaderProps {
  value?: string; // can be a URL or base64 string
  onChange: (base64: string) => void;
  accept?: string;
  maxSizeMB?: number;
}

export function ImageUploader({ value, onChange, accept = 'image/*', maxSizeMB = 5 }: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(value || null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    setPreview(value || null);
  }, [value]);

  const readFileAsDataURL = useCallback((file: File) => {
    return new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result);
      };
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
    });
  }, []);

  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const file = files[0];
    if (maxSizeMB && file.size > maxSizeMB * 1024 * 1024) {
      // ignore oversize silently (could show warning)
      console.warn(`ImageUploader: file too large (>${maxSizeMB}MB)`);
      return;
    }
    try {
      const dataUrl = await readFileAsDataURL(file);
      setPreview(dataUrl);
      onChange(dataUrl);
    } catch (err) {
      console.error('ImageUploader: error reading file', err);
    }
  }, [maxSizeMB, onChange, readFileAsDataURL]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    handleFiles(e.dataTransfer.files);
  }, [handleFiles]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  }, []);
  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  }, []);

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        className={`w-full flex items-center gap-3 p-2 border rounded-lg ${dragOver ? 'border-blue-300 bg-blue-50' : 'border-gray-200'} `}
        style={{ minHeight: 56 }}
        data-testid="image-uploader-dropzone"
      >
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <div className="text-sm text-gray-600"></div>
              <button
                type="button"
                className="text-sm text-gray-700 hover:underline"
                onClick={() => inputRef.current?.click()}
              >
                selecciona un archivo
              </button>
              <input
                ref={inputRef}
                type="file"
                accept={accept}
                className="hidden"
                onChange={(e) => handleFiles(e.target.files)}
              />
            </div>
            <div>
              {preview ? (
                <div className="w-20 h-20 rounded-md overflow-hidden border border-gray-200">
                  <img src={preview} alt="preview" className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-20 h-20 rounded-md bg-gray-100 border border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400">
                  Previsualización
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {preview && (
        <div className="mt-2 flex items-center gap-2">
          <button
            type="button"
            className="text-xs text-gray-600 hover:underline"
            onClick={() => {
              setPreview(null);
              onChange('');
              if (inputRef.current) inputRef.current.value = '';
            }}
          >
            Eliminar imagen
          </button>
          <span className="text-xs text-gray-500">(Se guardará como Base64)</span>
        </div>
      )}
    </div>
  );
}

export default ImageUploader;
