import React, { useState } from 'react';
import UploadPDF from './components/UploadPDF';
import TeachingSession from './components/TeachingSession';
import DocumentList from './components/DocumentList';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('upload'); // 'upload', 'teach', 'documents'
  const [uploadedDocument, setUploadedDocument] = useState(null);

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setUploadedDocument(result);
    
    // If user clicked "Start Teaching Session", switch to teach view
    if (result.action === 'start_teaching') {
      setCurrentView('teach');
    }
  };

  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
  };

  const handleSelectDocument = (doc) => {
    setUploadedDocument(doc);
    setCurrentView('teach');
  };

  const handleNavigateToUpload = () => {
    setCurrentView('upload');
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'upload':
        return (
          <UploadPDF 
            onUploadSuccess={handleUploadSuccess}
            onUploadError={handleUploadError}
          />
        );
        
      case 'teach':
        return (
          <TeachingSession 
            uploadedDocument={uploadedDocument}
            onNavigateToUpload={handleNavigateToUpload}
          />
        );
        
      case 'documents':
        return (
          <DocumentList 
            onSelectDocument={handleSelectDocument}
            onNavigateToUpload={handleNavigateToUpload}
          />
        );
        
      default:
        return (
          <UploadPDF 
            onUploadSuccess={handleUploadSuccess} 
            onUploadError={handleUploadError} 
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header with Navigation */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">Entaract</h1>
              <span className="ml-2 text-sm text-gray-500">AI Teaching Assistant</span>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setCurrentView('teach')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'teach' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Teach
              </button>
              <button
                onClick={() => setCurrentView('documents')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'documents' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                Documents
              </button>
            </nav>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
