'use client';

import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface LoadingScreenProps {
  onComplete?: () => void;
}

export default function LoadingScreen({ onComplete }: LoadingScreenProps) {
  const [text, setText] = useState('');
  const [fadeOut, setFadeOut] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const [progress, setProgress] = useState(0);
    const fullText = 'Clinicado';
  
  const startFadeOut = useCallback(() => {
    setFadeOut(true);
    if (onComplete) {
      setTimeout(onComplete, 1000);
    }
  }, [onComplete]);

  useEffect(() => {
    const loadingMessages = [
      'Loading medicines...',
      'Preparing your dashboard...',
      'Almost ready...',
      'Fetching data...',
      'Initializing...'
    ];
    
    let currentIndex = 0;
    let typingInterval: NodeJS.Timeout;
    let messageInterval: NodeJS.Timeout;
    let progressInterval: NodeJS.Timeout;
    let mounted = true;

    const typeNextChar = () => {
      if (!mounted) return;
      if (currentIndex < fullText.length) {
        setText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setShowLoadingBar(true);
        
        // Start progress bar animation
        progressInterval = setInterval(() => {
          setProgress(prev => {
            if (prev >= 100) {
              clearInterval(progressInterval);
              setTimeout(() => {
                if (mounted) startFadeOut();
              }, 500);
              return 100;
            }
            return prev + 2;
          });
        }, 50);
      }
    };

    const updateLoadingMessage = () => {
      if (!mounted) return;
      const index = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[index]);
    };

    // Initial delay before starting
    const startDelay = setTimeout(() => {
      if (!mounted) return;
      typingInterval = setInterval(typeNextChar, 150);
      messageInterval = setInterval(updateLoadingMessage, 2000);
      updateLoadingMessage();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(startDelay);
      clearInterval(typingInterval);
      clearInterval(messageInterval);
      clearInterval(progressInterval);
    };
  }, [fullText, startFadeOut]);

  return (
    <AnimatePresence>
      {!fadeOut && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900"
        >
          <div className="text-center">
            <motion.h1 
              className="text-6xl md:text-8xl font-bold text-white mb-8"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              {text}
              <motion.span
                className="inline-block w-1 h-20 ml-2 bg-white"
                animate={{ opacity: [1, 0, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
            </motion.h1>
            
            <AnimatePresence>
              {showLoadingBar && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="w-80 mx-auto"
                >
                  <div className="w-full bg-white/20 rounded-full h-2 mb-4 overflow-hidden">
                    <motion.div
                      className="h-full bg-gradient-to-r from-white to-blue-200 rounded-full"
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 0.1 }}
                    />
                  </div>
                  
                  <motion.p 
                    className="text-white/80 text-lg"
                    key={loadingMessage}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3 }}
                  >
                    {loadingMessage}
                  </motion.p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
