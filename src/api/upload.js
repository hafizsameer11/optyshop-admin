import api from '../utils/api';

/**
 * Admin image upload: POST `{base}/admin/upload/image` (multipart field `image`).
 * Default base: https://optyshop-frontend.hmstech.org/api
 */
export function extractImageUrlFromUploadResponse(data) {
  if (data == null) return null;
  if (typeof data === 'string') {
    const t = data.trim();
    if (/^https?:\/\//i.test(t) || t.startsWith('//')) return resolveToAbsoluteUrl(t);
    return null;
  }
  const candidates = [
    data.url,
    data.imageUrl,
    data.image_url,
    data.path,
    data.file,
    data.location,
    data.data?.url,
    data.data?.imageUrl,
    data.data?.image_url,
    data.data?.path,
    data.data?.file,
  ];
  for (const c of candidates) {
    if (typeof c === 'string' && c.trim()) {
      const u = resolveToAbsoluteUrl(c.trim());
      if (u) return u;
    }
  }
  return null;
}

function resolveToAbsoluteUrl(u) {
  if (!u) return null;
  if (u.startsWith('//')) return `https:${u}`;
  if (/^https?:\/\//i.test(u)) return u;
  const base = import.meta.env.VITE_API_BASE_URL || 'https://optyshop-frontend.hmstech.org/api';
  const origin = String(base).replace(/\/api\/?$/i, '');
  if (u.startsWith('/')) return `${origin}${u}`;
  return `${origin}/${u}`;
}

// Upload API service
const uploadAPI = {
  // Upload image with optimized timeout and error handling
  uploadImage: async (file, retryCount = 0) => {
    const maxRetries = 2;
    console.log('Starting image upload:', file.name, file.size, file.type);

    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('Sending upload request...');
      const response = await api.post('/admin/upload/image', formData, {
        timeout: 60000, // Increased to 60 second timeout for larger images
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          console.log(`Upload progress: ${progress}%`);
        },
      });
      console.log('Upload response:', response);
      const raw = response.data;
      const url = extractImageUrlFromUploadResponse(raw);
      if (!url) {
        const msg = raw?.message || raw?.error || 'Upload did not return an image URL';
        const err = new Error(typeof msg === 'string' ? msg : 'Invalid upload response');
        err.isUploadResponseError = true;
        throw err;
      }
      return { success: raw?.success !== false, url, raw };
    } catch (error) {
      console.error('Image upload error:', error);

      if (error.isUploadResponseError) {
        throw error;
      }

      // Retry on network errors or timeouts
      if (retryCount < maxRetries && (!error.response || error.code === 'ECONNABORTED')) {
        console.log(`Retrying upload... Attempt ${retryCount + 1} of ${maxRetries}`);
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1 second before retry
        return uploadAPI.uploadImage(file, retryCount + 1);
      }

      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        console.log('Upload timed out after retries');
        throw new Error('Upload timeout - Please try again with a smaller image or check your connection');
      }

      // Handle other errors
      if (error.response?.data?.message) {
        console.log('Upload failed with server error:', error.response.data);
        throw new Error(error.response.data.message);
      }

      console.log('Upload failed with unknown error');
      if (error.message && !error.response) throw error;
      throw new Error('Failed to upload image - Please check your internet connection');
    }
  },
};

export default uploadAPI;
