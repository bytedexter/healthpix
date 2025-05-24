import React, { useState, useRef, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  IconButton,
  CircularProgress,
  Avatar,
  Paper,
  Tooltip
} from '@mui/material';
import { Send as SendIcon, CameraAlt as CameraAltIcon, Close as CloseIcon } from '@mui/icons-material';

// WARNING: Hardcoding API keys is insecure for production apps.
const GEMINI_API_KEY = 'AIzaSyAa4hVQAkH-otUyVPEfaQ_1q_hGdTXUPlE'; // Your Chatbot specific Gemini Key
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`;

const SYSTEM_PROMPT = "You are a health advisor bot named Zoe. Your goal is to provide helpful, empathetic, and accurate information related to health and medicine based on user queries. If a user uploads a prescription, analyze it: identify medicines, dosages if visible, and provide general information or potential common uses. Explain the contents clearly. If the image is not a prescription, or is unreadable or irrelevant to health/medicine, clearly state 'The uploaded image does not appear to be a relevant prescription or is unreadable.' Always advise users to consult with a qualified healthcare professional for medical advice, diagnosis, or treatment. Do not provide medical diagnoses or prescribe treatments yourself.";

const BOT_GREETING = "Hello! I am Zoe, your AI health assistant. How can I help you today? You can ask me health-related questions or upload a prescription for analysis.";

// Helper function to convert file to base64
const fileToGenerativePart = async (file) => {
  const base64EncodedDataPromise = new Promise((resolve) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result.split(',')[1]);
    reader.readAsDataURL(file);
  });
  return {
    inlineData: { data: await base64EncodedDataPromise, mimeType: file.type },
  };
};


function Chatbot({ onClose }) { // Added onClose prop
  const [messages, setMessages] = useState([{ text: BOT_GREETING, sender: 'bot', id: Date.now() }]);
  const [newMessage, setNewMessage] = useState('');
  const [uploadedImage, setUploadedImage] = useState(null); // Stores the File object
  const [uploadedImagePreview, setUploadedImagePreview] = useState(null); // Stores base64 for preview
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef(null);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    if (newMessage.trim() === '' && !uploadedImage) return;

    const userText = newMessage.trim();
    const userMessage = {
      text: userText,
      sender: 'user',
      imagePreview: uploadedImagePreview, // Include preview for display if any
      id: Date.now()
    };
    setMessages(prevMessages => [...prevMessages, userMessage]);
    setNewMessage('');
    setUploadedImagePreview(null); // Clear preview after sending

    setIsLoading(true);

    try {
      const parts = [];
      let requestPrompt = userText;

      if (uploadedImage) {
        const imagePart = await fileToGenerativePart(uploadedImage);
        parts.push(imagePart);
        // If there's an image, the prompt might be more specific
        if (userText) {
          requestPrompt = `User's message regarding the uploaded image: "${userText}". Please analyze the image as a potential prescription and respond to the user's message.`;
        } else {
          requestPrompt = "Please analyze the uploaded image as a potential prescription.";
        }
      }
       parts.unshift({ text: requestPrompt }); // Add text part first for multimodal


      const requestBody = {
        contents: [{ parts }],
        systemInstruction: { // Using systemInstruction for better context management
          parts: [{ text: SYSTEM_PROMPT }]
        },
        generationConfig: {
            temperature: 0.7,
            // maxOutputTokens: 1024, // Let API decide or set if needed
        }
      };

      const response = await fetch(GEMINI_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Gemini API Error:', errorData);
        throw new Error(errorData.error?.message || `API request failed with status ${response.status}`);
      }

      const data = await response.json();
      let botResponseText = "Sorry, I couldn't get a response. Please try again.";

      if (data.candidates && data.candidates.length > 0 && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts.length > 0) {
        botResponseText = data.candidates[0].content.parts[0].text;
      } else if (data.promptFeedback && data.promptFeedback.blockReason) {
         botResponseText = `Your request was blocked: ${data.promptFeedback.blockReason}. Please rephrase or try a different query.`;
      }


      const botMessage = { text: botResponseText, sender: 'bot', id: Date.now() + 1 };
      setMessages(prevMessages => [...prevMessages, botMessage]);

    } catch (error) {
      console.error('Error sending message to Gemini:', error);
      const errorMessage = { text: `Error: ${error.message}`, sender: 'bot', id: Date.now() + 1 };
      setMessages(prevMessages => [...prevMessages, errorMessage]);
    } finally {
      setIsLoading(false);
      setUploadedImage(null); // Clear the actual file object
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setUploadedImage(file);
      // Create a preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setUploadedImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
     // Reset file input to allow re-uploading the same file
    if (event.target) {
        event.target.value = null;
    }
  };

  const handleKeyPress = (event) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const removeUploadedImage = () => {
    setUploadedImage(null);
    setUploadedImagePreview(null);
  }
  return (
    <Paper elevation={0} sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%', // Ensure Chatbot component takes full height of its container
      width: '100%',  // Ensure Chatbot component takes full width of its container
      borderRadius: '0', // No border radius as we're inside a container
      overflow: 'hidden', // To contain rounded corners
      backgroundColor: '#f4f7f6', // A light background for the chat window
      boxShadow: 'none'
    }}>
      {/* Header is removed as it's provided by the parent component */}

      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2, display: 'flex', flexDirection: 'column' }}>
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              justifyContent: message.sender === 'user' ? 'flex-end' : 'flex-start',
              mb: 1.5,
            }}
          >
            <Paper
              elevation={1}
              sx={{
                p: '10px 14px',
                borderRadius: message.sender === 'user' ? '20px 20px 5px 20px' : '20px 20px 20px 5px',
                backgroundColor: message.sender === 'user' ? 'primary.light' : 'white',
                color: message.sender === 'user' ? 'primary.contrastText' : 'text.primary',
                maxWidth: '75%',
                wordBreak: 'break-word',
                lineHeight: '1.5'
              }}
            >
              {/* Display image preview for user messages if it exists */}
              {message.sender === 'user' && message.imagePreview && (
                <Box mb={1} sx={{ textAlign: 'center' }}>
                  <img
                    src={message.imagePreview}
                    alt="Uploaded content"
                    style={{ maxHeight: '100px', maxWidth: '100%', borderRadius: '8px', border: '1px solid #ddd' }}
                  />
                </Box>
              )}
              <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{message.text}</Typography>
            </Paper>
          </Box>
        ))}
        {isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'flex-start', mb: 1.5, alignItems: 'center' }}>
             <Avatar sx={{ bgcolor: 'secondary.light', width: 30, height: 30, mr: 1 }}>Z</Avatar>
            <CircularProgress size={20} sx={{ml:1}} />
            <Typography variant="body2" sx={{ml:1, color: 'text.secondary'}}>Zoe is typing...</Typography>
          </Box>
        )}
        <div ref={messagesEndRef} />
      </Box>

      {uploadedImagePreview && (
        <Box sx={{ p: 1, borderTop: '1px solid #e0e0e0', backgroundColor: '#f0f0f0', textAlign: 'center', position: 'relative' }}>
          <img src={uploadedImagePreview} alt="Preview" style={{ maxHeight: '60px', borderRadius: '4px' }} />
          <IconButton
            size="small"
            onClick={removeUploadedImage}
            sx={{ position: 'absolute', top: '-5px', right: '0px', backgroundColor: 'rgba(255,255,255,0.7)', '&:hover': {backgroundColor: 'rgba(255,255,255,0.9)'} }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>
      )}

      <Box sx={{ display: 'flex', p: '8px 12px', alignItems: 'center', borderTop: '1px solid #e0e0e0', backgroundColor: 'white' }}>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageUpload}
          ref={fileInputRef}
          style={{ display: 'none' }}
          id="chatbot-prescription-upload"
        />
        <Tooltip title="Upload Prescription">
          <IconButton onClick={() => fileInputRef.current?.click()} color="primary" sx={{ mr: 1 }}>
            <CameraAltIcon />
          </IconButton>
        </Tooltip>
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Type your message or upload..."
          sx={{
            mr: 1,
            '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
            }
          }}
        />
        <Tooltip title="Send Message">
          <IconButton
            color="primary"
            onClick={handleSendMessage}
            disabled={isLoading || (newMessage.trim() === '' && !uploadedImage)}
          >
            <SendIcon />
          </IconButton>
        </Tooltip>
      </Box>
    </Paper>
  );
}

export default Chatbot;