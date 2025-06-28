import React from 'react';
import { Book, ArrowLeft, MessageSquare } from 'lucide-react';

const TeachingSession = ({ uploadedDocument, onNavigateToUpload }) => {
  if (!uploadedDocument) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <h2 className="text-2xl font-bold mb-4">Teaching Session</h2>
        
        <div className="text-center py-12">
          <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No document selected</h3>
          <p className="text-gray-600 mb-6">
            Select a document to start your teaching session with Gemini
          </p>
          <button
            onClick={onNavigateToUpload}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
          >
            Upload a Document
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Teaching Session</h2>
        <button
          onClick={onNavigateToUpload}
          className="flex items-center text-gray-600 hover:text-gray-900"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Upload
        </button>
      </div>

      {/* Document Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Book className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">
              Ready to teach from:
            </h3>
            <p className="text-blue-800 font-semibold">{uploadedDocument.filename}</p>
            <div className="text-xs text-blue-600 mt-1 space-x-4">
              <span>{uploadedDocument.chunks_count} chunks</span>
              <span>{uploadedDocument.total_characters?.toLocaleString()} characters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Teaching Interface Placeholder */}
      <div className="space-y-6">
        {/* Coming Soon Notice */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-start">
            <MessageSquare className="h-6 w-6 text-yellow-500 mr-3 mt-0.5" />
            <div>
              <h3 className="text-lg font-medium text-yellow-800 mb-2">
                🚧 AI Teaching Interface Coming Soon!
              </h3>
              <p className="text-yellow-700 mb-3">
                This is where Gemini will act as your AI student, asking thoughtful questions about your uploaded content to help you learn through teaching.
              </p>
              <div className="text-sm text-yellow-600">
                <p className="mb-1"><strong>What's coming:</strong></p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Gemini will analyze your document content</li>
                  <li>Ask clarifying questions about key concepts</li>
                  <li>Request explanations and examples</li>
                  <li>Provide feedback on your teaching</li>
                  <li>Track your learning progress</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Future Chat Interface Preview */}
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h4 className="font-medium text-gray-900 mb-4">Preview: Chat Interface</h4>
          
          {/* Mock chat messages */}
          <div className="space-y-4">
            <div className="flex items-start">
              <div className="bg-blue-100 rounded-full p-2 mr-3">
                <MessageSquare className="h-4 w-4 text-blue-600" />
              </div>
              <div className="bg-gray-100 rounded-lg p-3 max-w-md">
                <p className="text-sm text-gray-700">
                  Hi! I've read your notes on machine learning. Could you explain what supervised learning means in simple terms?
                </p>
                <span className="text-xs text-gray-500 mt-1 block">Gemini (AI Student)</span>
              </div>
            </div>
            
            <div className="flex items-start justify-end">
              <div className="bg-blue-500 text-white rounded-lg p-3 max-w-md">
                <p className="text-sm">
                  Supervised learning is when we train an AI model using examples that already have the correct answers...
                </p>
                <span className="text-xs text-blue-100 mt-1 block">You (Teacher)</span>
              </div>
              <div className="bg-gray-200 rounded-full p-2 ml-3">
                <span className="text-sm">👩‍🏫</span>
              </div>
            </div>
          </div>
          
          <div className="mt-4 p-3 bg-gray-50 rounded border-dashed border-2 border-gray-200 text-center">
            <p className="text-sm text-gray-500">Chat interface will appear here</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-4">
          <button
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-2 rounded-md font-medium"
            onClick={onNavigateToUpload}
          >
            Upload Another Document
          </button>
          <button
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-medium opacity-50 cursor-not-allowed"
            disabled
          >
            Start AI Chat (Coming Soon)
          </button>
        </div>
      </div>
    </div>
  );
};

export default TeachingSession; 