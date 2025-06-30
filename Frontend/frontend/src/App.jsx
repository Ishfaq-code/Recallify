import React, { useState, useEffect, useRef } from 'react';
import UploadPDF from './components/UploadPDF';
import TeachingSession from './components/TeachingSession';
import DocumentList from './components/DocumentList';
import './App.css';

function App() {
  const [currentView, setCurrentView] = useState('upload');
  const [uploadedDocument, setUploadedDocument] = useState(null);
  const canvasRef = useRef(null);
  const animationId = useRef(null);

  const waves = [
    { amplitude: 20, wavelength: 0.015, speed: 0.02, offsetRatio: 0.6, color: 'rgba(138,180,248,0.3)' },
    { amplitude: 25, wavelength: 0.02, speed: 0.015, offsetRatio: 0.7, color: 'rgba(138,180,248,0.4)' },
    { amplitude: 30, wavelength: 0.025, speed: 0.01, offsetRatio: 0.8, color: 'rgba(138,180,248,0.5)' },
  ];

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    const phases = waves.map(() => 0);

    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      waves.forEach((w, i) => {
        const { amplitude, wavelength, speed, offsetRatio, color } = w;
        const offsetY = height * offsetRatio;

        ctx.beginPath();
        ctx.moveTo(0, offsetY);
        for (let x = 0; x <= width; x++) {
          const y = offsetY + Math.sin(x * wavelength + phases[i]) * amplitude;
          ctx.lineTo(x, y);
        }
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        ctx.fillStyle = color;
        ctx.fill();

        phases[i] += speed;
      });

      animationId.current = requestAnimationFrame(render);
    };

    resize();
    window.addEventListener('resize', resize);
    render();

    return () => {
      cancelAnimationFrame(animationId.current);
      window.removeEventListener('resize', resize);
    };
  }, []);

  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setUploadedDocument(result);
    
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
    <div className="min-h-screen relative" style={{ backgroundColor: '#0d1117' }}>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      
      <header style={{ backgroundColor: '#161b22' }} className="shadow-sm border-b border-gray-700 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Recallify</h1>
              <span className="ml-2 text-sm text-[#8ab4f8]">AI Teaching Assistant</span>
            </div>
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'upload' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-[#8ab4f8] hover:text-white hover:bg-gray-700'
                }`}
              >
                Upload
              </button>
              <button
                onClick={() => setCurrentView('teach')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'teach' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-[#8ab4f8] hover:text-white hover:bg-gray-700'
                }`}
              >
                Teach
              </button>
              <button
                onClick={() => setCurrentView('documents')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'documents' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-[#8ab4f8] hover:text-white hover:bg-gray-700'
                }`}
              >
                Documents
              </button>
            </nav>
          </div>
        </div>
      </header>

      <main className="py-8 relative z-10">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
