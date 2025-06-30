import React, { useState, useRef, useEffect } from 'react';
import { Book, ArrowLeft, Bot, Loader2, Send, User, Mic, MicOff, Volume2, VolumeX, Play, RefreshCw, AlertCircle } from 'lucide-react';
import api from '../services/api';

const TeachingSession = ({ uploadedDocument, onNavigateToUpload }) => {
  const [conversation, setConversation] = useState([]);
  const [currentInput, setCurrentInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionStarted, setSessionStarted] = useState(false);
  
  // Voice chat states
  const [voiceChatEnabled, setVoiceChatEnabled] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [recognitionActive, setRecognitionActive] = useState(false);
  
  const chatEndRef = useRef(null);
  const recognitionRef = useRef(null);
  const synthRef = useRef(null);
  const restartTimeoutRef = useRef(null);
  const isManualStopRef = useRef(false);
  const isRecordingRef = useRef(false);
  const accumulatedTranscriptRef = useRef('');

  // Check voice support on component mount
  useEffect(() => {
    const speechRecognitionSupported = 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
    const speechSynthesisSupported = 'speechSynthesis' in window;
    setVoiceSupported(speechRecognitionSupported && speechSynthesisSupported);
    
    if (speechSynthesisSupported) {
      synthRef.current = window.speechSynthesis;
    }
  }, []);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversation]);

  // Initialize speech recognition
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Speech recognition useEffect triggered', {
        voiceSupported,
        voiceChatEnabled,
        sessionStarted,
        isLoading,
        recognitionActive
      });
    }

    if (!voiceSupported || !voiceChatEnabled || !sessionStarted) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Speech recognition conditions not met - cleaning up');
      }
      
      // Clean up when conditions not met
      isManualStopRef.current = true; // Prevent any restart attempts
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (error) {
          console.log('Error stopping recognition in cleanup:', error);
        }
      }
      
      setIsListening(false);
      setIsRecording(false);
      isRecordingRef.current = false;
      setRecognitionActive(false);
      
      // Clear accumulated transcript
      accumulatedTranscriptRef.current = '';
      
      if (process.env.NODE_ENV === 'development') {
        console.log('Speech recognition cleanup completed');
      }
      return;
    }

    const startRecognition = () => {
      // Double-check conditions before starting
      if (!voiceSupported || !voiceChatEnabled || !sessionStarted) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Conditions changed - not starting recognition');
        }
        return;
      }
      
      if (recognitionRef.current || recognitionActive) {
        if (process.env.NODE_ENV === 'development') {
          console.log('Recognition already active, skipping start');
        }
        return;
      }

      try {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
          console.error('Speech recognition not supported');
          setVoiceChatEnabled(false);
          return;
        }
        
        const recognition = new SpeechRecognition();
        
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Speech recognition started');
          }
          setIsListening(true);
          setRecognitionActive(true);
          isManualStopRef.current = false;
        };

        recognition.onend = () => {
          if (process.env.NODE_ENV === 'development') {
            console.log('Speech recognition ended', {
              isManualStop: isManualStopRef.current,
              voiceChatEnabled,
              sessionStarted,
              isLoading,
              isRecording: isRecordingRef.current,
              accumulatedTranscript: accumulatedTranscriptRef.current
            });
          }
          setIsListening(false);
          setRecognitionActive(false);
          recognitionRef.current = null;

          // Only restart if session is still active and other conditions are met
          if (!isManualStopRef.current && voiceChatEnabled && sessionStarted && !isLoading) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Scheduling recognition restart');
            }
            restartTimeoutRef.current = setTimeout(() => {
              // Double-check conditions before restarting
              if (voiceChatEnabled && sessionStarted && !isLoading) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Restarting recognition after timeout');
                }
                
                // Restore accumulated transcript if we were recording
                if (isRecordingRef.current && accumulatedTranscriptRef.current) {
                  if (process.env.NODE_ENV === 'development') {
                    console.log('Restoring accumulated transcript:', accumulatedTranscriptRef.current);
                  }
                  setCurrentInput(accumulatedTranscriptRef.current);
                }
                
                startRecognition();
              } else {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Conditions changed - not restarting recognition');
                }
              }
            }, 1000); // Wait 1 second before restarting
          } else {
            if (process.env.NODE_ENV === 'development') {
              console.log('Not restarting recognition', {
                isManualStop: isManualStopRef.current,
                voiceChatEnabled,
                sessionStarted,
                isLoading
              });
            }
          }
        };

        recognition.onresult = (event) => {
          let finalTranscript = '';
          let interimTranscript = '';

          for (let i = event.resultIndex; i < event.results.length; i++) {
            const transcript = event.results[i][0].transcript;
            if (event.results[i].isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }

          // Get the full transcript for analysis
          const fullTranscript = (finalTranscript + interimTranscript).trim();
          const lowerFullTranscript = fullTranscript.toLowerCase();
          
          if (process.env.NODE_ENV === 'development') {
            console.log('Speech result:', { 
              fullTranscript, 
              isRecording: isRecordingRef.current, 
              finalTranscript, 
              interimTranscript,
              accumulatedTranscript: accumulatedTranscriptRef.current
            });
          }
          
          // Check for "gemini start" activation word when not recording
          if (!isRecordingRef.current && lowerFullTranscript.includes('gemini start')) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Gemini Start command detected - switching to recording mode');
            }
            
            // Set recording state immediately (both ref and state)
            isRecordingRef.current = true;
            setIsRecording(true);
            
            // Clear accumulated transcript for new recording
            accumulatedTranscriptRef.current = '';
            
            setCurrentInput('🎤 Recording started... Speak your answer now');
            
            // Clear the activation message and prepare for speech capture
            setTimeout(() => {
              setCurrentInput('');
              
              // Process any speech that came after "gemini start" in the same result
              const startIndex = lowerFullTranscript.indexOf('gemini start');
              const speechAfterStart = fullTranscript.substring(startIndex + 12).trim();
              
              if (speechAfterStart.length > 0 && !speechAfterStart.toLowerCase().includes('gemini stop')) {
                if (process.env.NODE_ENV === 'development') {
                  console.log('Found speech after start:', speechAfterStart);
                }
                accumulatedTranscriptRef.current = speechAfterStart;
                setCurrentInput(speechAfterStart);
              }
            }, 1000);
            
            return; // Don't process further in this result
          }

          // Process speech when in recording mode
          if (isRecordingRef.current) {
            let currentTranscript = fullTranscript;
            
            // Remove "gemini start" command from the transcript if it's still there
            if (lowerFullTranscript.includes('gemini start')) {
              const startIndex = lowerFullTranscript.indexOf('gemini start');
              currentTranscript = fullTranscript.substring(startIndex + 12).trim();
            }
            
            // Check for "gemini stop" command to submit the answer
            if (lowerFullTranscript.includes('gemini stop')) {
              // Use accumulated transcript + current transcript for final answer
              const fullAccumulatedTranscript = (accumulatedTranscriptRef.current + ' ' + currentTranscript).trim();
              const stopIndex = fullAccumulatedTranscript.toLowerCase().lastIndexOf('gemini stop');
              let finalAnswer = fullAccumulatedTranscript;
              
              if (stopIndex !== -1) {
                finalAnswer = fullAccumulatedTranscript.substring(0, stopIndex).trim();
              }
              
              if (process.env.NODE_ENV === 'development') {
                console.log('Gemini Stop command detected - submitting answer:', finalAnswer);
              }
              
              // Stop recording immediately (both ref and state)
              isRecordingRef.current = false;
              setIsRecording(false);
              
              // Clear accumulated transcript
              accumulatedTranscriptRef.current = '';
              
              if (finalAnswer.length > 0) {
                // Show the final answer briefly before submitting
                setCurrentInput(`✅ Submitting: "${finalAnswer}"`);
                
                // Submit after a brief delay
                setTimeout(() => {
                  handleVoiceSubmit(finalAnswer);
                }, 500);
              } else {
                // If no content before "stop", just clear and stop recording
                setCurrentInput('');
              }
              
              return;
            }
            
            // Accumulate the transcript (only final results to avoid duplicates)
            if (finalTranscript.trim().length > 0) {
              // Only add new content that isn't already in accumulated transcript
              const newContent = currentTranscript.trim();
              if (newContent && !accumulatedTranscriptRef.current.includes(newContent)) {
                accumulatedTranscriptRef.current = (accumulatedTranscriptRef.current + ' ' + newContent).trim();
                if (process.env.NODE_ENV === 'development') {
                  console.log('Updated accumulated transcript:', accumulatedTranscriptRef.current);
                }
              }
            }
            
            // Show the combined transcript (accumulated + current interim)
            const displayTranscript = (accumulatedTranscriptRef.current + ' ' + currentTranscript).trim();
            
            if (process.env.NODE_ENV === 'development') {
              console.log('Updating display transcript:', displayTranscript);
            }
            
            // Show real-time transcript (only if there's meaningful content)
            if (displayTranscript.length > 0) {
              if (process.env.NODE_ENV === 'development') {
                console.log('Setting input to:', displayTranscript);
              }
              setCurrentInput(displayTranscript);
            }
          }
        };

        recognition.onerror = (event) => {
          console.error('Speech recognition error:', event.error);
          setIsListening(false);
          setIsRecording(false);
          isRecordingRef.current = false;
          setRecognitionActive(false);
          recognitionRef.current = null;

          // Handle specific errors
          if (event.error === 'not-allowed') {
            alert('Microphone access denied. Please allow microphone access and try again.');
            setVoiceChatEnabled(false);
            return;
          }

          if (event.error === 'network') {
            console.error('Network error in speech recognition');
            setVoiceChatEnabled(false);
            return;
          }

          // For other errors, only restart if session is still active
          if (!isManualStopRef.current && voiceChatEnabled && sessionStarted && !isLoading) {
            if (process.env.NODE_ENV === 'development') {
              console.log('Scheduling recognition restart after error:', event.error);
            }
            restartTimeoutRef.current = setTimeout(() => {
              if (voiceChatEnabled && sessionStarted && !isLoading) {
                startRecognition();
              }
            }, 3000); // Wait 3 seconds after error
          }
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (error) {
        console.error('Failed to start speech recognition:', error);
        setIsListening(false);
        setIsRecording(false);
        setRecognitionActive(false);
        setVoiceChatEnabled(false);
      }
    };

    // If all conditions are met but recognition is not active and not loading, start it
    if (!recognitionActive && !isLoading && !recognitionRef.current) {
      if (process.env.NODE_ENV === 'development') {
        console.log('Starting recognition from useEffect');
      }
      isManualStopRef.current = false; // Reset manual stop flag
      startRecognition();
    }

    // Cleanup function
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Cleaning up speech recognition from useEffect');
      }
      
      isManualStopRef.current = true; // Prevent restart attempts
      
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
        restartTimeoutRef.current = null;
      }
      
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
          recognitionRef.current = null;
        } catch (error) {
          console.log('Error stopping recognition in cleanup:', error);
        }
      }
      
      setIsListening(false);
      setIsRecording(false);
      isRecordingRef.current = false;
      setRecognitionActive(false);
      
      // Clear accumulated transcript
      accumulatedTranscriptRef.current = '';
    };
  }, [voiceChatEnabled, sessionStarted, isLoading]);

  const handleVoiceSubmit = async (transcript) => {
    if (!transcript.trim() || isLoading) return;
    
    // Immediately stop recording and clean up recognition
    setIsRecording(false);
    isRecordingRef.current = false;
    
    // Clear accumulated transcript
    accumulatedTranscriptRef.current = '';
    
    // Stop current recognition to prevent conflicts during submission
    if (recognitionRef.current) {
      isManualStopRef.current = true;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    // Clear any pending restart timeouts
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    setCurrentInput(`✅ Voice captured: "${transcript}"`);
    
    // Show processing message briefly
    setTimeout(() => {
      setCurrentInput(transcript);
    }, 800);
    
    // Use the existing sendAnswer logic
    await sendAnswerWithText(transcript);
    
    // After submission, reset manual stop flag so recognition can restart
    setTimeout(() => {
      if (voiceChatEnabled && sessionStarted) {
        isManualStopRef.current = false;
        if (process.env.NODE_ENV === 'development') {
          console.log('Voice submission complete - ready for next voice input');
        }
      }
    }, 1000);
  };

  const toggleVoiceChat = () => {
    const newVoiceState = !voiceChatEnabled;
    setVoiceChatEnabled(newVoiceState);
    
    // Clean up current recognition
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      isManualStopRef.current = true;
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    
    setIsListening(false);
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecognitionActive(false);
    
    // Clear accumulated transcript
    accumulatedTranscriptRef.current = '';
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    // If turning off voice chat, clear any voice-related input
    if (!newVoiceState && currentInput.includes('🎤')) {
      setCurrentInput('');
    }
  };

  const speakText = (text) => {
    if (!voiceChatEnabled || !synthRef.current || !text) return;

    // Stop any current speech
    synthRef.current.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 1;
    utterance.volume = 0.8;
    
    // Try to use a natural voice
    const voices = synthRef.current.getVoices();
    const preferredVoice = voices.find(voice => 
      voice.name.includes('Natural') || 
      voice.name.includes('Google') ||
      voice.name.includes('Microsoft')
    ) || voices[0];
    
    if (preferredVoice) {
      utterance.voice = preferredVoice;
    }

    synthRef.current.speak(utterance);
  };

  const startTeachingSession = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await api.generateQuestion();
      const initialQuestion = {
        id: Date.now(),
        type: 'ai_question',
        content: response.question,
        timestamp: new Date().toISOString()
      };
      
      setConversation([initialQuestion]);
      setSessionStarted(true);
      
      // Speak the initial question if voice chat is enabled
      if (voiceChatEnabled) {
        setTimeout(() => speakText(response.question), 500);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const sendAnswer = async () => {
    if (!currentInput.trim() || isLoading) return;
    await sendAnswerWithText(currentInput.trim());
  };

  const sendAnswerWithText = async (answerText) => {
    if (!answerText || isLoading) return;

    setCurrentInput('');
    setIsLoading(true);
    setIsRecording(false);
    isRecordingRef.current = false;

    // Add user message to conversation
    const userMessage = {
      id: Date.now(),
      type: 'user_answer',
      content: answerText,
      timestamp: new Date().toISOString()
    };

    setConversation(prev => [...prev, userMessage]);

    try {
      // Get the last AI question
      const lastAiQuestion = conversation.filter(msg => msg.type === 'ai_question').pop();
      
      // Build conversation history for context
      const conversationHistory = conversation
        .filter(msg => msg.type === 'ai_question')
        .slice(-3)
        .map(question => {
          const answerIndex = conversation.findIndex(msg => 
            msg.type === 'user_answer' && msg.id > question.id
          );
          const answer = answerIndex !== -1 ? conversation[answerIndex] : null;
          return {
            question: question.content,
            answer: answer ? answer.content : ''
          };
        });

      // Generate follow-up question
      const response = await api.generateFollowupQuestion(
        answerText,
        lastAiQuestion.content,
        conversationHistory
      );

      // Add AI follow-up question to conversation
      const aiFollowup = {
        id: Date.now() + 1,
        type: 'ai_question',
        content: response.question,
        timestamp: new Date().toISOString()
      };

      setConversation(prev => [...prev, aiFollowup]);
      
      // Speak the AI response if voice chat is enabled
      if (voiceChatEnabled) {
        setTimeout(() => speakText(response.question), 500);
      }
    } catch (err) {
      setError(`Failed to generate follow-up question: ${err.message}`);
    } finally {
      setIsLoading(false);
      
      // Reset voice chat state for next interaction
      if (voiceChatEnabled && sessionStarted) {
        if (process.env.NODE_ENV === 'development') {
          console.log('AI response complete - voice chat ready for next question');
        }
        // The useEffect will handle restarting recognition when isLoading becomes false
      }
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendAnswer();
    }
  };

  const formatTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const endSession = () => {
    if (process.env.NODE_ENV === 'development') {
      console.log('Ending teaching session - stopping all voice recognition');
    }
    
    // Stop session first
    setSessionStarted(false);
    setConversation([]);
    setCurrentInput('');
    setError(null);
    
    // Immediately set manual stop flag to prevent any restart attempts
    isManualStopRef.current = true;
    
    // Clean up recognition completely
    if (restartTimeoutRef.current) {
      clearTimeout(restartTimeoutRef.current);
      restartTimeoutRef.current = null;
    }
    
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      } catch (error) {
        console.log('Error stopping recognition:', error);
      }
    }
    
    // Reset all voice states
    setIsListening(false);
    setIsRecording(false);
    isRecordingRef.current = false;
    setRecognitionActive(false);
    
    // Clear accumulated transcript
    accumulatedTranscriptRef.current = '';
    
    if (synthRef.current) {
      synthRef.current.cancel();
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log('Teaching session ended - all voice recognition stopped');
    }
  };
  
  // Cleanup on component unmount
  useEffect(() => {
    return () => {
      if (process.env.NODE_ENV === 'development') {
        console.log('Component unmounting - cleaning up all recognition resources');
      }
      if (restartTimeoutRef.current) {
        clearTimeout(restartTimeoutRef.current);
      }
      if (recognitionRef.current) {
        isManualStopRef.current = true;
        recognitionRef.current.stop();
      }
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  if (!uploadedDocument) {
    return (
      <div className="max-w-4xl mx-auto p-6 relative z-10">
        {/* Content backdrop for better readability */}
        <div className="backdrop-blur-sm bg-black/10 rounded-xl p-6 border border-gray-700/30">
          <h2 className="text-2xl font-bold mb-4 text-[#8ab4f8]">Teaching Session</h2>
          
          <div className="text-center py-12">
            <Book className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#8ab4f8] mb-2">No document selected</h3>
            <p className="text-[#8ab4f8] mb-6">
              Select a document to start your teaching session
            </p>
            <button
              onClick={onNavigateToUpload}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium"
            >
              Upload a Document
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6 h-screen flex flex-col relative z-10">
      {/* Content backdrop for better readability */}
      <div className="backdrop-blur-sm bg-black/10 rounded-xl p-6 border border-gray-700/30 h-full flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-[#8ab4f8]">AI Teaching Session</h2>
        <div className="flex items-center space-x-4">
          {/* Voice Chat Toggle */}
          {voiceSupported && (
            <div className="flex items-center space-x-2">
              <button
                onClick={toggleVoiceChat}
                className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
                  voiceChatEnabled 
                    ? 'bg-green-100 text-green-800 border border-green-300' 
                    : 'bg-gray-100 text-gray-600 border border-gray-300'
                }`}
              >
                {voiceChatEnabled ? (
                  <>
                    <Volume2 className="h-4 w-4 mr-1" />
                    Voice Chat ON
                  </>
                ) : (
                  <>
                    <VolumeX className="h-4 w-4 mr-1" />
                    Voice Chat OFF
                  </>
                )}
              </button>
              
              {/* Voice Status Indicators */}
              {voiceChatEnabled && sessionStarted && (
                <div className="flex items-center space-x-2">
                  {isListening && (
                    <div className="flex items-center text-blue-600">
                      <Mic className="h-4 w-4 mr-1" />
                      <span className="text-xs">Listening...</span>
                    </div>
                  )}
                  {isRecording && (
                    <div className="flex items-center text-red-600">
                      <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse mr-1"></div>
                      <span className="text-xs font-medium">Recording</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
          
                      <button
              onClick={onNavigateToUpload}
              className="flex items-center text-gray-300 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Back to Upload
            </button>
        </div>
      </div>

      {/* Voice Chat Instructions */}
      {voiceChatEnabled && sessionStarted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <div className="flex items-start">
            <Mic className="h-4 w-4 text-green-500 mr-2 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">Voice Chat Active</p>
              <p>Say <strong>"Gemini Start"</strong> to begin recording, then say <strong>"Gemini Stop"</strong> when finished with your answer.</p>
            </div>
          </div>
        </div>
      )}

      {/* Recording Status Banner */}
      {voiceChatEnabled && sessionStarted && isRecording && (
        <div className="bg-red-50 border-2 border-red-300 rounded-lg p-4 mb-4 animate-pulse">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-3">
              <div className="relative">
                <Mic className="h-6 w-6 text-red-600" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping"></div>
              </div>
              <div className="text-center">
                <p className="text-red-800 font-semibold text-lg">🎤 Recording Your Answer</p>
                <p className="text-red-600 text-sm">Speak clearly - Your words appear below!</p>
                <p className="text-red-500 text-xs mt-1">Say <strong>"Gemini Stop"</strong> to submit your answer</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Listening Status Banner */}
      {voiceChatEnabled && sessionStarted && isListening && !isRecording && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-center">
            <div className="flex items-center space-x-2">
              <Mic className="h-4 w-4 text-blue-600" />
              <p className="text-blue-800 text-sm">👂 Listening for "Gemini Start" command...</p>
            </div>
          </div>
        </div>
      )}

      {/* Document Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-start">
          <Book className="h-5 w-5 text-blue-500 mr-3 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-blue-900">Teaching from:</h3>
            <p className="text-blue-800 font-semibold">{uploadedDocument.filename}</p>
            <div className="text-xs text-blue-600 mt-1 space-x-4">
              <span>{uploadedDocument.chunks_count} chunks</span>
              <span>{uploadedDocument.total_characters?.toLocaleString()} characters</span>
            </div>
          </div>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
          <p className="text-red-800">{error}</p>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 hover:text-red-800 text-sm mt-2"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Main Content */}
      {!sessionStarted ? (
        <div className="text-center py-16">
          <Bot className="h-20 w-20 text-green-400 mx-auto mb-6" />
          <h3 className="text-xl font-semibold text-[#8ab4f8] mb-4">Ready to Start Teaching?</h3>
          <p className="text-[#8ab4f8] max-w-2xl mx-auto mb-6">
            Your AI student will ask thoughtful questions based on your uploaded document. 
            Answer their questions to help them learn, and they'll ask follow-up questions to deepen the conversation.
            {voiceSupported && (
              <span className="block mt-2 text-sm text-blue-600">
                💡 Try enabling voice chat! Say "Gemini Start" to begin recording, then "Gemini Stop" to submit your answers.
              </span>
            )}
          </p>
          <button
            onClick={startTeachingSession}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-8 py-3 rounded-md font-medium flex items-center mx-auto"
          >
            {isLoading ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Starting Session...
              </>
            ) : (
              <>
                <Bot className="h-5 w-5 mr-2" />
                Start Teaching Session
              </>
            )}
          </button>
        </div>
      ) : (
        <div className="flex-1 flex flex-col min-h-0">
          {/* Chat Messages */}
          <div className="flex-1 bg-gray-800/30 border border-gray-700/50 rounded-lg mb-4 overflow-hidden flex flex-col">
            <div className="p-4 border-b border-gray-700/50 bg-gray-800/50">
              <h4 className="font-medium text-[#8ab4f8] flex items-center">
                <Bot className="h-4 w-4 mr-2 text-green-500" />
                Conversation with your AI Student
                {voiceChatEnabled && (
                  <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                    🎤 Voice Active
                  </span>
                )}
              </h4>
            </div>
            
            <div className="flex-1 p-4 overflow-y-auto">
              <div className="space-y-4">
                {conversation.map((message) => (
                  <div key={message.id} className={`flex ${message.type === 'user_answer' ? 'justify-end' : 'justify-start'}`}>
                    <div                         className={`max-w-xs lg:max-w-md ${message.type === 'user_answer' ? 'order-2' : 'order-1'}`}>
                        <div className={`px-4 py-3 rounded-lg ${
                          message.type === 'user_answer' 
                            ? 'bg-blue-500 text-white' 
                            : 'bg-gray-700/50 text-[#8ab4f8]'
                        }`}>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                      <div className={`flex items-center mt-1 space-x-2 ${message.type === 'user_answer' ? 'justify-end' : 'justify-start'}`}>
                        {message.type === 'user_answer' ? (
                          <User className="h-3 w-3 text-gray-400" />
                        ) : (
                          <Bot className="h-3 w-3 text-green-500" />
                        )}
                        <span className="text-xs text-gray-500">
                          {formatTime(message.timestamp)}
                        </span>
                        {voiceChatEnabled && message.type === 'ai_question' && (
                          <button
                            onClick={() => speakText(message.content)}
                            className="text-gray-400 hover:text-gray-600"
                            title="Replay voice"
                          >
                            <Volume2 className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-gray-700/50 rounded-lg px-4 py-3">
                      <div className="flex items-center space-x-2">
                        <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                        <span className="text-sm text-[#8ab4f8]">AI student is thinking...</span>
                      </div>
                    </div>
                  </div>
                )}
                
                <div ref={chatEndRef} />
              </div>
            </div>
          </div>

          {/* Input Area */}
          <div className="bg-gray-800/30 border border-gray-700/50 rounded-lg p-4">
            <div className="flex space-x-3">
              <textarea
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  voiceChatEnabled 
                    ? (isRecording 
                        ? "🎤 Speaking... Say 'Gemini Stop' when finished" 
                        : isListening 
                          ? "👂 Say 'Gemini Start' to record, or type your answer..." 
                          : "Voice chat ready - say 'Gemini Start' or type...")
                    : "Type your answer to help your AI student learn..."
                }
                className={`flex-1 border rounded-md px-3 py-2 resize-none focus:outline-none transition-all duration-300 text-[#8ab4f8] placeholder-[#8ab4f8] bg-gray-800/30 ${
                  isRecording 
                    ? 'border-red-400 ring-2 ring-red-300 shadow-lg' 
                    : isListening 
                      ? 'border-blue-300 ring-1 ring-blue-200' 
                      : 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent'
                }`}
                rows="3"
                disabled={isLoading}
              />
              <div className="flex flex-col space-y-2">
                <button
                  onClick={sendAnswer}
                  disabled={!currentInput.trim() || isLoading || isRecording}
                  className="bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white p-2 rounded-md transition-colors"
                >
                  <Send className="h-4 w-4" />
                </button>
                <button
                  onClick={endSession}
                  disabled={isLoading}
                  className="bg-red-500 hover:bg-red-600 disabled:bg-gray-300 text-white px-3 py-2 rounded-md text-xs"
                >
                  End
                </button>
              </div>
            </div>
            <div className="mt-2 text-xs text-[#8ab4f8]">
              {voiceChatEnabled ? (
                isRecording ? (
                                      <span className="text-red-600 font-medium">🎤 Recording in progress - say "Gemini Stop" to submit your answer</span>
                ) : isListening ? (
                                      <span className="text-blue-600">👂 Say "Gemini Start" to record voice, or press Enter to send text • Use "Gemini Stop" to end recording</span>
                ) : (
                                      <>Say "Gemini Start" to record voice, then "Gemini Stop" to submit • Press Enter to send text • Shift+Enter for new line</>
                )
              ) : (
                <>Press Enter to send, Shift+Enter for new line</>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
};

export default TeachingSession; 