export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  modifiedTime: string;
  thumbnailLink?: string;
  imageMediaMetadata?: {
    width: number;
    height: number;
  };
  videoMediaMetadata?: {
    width: number;
    height: number;
    durationMillis: string;
  };
}

export interface ListFilesResponse {
  files: DriveFile[];
  nextPageToken?: string | null;
}
