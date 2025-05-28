'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import LoadingScreen from '@/components/LoadingScreen';
import Login from '@/components/Login';
import Registration from '@/components/Registration';
import Home from '@/components/Home';

export default function App() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState<'login' | 'register' | 'home'>('login');
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  useEffect(() => {
    // Show loading screen for 2 seconds on initial load
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  // Show loading screen during initial load
  if (isInitialLoading) {
    return <LoadingScreen />;
  }

  // Show loading screen during auth state changes
  if (loading) {
    return <LoadingScreen />;
  }

  // If user is authenticated, show home page
  if (user) {
    return <Home />;
  }

  // If user is not authenticated, show login or register based on current view
  const handleSwitchToRegister = () => setCurrentView('register');
  const handleSwitchToLogin = () => setCurrentView('login');

  if (currentView === 'register') {
    return <Registration onSwitchToLogin={handleSwitchToLogin} />;
  }

  return <Login onSwitchToRegister={handleSwitchToRegister} />;
}
