'use client';

import { useState, useEffect } from 'react';
import { LinkData } from '@/lib/db';

interface LinkDisplayData {
  id?: number;
  source: string;
  destination: string;
  title?: string;
  description?: string;
}

export default function URLShortener() {
  const [linksData, setLinksData] = useState<LinkDisplayData[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    title: '',
    description: ''
  });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);

  useEffect(() => {
    loadLinks();
  }, []);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
  };

  const loadLinks = async () => {
    try {
      const response = await fetch('/api/links');
      if (!response.ok) throw new Error('Failed to fetch links');
      
      const data = await response.json();
      setLinksData(data.redirects || []);
    } catch (error) {
      console.error('Error loading links:', error);
      showToast('Error loading links', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminLogin = async () => {
    try {
      const response = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });

      const result = await response.json();
      
      if (response.ok && result.authenticated) {
        setIsAdminAuthenticated(true);
        showToast('Successfully logged in as admin', 'success');
        setAdminPassword('');
      } else {
        showToast('Invalid admin password', 'error');
        setAdminPassword('');
      }
    } catch (error) {
      showToast('Error during authentication', 'error');
      setAdminPassword('');
    }
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.source || !formData.destination) {
      showToast('Source and destination are required', 'error');
      return;
    }

    try {
      const url = editingIndex !== null ? `/api/links/${editingIndex}` : '/api/links';
      const method = editingIndex !== null ? 'PUT' : 'POST';
      
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const result = await response.json();
      
      if (response.ok) {
        showToast(editingIndex !== null ? 'Link updated successfully' : 'Link added successfully', 'success');
        await loadLinks();
        setShowForm(false);
        setEditingIndex(null);
        setFormData({ source: '', destination: '', title: '', description: '' });
      } else {
        showToast(result.error || 'Error saving link', 'error');
      }
    } catch (error) {
      showToast('Error saving link', 'error');
    }
  };

  const handleEdit = (index: number) => {
    const link = linksData[index];
    setFormData({
      source: link.source,
      destination: link.destination,
      title: link.title || '',
      description: link.description || ''
    });
    setEditingIndex(index);
    setShowForm(true);
  };

  const handleDelete = async (index: number) => {
    const link = linksData[index];
    if (!confirm(`Are you sure you want to delete the link "${link.source}"?`)) {
      return;
    }

    try {
      const linkId = link.id || index; // Use database ID if available, fallback to index
      const response = await fetch(`/api/links/${linkId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showToast('Link deleted successfully', 'success');
        await loadLinks();
      } else {
        const result = await response.json();
        showToast(result.error || 'Error deleting link', 'error');
      }
    } catch (error) {
      showToast('Error deleting link', 'error');
    }
  };

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('Link copied to clipboard!', 'success');
    } catch (error) {
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      showToast('Link copied to clipboard!', 'success');
    }
  };

  const filteredLinks = linksData.filter(link => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      link.source.toLowerCase().includes(query) ||
      link.destination.toLowerCase().includes(query) ||
      (link.title && link.title.toLowerCase().includes(query)) ||
      (link.description && link.description.toLowerCase().includes(query))
    );
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Navigation */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14">
            <div className="flex items-center space-x-3">
              <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-link text-white text-sm"></i>
              </div>
              <h1 className="text-lg font-semibold text-gray-900">Shortener</h1>
            </div>
            <div className="flex space-x-1">
              <button 
                onClick={() => setCurrentView('home')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  currentView === 'home'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Home
              </button>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors duration-200 ${
                  currentView === 'admin'
                    ? 'text-blue-600 bg-blue-50'
                    : 'text-gray-600 hover:text-blue-600 hover:bg-gray-100'
                }`}
              >
                Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {currentView === 'home' ? (
          <div className="max-w-4xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-8">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-50 border border-blue-200 rounded-xl mb-4">
                <i className="fas fa-link text-blue-600 text-lg"></i>
              </div>
              <h1 className="text-3xl font-semibold text-gray-900 mb-3">URL Shortener</h1>
              <p className="text-gray-600 max-w-xl mx-auto">Clean and simple URL management</p>
            </div>

            {/* Search Section */}
            <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400 text-sm"></i>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-1 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 text-sm" 
                  placeholder="Search links..."
                />
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredLinks.map((link, index) => (
                <div key={index} className="bg-white rounded-lg border border-gray-200 p-4 hover:border-blue-200 transition-all duration-200 group">
                  {link.title && (
                    <h3 className="text-base font-medium text-gray-900 mb-2 group-hover:text-blue-600 transition-colors duration-200">
                      {link.title}
                    </h3>
                  )}
                  {link.description && (
                    <p className="text-gray-600 text-sm mb-3">
                      {link.description}
                    </p>
                  )}
                  <div className="bg-gray-50 rounded-md p-2 mb-3 border border-gray-100">
                    <a 
                      href={link.destination} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-700 font-mono text-xs break-all transition-colors duration-200"
                    >
                      {window.location.origin}{link.source}
                    </a>
                  </div>
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}${link.source}`)}
                    className="w-full flex items-center justify-center px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-md transition-colors duration-200 focus:ring-1 focus:ring-blue-500 focus:ring-offset-1"
                  >
                    <i className="fas fa-copy mr-1.5 text-xs"></i>Copy
                  </button>
                </div>
              ))}
            </div>

            {filteredLinks.length === 0 && (
              <div className="text-center py-16">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-search text-gray-400 text-xl"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No links found</h3>
                <p className="text-gray-500">Try adjusting your search terms</p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-6xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
              <div className="flex items-center space-x-3 mb-4 sm:mb-0">
                <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
                  <i className="fas fa-cog text-white"></i>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Admin Panel</h2>
              </div>
              {isAdminAuthenticated && (
                <button 
                  onClick={() => {
                    setShowForm(true);
                    setEditingIndex(null);
                    setFormData({ source: '', destination: '', title: '', description: '' });
                  }}
                  className="inline-flex items-center px-4 py-2 bg-green-500 hover:bg-green-600 text-white font-medium rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                >
                  <i className="fas fa-plus mr-2"></i>Add New Link
                </button>
              )}
            </div>

            {!isAdminAuthenticated ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="fas fa-lock text-blue-500 text-xl"></i>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Access Required</h3>
                  <p className="text-gray-600 mb-6">Please enter the admin password to continue</p>
                  <div className="space-y-4">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-key text-gray-400"></i>
                      </div>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                        className="block w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                        placeholder="Enter admin password"
                      />
                    </div>
                    <button 
                      onClick={handleAdminLogin}
                      className="w-full py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      <i className="fas fa-sign-in-alt mr-2"></i>Login
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Add/Edit Form */}
                {showForm && (
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                          <i className="fas fa-edit text-blue-500"></i>
                        </div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          {editingIndex !== null ? 'Edit Link' : 'Add New Link'}
                        </h3>
                      </div>
                      <button 
                        onClick={() => {
                          setShowForm(false);
                          setEditingIndex(null);
                          setFormData({ source: '', destination: '', title: '', description: '' });
                        }}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                    <form onSubmit={handleFormSubmit} className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Source Path</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-sm">/</span>
                            </div>
                            <input 
                              type="text" 
                              required
                              value={formData.source}
                              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                              className="block w-full pl-8 pr-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                              placeholder="example"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Destination URL</label>
                          <input 
                            type="url" 
                            required
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Title (Optional)</label>
                          <input 
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                            placeholder="Link title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                          <input 
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="block w-full px-3 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200" 
                            placeholder="Link description"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button 
                          type="submit"
                          className="inline-flex items-center justify-center px-6 py-3 bg-blue-500 hover:bg-blue-600 text-white font-medium rounded-xl transition-colors duration-200 focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        >
                          <i className="fas fa-save mr-2"></i>Save Link
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingIndex(null);
                            setFormData({ source: '', destination: '', title: '', description: '' });
                          }}
                          className="inline-flex items-center justify-center px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors duration-200"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Admin Links Table */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                        <i className="fas fa-list text-green-500"></i>
                      </div>
                      <h3 className="text-lg font-semibold text-gray-900">Manage Links</h3>
                    </div>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Source</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Destination</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Description</th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {linksData.map((link, index) => (
                          <tr key={index} className="hover:bg-gray-50 transition-colors duration-200">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <code className="bg-gray-100 text-gray-800 px-2 py-1 rounded text-sm">{link.source}</code>
                            </td>
                            <td className="px-6 py-4">
                              <a 
                                href={link.destination} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:text-blue-600 text-sm break-all"
                              >
                                {link.destination.length > 40 ? `${link.destination.substring(0, 40)}...` : link.destination}
                              </a>
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900">{link.title || '-'}</td>
                            <td className="px-6 py-4 text-sm text-gray-500">{link.description || '-'}</td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex space-x-2">
                                <button 
                                  onClick={() => handleEdit(index)}
                                  className="p-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors duration-200" 
                                  title="Edit"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDelete(index)}
                                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200" 
                                  title="Delete"
                                >
                                  <i className="fas fa-trash"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-4 right-4 z-50">
          <div className={`px-6 py-4 rounded-xl shadow-lg ${
            toast.type === 'success' ? 'bg-green-500' : 'bg-red-500'
          } text-white`}>
            <div className="flex items-center space-x-3">
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'}`}></i>
              <span className="font-medium">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
