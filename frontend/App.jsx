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
  apiKey: "AIzaSyDF3FBk30I4y1UfRvAB0nnOfOfiZnDfhPk",
  authDomain: "healthpix-63617.firebaseapp.com",
  projectId: "healthpix-63617",
  storageBucket: "healthpix-63617.appspot.com",
  messagingSenderId: "275934394685",
  appId: "1:275934394685:web:YOUR_APP_ID"
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
