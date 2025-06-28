import axios from 'axios';

// Base API configuration
const API_BASE_URL = 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout for file uploads
  headers: {
    'Content-Type': 'application/json',
  },
});

// API service functions
export const apiService = {
  // Health check
  healthCheck: async () => {
    try {
      const response = await api.get('/health');
      return response.data;
    } catch (error) {
      throw new Error(`Health check failed: ${error.message}`);
    }
  },

  // Upload PDF file
  uploadPDF: async (file, onProgress = null) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await api.post('/api/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      console.log(response.data);
      return response.data;
    } catch (error) {
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  // Get all documents
  getDocuments: async () => {
    try {
      const response = await api.get('/api/documents');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  },

  // Get document chunks by ID
  getDocumentChunks: async (documentId) => {
    try {
      const response = await api.get(`/api/documents/${documentId}/chunks`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch document chunks: ${error.message}`);
    }
  },

  // Search similar content
  searchSimilar: async (query, limit = 5) => {
    try {
      const response = await api.post('/api/search', {
        query: query,
        limit: limit,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Search failed: ${error.message}`);
    }
  },

  // Start teaching session
  startTeachingSession: async (documentId) => {
    try {
      const response = await api.post('/api/teaching/start', {
        document_id: documentId,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to start teaching session: ${error.message}`);
    }
  },

  // Send message in teaching session
  sendMessage: async (sessionId, message) => {
    try {
      const response = await api.post('/api/teaching/message', {
        session_id: sessionId,
        message: message,
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to send message: ${error.message}`);
    }
  },

  // Get session history
  getSessionHistory: async (sessionId) => {
    try {
      const response = await api.get(`/api/teaching/session/${sessionId}/history`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to get session history: ${error.message}`);
    }
  },

  // Delete document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/api/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },
};

// Example usage functions for components
export const useApi = () => {
  return {
    // Upload with progress tracking
    uploadWithProgress: async (file, setProgress, setError) => {
      try {
        setError(null);
        const result = await apiService.uploadPDF(file, setProgress);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    // Fetch documents with error handling
    fetchDocuments: async (setDocuments, setError) => {
      try {
        setError(null);
        const result = await apiService.getDocuments();
        setDocuments(result.documents || []);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },

    // Search with debouncing
    searchContent: async (query, setResults, setError) => {
      try {
        setError(null);
        if (!query.trim()) {
          setResults([]);
          return;
        }
        const result = await apiService.searchSimilar(query);
        setResults(result.results || []);
        return result;
      } catch (error) {
        setError(error.message);
        throw error;
      }
    },
  };
};

export default apiService; 