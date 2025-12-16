import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiBold, FiItalic, FiUnderline, FiList } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';

const BlogPostModal = ({ post, onClose }) => {
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    excerpt: '',
    content: '',
    thumbnail: '',
    tags: '',
    is_published: false,
  });
  const [loading, setLoading] = useState(false);
  const contentEditableRef = useRef(null);

  useEffect(() => {
    if (post) {
      setFormData({
        title: post.title || '',
        slug: post.slug || '',
        excerpt: post.excerpt || '',
        content: post.content || '',
        thumbnail: post.thumbnail || '',
        tags: post.tags ? (Array.isArray(post.tags) ? post.tags.join(', ') : post.tags) : '',
        is_published: post.is_published !== undefined ? post.is_published : false,
      });
      // Set content in contentEditable div
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = post.content || '';
      }
    } else {
      setFormData({
        title: '',
        slug: '',
        excerpt: '',
        content: '',
        thumbnail: '',
        tags: '',
        is_published: false,
      });
      // Clear contentEditable div
      if (contentEditableRef.current) {
        contentEditableRef.current.innerHTML = '';
      }
    }
  }, [post]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData({ 
      ...formData, 
      [name]: fieldValue 
    });
    
    // Auto-generate slug from title when creating new post
    if (name === 'title' && !post) {
      const slug = value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
      setFormData(prev => ({ ...prev, title: value, slug }));
    }
  };

  const handleContentChange = () => {
    if (contentEditableRef.current) {
      const content = contentEditableRef.current.innerHTML;
      setFormData(prev => ({ ...prev, content }));
    }
  };

  const handleFormat = (command, value = null) => {
    document.execCommand(command, false, value);
    contentEditableRef.current?.focus();
    handleContentChange();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Validate required fields
      if (!formData.title || !formData.title.trim()) {
        toast.error('Title is required');
        setLoading(false);
        return;
      }
      if (!formData.slug || !formData.slug.trim()) {
        toast.error('Slug is required');
        setLoading(false);
        return;
      }
      // Get content from contentEditable div
      const content = contentEditableRef.current ? contentEditableRef.current.innerHTML : formData.content;
      
      // Check if content is empty (strip HTML tags for validation)
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;
      const textContent = tempDiv.textContent || tempDiv.innerText || '';
      
      if (!textContent.trim()) {
        toast.error('Content is required');
        setLoading(false);
        return;
      }

      // Prepare data object - convert empty strings to null for optional fields
      const dataToSend = {
        title: formData.title.trim(),
        slug: formData.slug.trim(),
        content: content.trim(),
        is_published: formData.is_published,
      };

      // Add optional fields only if they have values
      if (formData.excerpt && formData.excerpt.trim()) {
        dataToSend.excerpt = formData.excerpt.trim();
      } else {
        dataToSend.excerpt = null;
      }

      if (formData.thumbnail && formData.thumbnail.trim()) {
        dataToSend.thumbnail = formData.thumbnail.trim();
      } else {
        dataToSend.thumbnail = '';
      }

      if (formData.tags && formData.tags.trim()) {
        // Convert comma-separated string to array or keep as string
        const tagsArray = formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag);
        dataToSend.tags = tagsArray.length > 0 ? tagsArray : null;
      } else {
        dataToSend.tags = null;
      }

      let response;
      if (post) {
        response = await api.put(API_ROUTES.ADMIN.BLOG_POSTS.UPDATE(post.id), dataToSend);
      } else {
        response = await api.post(API_ROUTES.ADMIN.BLOG_POSTS.CREATE, dataToSend);
      }
      
      const successMessage = response.data?.message || (post ? 'Blog post updated successfully' : 'Blog post created successfully');
      toast.success(successMessage);
      onClose();
    } catch (error) {
      console.error('Blog post save error:', error);
      if (!error.response) {
        toast.error('Backend unavailable - Cannot save blog post');
      } else if (error.response.status === 401) {
        toast.error('❌ Demo mode - Please log in with real credentials');
      } else if (error.response.status === 400 || error.response.status === 422) {
        const errorData = error.response?.data || {};
        const errorMessage = errorData.message || errorData.errors?.[0]?.msg || 'Validation failed';
        toast.error(errorMessage);
      } else {
        const errorMessage = error.response?.data?.message || 'Failed to save blog post';
        toast.error(errorMessage);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">
            {post ? 'Edit Blog Post' : 'Add Blog Post'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Title *
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., The Future of Optical Retail"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Slug *
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              required
              placeholder="e.g., future-of-optical-retail"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="2"
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="Brief summary of the post (optional)..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="text"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="https://example.com/image.jpg (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              placeholder="tag1, tag2, tag3 (comma-separated, optional)"
            />
            <p className="mt-1 text-sm text-gray-500">Separate multiple tags with commas</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Content *
            </label>
            {/* Formatting Toolbar */}
            <div className="flex items-center space-x-2 mb-2 p-2 border rounded-t-lg bg-gray-50">
              <button
                type="button"
                onClick={() => handleFormat('bold')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Bold"
              >
                <FiBold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('italic')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Italic"
              >
                <FiItalic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('underline')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Underline"
              >
                <FiUnderline className="w-4 h-4" />
              </button>
              <div className="w-px h-6 bg-gray-300"></div>
              <button
                type="button"
                onClick={() => handleFormat('insertUnorderedList')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Bullet List"
              >
                <FiList className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleFormat('insertOrderedList')}
                className="p-2 hover:bg-gray-200 rounded transition-colors"
                title="Numbered List"
              >
                <span className="text-sm font-semibold">1.</span>
              </button>
            </div>
            {/* Rich Text Editor */}
            <div
              ref={contentEditableRef}
              contentEditable
              onInput={handleContentChange}
              onBlur={handleContentChange}
              className="w-full min-h-[200px] px-4 py-2 border border-t-0 rounded-b-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
              style={{
                whiteSpace: 'pre-wrap',
                wordWrap: 'break-word'
              }}
              data-placeholder="Full content of the blog post..."
            />
            <style>{`
              [contenteditable][data-placeholder]:empty:before {
                content: attr(data-placeholder);
                color: #9ca3af;
                pointer-events: none;
              }
              [contenteditable]:focus {
                outline: none;
              }
            `}</style>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              name="is_published"
              id="is_published"
              checked={formData.is_published}
              onChange={handleChange}
              className="w-4 h-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
            />
            <label htmlFor="is_published" className="ml-2 text-sm text-gray-700">
              Publish immediately
            </label>
          </div>

          <div className="flex justify-end space-x-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2 bg-primary-500 text-white rounded-lg hover:bg-primary-600 disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogPostModal;

