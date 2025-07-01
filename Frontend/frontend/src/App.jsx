// Main Application Component for Recallify
// Manages global state, navigation, and animated background waves

import React, { useState, useEffect, useRef } from 'react';
import UploadPDF from './components/UploadPDF';
import TeachingSession from './components/TeachingSession';
import DocumentList from './components/DocumentList';
import './App.css';

function App() {
  // State Management
  // ===============
  const [currentView, setCurrentView] = useState('upload'); // Current active page/component
  const [uploadedDocument, setUploadedDocument] = useState(null); // Currently selected document data
  
  // Animation References
  // ===================
  const canvasRef = useRef(null); // Reference to canvas element for background animation
  const animationId = useRef(null); // Reference to animation frame for cleanup

  // Wave Animation Configuration
  // ===========================
  // Creates a layered wave effect with different parameters for visual depth
  const waves = [
    { 
      amplitude: 20,        // Wave height
      wavelength: 0.015,    // Wave frequency (smaller = more waves)
      speed: 0.02,          // Animation speed
      offsetRatio: 0.6,     // Vertical position (0.6 = 60% down the screen)
      color: 'rgba(138,180,248,0.3)' // Semi-transparent blue
    },
    { 
      amplitude: 25, 
      wavelength: 0.02, 
      speed: 0.015, 
      offsetRatio: 0.7, 
      color: 'rgba(138,180,248,0.4)' 
    },
    { 
      amplitude: 30, 
      wavelength: 0.025, 
      speed: 0.01, 
      offsetRatio: 0.8, 
      color: 'rgba(138,180,248,0.5)' 
    },
  ];

  // Background Wave Animation Effect
  // ===============================
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;
    
    // Track wave phases for smooth animation
    const phases = waves.map(() => 0);

    // Handle window resize to maintain full-screen canvas
    const resize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    // Main animation render loop
    const render = () => {
      // Clear previous frame
      ctx.clearRect(0, 0, width, height);

      // Render each wave layer
      waves.forEach((w, i) => {
        const { amplitude, wavelength, speed, offsetRatio, color } = w;
        const offsetY = height * offsetRatio; // Calculate vertical position

        // Create wave path
        ctx.beginPath();
        ctx.moveTo(0, offsetY);
        
        // Generate sine wave across screen width
        for (let x = 0; x <= width; x++) {
          const y = offsetY + Math.sin(x * wavelength + phases[i]) * amplitude;
          ctx.lineTo(x, y);
        }
        
        // Complete the shape to fill area below wave
        ctx.lineTo(width, height);
        ctx.lineTo(0, height);
        ctx.closePath();

        // Fill the wave with specified color
        ctx.fillStyle = color;
        ctx.fill();

        // Advance wave phase for next frame
        phases[i] += speed;
      });

      // Schedule next frame
      animationId.current = requestAnimationFrame(render);
    };

    // Initialize animation
    resize();
    window.addEventListener('resize', resize);
    render();

    // Cleanup function
    return () => {
      cancelAnimationFrame(animationId.current);
      window.removeEventListener('resize', resize);
    };
  }, []); // Empty dependency array - run once on mount

  // Event Handlers
  // ==============

  /**
   * Handle successful PDF upload
   * Updates state and potentially navigates to teaching view
   */
  const handleUploadSuccess = (result) => {
    console.log('Upload successful:', result);
    setUploadedDocument(result);
    
    // Auto-navigate to teaching session if requested
    if (result.action === 'start_teaching') {
      setCurrentView('teach');
    }
  };

  /**
   * Handle upload errors with logging
   */
  const handleUploadError = (error) => {
    console.error('Upload failed:', error);
  };

  /**
   * Handle document selection from document list
   * Navigates to teaching session with selected document
   */
  const handleSelectDocument = (doc) => {
    setUploadedDocument(doc);
    setCurrentView('teach');
  };

  /**
   * Navigate back to upload view
   * Used by other components to return to main upload screen
   */
  const handleNavigateToUpload = () => {
    setCurrentView('upload');
  };

  // View Rendering Logic
  // ===================
  /**
   * Render the appropriate component based on current view state
   * Implements single-page application navigation
   */
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
        // Fallback to upload view
        return (
          <UploadPDF 
            onUploadSuccess={handleUploadSuccess} 
            onUploadError={handleUploadError} 
          />
        );
    }
  };

  // Main Render
  // ===========
  return (
    <div className="min-h-screen relative" style={{ backgroundColor: '#0d1117' }}>
      {/* Animated Background Canvas */}
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" />
      
      {/* Navigation Header */}
      <header style={{ backgroundColor: '#161b22' }} className="shadow-sm border-b border-gray-700/0 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            
            {/* Brand/Logo Section */}
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-white">Recallify</h1>
              <span className="ml-2 text-sm text-[#8ab4f8]">AI Teaching Assistant</span>
            </div>
            
            {/* Navigation Menu */}
            <nav className="flex space-x-4">
              <button
                onClick={() => setCurrentView('upload')}
                className={`px-3 py-1 rounded-md transition-colors ${
                  currentView === 'upload' 
                    ? 'bg-blue-600 text-white'  // Active state styling
                    : 'text-[#8ab4f8] hover:text-white hover:bg-gray-700' // Inactive state with hover
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

      {/* Main Content Area */}
      <main className="py-8 relative z-10">
        {renderCurrentView()}
      </main>
    </div>
  );
}

export default App;
