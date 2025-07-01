// API Service Layer
// Centralized HTTP client for all backend communication
// Handles authentication, error processing, and provides clean interface for components

import axios from 'axios';

// API Configuration
// ================
const API_BASE_URL = 'http://localhost:8000'; // Backend server address

// Create configured axios instance with default settings
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // 30 seconds timeout (generous for file uploads and AI processing)
  headers: {
    'Content-Type': 'application/json', // Default content type
  },
});

// API Service Object
// ==================
// Provides clean, promise-based interface for all backend operations
export const apiService = {

  /**
   * Upload PDF file to backend for processing
   * 
   * Handles multipart form data upload with progress tracking
   * Backend will extract text, create embeddings, and store in vector database
   * 
   * @param {File} file - PDF file object from file input
   * @param {Function} onProgress - Optional callback for upload progress (0-100)
   * @returns {Promise<Object>} Upload result with text, chunks, and embeddings
   * @throws {Error} If upload fails or file is invalid
   */
  uploadPDF: async (file, onProgress = null) => {
    try {
      // Create form data for file upload
      const formData = new FormData();
      formData.append('file', file);

      // Make upload request with progress tracking
      const response = await api.post('/api/upload-pdf', formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Override for file upload
        },
        // Track upload progress for user feedback
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
            onProgress(progress);
          }
        },
      });

      console.log(response.data); // Debug logging
      return response.data;
    } catch (error) {
      // Extract detailed error message from backend response
      if (error.response?.data?.detail) {
        throw new Error(error.response.data.detail);
      }
      throw new Error(`Upload failed: ${error.message}`);
    }
  },

  /**
   * Retrieve list of all uploaded documents
   * 
   * Gets document metadata for display in document management interface
   * Includes document IDs, filenames, and content previews
   * 
   * @returns {Promise<Object>} Response containing documents array
   * @throws {Error} If request fails or server error
   */
  getDocuments: async () => {
    try {
      const response = await api.get('/api/documents');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }
  },

  /**
   * Get full content and chunks for a specific document
   * 
   * Retrieves detailed document data by ID for viewing or teaching sessions
   * 
   * @param {string} documentId - Unique identifier of the document
   * @returns {Promise<Object>} Document content and metadata
   * @throws {Error} If document not found or request fails
   */
  getDocumentChunks: async (documentId) => {
    try {
      const response = await api.get(`/api/documents/${documentId}/chunks`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to fetch document chunks: ${error.message}`);
    }
  },

  /**
   * Delete a document and all associated data
   * 
   * Permanently removes document from vector database
   * This operation cannot be undone
   * 
   * @param {string} documentId - Unique identifier of document to delete
   * @returns {Promise<Object>} Success confirmation
   * @throws {Error} If document not found or deletion fails
   */
  deleteDocument: async (documentId) => {
    try {
      const response = await api.delete(`/api/documents/${documentId}`);
      return response.data;
    } catch (error) {
      throw new Error(`Failed to delete document: ${error.message}`);
    }
  },

  /**
   * Generate initial teaching question using AI
   * 
   * Creates contextual opening question based on uploaded document content
   * AI acts as curious student asking teacher to explain concepts
   * 
   * @returns {Promise<Object>} Response containing generated question
   * @throws {Error} If AI service fails or no content available
   */
  generateQuestion: async () => {
    try {
      const response = await api.get('/api/gemini/generate-question');
      return response.data;
    } catch (error) {
      throw new Error(`Failed to generate question: ${error.message}`);
    }
  },

  /**
   * Generate contextual follow-up question based on conversation
   * 
   * Creates adaptive questions that build upon user's previous answers
   * Maintains conversation flow and deepens understanding
   * 
   * @param {string} userAnswer - User's response to previous question
   * @param {string} previousQuestion - The question that was just answered
   * @param {Array} conversationHistory - Previous Q&A exchanges for context
   * @returns {Promise<Object>} Response containing follow-up question
   * @throws {Error} If AI service fails or request invalid
   */
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

// Export default for convenient importing
export default apiService; 