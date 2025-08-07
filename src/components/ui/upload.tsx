import React, { useCallback } from 'react';
import { cn } from '@/lib/utils';

interface UploadProps {
  onUpload: (file: File) => void;
  accept?: string;
  className?: string;
  children: React.ReactNode;
  disabled?: boolean;
}

export const Upload: React.FC<UploadProps> = ({
  onUpload,
  accept,
  className,
  children,
  disabled = false
}) => {
  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0 && !disabled) {
      onUpload(files[0]);
    }
  }, [onUpload, disabled]);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0 && !disabled) {
      onUpload(files[0]);
    }
  }, [onUpload, disabled]);

  return (
    <div
      className={cn(
        'relative rounded-lg border-2 border-dashed transition-colors',
        'hover:border-primary/50 focus-within:border-primary',
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className
      )}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
    >
      <input
        type="file"
        accept={accept}
        onChange={handleFileSelect}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={disabled}
      />
      {children}
    </div>
  );
};