import { DriveFile } from '@/types';
import { formatBytes, cn } from '@/lib/utils';
import { format } from 'date-fns';
import { FileIcon, ImageIcon, VideoIcon, FileTextIcon } from 'lucide-react';

interface FileCardProps {
  file: DriveFile;
  isSelected: boolean;
  onSelect: (id: string, selected: boolean) => void;
  onClick: (file: DriveFile) => void;
}

export function FileCard({ file, isSelected, onSelect, onClick }: FileCardProps) {
  const isImage = file.mimeType.startsWith('image/');
  const isVideo = file.mimeType.startsWith('video/');
  const isPdf = file.mimeType === 'application/pdf';

  const getIcon = () => {
    if (isImage) return <ImageIcon className="w-10 h-10 text-gray-500" />;
    if (isVideo) return <VideoIcon className="w-10 h-10 text-gray-500" />;
    if (isPdf) return <FileTextIcon className="w-10 h-10 text-gray-500" />;
    return <FileIcon className="w-10 h-10 text-gray-500" />;
  };

  return (
    <div 
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-xl border transition-all duration-300",
        "hover:shadow-xl hover:-translate-y-1 cursor-pointer",
        isSelected 
          ? "border-blue-500 bg-blue-500/10 shadow-lg shadow-blue-500/20" 
          : "border-gray-800 bg-gray-900/50 hover:bg-gray-800"
      )}
      onClick={() => onClick(file)}
    >
      <div className="absolute top-3 left-3 z-20">
        <div 
          className={cn(
            "rounded-md border p-0.5 backdrop-blur-md transition-colors",
            isSelected ? "border-blue-500 bg-blue-500" : "border-gray-500 bg-black/40 group-hover:border-gray-400"
          )}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(file.id, !isSelected);
          }}
        >
          <svg className={cn("w-4 h-4 text-white transition-opacity", isSelected ? "opacity-100" : "opacity-0")} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
      </div>
      
      <div className="relative aspect-square w-full bg-gray-950 flex items-center justify-center overflow-hidden">
        {file.thumbnailLink ? (
          <img 
            src={file.thumbnailLink.replace('=s220', '=s800')} 
            alt={file.name}
            className="object-cover w-full h-full transition-transform duration-700 group-hover:scale-110"
            loading="lazy"
          />
        ) : (
          getIcon()
        )}
        
        {isVideo && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/10 group-hover:bg-black/0 transition-colors">
            <div className="bg-black/60 backdrop-blur-md rounded-full p-4 shadow-2xl transform transition-transform group-hover:scale-110">
              <VideoIcon className="w-8 h-8 text-white fill-white" />
            </div>
          </div>
        )}
        
        {/* Gradient overlay for better text visibility */}
        <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-transparent opacity-80" />
      </div>

      <div className="p-4 flex flex-col gap-1.5 absolute bottom-0 left-0 right-0 z-10">
        <h3 className="font-semibold text-sm text-white line-clamp-2 drop-shadow-md" title={file.name}>{file.name}</h3>
        <div className="flex items-center justify-between text-xs text-gray-300 font-medium">
          <span className="bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">{formatBytes(file.size)}</span>
          <span className="bg-black/50 px-2 py-0.5 rounded-full backdrop-blur-sm">{format(new Date(file.modifiedTime), 'MMM d, yy')}</span>
        </div>
      </div>
    </div>
  );
}
