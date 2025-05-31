'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X, Send, Bot, User, Camera, Upload, Loader2 } from 'lucide-react';
import { analyzePrescriptionImage } from '@/lib/gemini';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  type?: 'text' | 'prescription';
}

interface ChatbotProps {
  isOpen: boolean;
  onToggle: () => void;
}

const quickReplies = [
  "What medicines do you have?",
  "How can I track my order?",
  "What are your delivery charges?",
  "Analyze my prescription",
];

const botResponses: Record<string, string> = {
  "hello": "Hello! I'm here to help you with your healthcare needs. How can I assist you today?",
  "hi": "Hi there! Welcome to Clinicado. What can I help you find?",
  "medicines": "We have a wide range of medicines including pain relievers, vitamins, supplements, and prescription drugs. You can browse our categories or search for specific medicines.",
  "delivery": "We offer fast delivery within 24-48 hours. Delivery charges start from ₹50 depending on your location and order value. Orders above ₹500 get free delivery!",
  "track": "You can track your order by going to 'My Orders' section in your account. You'll receive SMS and email updates about your order status.",  "prescription": "Yes, we have prescription medicines. You can upload your prescription image and I'll help analyze it for you. Click the camera icon to get started!",
  "analyze": "I can help analyze your prescription! Please upload an image of your prescription and I'll extract the medicine details for you.",
  "default": "I'm here to help! You can ask me about our medicines, delivery, orders, or upload a prescription for analysis.",
};

export default function Chatbot({ isOpen, onToggle }: ChatbotProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hello! I'm your healthcare assistant. How can I help you today?",
      sender: 'bot',
      timestamp: new Date(),
    },
  ]);const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close camera options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCameraOptions && !(event.target as Element).closest('.chatbot-camera-dropdown')) {
        setShowCameraOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCameraOptions]);

  const generateBotResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();
    
    for (const [key, response] of Object.entries(botResponses)) {
      if (lowerMessage.includes(key)) {
        return response;
      }
    }
    
    return botResponses.default;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate bot typing delay
    setTimeout(() => {
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: generateBotResponse(text),
        sender: 'bot',
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, botResponse]);
      setIsTyping(false);
    }, 1000 + Math.random() * 1000);
  };
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSendMessage(inputValue);
  };

  const handlePrescriptionAnalysis = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      const errorMessage: Message = {
        id: Date.now().toString(),
        text: "Please upload an image file for prescription analysis.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      return;
    }

    setIsAnalyzing(true);
    setShowCameraOptions(false);

    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      text: "📄 Prescription uploaded for analysis",
      sender: 'user',
      timestamp: new Date(),
      type: 'prescription'
    };
    setMessages(prev => [...prev, userMessage]);

    try {
      const analysis = await analyzePrescriptionImage(file);
      
      const botResponse: Message = {
        id: (Date.now() + 1).toString(),
        text: `📋 **Prescription Analysis Results:**\n\n${analysis}\n\n💊 Would you like me to help you find these medicines in our inventory?`,
        sender: 'bot',
        timestamp: new Date(),
        type: 'prescription'
      };      setMessages(prev => [...prev, botResponse]);
    } catch (err) {
      console.error('Prescription analysis failed:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I couldn't analyze the prescription. Please make sure the image is clear and try again.",
        sender: 'bot',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handlePrescriptionAnalysis(file);
    }
  };

  const handleCameraClick = () => {
    setShowCameraOptions(!showCameraOptions);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      {/* Chat Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="fixed bottom-6 right-6 bg-blue-600 text-white p-4 rounded-full shadow-lg hover:bg-blue-700 transition-colors z-50"
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 100, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 100, scale: 0.8 }}
            transition={{ duration: 0.3 }}
            className="fixed bottom-24 right-6 w-80 h-96 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-40"
          >
            {/* Header */}
            <div className="bg-blue-600 dark:bg-blue-700 text-white p-4 rounded-t-xl">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
                  <Bot className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-semibold">Healthcare Assistant</h3>
                  <p className="text-xs text-blue-100">Online • Ready to help</p>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex items-start space-x-2 max-w-[80%] ${
                    message.sender === 'user' ? 'flex-row-reverse space-x-reverse' : ''
                  }`}>                    <div className={`w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 ${
                      message.sender === 'user' 
                        ? 'bg-blue-600 text-white' 
                        : 'bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300'
                    }`}>
                      {message.sender === 'user' ? (
                        <User className="w-3 h-3" />
                      ) : (
                        <Bot className="w-3 h-3" />
                      )}
                    </div>                    <div className={`rounded-lg p-3 ${
                      message.sender === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                    }`}>
                      {message.type === 'prescription' && message.sender === 'bot' ? (
                        <div className="text-sm whitespace-pre-line">{message.text}</div>
                      ) : (
                        <p className="text-sm">{message.text}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}

              {isTyping && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >                  <div className="flex items-start space-x-2">
                    <div className="w-6 h-6 bg-gray-200 dark:bg-gray-600 text-gray-600 dark:text-gray-300 rounded-full flex items-center justify-center">
                      <Bot className="w-3 h-3" />
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <div className="w-2 h-2 bg-gray-400 dark:bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Quick Replies */}
            {messages.length === 1 && (              <div className="px-4 py-2">
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Quick questions:</p>
                <div className="flex flex-wrap gap-1">
                  {quickReplies.map((reply, index) => (
                    <button
                      key={index}
                      onClick={() => handleSendMessage(reply)}
                      className="text-xs bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 px-2 py-1 rounded transition-colors"
                    >
                      {reply}
                    </button>
                  ))}
                </div>
              </div>
            )}            {/* Input */}
            <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex space-x-2">
                <div className="flex-1 relative">
                  <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full pl-3 pr-10 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
                    disabled={isTyping || isAnalyzing}
                  />
                  
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2">
                    {isAnalyzing ? (
                      <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />                    ) : (
                      <div className="relative chatbot-camera-dropdown">
                        <button
                          type="button"
                          onClick={handleCameraClick}
                          className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
                          title="Upload prescription"
                        >
                          <Camera className="w-4 h-4" />
                        </button>
                        
                        {showCameraOptions && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 bottom-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-2 z-50 min-w-[160px]"
                          >
                            <button
                              type="button"
                              onClick={handleUploadClick}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload Prescription</span>
                            </button>
                          </motion.div>
                        )}
                      </div>
                    )}
                  </div>
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isTyping || isAnalyzing}
                  className="bg-blue-600 dark:bg-blue-700 text-white p-2 rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
