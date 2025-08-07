'use client';

import { useState, useEffect } from 'react';
import { LinkData } from '@/lib/db';

interface LinkDisplayData {
  id?: number;
  source: string;
  destination: string;
  title?: string;
  description?: string;
  status?: 'draft' | 'published' | 'synced';
  created_at?: string;
}

export default function URLShortener() {
  const [linksData, setLinksData] = useState<LinkDisplayData[]>([]);
  const [draftLinks, setDraftLinks] = useState<LinkDisplayData[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'admin'>('home');
  const [adminView, setAdminView] = useState<'drafts' | 'all'>('drafts');
  const [isAdminAuthenticated, setIsAdminAuthenticated] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    source: '',
    destination: '',
    title: '',
    description: ''
  });
  const [toast, setToast] = useState<{message: string, type: 'success' | 'error' | 'info'} | null>(null);

  useEffect(() => {
    loadLinks();
    if (isAdminAuthenticated) {
      loadAdminLinks();
    }
  }, [isAdminAuthenticated]);

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
  };

  const syncWithGitHub = async () => {
    try {
      showToast('Triggering GitHub Action to sync vercel.json...', 'info');
      
      const response = await fetch('/api/github-sync', {
        method: 'PUT'
      });
      
      const result = await response.json();
      
      if (response.ok) {
        showToast('🚀 GitHub Action triggered! vercel.json will be committed automatically.', 'success');
      } else {
        showToast(result.error || 'Failed to trigger GitHub sync', 'error');
      }
    } catch (error) {
      showToast('Error triggering GitHub sync', 'error');
    }
  };

  const loadLinks = async () => {
    try {
      // Load published/synced links from public API (already filtered)
      const response = await fetch('/api/links');
      if (!response.ok) throw new Error('Failed to fetch links from database');
      
      const data = await response.json();
      setLinksData(data.redirects || []);
    } catch (error) {
      console.error('Error loading links:', error);
      showToast('Error loading links from database', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const loadAdminLinks = async () => {
    try {
      // Load all links for admin view
      const allResponse = await fetch('/api/admin/links');
      const draftResponse = await fetch('/api/admin/links?status=draft');
      
      if (allResponse.ok) {
        const allData = await allResponse.json();
        setLinksData(allData.redirects || []);
      }
      
      if (draftResponse.ok) {
        const draftData = await draftResponse.json();
        setDraftLinks(draftData.redirects || []);
      }
    } catch (error) {
      console.error('Error loading admin links:', error);
      showToast('Error loading admin links', 'error');
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
        setCurrentView('admin');
        showToast('Successfully logged in as admin', 'success');
        setAdminPassword('');
        await loadAdminLinks();
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
      // Check if we're editing an existing link
      if (editingId) {
        // Update existing link
        const response = await fetch(`/api/admin/links/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: formData.source,
            destination: formData.destination,
            title: formData.title || undefined,
            description: formData.description || undefined
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          showToast('Link updated successfully!', 'success');
          
          await loadLinks();
          if (isAdminAuthenticated) {
            await loadAdminLinks();
          }
          
          setShowForm(false);
          setEditingIndex(null);
          setEditingId(null);
          setFormData({ source: '', destination: '', title: '', description: '' });
          
          // Trigger GitHub sync to update vercel.json
          await syncWithGitHub();
        } else {
          showToast(result.error || 'Error updating link', 'error');
        }
      } else {
        // Add new redirect to database as draft (admin approval needed)
        const endpoint = isAdminAuthenticated ? '/api/admin/links' : '/api/links';
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            source: formData.source,
            destination: formData.destination,
            title: formData.title || undefined,
            description: formData.description || undefined
          })
        });

        const result = await response.json();
        
        if (response.ok) {
          const message = isAdminAuthenticated 
            ? 'Redirect saved as draft - approve to sync to vercel.json!'
            : 'Redirect submitted for admin approval!';
          showToast(message, 'success');
          
          await loadLinks();
          if (isAdminAuthenticated) {
            await loadAdminLinks();
          }
          
          setShowForm(false);
          setEditingIndex(null);
          setEditingId(null);
          setFormData({ source: '', destination: '', title: '', description: '' });
        } else {
          showToast(result.error || 'Error adding redirect', 'error');
        }
      }
    } catch (error) {
      showToast(editingId ? 'Error updating redirect' : 'Error adding redirect', 'error');
    }
  };

  // Admin functions
  const handleApproveDraft = async (id: number) => {
    try {
      const response = await fetch('/api/admin/links', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          action: 'approve'
        })
      });

      const result = await response.json();
      
      if (response.ok) {
        showToast('Draft approved! Will sync to vercel.json on next GitHub Action.', 'success');
        await loadAdminLinks();
        // Trigger GitHub sync
        await syncWithGitHub();
      } else {
        showToast(result.error || 'Error approving draft', 'error');
      }
    } catch (error) {
      showToast('Error approving draft', 'error');
    }
  };

  // Edit and Delete functionality for database records
  const handleEdit = (index: number) => {
    const link = linksData[index];
    if (link) {
      setFormData({
        source: link.source,
        destination: link.destination,
        title: link.title || '',
        description: link.description || ''
      });
      setEditingIndex(index);
      setEditingId(link.id || null);
      setShowForm(true);
    }
  };

  const handleDelete = async (index: number) => {
    const link = linksData[index];
    if (!link || !link.id) {
      showToast('Cannot delete: Link ID not found', 'error');
      return;
    }

    if (!confirm('Are you sure you want to delete this link? This action cannot be undone.')) {
      return;
    }

    try {
      const response = await fetch(`/api/admin/links/${link.id}`, {
        method: 'DELETE'
      });

      const result = await response.json();

      if (response.ok) {
        showToast('Link deleted successfully', 'success');
        // Remove from local state
        const updatedLinks = linksData.filter((_, i) => i !== index);
        setLinksData(updatedLinks);
        
        // Reload admin links to update counts
        await loadAdminLinks();
        
        // Trigger GitHub sync to update vercel.json
        await syncWithGitHub();
      } else {
        showToast(result.error || 'Error deleting link', 'error');
      }
    } catch (error) {
      console.error('Error deleting link:', error);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 via-white to-gray-100/50">
        <div className="text-center">
          <div className="relative">
            <div className="w-12 h-12 border-3 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-6"></div>
            <div className="absolute inset-0 w-12 h-12 border-3 border-blue-300/10 rounded-full mx-auto"></div>
          </div>
          <p className="text-gray-600 font-medium">Loading your links...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="bg-white/80 backdrop-blur-md shadow-sm border-b border-gray-200/60 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
                <i className="fas fa-link text-white text-lg"></i>
              </div>
              <h1 className="text-xl font-semibold text-gray-900 tracking-tight">Shortener</h1>
            </div>
            <div className="flex space-x-1 bg-gray-100/70 rounded-xl p-1">
              <button 
                onClick={() => setCurrentView('home')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === 'home'
                    ? 'text-gray-900 bg-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <i className="fas fa-home mr-2"></i>Home
              </button>
              <button 
                onClick={() => setCurrentView('admin')}
                className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  currentView === 'admin'
                    ? 'text-gray-900 bg-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                }`}
              >
                <i className="fas fa-cog mr-2"></i>Admin
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {currentView === 'home' ? (
          <div className="max-w-5xl mx-auto">
            {/* Hero Section */}
            <div className="text-center mb-12 lg:mb-16">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4 lg:mb-6 tracking-tight px-4">
                Simple URL Shortener
              </h1>
              <p className="text-lg sm:text-xl text-gray-600 max-w-2xl mx-auto leading-relaxed px-4">
                Create URL redirects with database storage and auto-sync to Vercel.
              </p>
              <p className="text-base sm:text-lg text-gray-500 mt-3 max-w-xl mx-auto px-4">
                Database → GitHub Actions → vercel.json → Vercel CDN
              </p>
            </div>

            {/* Search Section */}
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-200/60 p-4 sm:p-6 lg:p-8 mb-8 lg:mb-12 mx-4 sm:mx-0">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 sm:pl-5 flex items-center pointer-events-none">
                  <i className="fas fa-search text-gray-400 text-lg"></i>
                </div>
                <input 
                  type="text" 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="block w-full pl-12 sm:pl-14 pr-4 sm:pr-6 py-3 sm:py-4 text-base sm:text-lg border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 placeholder-gray-500 bg-white/50" 
                  placeholder="Search links, titles, or descriptions..."
                />
              </div>
            </div>

            {/* Links Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 px-4 sm:px-0">
              {filteredLinks.map((link, index) => (
                <div key={link.id || index} className="group bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg shadow-gray-200/50 border border-gray-200/60 p-6 lg:p-8 hover:shadow-xl hover:shadow-gray-300/50 hover:border-blue-300/60 hover:-translate-y-1 transition-all duration-300">
                  <div className="flex items-start justify-between mb-4">
                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                      link.status === 'synced' ? 'bg-green-100 text-green-700' :
                      link.status === 'published' ? 'bg-blue-100 text-blue-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      <i className={`mr-1 ${
                        link.status === 'synced' ? 'fas fa-check' :
                        link.status === 'published' ? 'fas fa-clock' :
                        'fas fa-hourglass-half'
                      }`}></i>
                      {link.status === 'synced' ? 'Live' : link.status || 'Draft'}
                    </span>
                  </div>
                  
                  {link.title && (
                    <h3 className="text-lg lg:text-xl font-semibold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-200 leading-tight">
                      {link.title}
                    </h3>
                  )}
                  
                  {link.description && (
                    <p className="text-gray-600 text-sm mb-4 lg:mb-6 leading-relaxed">
                      {link.description}
                    </p>
                  )}
                  
                  <div className="bg-gray-50/80 backdrop-blur-sm rounded-xl p-3 lg:p-4 mb-4 lg:mb-6 border border-gray-200/40">
                    <div className="text-sm text-gray-500 mb-1 font-medium">Short URL:</div>
                    <div className="text-blue-600 hover:text-blue-700 font-mono text-sm break-all transition-colors duration-200 font-medium">
                      {window.location.origin}{link.source}
                    </div>
                    <div className="text-xs text-gray-400 mt-2">
                      <span className="font-medium">Redirects to:</span> 
                      <a 
                        href={link.destination} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-gray-600 hover:text-blue-600 ml-1 break-all"
                      >
                        {link.destination.length > 50 ? `${link.destination.substring(0, 50)}...` : link.destination}
                      </a>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => copyToClipboard(`${window.location.origin}${link.source}`)}
                    className="w-full flex items-center justify-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl shadow-lg shadow-blue-500/25 transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 hover:-translate-y-0.5"
                  >
                    <i className="fas fa-copy mr-2"></i>Copy Link
                  </button>
                </div>
              ))}
            </div>

            {filteredLinks.length === 0 && (
              <div className="text-center py-24">
                <div className="w-24 h-24 bg-gray-100/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-gray-200/50 border border-gray-200/40">
                  <i className="fas fa-search text-gray-400 text-3xl"></i>
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">No links found</h3>
                <p className="text-gray-600 text-lg max-w-md mx-auto leading-relaxed">
                  Try adjusting your search terms or add some links in the admin panel to get started
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-7xl mx-auto">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-12">
              <div className="flex items-center space-x-4 mb-6 sm:mb-0">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/25">
                  <i className="fas fa-cog text-white text-xl"></i>
                </div>
                <div>
                  <h2 className="text-3xl font-bold text-gray-900 tracking-tight">Admin Panel</h2>
                  <p className="text-gray-600 mt-1">Manage your shortened links</p>
                </div>
              </div>
              {isAdminAuthenticated && (
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="flex space-x-1 bg-gray-100/70 rounded-xl p-1">
                    <button 
                      onClick={() => setAdminView('drafts')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        adminView === 'drafts'
                          ? 'text-gray-900 bg-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <i className="fas fa-hourglass-half mr-2"></i>Drafts ({draftLinks.length})
                    </button>
                    <button 
                      onClick={() => setAdminView('all')}
                      className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                        adminView === 'all'
                          ? 'text-gray-900 bg-white shadow-sm'
                          : 'text-gray-600 hover:text-gray-900 hover:bg-white/50'
                      }`}
                    >
                      <i className="fas fa-list mr-2"></i>All Links ({linksData.length})
                    </button>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={syncWithGitHub}
                      className="inline-flex items-center px-5 py-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-semibold rounded-xl shadow-lg shadow-orange-500/25 transition-all duration-200 focus:ring-2 focus:ring-orange-500/20 focus:ring-offset-2 hover:-translate-y-0.5"
                    >
                      <i className="fab fa-github mr-2"></i>GitHub Sync
                    </button>
                    <button 
                      onClick={() => {
                        setShowForm(true);
                        setEditingIndex(null);
                        setEditingId(null);
                        setFormData({ source: '', destination: '', title: '', description: '' });
                      }}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold rounded-xl shadow-lg shadow-green-500/25 transition-all duration-200 focus:ring-2 focus:ring-green-500/20 focus:ring-offset-2 hover:-translate-y-0.5"
                    >
                      <i className="fas fa-plus mr-2"></i>Add New Redirect
                    </button>
                  </div>
                </div>
              )}
            </div>

            {!isAdminAuthenticated ? (
              <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60 p-10">
                <div className="text-center max-w-md mx-auto">
                  <div className="w-20 h-20 bg-blue-50/80 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-lg shadow-blue-500/10 border border-blue-200/40">
                    <i className="fas fa-lock text-blue-500 text-2xl"></i>
                  </div>
                  <h3 className="text-2xl font-semibold text-gray-900 mb-3">Admin Access Required</h3>
                  <p className="text-gray-600 mb-8 leading-relaxed">Please enter the admin password to continue</p>
                  <div className="space-y-6">
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <i className="fas fa-key text-gray-400 text-lg"></i>
                      </div>
                      <input 
                        type="password" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && handleAdminLogin()}
                        className="block w-full pl-12 pr-4 py-4 text-lg border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50" 
                        placeholder="Enter admin password"
                      />
                    </div>
                    <button 
                      onClick={handleAdminLogin}
                      className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-medium rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5 text-lg"
                    >
                      <i className="fas fa-sign-in-alt mr-2"></i>Login
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-10">
                {/* Add/Edit Form */}
                {showForm && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60 p-8">
                    <div className="flex items-center justify-between mb-8">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-blue-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/10 border border-blue-200/40">
                          <i className="fas fa-edit text-blue-500 text-lg"></i>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">
                            {editingId ? 'Edit Vercel Redirect' : 'Add New Vercel Redirect'}
                          </h3>
                          <p className="text-gray-600 text-sm mt-1">
                            {editingId ? 'Update the link details below' : 'Create a new shortened link'}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          setShowForm(false);
                          setEditingIndex(null);
                          setEditingId(null);
                          setFormData({ source: '', destination: '', title: '', description: '' });
                        }}
                        className="p-3 text-gray-400 hover:text-gray-600 hover:bg-gray-100/80 rounded-xl transition-all duration-200"
                      >
                        <i className="fas fa-times text-lg"></i>
                      </button>
                    </div>
                    <form onSubmit={handleFormSubmit} className="space-y-8">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Source Path</label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                              <span className="text-gray-500 text-lg font-mono">/</span>
                            </div>
                            <input 
                              type="text" 
                              required
                              value={formData.source}
                              onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                              className="block w-full pl-10 pr-4 py-4 text-lg border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50" 
                              placeholder="example"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Destination URL</label>
                          <input 
                            type="url" 
                            required
                            value={formData.destination}
                            onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                            className="block w-full px-4 py-4 text-lg border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50" 
                            placeholder="https://example.com"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Title (Optional)</label>
                          <input 
                            type="text"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            className="block w-full px-4 py-4 text-lg border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50" 
                            placeholder="Link title"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-semibold text-gray-700 mb-3">Description (Optional)</label>
                          <input 
                            type="text"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="block w-full px-4 py-4 text-lg border border-gray-300/60 rounded-xl focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200 bg-white/50" 
                            placeholder="Link description"
                          />
                        </div>
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4 pt-4">
                        <button 
                          type="submit"
                          className="inline-flex items-center justify-center px-8 py-4 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold rounded-xl transition-all duration-200 focus:ring-2 focus:ring-blue-500/20 focus:ring-offset-2 shadow-lg shadow-blue-500/25 hover:-translate-y-0.5"
                        >
                          <i className={`fas ${editingId ? 'fa-save' : 'fa-plus'} mr-2`}></i>
                          {editingId ? 'Update Link' : 'Save Link'}
                        </button>
                        <button 
                          type="button"
                          onClick={() => {
                            setShowForm(false);
                            setEditingIndex(null);
                            setEditingId(null);
                            setFormData({ source: '', destination: '', title: '', description: '' });
                          }}
                          className="inline-flex items-center justify-center px-8 py-4 bg-gray-100/80 hover:bg-gray-200/80 text-gray-700 font-semibold rounded-xl transition-all duration-200 backdrop-blur-sm"
                        >
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}

                {/* Draft Management Section */}
                {adminView === 'drafts' && draftLinks.length > 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60 overflow-hidden">
                    <div className="px-6 lg:px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-yellow-50/80 to-white/80">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-yellow-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-yellow-500/10 border border-yellow-200/40">
                          <i className="fas fa-hourglass-half text-yellow-500 text-lg"></i>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Pending Drafts</h3>
                          <p className="text-gray-600 text-sm mt-1">Links awaiting approval for sync to vercel.json</p>
                        </div>
                      </div>
                    </div>
                    <div className="p-6 lg:p-8">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        {draftLinks.map((link, index) => (
                          <div key={link.id || index} className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-6 border border-yellow-200/60">
                            <div className="flex items-start justify-between mb-4">
                              <div className="flex-1">
                                <h4 className="font-semibold text-gray-900 text-lg mb-2">
                                  {link.title || 'Untitled Link'}
                                </h4>
                                <p className="text-gray-600 text-sm mb-3">
                                  {link.description || 'No description'}
                                </p>
                              </div>
                              <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-medium rounded-full">
                                Draft
                              </span>
                            </div>
                            <div className="bg-white/80 rounded-lg p-3 mb-4 border border-yellow-200/40">
                              <div className="text-sm">
                                <div className="font-medium text-gray-700 mb-1">Source:</div>
                                <div className="text-blue-600 font-mono text-sm">{link.source}</div>
                              </div>
                              <div className="text-sm mt-2">
                                <div className="font-medium text-gray-700 mb-1">Destination:</div>
                                <div className="text-gray-600 truncate">{link.destination}</div>
                              </div>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleApproveDraft(link.id!)}
                                className="flex-1 inline-flex items-center justify-center px-4 py-2 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-medium rounded-lg transition-all duration-200 text-sm"
                              >
                                <i className="fas fa-check mr-2"></i>Approve & Sync
                              </button>
                              <button
                                onClick={() => handleDelete(index)}
                                className="px-3 py-2 bg-gray-100 hover:bg-red-100 text-gray-600 hover:text-red-600 rounded-lg transition-all duration-200"
                              >
                                <i className="fas fa-trash"></i>
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* No Drafts Message */}
                {adminView === 'drafts' && draftLinks.length === 0 && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-gray-200/60 p-12 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="fas fa-inbox text-gray-400 text-xl"></i>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">No Pending Drafts</h3>
                    <p className="text-gray-600">All links have been approved and synced to vercel.json</p>
                  </div>
                )}

                {/* Admin Links Table */}
                {adminView === 'all' && (
                  <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl shadow-gray-200/50 border border-gray-200/60 overflow-hidden">
                    <div className="px-6 lg:px-8 py-6 border-b border-gray-200/60 bg-gradient-to-r from-gray-50/80 to-white/80">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-green-50/80 backdrop-blur-sm rounded-xl flex items-center justify-center shadow-lg shadow-green-500/10 border border-green-200/40">
                          <i className="fas fa-list text-green-500 text-lg"></i>
                        </div>
                        <div>
                          <h3 className="text-xl font-semibold text-gray-900">Manage Links</h3>
                          <p className="text-gray-600 text-sm mt-1">View and edit all your shortened links</p>
                        </div>
                      </div>
                    </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50/80 backdrop-blur-sm">
                        <tr>
                          <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Source</th>
                          <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Destination</th>
                          <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Title</th>
                          <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                          <th className="px-6 lg:px-8 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider w-32">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white/50 backdrop-blur-sm divide-y divide-gray-200/60">
                        {linksData.map((link, index) => (
                          <tr key={link.id || index} className="hover:bg-white/80 transition-all duration-200">
                            <td className="px-6 lg:px-8 py-5 whitespace-nowrap">
                              <code className="bg-gray-100/80 text-gray-800 px-3 py-2 rounded-lg text-sm font-mono border border-gray-200/40">{link.source}</code>
                            </td>
                            <td className="px-6 lg:px-8 py-5">
                              <a 
                                href={link.destination} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-700 text-sm break-all transition-colors duration-200 font-medium"
                              >
                                {link.destination.length > 40 ? `${link.destination.substring(0, 40)}...` : link.destination}
                              </a>
                            </td>
                            <td className="px-6 lg:px-8 py-5 text-sm text-gray-900 font-medium">
                              <div>
                                <div className="font-medium">{link.title || 'Untitled'}</div>
                                {link.description && <div className="text-gray-500 text-xs mt-1">{link.description}</div>}
                              </div>
                            </td>
                            <td className="px-6 lg:px-8 py-5 whitespace-nowrap">
                              <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                link.status === 'synced' ? 'bg-green-100 text-green-700' :
                                link.status === 'published' ? 'bg-blue-100 text-blue-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                <i className={`mr-1 ${
                                  link.status === 'synced' ? 'fas fa-check' :
                                  link.status === 'published' ? 'fas fa-clock' :
                                  'fas fa-hourglass-half'
                                }`}></i>
                                {link.status || 'draft'}
                              </span>
                            </td>
                            <td className="px-6 lg:px-8 py-5 whitespace-nowrap">
                              <div className="flex space-x-2">
                                {link.status === 'draft' && (
                                  <button
                                    onClick={() => handleApproveDraft(link.id!)}
                                    className="p-2 text-green-600 hover:text-green-700 hover:bg-green-50/80 rounded-lg transition-all duration-200 text-sm"
                                    title="Approve & Sync"
                                  >
                                    <i className="fas fa-check"></i>
                                  </button>
                                )}
                                <button 
                                  onClick={() => handleEdit(index)}
                                  className="p-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50/80 rounded-lg transition-all duration-200" 
                                  title="Edit"
                                >
                                  <i className="fas fa-edit"></i>
                                </button>
                                <button 
                                  onClick={() => handleDelete(index)}
                                  className="p-2 text-red-600 hover:text-red-700 hover:bg-red-50/80 rounded-lg transition-all duration-200" 
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
                )}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast Notifications */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50">
          <div className={`px-8 py-4 rounded-2xl shadow-xl backdrop-blur-md border ${
            toast.type === 'success' 
              ? 'bg-green-500/90 border-green-400/50 text-white shadow-green-500/25' 
              : 'bg-red-500/90 border-red-400/50 text-white shadow-red-500/25'
          }`}>
            <div className="flex items-center space-x-3">
              <i className={`fas ${toast.type === 'success' ? 'fa-check-circle' : 'fa-exclamation-circle'} text-xl`}></i>
              <span className="font-medium text-lg">{toast.message}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
