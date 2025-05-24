import React, { useEffect, useState, useCallback } from 'react';
import './LoadingScreen.css';

function LoadingScreen({ onComplete }) {
  const [text, setText] = useState('');  const [fadeOut, setFadeOut] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('');
  const [showLoadingBar, setShowLoadingBar] = useState(false);
  const fullText = 'Clinicado';
  
  const loadingMessages = [
    'Loading medicines...',
    'Preparing your dashboard...',
    'Almost ready...',
    'Fetching data...',
    'Initializing...'
  ];

  const startFadeOut = useCallback(() => {
    setFadeOut(true);
    setTimeout(onComplete, 1000);
  }, [onComplete]);

  useEffect(() => {
    let currentIndex = 0;
    let typingInterval;
    let messageInterval;
    let mounted = true;

    const typeNextChar = () => {
      if (!mounted) return;
      
      if (currentIndex < fullText.length) {
        setText(fullText.slice(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setShowLoadingBar(true);
        setTimeout(() => {
          if (mounted) {
            startFadeOut();
          }
        }, 2000);
      }
    };

    const updateLoadingMessage = () => {
      if (!mounted) return;
      const index = Math.floor(Math.random() * loadingMessages.length);
      setLoadingMessage(loadingMessages[index]);
    };

    // Initial delay before starting
    const startDelay = setTimeout(() => {
      typingInterval = setInterval(typeNextChar, 150);
      messageInterval = setInterval(updateLoadingMessage, 2000);
      updateLoadingMessage();
    }, 500);

    return () => {
      mounted = false;
      clearTimeout(startDelay);
      clearInterval(typingInterval);
      clearInterval(messageInterval);
    };
  }, [fullText, startFadeOut]);

  return (
    <div className={`loading-screen ${fadeOut ? 'fade-out' : ''}`}>
      <div className="loading-content">
        <h1 className="loading-text">{text}</h1>
        {showLoadingBar && (
          <>
            <div className="loading-bar">
              <div className="loading-bar-fill"></div>
            </div>
            <p className="loading-message">{loadingMessage}</p>
          </>
        )}
      </div>
    </div>
  );
}

export default LoadingScreen;
