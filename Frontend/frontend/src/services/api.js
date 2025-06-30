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

  // Delete document
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/api/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },

  // Generate initial question
  generateQuestion: async () => {
    try {
      const response = await api.get('/api/gemini/generate-question');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate question: ${error.message}`);
    }
  },

  // Generate follow-up question
  generateFollowupQuestion: async (userAnswer, previousQuestion, conversationHistory = []) => {
    try {
      const response = await api.post('/api/gemini/followup-question', {
        user_answer: userAnswer,
        previous_question: previousQuestion,
        conversation_history: conversationHistory
      });
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate follow-up question: ${error.message}`);
    }
  },

};

export default apiService; 