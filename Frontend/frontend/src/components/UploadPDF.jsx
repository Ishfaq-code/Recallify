import React, { useState, useRef } from 'react';
import { Upload, File, CheckCircle, AlertCircle, X } from 'lucide-react';
import { apiService } from '../services/api';

const UploadPDF = ({ onUploadSuccess, onUploadError }) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [error, setError] = useState(null);
  
  const fileInputRef = useRef(null);
  const dropZoneRef = useRef(null);

  // Handle file selection
  const handleFileSelect = (files) => {
    const file = files[0];
    
    if (!file) return;
    
    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setError('Please select a PDF file');
      return;
    }
    
    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      setError('File size must be less than 10MB');
      return;
    }
    
    setError(null);
    uploadFile(file);
  };

  // Upload file using API service
  const uploadFile = async (file) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    try {
      const result = await apiService.uploadPDF(file, (progress) => {
        setUploadProgress(progress);
      });
      
      setUploadedFile({
        name: file.name,
        size: file.size,
        ...result
      });
      
      setUploadProgress(100);
      
      // Call success callback
      if (onUploadSuccess) {
        onUploadSuccess(result);
      }
      
    } catch (err) {
      setError(err.message);
      if (onUploadError) {
        onUploadError(err.message);
      }
    } finally {
      setIsUploading(false);
    }
  };

  // Drag and drop handlers
  const handleDragEnter = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    
    const files = Array.from(e.dataTransfer.files);
    handleFileSelect(files);
  };

  // Click to select file
  const handleClick = () => {
    fileInputRef.current?.click();
  };

  // Clear uploaded file
  const clearFile = () => {
    setUploadedFile(null);
    setError(null);
    setUploadProgress(0);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Format file size
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Upload Your PDF Notes</h2>
        <p className="text-gray-600">
          Upload your PDF notes and let Gemini learn from them as your AI student
        </p>
      </div>

      {/* Upload Area */}
      {!uploadedFile && (
        <div
          ref={dropZoneRef}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all duration-200
            ${isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }
            ${isUploading ? 'pointer-events-none opacity-50' : ''}
          `}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="flex flex-col items-center">
            <Upload className={`h-12 w-12 mb-4 ${isDragging ? 'text-blue-500' : 'text-gray-400'}`} />
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? 'Drop your PDF here' : 'Upload PDF Notes'}
            </h3>
            
            <p className="text-gray-500 mb-4">
              Drag and drop your PDF file here, or click to browse
            </p>
            
            <div className="text-sm text-gray-400">
              <p>Supported: PDF files only</p>
              <p>Maximum size: 10MB</p>
            </div>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf"
            onChange={(e) => handleFileSelect(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Upload Progress */}
      {isUploading && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-center mb-2">
            <File className="h-5 w-5 text-blue-500 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              Uploading... {uploadProgress}%
            </span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div 
              className="bg-blue-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
          <p className="text-xs text-blue-700 mt-1">Processing PDF and extracting text...</p>
        </div>
      )}

      {/* Success State */}
      {uploadedFile && !isUploading && (
        <div className="mt-4 p-4 bg-green-50 rounded-lg border border-green-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start">
              <CheckCircle className="h-5 w-5 text-green-500 mr-3 mt-0.5" />
              <div>
                <h3 className="text-sm font-medium text-green-900">
                  PDF Uploaded Successfully!
                </h3>
                <div className="mt-2 text-sm text-green-700">
                  <p><strong>File:</strong> {uploadedFile.name}</p>
                  <p><strong>Size:</strong> {formatFileSize(uploadedFile.size)}</p>
                  <p><strong>Chunks created:</strong> {uploadedFile.chunks_count}</p>
                  <p><strong>Characters processed:</strong> {uploadedFile.total_characters?.toLocaleString()}</p>
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => {
                      // Switch to teach view - parent component will handle this
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
            <button
              onClick={clearFile}
              className="text-green-500 hover:text-green-700"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-200">
          <div className="flex items-start">
            <AlertCircle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-sm font-medium text-red-900">Upload Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
              <button
                onClick={() => setError(null)}
                className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
              >
                Try again
              </button>
            </div>
          </div>
        </div>
      )}

     {/* Instructions */}
     <div className="max-w-2xl mx-auto px-6 pb-8">
              <div className="bg-blue-50 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-blue-900 mb-3">How it works:</h3>
                <ol className="list-decimal list-inside space-y-2 text-blue-800">
                  <li>Upload your PDF notes or study materials</li>
                  <li>Our AI processes and understands the content</li>
                  <li>Gemini acts as your AI student, asking questions about the material</li>
                  <li>Teach the AI by answering its questions and explaining concepts</li>
                  <li>Reinforce your own learning through teaching!</li>
                </ol>
              </div>
            </div>

    </div>

    
  );
};

export default UploadPDF; 