import React, { useState, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { initializeApp } from 'firebase/app';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import Login from "./Login";
import Registration from "./Registration";
import Home from "./Home";
import LoadingScreen from "./LoadingScreen";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyDF3FBk30I4y1UfRvAB0nnOfOfiZnDfhPk",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "healthpix-63617.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "healthpix-63617",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "healthpix-63617.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "275934394685",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:275934394685:web:4f8b9c2a1e5d7f3a8b9c2e5d"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const startTime = Date.now();
    const minimumLoadTime = 3000; // Minimum 3 seconds loading screen

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsAuthenticated(!!user);
      
      // Ensure loading screen shows for at least minimumLoadTime
      const elapsedTime = Date.now() - startTime;
      const remainingTime = Math.max(0, minimumLoadTime - elapsedTime);
      
      setTimeout(() => {
        setIsLoading(false);
      }, remainingTime);
    });

    return () => unsubscribe();
  }, []);

  const handleLoadingComplete = () => {
    // This will be called when the loading animation is complete
    setIsLoading(false);
  };

  if (isLoading) {
    return <LoadingScreen onComplete={handleLoadingComplete} />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/" />} />
        <Route path="/register" element={!isAuthenticated ? <Registration /> : <Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
