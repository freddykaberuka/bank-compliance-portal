import React, { ChangeEvent } from 'react';

type DocumentUploadProps = {
  file: File | null;
  onFileChange: (event: ChangeEvent<HTMLInputElement>) => void;
  onUpload: () => void;
  uploading: boolean;
  progress: number;
  error: string | null;
  maxSizeBytes: number;
};

const formatFileSize = (size: number) => {
  if (size >= 1_000_000) return `${(size / 1_000_000).toFixed(1)} MB`;
  if (size >= 1_000) return `${(size / 1_000).toFixed(1)} KB`;
  return `${size} B`;
};

export const MAX_FILE_SIZE = 5 * 1024 * 1024;

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  file,
  onFileChange,
  onUpload,
  uploading,
  progress,
  error,
  maxSizeBytes,
}) => {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-gray-900">Upload document</p>
          <p className="mt-1 text-sm text-gray-500">Max file size: {formatFileSize(maxSizeBytes)}.</p>
        </div>
        <button
          type="button"
          onClick={onUpload}
          disabled={uploading || !file}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-300"
        >
          {uploading ? 'Uploading...' : 'Upload'}
        </button>
      </div>

      <div className="mt-4 space-y-3">
        <input
          type="file"
          onChange={onFileChange}
          className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-gray-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-gray-700"
        />

        {file && (
          <div className="rounded-md border border-gray-200 bg-gray-50 p-3 text-sm text-gray-700">
            <div className="flex flex-col gap-1">
              <span className="font-medium text-gray-900">{file.name}</span>
              <span>Size: {formatFileSize(file.size)}</span>
            </div>
          </div>
        )}

        {(error || (!file && !uploading && false)) && <p className="text-sm text-red-600">{error}</p>}

        {uploading && (
          <div className="mt-2">
            <div className="h-2 overflow-hidden rounded-full bg-gray-200">
              <div className="h-full rounded-full bg-blue-600 transition-all" style={{ width: `${progress}%` }} />
            </div>
            <p className="mt-2 text-xs text-gray-500">{progress}% complete</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentUpload;
