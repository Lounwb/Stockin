import { useState } from 'react';
import { supabase } from '../lib/supabaseClient';

type ImageUploaderProps = {
  value: string | null;
  onChange: (url: string | null) => void;
  pathPrefix: string;
};

export function ImageUploader({ value, onChange, pathPrefix }: ImageUploaderProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${pathPrefix}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('item-images')
        .upload(filePath, file);
      if (uploadError) {
        setError(uploadError.message);
        return;
      }

      const {
        data: { publicUrl }
      } = supabase.storage.from('item-images').getPublicUrl(filePath);

      onChange(publicUrl);
    } finally {
      setUploading(false);
    }
  };

  const handleClear = () => {
    onChange(null);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-3">
        <label className="inline-flex cursor-pointer items-center rounded-xl border border-dashed border-slate-700 px-3 py-2 text-xs text-slate-300">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
          {uploading ? '上传中...' : '拍照/选择图片'}
        </label>
        {value && (
          <button
            type="button"
            onClick={handleClear}
            className="text-xs text-slate-400 underline"
          >
            移除
          </button>
        )}
      </div>
      {error && <p className="text-xs text-red-400">{error}</p>}
      {value && (
        <div className="overflow-hidden rounded-xl border border-slate-800">
          <img src={value} alt="物品图片" className="h-32 w-full object-cover" />
        </div>
      )}
    </div>
  );
}

