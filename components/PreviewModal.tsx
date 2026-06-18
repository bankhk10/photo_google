import { DriveFile } from '@/types';
import { X, Loader2, Download } from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatBytes } from '@/lib/utils';

interface PreviewModalProps {
  file: DriveFile | null;
  onClose: () => void;
}

export function PreviewModal({ file, onClose }: PreviewModalProps) {
  const [loading, setLoading] = useState(true);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!file) return null;

  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isPdf = file.mimeType === 'application/pdf';

  const previewUrl = `/api/files/${file.id}/preview`;
  const downloadUrl = `/api/files/${file.id}/download`;

  // If it's a PDF, we might just open it in a new tab, but we can also iframe it.
  // The requirement says "PDF: Open new tab."
  // Wait, if it's a PDF, `page.tsx` should handle opening it in a new tab. 
  // Let's just handle it here just in case, or render a button.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      <div 
        className="absolute inset-0 bg-black/90 backdrop-blur-sm"
        onClick={onClose}
      />
      
      <div className="relative w-full max-w-6xl max-h-full flex flex-col bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-800 bg-gray-900/50">
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold text-white truncate max-w-xl" title={file.name}>
              {file.name}
            </h3>
            <span className="text-sm text-gray-400">{formatBytes(file.size)}</span>
          </div>
          <div className="flex items-center gap-2">
            <a 
              href={downloadUrl} 
              download
              className="p-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors"
              title="Download"
            >
              <Download className="w-5 h-5" />
            </a>
            <button 
              onClick={onClose}
              className="p-2 bg-gray-800 hover:bg-red-500/20 hover:text-red-400 text-gray-400 rounded-lg transition-colors"
              title="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="relative flex-1 min-h-[50vh] flex items-center justify-center bg-black/50 p-4">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center z-10">
              <Loader2 className="w-10 h-10 text-blue-500 animate-spin" />
            </div>
          )}

          {isImage && (
            <img 
              src={previewUrl} 
              alt={file.name}
              className="max-w-full max-h-[75vh] object-contain relative z-20"
              onLoad={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}

          {isVideo && (
            <video 
              src={previewUrl} 
              controls
              autoPlay
              className="max-w-full max-h-[75vh] relative z-20 outline-none rounded-lg shadow-2xl"
              onLoadedData={() => setLoading(false)}
              onError={() => setLoading(false)}
            />
          )}

          {!isImage && !isVideo && (
            <div className="flex flex-col items-center justify-center text-gray-400 relative z-20">
              <p>Preview not available for this file type.</p>
              <a 
                href={downloadUrl} 
                className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors"
              >
                Download File
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
