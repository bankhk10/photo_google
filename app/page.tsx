"use client";

import { useState, useEffect, useRef, useCallback } from 'react';
import { DriveFile } from '@/types';
import { FileCard } from '@/components/FileCard';
import { PreviewModal } from '@/components/PreviewModal';
import { LogOut, Loader2, Download, X, Search, Database } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { formatBytes, cn } from '@/lib/utils';

export default function Dashboard() {
  const [files, setFiles] = useState<DriveFile[]>([]);
  const [pageToken, setPageToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [error, setError] = useState('');
  const [previewFile, setPreviewFile] = useState<DriveFile | null>(null);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const router = useRouter();

  const loadFiles = async (token?: string) => {
    setLoading(true);
    setError('');
    try {
      const url = token ? `/api/files?pageToken=${token}` : '/api/files';
      const res = await fetch(url);
      const data = await res.json();
      
      if (res.ok) {
        if (token) {
          setFiles(prev => {
            const newFiles = data.files.filter((f: DriveFile) => !prev.some(p => p.id === f.id));
            return [...prev, ...newFiles];
          });
        } else {
          setFiles(data.files);
        }
        setPageToken(data.nextPageToken || null);
        setHasMore(!!data.nextPageToken);
      } else {
        setError(data.error || 'Failed to load files');
      }
    } catch (err) {
      setError('An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles();
  }, []);

  const observer = useRef<IntersectionObserver | null>(null);
  const lastElementRef = useCallback((node: HTMLDivElement | null) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && pageToken) {
        loadFiles(pageToken);
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, pageToken]);

  const handleLogout = async () => {
    await fetch('/api/logout', { method: 'POST' });
    router.push('/login');
    router.refresh();
  };

  const toggleSelect = (id: string, isSelected: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (isSelected) next.add(id);
      else next.delete(id);
      return next;
    });
  };
  
  const selectAll = () => {
    const allVisibleIds = files.map(f => f.id);
    setSelectedIds(new Set(allVisibleIds));
  };
  
  const clearSelection = () => setSelectedIds(new Set());

  const selectedFiles = files.filter(f => selectedIds.has(f.id));
  const totalSize = selectedFiles.reduce((acc, f) => acc + (parseInt(f.size || '0', 10) || 0), 0);
  
  const MAX_FILES = 50;
  const MAX_SIZE = 2 * 1024 * 1024 * 1024; // 2 GB

  const isLimitExceeded = selectedIds.size > MAX_FILES || totalSize > MAX_SIZE;

  const handleDownload = async () => {
    if (selectedIds.size === 0 || isLimitExceeded) return;
    
    setIsDownloading(true);
    try {
      const response = await fetch('/api/files/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileIds: Array.from(selectedIds) }),
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      // Blob approach for streaming the zip
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `archive_${new Date().getTime()}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      
      clearSelection();
    } catch (err) {
      alert('Failed to download ZIP. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePreview = (file: DriveFile) => {
    if (file.mimeType === 'application/pdf') {
      window.open(`/api/files/${file.id}/preview`, '_blank');
    } else {
      setPreviewFile(file);
    }
  };

  return (
    <div className="min-h-screen bg-gray-950 pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-gray-950/80 backdrop-blur-xl border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="bg-blue-500/20 p-2 rounded-lg border border-blue-500/30">
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-cyan-300">
                Archive
              </h1>
            </div>
            <button 
              onClick={handleLogout}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400 hover:text-white hover:bg-gray-800 rounded-md transition-colors"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Actions Bar */}
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-semibold text-white">Your Files</h2>
          <div className="flex gap-4">
            <button 
              onClick={selectAll}
              className="text-sm text-blue-400 hover:text-blue-300 transition-colors"
            >
              Select All Visible
            </button>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl mb-8">
            {error}
          </div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 sm:gap-6">
          {files.map((file, index) => {
            const isLast = index === files.length - 1;
            return (
              <div key={file.id} ref={isLast ? lastElementRef : null}>
                <FileCard
                  file={file}
                  isSelected={selectedIds.has(file.id)}
                  onSelect={toggleSelect}
                  onClick={handlePreview}
                />
              </div>
            );
          })}
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          </div>
        )}

        {/* Empty State */}
        {!loading && files.length === 0 && !error && (
          <div className="flex flex-col items-center justify-center py-32 text-center">
            <div className="bg-gray-900 p-6 rounded-full border border-gray-800 mb-6">
              <Search className="w-12 h-12 text-gray-600" />
            </div>
            <h3 className="text-xl font-semibold text-gray-300">No files found</h3>
            <p className="text-gray-500 mt-2 max-w-md">
              We couldn't find any files in the specified Google Drive folder. Make sure the folder ID is correct.
            </p>
          </div>
        )}
      </main>

      {/* Selection Action Bar (Floating) */}
      <div 
        className={cn(
          "fixed bottom-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500 transform",
          selectedIds.size > 0 ? "translate-y-0 opacity-100" : "translate-y-24 opacity-0 pointer-events-none"
        )}
      >
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-700 shadow-2xl rounded-2xl p-4 flex items-center gap-6 md:gap-12 w-full max-w-4xl">
          <div className="flex items-center gap-4">
            <button 
              onClick={clearSelection}
              className="p-2 hover:bg-gray-800 rounded-full text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <div className="text-white font-semibold flex items-center gap-2">
                <span>{selectedIds.size} Selected</span>
                {selectedIds.size > MAX_FILES && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30">
                    Max 50
                  </span>
                )}
              </div>
              <div className="text-sm flex items-center gap-2">
                <span className={totalSize > MAX_SIZE ? "text-red-400" : "text-gray-400"}>
                  {formatBytes(totalSize)}
                </span>
                {totalSize > MAX_SIZE && (
                  <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-md border border-red-500/30">
                    Exceeds 2GB
                  </span>
                )}
              </div>
            </div>
          </div>
          
          <button
            onClick={handleDownload}
            disabled={isLimitExceeded || isDownloading}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            {isDownloading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
            <span>{isDownloading ? 'Zipping...' : 'Download ZIP'}</span>
          </button>
        </div>
      </div>
      
      <PreviewModal file={previewFile} onClose={() => setPreviewFile(null)} />
    </div>
  );
}
