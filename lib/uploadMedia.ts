type UploadMediaType = 'image' | 'video';

type CloudinaryUploadResponse = {
  secure_url?: string;
};

type ReactNativeFormDataFile = {
  uri: string;
  name: string;
  type: string;
};

const DEFAULT_UPLOAD_PRESET = 'ping_uploads';

function getCloudinaryConfig() {
  const cloudName =
    process.env.EXPO_PUBLIC_CLOUDINARY_CLOUD_NAME ?? process.env.CLOUDINARY_CLOUD_NAME;
  const uploadPreset =
    process.env.EXPO_PUBLIC_CLOUDINARY_UPLOAD_PRESET ??
    process.env.CLOUDINARY_UPLOAD_PRESET ??
    DEFAULT_UPLOAD_PRESET;

  if (!cloudName) {
    throw new Error('Cloudinary cloud name is missing');
  }

  return { cloudName, uploadPreset };
}

/**
 * Uploads a local file URI to Cloudinary using an unsigned upload preset and
 * returns the hosted URL. Swap this for S3 signed uploads or another CDN later.
 */
export async function uploadMedia(uri: string, type: UploadMediaType = 'image'): Promise<string> {
  const { cloudName, uploadPreset } = getCloudinaryConfig();
  const formData = new FormData();
  const filename = uri.split('/').pop() ?? `ping-${type}`;
  const mimeType = type === 'video' ? 'video/mp4' : 'image/jpeg';
  const file: ReactNativeFormDataFile = { uri, name: filename, type: mimeType };

  formData.append('file', file as unknown as Blob);
  formData.append('upload_preset', uploadPreset);
  formData.append('resource_type', type);

  const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/${type}/upload`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Upload failed');
  }

  const data = (await response.json()) as CloudinaryUploadResponse;
  if (!data.secure_url) {
    throw new Error('Upload response missing secure URL');
  }

  return data.secure_url;
}

/** Returns a thumbnail URL for a Cloudinary video URL. */
export function getVideoThumbnail(videoUrl: string): string {
  return videoUrl.replace('/video/upload/', '/video/upload/so_0,w_400,h_400,c_fill,f_jpg/');
}

/** Returns a resized image URL using Cloudinary transformations. */
export function resizeImage(url: string, width: number, height: number): string {
  return url.replace('/image/upload/', `/image/upload/w_${width},h_${height},c_fill,q_auto,f_auto/`);
}
