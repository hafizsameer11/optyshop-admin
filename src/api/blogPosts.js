import api from '../utils/api';

// Blog Posts API service for admin panel
const blogPostsAPI = {
  // Get all blog posts
  getAll: async () => {
    const response = await api.get('/admin/blog-posts');
    return response.data?.data?.blogPosts || response.data?.data?.blog_posts || response.data?.data || response.data || [];
  },

  // Get blog post by ID
  getById: async (id) => {
    const response = await api.get(`/admin/blog-posts/${id}`);
    return response.data?.data?.blogPost || response.data?.data?.blog_post || response.data?.data || response.data;
  },

  // Create new blog post
  create: async (blogData) => {
    const response = await api.post('/admin/blog-posts', blogData);
    return response.data?.data?.blogPost || response.data?.data?.blog_post || response.data?.data || response.data;
  },

  // Update blog post
  update: async (id, blogData) => {
    const response = await api.put(`/admin/blog-posts/${id}`, blogData);
    return response.data?.data?.blogPost || response.data?.data?.blog_post || response.data?.data || response.data;
  },

  // Delete blog post
  delete: async (id) => {
    const response = await api.delete(`/admin/blog-posts/${id}`);
    return response.data;
  },
};

export default blogPostsAPI;
