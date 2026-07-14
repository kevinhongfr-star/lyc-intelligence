import React, { useState, useRef, useCallback } from 'react';
import {
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  FileSpreadsheet,
  File,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Eye,
  Trash2,
} from 'lucide-react';

export interface UploadFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  previewUrl?: string;
}

export interface FileUploadProps {
  onUpload?: (files: File[]) => void | Promise<void>;
  onFileRemove?: (fileId: string) => void;
  accept?: string;
  maxSizeMB?: number;
  maxFiles?: number;
  multiple?: boolean;
  disabled?: boolean;
  showPreview?: boolean;
  showProgress?: boolean;
  dragAndDrop?: boolean;
  label?: string;
  description?: string;
  className?: string;
}

const FILE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'application/pdf': FileText,
  'image/': ImageIcon,
  'text/csv': FileSpreadsheet,
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': FileSpreadsheet,
  'application/vnd.ms-excel': FileSpreadsheet,
};

function getFileIcon(type: string) {
  for (const [key, Icon] of Object.entries(FILE_ICONS)) {
    if (type.startsWith(key) || type === key) return Icon;
  }
  return File;
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

export function FileUpload({
  onUpload,
  onFileRemove,
  accept = '*/*',
  maxSizeMB = 10,
  maxFiles = 10,
  multiple = true,
  disabled = false,
  showPreview = true,
  showProgress = true,
  dragAndDrop = true,
  label,
  description,
  className = '',
}: FileUploadProps) {
  const [files, setFiles] = useState<UploadFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const validateFile = useCallback((file: File): string | null => {
    const maxSize = maxSizeMB * 1024 * 1024;
    if (file.size > maxSize) {
      return `File too large (max ${maxSizeMB}MB)`;
    }

    if (accept !== '*/*') {
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileType = file.type.toLowerCase();
      const fileName = file.name.toLowerCase();
      const isValid = acceptedTypes.some(type => {
        if (type.startsWith('.')) {
          return fileName.endsWith(type);
        }
        if (type.endsWith('/*')) {
          return fileType.startsWith(type.replace('/*', '/'));
        }
        return fileType === type;
      });
      if (!isValid) {
        return `Invalid file type`;
      }
    }

    return null;
  }, [maxSizeMB, accept]);

  const addFiles = useCallback((newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const remainingSlots = maxFiles - files.length;

    if (remainingSlots <= 0) return;

    const filesToAdd = fileArray.slice(0, remainingSlots).map(file => {
      const error = validateFile(file);
      const uploadFile: UploadFile = {
        id: generateId(),
        file,
        name: file.name,
        size: file.size,
        type: file.type,
        progress: 0,
        status: error ? 'error' : 'pending',
        error: error || undefined,
      };

      if (showPreview && file.type.startsWith('image/')) {
        uploadFile.previewUrl = URL.createObjectURL(file);
      }

      return uploadFile;
    });

    setFiles(prev => [...prev, ...filesToAdd]);

    const validFiles = filesToAdd.filter(f => f.status === 'pending');
    if (validFiles.length > 0 && onUpload) {
      onUpload(validFiles.map(f => f.file));
    }
  }, [maxFiles, files.length, validateFile, showPreview, onUpload]);

  const removeFile = useCallback((id: string) => {
    setFiles(prev => {
      const file = prev.find(f => f.id === id);
      if (file?.previewUrl) {
        URL.revokeObjectURL(file.previewUrl);
      }
      return prev.filter(f => f.id !== id);
    });
    onFileRemove?.(id);
  }, [onFileRemove]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled && dragAndDrop) {
      setIsDragging(true);
    }
  }, [disabled, dragAndDrop]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (!disabled && dragAndDrop && e.dataTransfer.files) {
      addFiles(e.dataTransfer.files);
    }
  }, [disabled, dragAndDrop, addFiles]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }, [addFiles]);

  const handleClick = () => {
    if (!disabled) {
      inputRef.current?.click();
    }
  };

  const FileIcon = ({ file }: { file: UploadFile }) => {
    const Icon = getFileIcon(file.type);
    return <Icon className="w-5 h-5" />;
  };

  return (
    <div className={`space-y-3 ${className}`}>
      {label && (
        <label className="text-sm font-medium text-text-primary">{label}</label>
      )}

      {dragAndDrop ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
          className={`
            relative border-2 border-dashed rounded-none p-8 text-center
            transition-all duration-200 cursor-pointer
            ${isDragging
              ? 'border-primary bg-primary/5'
              : disabled
              ? 'border-border bg-bg-alt cursor-not-allowed opacity-60'
              : 'border-border hover:border-primary/50 hover:bg-bg-alt/50'
            }
          `}
        >
          <input
            ref={inputRef}
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileInput}
            disabled={disabled}
            className="hidden"
          />
          <Upload className={`w-10 h-10 mx-auto mb-3 ${isDragging ? 'text-primary' : 'text-text-muted'}`} />
          <p className="text-sm font-medium text-text-primary mb-1">
            {isDragging ? 'Drop files here' : 'Drag and drop files here'}
          </p>
          <p className="text-xs text-text-muted">
            or <span className="text-primary font-medium">browse</span>
          </p>
          {description && (
            <p className="text-xs text-text-muted mt-2">{description}</p>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleClick}
          disabled={disabled}
          className="w-full px-4 py-2.5 border border-border bg-white hover:bg-bg-alt text-sm font-medium text-text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed rounded-none flex items-center justify-center gap-2"
        >
          <Upload className="w-4 h-4" />
          {label || 'Upload Files'}
        </button>
      )}

      {files.length > 0 && (
        <div className="space-y-2">
          {files.map(file => (
            <div
              key={file.id}
              className={`
                flex items-center gap-3 p-3 border border-border bg-white
                ${file.status === 'error' ? 'border-red-200 bg-red-50' : ''}
              `}
            >
              {showPreview && file.previewUrl ? (
                <img
                  src={file.previewUrl}
                  alt={file.name}
                  className="w-10 h-10 object-cover rounded-none"
                />
              ) : (
                <div className={`w-10 h-10 flex items-center justify-center bg-bg-alt rounded-none ${
                  file.status === 'error' ? 'text-red-500 bg-red-50' :
                  file.status === 'success' ? 'text-green-600 bg-green-50' :
                  'text-text-muted'
                }`}>
                  <FileIcon file={file} />
                </div>
              )}

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text-primary truncate">{file.name}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs text-text-muted">{formatFileSize(file.size)}</span>
                  {file.status === 'error' && file.error && (
                    <span className="text-xs text-red-500 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {file.error}
                    </span>
                  )}
                  {file.status === 'success' && (
                    <span className="text-xs text-green-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Uploaded
                    </span>
                  )}
                </div>
                {showProgress && file.status === 'uploading' && (
                  <div className="mt-2 h-1.5 bg-bg-tertiary rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all duration-200"
                      style={{ width: `${file.progress}%` }}
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1">
                {showPreview && file.previewUrl && file.status === 'success' && (
                  <button
                    type="button"
                    className="p-1.5 hover:bg-bg-alt text-text-muted hover:text-text-primary transition-colors"
                    title="Preview"
                  >
                    <Eye className="w-4 h-4" />
                  </button>
                )}
                {file.status === 'uploading' && (
                  <Loader2 className="w-4 h-4 text-primary animate-spin" />
                )}
                <button
                  type="button"
                  onClick={() => removeFile(file.id)}
                  className="p-1.5 hover:bg-red-50 text-text-muted hover:text-red-500 transition-colors"
                  title="Remove"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default FileUpload;
