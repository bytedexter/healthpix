'use client';

import { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LogOut, 
  Search, 
  ShoppingCart, 
  Heart, 
  Pill, 
  User, 
  Bell,
  Menu,
  X,
  Plus,
  Star,
  Clock,
  MapPin,
  Camera,
  Upload,
  Loader2,
  Package,
  History as HistoryIcon,
  Home as HomeIcon
} from 'lucide-react';
import ImageSlideshow from './ImageSlideshow';
import Chatbot from './Chatbot';
import Orders from './Orders';
import History from './History';
import Profile from './Profile';
import { analyzeImageForMedicines, type ImageAnalysisResult } from '@/lib/gemini';
import { apiService, type Medicine } from '@/lib/api';

type CurrentView = 'home' | 'orders' | 'history' | 'profile';

export default function Home() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [currentView, setCurrentView] = useState<CurrentView>('home');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [cart, setCart] = useState<string[]>([]);
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [showChatbot, setShowChatbot] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { logout } = useAuth();
  
  // Update categories to match CSV data structure  
  const categories = ['All', 'Pain Relief', 'Allergy', 'Diabetes', 'Gastric', 'Topical', 'Antibiotics', 'Gastrointestinal'];

  // Load medicines from API
  useEffect(() => {
    if (currentView === 'home') {
      const loadMedicines = async () => {
        setIsLoadingMedicines(true);
        try {
          const response = await apiService.getMedicines(
            selectedCategory !== 'All' ? selectedCategory : undefined,
            searchQuery || undefined
          );
          if (response.success && response.data) {
            setMedicines(response.data);
          }
        } catch (error) {
          console.error('Failed to load medicines:', error);
        } finally {
          setIsLoadingMedicines(false);
        }
      };

      loadMedicines();
    }
  }, [selectedCategory, searchQuery, currentView]);

  // Close camera options when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (showCameraOptions && !(event.target as Element).closest('.camera-dropdown')) {
        setShowCameraOptions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showCameraOptions]);

  const handleSignOut = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };
  
  const addToCart = (medicineId: string) => {
    setCart(prev => [...prev, medicineId]);
  };

  const handleImageUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsAnalyzing(true);
    setShowCameraOptions(false);

    try {
      const result = await analyzeImageForMedicines(file);
      setAnalysisResult(result);
      
      // If medicines were found, update the search query
      if (result.medicines.length > 0) {
        setSearchQuery(result.medicines[0]);
      }
    } catch (error) {
      console.error('Error analyzing image:', error);
      alert('Failed to analyze image. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleImageUpload(file);
    }
  };

  const handleCameraClick = () => {
    setShowCameraOptions(!showCameraOptions);
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const renderHomeContent = () => (
    <>
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white">
          <div className="flex flex-col lg:flex-row items-center justify-between">
            <div className="lg:w-1/2 mb-6 lg:mb-0">
              <h2 className="text-3xl lg:text-4xl font-bold mb-4">
                Your Health, Our Priority
              </h2>
              <p className="text-blue-100 text-lg mb-6">
                Order quality medicines and healthcare products with fast delivery and expert consultation.
              </p>
              <div className="flex items-center space-x-4 text-sm">
                <div className="flex items-center space-x-2">
                  <Clock className="w-4 h-4" />
                  <span>24/7 Service</span>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="w-4 h-4" />
                  <span>Fast Delivery</span>
                </div>
              </div>
            </div>
            <div className="lg:w-1/2">
              <ImageSlideshow />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Quick Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8"
      >
        {[
          { icon: Pill, label: 'Medicines', count: '5000+', color: 'bg-blue-500' },
          { icon: Heart, label: 'Satisfied Customers', count: '10K+', color: 'bg-red-500' },
          { icon: User, label: 'Expert Pharmacists', count: '50+', color: 'bg-green-500' },
          { icon: Star, label: 'Average Rating', count: '4.8', color: 'bg-yellow-500' }
        ].map((stat, index) => (
          <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200">
            <div className="flex items-center">
              <div className={`p-3 rounded-lg ${stat.color}`}>
                <stat.icon className="w-6 h-6 text-white" />
              </div>
              <div className="ml-4">
                <p className="text-2xl font-bold text-gray-900">{stat.count}</p>
                <p className="text-gray-600 text-sm">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </motion.div>

      {/* Image Analysis Result */}
      {analysisResult && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-blue-900">Image Analysis Results</h3>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-blue-600 hover:text-blue-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="space-y-4">
              {analysisResult.medicines.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Detected Medicines:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.medicines.map((medicine, index) => (
                      <span
                        key={index}
                        className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-medium"
                      >
                        {medicine}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <h4 className="font-medium text-blue-900 mb-2">Description:</h4>
                <p className="text-blue-800">{analysisResult.description}</p>
              </div>
              
              {analysisResult.suggestions.length > 0 && (
                <div>
                  <h4 className="font-medium text-blue-900 mb-2">Related Suggestions:</h4>
                  <div className="flex flex-wrap gap-2">
                    {analysisResult.suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        onClick={() => setSearchQuery(suggestion)}
                        className="bg-white text-blue-700 border border-blue-300 px-3 py-1 rounded-full text-sm hover:bg-blue-50 transition-colors"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}

      {/* Category Filter */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="mb-8"
      >
        <h3 className="text-xl font-semibold text-gray-900 mb-4">Browse by Category</h3>
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-300'
              }`}
            >
              {category}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Medicine Grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="mb-8"
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Available Medicines</h3>
          <p className="text-gray-600">
            {isLoadingMedicines ? 'Loading...' : `${medicines.length} products found`}
          </p>
        </div>
        
        {isLoadingMedicines ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[...Array(8)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-pulse">
                <div className="aspect-square bg-gray-200"></div>
                <div className="p-4 space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-1/2"></div>
                  <div className="h-6 bg-gray-200 rounded w-3/4"></div>
                  <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {medicines.map((medicine) => (
              <motion.div
                key={medicine.id}
                layout
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="aspect-square bg-gray-100 flex items-center justify-center">
                  <img
                    src={medicine.image}
                    alt={medicine.name}
                    className="w-20 h-20 object-contain"
                  />
                </div>
                
                <div className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-medium text-blue-600 bg-blue-100 px-2 py-1 rounded">
                      {medicine.category}
                    </span>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="text-sm text-gray-600">{medicine.rating}</span>
                    </div>
                  </div>
                  
                  <h4 className="font-semibold text-gray-900 mb-1">{medicine.name}</h4>
                  <p className="text-xs text-gray-500 mb-2">{medicine.type} • {medicine.dosage}</p>
                  <p className="text-2xl font-bold text-gray-900 mb-4">₹{medicine.price}</p>
                  
                  <button
                    onClick={() => addToCart(medicine.id)}
                    disabled={!medicine.inStock}
                    className={`w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 ${
                      medicine.inStock
                        ? 'bg-blue-600 text-white hover:bg-blue-700'
                        : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    }`}
                  >
                    <Plus className="w-4 h-4" />
                    <span>{medicine.inStock ? 'Add to Cart' : 'Out of Stock'}</span>
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </>
  );

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100 lg:hidden"
              >
                <Menu className="w-6 h-6" />
              </button>
              <div className="flex items-center ml-4 lg:ml-0">
                <img src="/log.jpg" alt="Clinicado" className="w-8 h-8 rounded-full object-cover" />
                <h1 className="ml-3 text-xl font-bold text-gray-900">Clinicado</h1>
              </div>
            </div>

            <div className="hidden lg:flex items-center space-x-4">
              {/* Navigation Menu */}
              <div className="flex items-center space-x-1 mr-6">
                <button
                  onClick={() => setCurrentView('home')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'home' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <HomeIcon className="w-5 h-5" />
                  <span>Home</span>
                </button>
                <button
                  onClick={() => setCurrentView('orders')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'orders' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Package className="w-5 h-5" />
                  <span>Orders</span>
                </button>
                <button
                  onClick={() => setCurrentView('history')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'history' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <HistoryIcon className="w-5 h-5" />
                  <span>History</span>
                </button>
                <button
                  onClick={() => setCurrentView('profile')}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors ${
                    currentView === 'profile' 
                      ? 'bg-blue-100 text-blue-600' 
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <User className="w-5 h-5" />
                  <span>Profile</span>
                </button>
              </div>

              {/* Search Bar - Only show on home view */}
              {currentView === 'home' && (
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search medicines..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 pr-12 py-2 w-80 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                    {isAnalyzing ? (
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : (
                      <div className="relative camera-dropdown">
                        <button
                          onClick={handleCameraClick}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Search by image"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                        
                        {showCameraOptions && (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-50 min-w-[140px]"
                          >
                            <button
                              onClick={handleUploadClick}
                              className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
                            >
                              <Upload className="w-4 h-4" />
                              <span>Upload Image</span>
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
              )}
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <Bell className="w-6 h-6" />
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>
              
              <button className="relative p-2 text-gray-600 hover:text-gray-900">
                <ShoppingCart className="w-6 h-6" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-blue-500 text-white text-xs rounded-full flex items-center justify-center">
                    {cart.length}
                  </span>
                )}
              </button>
              
              <button
                onClick={handleSignOut}
                className="flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <LogOut className="w-5 h-5" />
                <span>Sign Out</span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black bg-opacity-50 z-50 lg:hidden"
              onClick={() => setIsSidebarOpen(false)}
            />
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              className="fixed left-0 top-0 bottom-0 w-80 bg-white z-50 lg:hidden overflow-y-auto"
            >
              <div className="p-4 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <img src="/log.jpg" alt="Clinicado" className="w-8 h-8 rounded-full object-cover" />
                    <h2 className="ml-3 text-lg font-semibold text-gray-900">Clinicado</h2>
                  </div>
                  <button
                    onClick={() => setIsSidebarOpen(false)}
                    className="p-2 text-gray-600 hover:text-gray-900"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
              </div>
              
              <div className="p-4 space-y-4">
                {/* Mobile Navigation */}
                <div className="space-y-2 border-b border-gray-200 pb-4">
                  <button
                    onClick={() => {
                      setCurrentView('home');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === 'home' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span>Home</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('orders');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === 'orders' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Package className="w-5 h-5" />
                    <span>Orders</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('history');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === 'history' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <HistoryIcon className="w-5 h-5" />
                    <span>History</span>
                  </button>
                  <button
                    onClick={() => {
                      setCurrentView('profile');
                      setIsSidebarOpen(false);
                    }}
                    className={`w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                      currentView === 'profile' 
                        ? 'bg-blue-100 text-blue-600' 
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <User className="w-5 h-5" />
                    <span>Profile</span>
                  </button>
                </div>

                {/* Search - Only show on home view */}
                {currentView === 'home' && (
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search medicines..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-10 pr-12 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      {isAnalyzing ? (
                        <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      ) : (
                        <button
                          onClick={handleUploadClick}
                          className="p-1 text-gray-400 hover:text-blue-500 transition-colors"
                          title="Search by image"
                        >
                          <Camera className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
                
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center space-x-2 px-4 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">        {/* Conditional Content Based on Current View */}        {currentView === 'home' && renderHomeContent()}
        {currentView === 'orders' && <Orders onBack={() => setCurrentView('home')} />}
        {currentView === 'history' && <History onBack={() => setCurrentView('home')} />}
        {currentView === 'profile' && <Profile onBack={() => setCurrentView('home')} />}
      </div>

      {/* Footer - Only show on home view */}
      {currentView === 'home' && (
        <footer className="bg-gray-900 text-white py-12">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
              <div className="space-y-4">
                <div className="flex items-center">
                  <img src="/log.jpg" alt="Clinicado" className="w-8 h-8 rounded-full object-cover" />
                  <h3 className="ml-3 text-xl font-bold">Clinicado</h3>
                </div>
                <p className="text-gray-400">
                  Your trusted healthcare partner providing quality medicines and healthcare products with fast delivery.
                </p>
                <div className="flex space-x-4">
                  <div className="text-blue-400">
                    <Clock className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-medium">24/7 Customer Support</p>
                    <p className="text-gray-400 text-sm">Always here to help you</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">About Us</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Our Services</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">FAQ</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Categories</h3>
                <ul className="space-y-2 text-gray-400">
                  <li><a href="#" className="hover:text-white transition-colors">Pain Relief</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Diabetes Care</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Heart Health</a></li>
                  <li><a href="#" className="hover:text-white transition-colors">Vitamins</a></li>
                </ul>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Contact Info</h3>
                <div className="space-y-3 text-gray-400">
                  <div className="flex items-center space-x-3">
                    <MapPin className="w-5 h-5" />
                    <span>123 Healthcare St, Medical City</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Bell className="w-5 h-5" />
                    <span>+91 98765 43210</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5" />
                    <span>support@clinicado.com</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
              <p>&copy; 2024 Clinicado. All rights reserved. | Made with ❤️ for better healthcare</p>
            </div>
          </div>
        </footer>
      )}

      {/* Chatbot */}
      <Chatbot isOpen={showChatbot} onToggle={() => setShowChatbot(!showChatbot)} />
    </div>
  );
}
