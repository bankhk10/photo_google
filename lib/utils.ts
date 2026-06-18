import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatBytes(bytes: number | string | undefined, decimals = 2) {
  if (!bytes) return 'Unknown Size';
  const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (!numBytes) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

  const i = Math.floor(Math.log(numBytes) / Math.log(k));

  return `${parseFloat((numBytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}
