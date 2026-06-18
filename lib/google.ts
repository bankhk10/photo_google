import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/drive.readonly'];

export function getDriveClient() {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!email || !privateKey) {
    throw new Error('Google Service Account credentials are not fully configured.');
  }

  const credentials = {
    client_email: email,
    private_key: privateKey,
  };

  const auth = new google.auth.GoogleAuth({
    credentials,
    scopes: SCOPES,
  });

  return google.drive({ version: 'v3', auth });
}

export async function listFiles(pageToken?: string, pageSize: number = 50) {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) throw new Error('Missing GOOGLE_DRIVE_FOLDER_ID');

  const response = await drive.files.list({
    q: `'${folderId}' in parents and trashed=false`,
    fields: 'nextPageToken, files(id, name, mimeType, size, modifiedTime, thumbnailLink, imageMediaMetadata, videoMediaMetadata)',
    pageSize,
    pageToken,
    orderBy: 'modifiedTime desc',
  });

  return {
    files: response.data.files || [],
    nextPageToken: response.data.nextPageToken || null,
  };
}

export async function getFile(fileId: string) {
  const drive = getDriveClient();
  const response = await drive.files.get({
    fileId,
    fields: 'id, name, mimeType, size, modifiedTime, thumbnailLink',
  });
  return response.data;
}

export async function getFileStream(fileId: string) {
  const drive = getDriveClient();
  const response = await drive.files.get(
    { fileId, alt: 'media' },
    { responseType: 'stream' }
  );
  return response.data;
}
