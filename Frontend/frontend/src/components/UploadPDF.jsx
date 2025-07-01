// PDF Upload Component
// Handles file selection, drag-and-drop, upload progress, and user feedback
// Provides intuitive interface for PDF file upload with validation and error handling

import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { apiService } from '../services/api';

const UploadPDF = ({ onUploadSuccess, onUploadError }) => {
  // Component State Management
  // =========================
  const [isDragging, setIsDragging] = useState(false); // Track drag-over state for visual feedback
  const [isUploading, setIsUploading] = useState(false); // Show upload progress and disable interactions
  const [uploadProgress, setUploadProgress] = useState(0); // Progress percentage (0-100)
  const [uploadedFile, setUploadedFile] = useState(null); // Successful upload result data
  const [error, setError] = useState(null); // Error message to display to user
  
  // DOM References
  // ==============
  const fileInputRef = useRef(null); // Hidden file input for click-to-browse
  const dropZoneRef = useRef(null); // Drop zone container for drag events

  // File Selection and Validation
  // =============================
  /**
   * Handle file selection from drag-drop or file browser
   * Validates file type and size before initiating upload
   */
  const handleFileSelect = (files) => {
    const file = files[0];
    
    if (!file) return;
    
    // Validate file type - only PDFs allowed
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }
    
    // Validate file size - 10MB limit to prevent server overload
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    // Clear any previous errors and start upload
    setError(null);
    uploadFile(file);
  };

  // File Upload Process
  // ==================
  /**
   * Upload file to backend with progress tracking
   * Handles the complete upload workflow and user feedback
   */
  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      // Upload with progress callback for real-time feedback
      const result = await apiService.uploadPDF(file, (progress) => {
        setUploadProgress(progress);
      });
      
      // Store upload result with file metadata
      setUploadedFile({
        name: file.name,
        size: file.size,
        ...result
      });
      
      setUploadProgress(100);
      
      // Notify parent component of successful upload
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
    } catch (err) {
      // Handle upload errors with user-friendly messages
      setError(err.message);
      if (onUploadError) {
        onUploadError(err.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and Drop Event Handlers
  // ============================
  
  /**
   * Handle drag enter - show visual feedback
   */
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  /**
   * Handle drag leave - remove visual feedback
   */
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  /**
   * Handle drag over - prevent default to allow drop
   */
  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  /**
   * Handle file drop - process dropped files
   */
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  // User Interaction Handlers
  // ========================
  
  /**
   * Trigger file browser when drop zone is clicked
   */
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  /**
   * Clear uploaded file and reset component state
   * Allows user to upload a different file
   */
  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Utility Functions
  // ================
  
  /**
   * Format file size in human-readable format
   * Converts bytes to appropriate unit (Bytes, KB, MB)
   */
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Component Render
  // ===============
  return (
    <div className="max-w-2xl mx-auto p-6 relative z-10">
      {/* Content backdrop for better readability over animated background */}
      <div className=" bg-black/0 rounded-xl p-6 border border-gray-700/0">
        
        {/* Header Section */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[#8ab4f8] mb-2">Upload Your PDF Notes</h2>
          <p className="text-[#9aa0a6]">
            Upload your PDF notes and let Gemini learn from them as your AI student
          </p>
        </div>

        {/* File Upload Drop Zone */}
        {!uploadedFile && (
          <div
            ref={dropZoneRef}
            className={`
              border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200 
              ${isDragging 
                ? 'border-blue-500 bg-blue-900/20'  // Active drag state
                : 'border-gray-600 hover:border-blue-400 hover:bg-gray-800/30' // Normal/hover state
              }
              ${isUploading ? 'pointer-events-none opacity-50' : ''} // Disabled during upload
            `}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
            onClick={handleClick}
          >
            <div className="flex flex-col items-center">
              {/* Upload icon with dynamic color based on drag state */}
              <Upload className={`h-12 w-12 mb-4 ${isDragging ? 'text-blue-400' : 'text-gray-400'}`} />
              
              {/* Dynamic heading based on interaction state */}
              <h3 className="text-lg font-medium text-[#8ab4f8] mb-2">
                {isDragging ? 'Drop your PDF here' : 'Upload PDF Notes'}
              </h3>
              
              {/* Instructions */}
              <p className="text-[#8ab4f8] mb-4">
                Drag and drop your PDF file here, or click to browse
              </p>
              
              {/* File requirements */}
              <div className="text-sm text-[#8ab4f8]">
                <p>Supported: PDF files only</p>
                <p>Maximum size: 10MB</p>
              </div>
            </div>
            
            {/* Hidden file input for click-to-browse functionality */}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={(e) => handleFileSelect(e.target.files)}
              className="hidden"
            />
          </div>
        )}

        {/* Upload Progress Display */}
        {isUploading && (
          <div className="mt-4 p-4 bg-[#161b22] rounded-lg border border-[#30363d] text-[#9aa0a6]">
            <div className="flex items-center mb-2">
              <File className="h-5 w-5  mr-2" />
              <span className="text-sm font-medium ">
                Uploading... {uploadProgress}%
              </span>
            </div>
            
            {/* Progress bar with smooth animation */}
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
            
            {/* Processing status message */}
            <p className="text-xsmt-1">Processing PDF and extracting text...</p>
          </div>
        )}

        {/* Success State Display */}
        {uploadedFile && !isUploading && (
          <div className="mt-4 p-4 bg-green-900/20 rounded-lg border border-green-700/30">
            <div className="flex items-start justify-between">
              <div className="flex items-start">
                <CheckCircle className="h-5 w-5 text-green-400 mr-3 mt-0.5" />
                <div>
                  {/* Success message */}
                  <h3 className="text-sm font-medium text-green-300">
                    PDF Uploaded Successfully!
                  </h3>
                  
                  {/* File details and processing results */}
                  <div className="mt-2 text-sm text-green-400">
                    <p><strong>File:</strong> {uploadedFile.name}</p>
                    <p><strong>Size:</strong> {formatFileSize(uploadedFile.size)}</p>
                    <p><strong>Chunks created:</strong> {uploadedFile.chunks_count}</p>
                    <p><strong>Characters processed:</strong> {uploadedFile.total_characters?.toLocaleString()}</p>
                  </div>
                  
                  {/* Action button to start teaching */}
                  <div className="mt-3">
                    <button
                      onClick={() => {
                        // Notify parent to switch to teach view
                        if (onUploadSuccess) {
                          onUploadSuccess({ ...uploadedFile, action: 'start_teaching' });
                        }
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                    >
                      Start Teaching Session
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Clear/close button */}
              <button
                onClick={clearFile}
                className="text-green-400 hover:text-green-300"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}

        {/* Error State Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-900/20 rounded-lg border border-red-700/30">
            <div className="flex items-start">
              <AlertCircle className="h-5 w-5 text-red-400 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-red-300">Upload Error</h3>
                <p className="mt-1 text-sm text-red-400">{error}</p>
                
                {/* Retry button */}
                <button
                  onClick={() => setError(null)}
                  className="mt-2 text-sm text-red-400 hover:text-red-300 underline"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        )}

        {/* How It Works Instructions */}
        <div className="max-w-2xl mx-auto px-6 pb-8 pt-10">
          <div className=" rounded-lg p-6 border border-[#30363d] bg-[#161b22]">
            <h3 className="text-lg font-semibold text-white mb-3">How it works:</h3>
            <ol className="list-decimal list-inside space-y-2 text-[#8ab4f8]">
              <li>Upload your PDF notes or study materials</li>
              <li>Our AI processes and understands the content</li>
              <li>Gemini acts as your AI student, asking questions about the material</li>
              <li>Teach the AI by answering its questions and explaining concepts</li>
              <li>Reinforce your own learning through teaching!</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UploadPDF; 