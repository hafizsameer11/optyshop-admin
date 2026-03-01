import api from '../utils/api';

// Upload API service
const uploadAPI = {
  // Upload image with proper timeout and error handling
  uploadImage: async (file) => {
    console.log('Starting image upload:', file.name, file.size, file.type);
    const formData = new FormData();
    formData.append('image', file);

    try {
      console.log('Sending upload request...');
      const response = await api.post('/admin/upload/image', formData, {
        timeout: 60000, // 60 second timeout for image uploads
      });
      console.log('Upload response:', response);
      return response.data;
    } catch (error) {
      console.error('Image upload error:', error);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        console.log('Upload timed out');
        throw new Error('Upload timeout - Please try again with a smaller image');
      }
      
      // Handle other errors
      if (error.response?.data?.message) {
        console.log('Upload failed with server error:', error.response.data);
        throw new Error(error.response.data.message);
      }
      
      console.log('Upload failed with unknown error');
      throw new Error('Failed to upload image');
    }
  },
};

export default uploadAPI;
