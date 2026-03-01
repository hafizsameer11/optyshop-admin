import api from '../utils/api';

// Upload API service
const uploadAPI = {
  // Upload image with proper timeout and error handling
  uploadImage: async (file) => {
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await api.post('/admin/upload/image', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        timeout: 60000, // 60 second timeout for image uploads
      });

      return response.data;
    } catch (error) {
      console.error('Image upload error:', error);
      
      // Handle timeout specifically
      if (error.code === 'ECONNABORTED') {
        throw new Error('Upload timeout - Please try again with a smaller image');
      }
      
      // Handle other errors
      if (error.response?.data?.message) {
        throw new Error(error.response.data.message);
      }
      
      throw new Error('Failed to upload image');
    }
  },
};

export default uploadAPI;
