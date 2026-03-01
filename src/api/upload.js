import api from '../utils/api';

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
      return response.data;
    } catch (error) {
      console.error('Image upload error:', error);
      
      // Retry on network errors or timeouts
      if (retryCount < maxRetries && (!error.response || error.code === 'ECONNABORTED')) {
        console.log(`Retrying upload... Attempt ${retryCount + 1} of ${maxRetries}`);
        await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second before retry
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
      throw new Error('Failed to upload image - Please check your internet connection');
    }
  },
};

export default uploadAPI;
