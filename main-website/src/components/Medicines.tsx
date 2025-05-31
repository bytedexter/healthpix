'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Search, 
  Plus, 
  Minus,
  Star,
  Camera,
  Upload,
  Loader2,
  X
} from 'lucide-react';
import { apiService, type Medicine } from '@/lib/api';
import { analyzeImageForMedicines, type ImageAnalysisResult } from '@/lib/gemini';

interface MedicinesProps {
  onBack: () => void;
  cart: CartItem[];
  addToCart: (medicine: Medicine) => void;
  updateCartItemQuantity: (id: string, quantity: number) => void;
}

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  type: string;
  dosage: string;
}

export default function Medicines({ onBack, cart, addToCart, updateCartItemQuantity }: MedicinesProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [isLoadingMedicines, setIsLoadingMedicines] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [showCameraOptions, setShowCameraOptions] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ImageAnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ['All', 'Pain Relief', 'Allergy', 'Diabetes', 'Gastric', 'Topical', 'Antibiotics', 'Gastrointestinal'];

  // Load medicines from API
  useEffect(() => {
    const loadMedicines = async () => {
      setIsLoadingMedicines(true);
      try {
        const response = await apiService.getMedicines(
          selectedCategory !== 'All' ? selectedCategory : undefined,
          searchQuery || undefined
        );
        if (response.success && response.data) {
          // Mark all medicines as in stock for this implementation
          const updatedMedicines = response.data.map(medicine => ({
            ...medicine,
            inStock: true,
            stock: medicine.stock || Math.floor(Math.random() * 50) + 10
          }));
          setMedicines(updatedMedicines);
        }
      } catch (error) {
        console.error('Failed to load medicines:', error);
      } finally {
        setIsLoadingMedicines(false);
      }
    };

    loadMedicines();
  }, [selectedCategory, searchQuery]);

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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between mb-8"
        >
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="p-2 rounded-lg bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors shadow-sm border border-gray-200 dark:border-gray-700"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">All Medicines</h1>
              <p className="text-gray-600 dark:text-gray-400">Browse and search through our medicine collection</p>
            </div>
          </div>
        </motion.div>

        {/* Search Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-8"
        >
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-5 h-5" />
            <input
              type="text"
              placeholder="Search medicines..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-12 py-3 w-full border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {isAnalyzing ? (
                <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
              ) : (
                <div className="relative camera-dropdown">
                  <button
                    onClick={handleCameraClick}
                    className="p-1 text-gray-400 dark:text-gray-500 hover:text-blue-500 transition-colors"
                    title="Search by image"
                  >
                    <Camera className="w-5 h-5" />
                  </button>
                  
                  {showCameraOptions && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      className="absolute right-0 top-8 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg p-2 z-50 min-w-[140px]"
                    >
                      <button
                        onClick={handleUploadClick}
                        className="w-full flex items-center space-x-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-md"
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
        </motion.div>

        {/* Analysis Results */}
        {analysisResult && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100">Image Analysis Results</h3>
                <button
                  onClick={() => setAnalysisResult(null)}
                  className="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-4">
                {analysisResult.medicines.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Detected Medicines:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.medicines.map((medicine, index) => (
                        <span
                          key={index}
                          className="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm font-medium"
                        >
                          {medicine}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Description:</h4>
                  <p className="text-blue-800 dark:text-blue-200">{analysisResult.description}</p>
                </div>
                
                {analysisResult.suggestions.length > 0 && (
                  <div>
                    <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">Related Suggestions:</h4>
                    <div className="flex flex-wrap gap-2">
                      {analysisResult.suggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => setSearchQuery(suggestion)}
                          className="bg-white dark:bg-gray-700 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-600 px-3 py-1 rounded-full text-sm hover:bg-blue-50 dark:hover:bg-blue-800 transition-colors"
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
          transition={{ delay: 0.2 }}
          className="mb-8"
        >
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Browse by Category</h3>
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  selectedCategory === category
                    ? 'bg-blue-600 dark:bg-blue-700 text-white'
                    : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-300 dark:border-gray-600'
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
          transition={{ delay: 0.3 }}
          className="mb-8"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Available Medicines</h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isLoadingMedicines ? 'Loading...' : `${medicines.length} products found`}
            </p>
          </div>
          
          {isLoadingMedicines ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[...Array(8)].map((_, index) => (
                <div key={index} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden animate-pulse">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700"></div>
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
                    <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div>
                    <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded"></div>
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
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg dark:hover:shadow-xl transition-shadow"
                >
                  <div className="aspect-square bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                    <img
                      src={medicine.image}
                      alt={medicine.name}
                      className="w-20 h-20 object-contain"
                    />
                  </div>
                  
                  <div className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900 px-2 py-1 rounded">
                        {medicine.category}
                      </span>
                      <div className="flex items-center space-x-1">
                        <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{medicine.rating}</span>
                      </div>
                    </div>
                    
                    <h4 className="font-semibold text-gray-900 dark:text-white mb-1">{medicine.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{medicine.type} • {medicine.dosage}</p>
                    
                    <div className="flex justify-between items-center mb-3">
                      <p className="text-xl font-bold text-gray-900 dark:text-white">₹{medicine.price}</p>
                      <p className="text-sm text-green-600 dark:text-green-400 font-medium">In Stock: {(medicine.stock || 50)}</p>
                    </div>
                    
                    {cart.find(item => item.id === medicine.id) ? (
                      <div className="flex flex-col space-y-2">
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => updateCartItemQuantity(medicine.id, Math.max(1, (cart.find(item => item.id === medicine.id)?.quantity || 1) - 1))}
                            className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="font-medium text-gray-900 dark:text-white">
                            {cart.find(item => item.id === medicine.id)?.quantity || 0}
                          </span>
                          <button
                            onClick={() => updateCartItemQuantity(medicine.id, (cart.find(item => item.id === medicine.id)?.quantity || 0) + 1)}
                            className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-400 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => addToCart(medicine)}
                        className="w-full py-2 px-4 rounded-lg font-medium transition-colors flex items-center justify-center space-x-2 bg-blue-600 dark:bg-blue-700 text-white hover:bg-blue-700 dark:hover:bg-blue-600"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add to Cart</span>
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
