import React, { useState, useEffect, useRef } from 'react';
import { FiX, FiBold, FiItalic, FiUnderline, FiList } from 'react-icons/fi';
import api from '../utils/api';
import toast from 'react-hot-toast';
import { API_ROUTES } from '../config/apiRoutes';
import LanguageSwitcher from './LanguageSwitcher';
import { useI18n } from '../context/I18nContext';

const BlogPostModal = ({ post, onClose }) => {
  const { t } = useI18n();
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border border-gray-200/50">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 sticky top-0 bg-white/95 backdrop-blur-sm z-10">
          <h2 className="text-2xl font-extrabold bg-gradient-to-r from-gray-900 via-indigo-800 to-purple-800 bg-clip-text text-transparent">
            {post ? t('editBlogPost') : t('addBlogPost')}
          </h2>
          <div className="flex items-center gap-3">
            <LanguageSwitcher variant="compact" />
            <button 
              onClick={onClose} 
              className="p-2 rounded-xl text-gray-500 hover:text-gray-700 hover:bg-gray-100/80 transition-all duration-200"
              aria-label="Close"
            >
              <FiX className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              {t('title')} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="input-modern"
              required
              placeholder="e.g., The Future of Optical Retail"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Slug <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              className="input-modern font-mono"
              required
              placeholder="e.g., future-of-optical-retail"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Excerpt
            </label>
            <textarea
              name="excerpt"
              value={formData.excerpt}
              onChange={handleChange}
              rows="2"
              className="input-modern resize-none"
              placeholder="Brief summary of the post (optional)..."
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Thumbnail URL
            </label>
            <input
              type="text"
              name="thumbnail"
              value={formData.thumbnail}
              onChange={handleChange}
              className="input-modern"
              placeholder="https://example.com/image.jpg (optional)"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tags
            </label>
            <input
              type="text"
              name="tags"
              value={formData.tags}
              onChange={handleChange}
              className="input-modern"
              placeholder="tag1, tag2, tag3 (comma-separated, optional)"
            />
            <p className="mt-1 text-sm text-gray-500">Separate multiple tags with commas</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Content <span className="text-red-500">*</span>
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
              className="w-4 h-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500 focus:ring-2 cursor-pointer"
            />
            <label htmlFor="is_published" className="ml-2 block text-sm font-medium text-gray-700 cursor-pointer">
              Publish immediately
            </label>
          </div>

          <div className="flex flex-col sm:flex-row justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2.5 border border-gray-300 rounded-xl hover:bg-gray-50 transition-colors font-semibold text-gray-700"
            >
              {t('cancel')}
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary-modern disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t('saving') : t('save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default BlogPostModal;

