// Document Management Component
// Displays uploaded documents in a grid layout with management capabilities
// Handles document selection, deletion, and navigation to teaching sessions

import React, { useState, useEffect } from 'react';
import { File, Trash2, Play, RefreshCw, Upload, Calendar, Hash, Type, AlertCircle, FileText } from 'lucide-react';
import { apiService } from '../services/api';

const DocumentList = ({ onSelectDocument, onNavigateToUpload }) => {
  // Component State Management
  // =========================
  const [documents, setDocuments] = useState([]); // List of uploaded documents
  const [loading, setLoading] = useState(false); // Loading state for API calls
  const [error, setError] = useState(null); // Error messages for user feedback
  const [deleting, setDeleting] = useState(null); // Track which document is being deleted

  // Data Loading Effect
  // ==================
  // Load documents when component mounts
  useEffect(() => {
    loadDocuments();
  }, []);

  // API Integration Functions
  // ========================
  
  /**
   * Load all documents from the backend
   * Updates state with document list and handles errors
   */
  const loadDocuments = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await apiService.getDocuments();
      setDocuments(result.documents || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Delete a document with user confirmation
   * Prevents accidental deletion and updates the document list
   */
  const handleDeleteDocument = async (e, documentId) => {
    // Prevent triggering parent click events
    e.stopPropagation();
    
    // Confirm deletion to prevent accidents
    if (!confirm(`Are you sure you want to delete this document?`)) return;
    
    setDeleting(documentId); // Show loading state on specific document
    try {
      await apiService.deleteDocument(documentId);
      await loadDocuments(); // Refresh the list after successful deletion
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Handle document selection for teaching session
   * Navigates to teaching view with selected document
   */
  const handleStartTeaching = (doc) => {
    onSelectDocument(doc);
  };

  // Utility Functions
  // ================
  
  /**
   * Format timestamp into readable date string
   * Handles invalid dates gracefully
   */
  const formatDate = (dateString) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Unknown date';
    }
  };

  // Component Render
  // ===============
  return (
    <div className="max-w-4xl mx-auto p-6 relative z-10">
      {/* Content backdrop for better readability over animated background */}
      <div className="backdrop-blur-sm bg-black/10 rounded-xl p-6 border border-gray-700/30">
        
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#8ab4f8] mb-2">Your Documents</h2>
          <p className="text-[#8ab4f8]">
            Select a document to start a teaching session
          </p>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <span className="ml-3 text-[#8ab4f8]">Loading documents...</span>
          </div>
        )}

        {/* Error State */}
        {error && !loading && (
          <div className="bg-red-900/20 border border-red-700/30 text-red-400 px-4 py-3 rounded-lg mb-6">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 mr-2" />
              <span>{error}</span>
            </div>
          </div>
        )}

        {/* Empty State - No Documents */}
        {!loading && !error && documents.length === 0 && (
          <div className="text-center py-12">
            <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#8ab4f8] mb-2">No documents found</h3>
            <p className="text-[#8ab4f8] mb-6">Upload your first PDF to get started!</p>
            <button
              onClick={onNavigateToUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-medium transition-colors"
            >
              Upload PDF
            </button>
          </div>
        )}

        {/* Document List Header with Actions */}
        {!loading && documents.length > 0 && (
          <div className="flex justify-between items-center mb-6">
            {/* Document count */}
            <p className="text-[#8ab4f8]">
              {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
            </p>
            
            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={loadDocuments}
                className="flex items-center bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              <button
                onClick={onNavigateToUpload}
                className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload New
              </button>
            </div>
          </div>
        )}

        {/* Documents Grid Layout */}
        {!loading && documents.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <div
                key={doc.id}
                className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4 hover:border-blue-500/50 transition-all duration-200 cursor-pointer group"
                onClick={() => onSelectDocument(doc)}
              >
                {/* Document Header */}
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <FileText className="h-5 w-5 text-blue-400 mr-2" />
                    <h3 className="font-medium text-[#8ab4f8] group-hover:text-blue-300 transition-colors truncate">
                      {doc.filename}
                    </h3>
                  </div>
                  
                  {/* Delete button - only visible on hover */}
                  <button
                    onClick={(e) => handleDeleteDocument(e, doc.id)}
                    className="text-gray-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                    title="Delete document"
                    disabled={deleting === doc.id}
                  >
                    {deleting === doc.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </button>
                </div>
                
                {/* Document Metadata */}
                <div className="text-sm text-[#8ab4f8] space-y-1">
                  <p><strong>Chunks:</strong> {doc.chunks_count || 'N/A'}</p>
                  <p><strong>Characters:</strong> {doc.total_characters?.toLocaleString() || 'N/A'}</p>
                  <p><strong>Uploaded:</strong> {formatDate(doc.created_at)}</p>
                </div>
                
                {/* Action Area */}
                <div className="mt-4 pt-3 border-t border-gray-700/50">
                  <button
                    className="text-blue-400 hover:text-blue-300 text-sm font-medium transition-colors"
                    onClick={() => onSelectDocument(doc)}
                  >
                    Start Teaching Session →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        {!loading && documents.length > 0 && (
          <div className="mt-8 text-center">
            <button
              onClick={onNavigateToUpload}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
            >
              Upload Another PDF
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentList; 