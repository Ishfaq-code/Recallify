import React, { useState, useEffect } from 'react';
import { File, Trash2, Play, RefreshCw, Upload, Calendar, Hash, Type } from 'lucide-react';
import { apiService } from '../services/api';

const DocumentList = ({ onSelectDocument, onNavigateToUpload }) => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Load documents when component mounts
  useEffect(() => {
    loadDocuments();
  }, []);

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

  const handleDeleteDocument = async (documentId, filename) => {
    if (!confirm(`Are you sure you want to delete "${filename}"?`)) return;
    
    setDeleting(documentId);
    try {
      await apiService.deleteDocument(documentId);
      await loadDocuments(); // Reload the list
    } catch (err) {
      setError(err.message);
    } finally {
      setDeleting(null);
    }
  };

  const handleStartTeaching = (doc) => {
    onSelectDocument(doc);
  };

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

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Your Documents</h2>
        </div>
        
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 text-gray-400 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading documents...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Your Documents</h2>
          <p className="text-gray-600 mt-1">
            {documents.length} document{documents.length !== 1 ? 's' : ''} uploaded
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={loadDocuments}
            className="flex items-center bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm font-medium"
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={onNavigateToUpload}
            className="flex items-center bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
          >
            <Upload className="h-4 w-4 mr-2" />
            Upload New
          </button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700 text-sm">{error}</p>
          <button
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm underline mt-1"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Empty State */}
      {documents.length === 0 && !loading && (
        <div className="text-center py-12">
          <File className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents yet</h3>
          <p className="text-gray-600 mb-6">
            Upload your first PDF to start teaching with Gemini
          </p>
          <button
            onClick={onNavigateToUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Upload Your First Document
          </button>
        </div>
      )}

      {/* Documents Grid */}
      {documents.length > 0 && (
        <div className="space-y-4">
          {documents.map((doc) => (
            <div key={doc.document_id} className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start">
                {/* Document Info */}
                <div className="flex-1">
                  <div className="flex items-start">
                    <File className="h-5 w-5 text-blue-500 mr-3 mt-0.5 flex-shrink-0" />
                    <div className="min-w-0 flex-1">
                      <h3 className="font-medium text-gray-900 truncate">{doc.filename}</h3>
                      
                      {/* Stats */}
                      <div className="mt-2 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <Hash className="h-4 w-4 mr-1" />
                          <span>{doc.chunk_count} chunks</span>
                        </div>
                        <div className="flex items-center">
                          <Type className="h-4 w-4 mr-1" />
                          <span>{doc.total_characters?.toLocaleString()} chars</span>
                        </div>
                        <div className="flex items-center">
                          <Calendar className="h-4 w-4 mr-1" />
                          <span>{formatDate(doc.upload_timestamp)}</span>
                        </div>
                        <div className="flex items-center">
                          <span className="text-green-600 text-xs bg-green-100 px-2 py-1 rounded">
                            Processed
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-2 ml-4 flex-shrink-0">
                  <button
                    onClick={() => handleStartTeaching(doc)}
                    className="flex items-center bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                  >
                    <Play className="h-4 w-4 mr-1" />
                    Teach
                  </button>
                  <button
                    onClick={() => handleDeleteDocument(doc.document_id, doc.filename)}
                    disabled={deleting === doc.document_id}
                    className="flex items-center bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-md text-sm font-medium disabled:opacity-50"
                  >
                    {deleting === doc.document_id ? (
                      <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4 mr-1" />
                    )}
                    {deleting === doc.document_id ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Quick Stats Summary */}
      {documents.length > 0 && (
        <div className="mt-8 bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium text-gray-900 mb-2">Library Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Total Documents:</span>
              <span className="ml-2 font-medium">{documents.length}</span>
            </div>
            <div>
              <span className="text-gray-500">Total Chunks:</span>
              <span className="ml-2 font-medium">
                {documents.reduce((sum, doc) => sum + (doc.chunk_count || 0), 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Total Characters:</span>
              <span className="ml-2 font-medium">
                {documents.reduce((sum, doc) => sum + (doc.total_characters || 0), 0).toLocaleString()}
              </span>
            </div>
            <div>
              <span className="text-gray-500">Ready to Teach:</span>
              <span className="ml-2 font-medium text-green-600">{documents.length}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default DocumentList; 