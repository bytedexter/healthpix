'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Calendar, 
  MapPin, 
  Star,
  Clock,
  CheckCircle
} from 'lucide-react';
import { apiService, type Order } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';

interface HistoryProps {
  onBack: () => void;
}

export default function History({ onBack }: HistoryProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    const loadOrderHistory = async () => {
      if (!user?.uid) return;
      
      setIsLoading(true);
      try {
        const response = await apiService.getOrders(user.uid);
        if (response.success && response.data) {
          // Sort by date, most recent first
          const sortedOrders = response.data.sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
          setOrders(sortedOrders);
        }
      } catch (error) {
        console.error('Failed to load order history:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrderHistory();
  }, [user]);
  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'delivered': return 'text-green-600 dark:text-green-400';
      case 'cancelled': return 'text-red-600 dark:text-red-400';
      case 'shipped': return 'text-blue-600 dark:text-blue-400';
      default: return 'text-yellow-600 dark:text-yellow-400';
    }
  };

  const getMonthlyGroups = (orders: Order[]) => {
    const groups: { [key: string]: Order[] } = {};
    
    orders.forEach(order => {
      const date = new Date(order.createdAt);
      const monthYear = date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      
      if (!groups[monthYear]) {
        groups[monthYear] = [];
      }
      groups[monthYear].push(order);
    });
    
    return groups;
  };
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mr-4 text-gray-900 dark:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h1>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 animate-pulse">
                <div className="h-6 bg-gray-200 dark:bg-gray-600 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 dark:bg-gray-600 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const monthlyGroups = getMonthlyGroups(orders);
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center mb-6">
          <button
            onClick={onBack}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mr-4 text-gray-900 dark:text-white"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order History</h1>
        </div>        {orders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >            <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No order history</h3>
            <p className="text-gray-600 dark:text-gray-400">You haven&apos;t placed any orders yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-8">
            {Object.entries(monthlyGroups).map(([monthYear, monthOrders]) => (
              <motion.div
                key={monthYear}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}              >
                <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2" />
                  {monthYear}
                </h2>
                
                <div className="space-y-4">
                  {monthOrders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                    >
                      <div className="flex justify-between items-start mb-4">                        <div>
                          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                            <div className="flex items-center space-x-1">
                              <Clock className="w-4 h-4" />
                              <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <MapPin className="w-4 h-4" />
                              <span>{order.shippingAddress.city}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className={`flex items-center space-x-1 ${getStatusColor(order.status)} mb-1`}>
                            <CheckCircle className="w-4 h-4" />
                            <span className="text-sm font-medium capitalize">{order.status}</span>
                          </div>
                          <p className="text-lg font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</p>
                        </div>
                      </div>                      {/* Order Items Preview */}
                      <div className="mb-4">
                        <div className="flex items-center space-x-4 overflow-x-auto pb-2">
                          {order.items.map((item, index) => (
                            <div key={index} className="flex-shrink-0 flex items-center space-x-3 bg-gray-50 dark:bg-gray-700 rounded-lg p-3 min-w-[200px]">
                              <img
                                src={item.image}
                                alt={item.medicineName}
                                className="w-12 h-12 rounded-lg object-cover"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{item.medicineName}</p>
                                <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                                <p className="text-sm font-medium text-gray-900 dark:text-white">₹{item.price}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>                      {/* Action Buttons */}
                      <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-3">
                          {order.status === 'delivered' && (
                            <button className="flex items-center space-x-2 px-4 py-2 bg-blue-600 dark:bg-blue-700 text-white rounded-lg hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors">
                              <Star className="w-4 h-4" />
                              <span>Rate Order</span>
                            </button>
                          )}
                          <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                            View Details
                          </button>
                        </div>
                        
                        {order.status === 'delivered' && (
                          <button className="px-4 py-2 bg-green-600 dark:bg-green-700 text-white rounded-lg hover:bg-green-700 dark:hover:bg-green-600 transition-colors">
                            Reorder
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}        {/* Summary Stats */}
        {orders.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{orders.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Orders</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {orders.filter(o => o.status === 'delivered').length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Delivered</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-gray-900 dark:text-white">
                  ₹{orders.reduce((sum, order) => sum + order.totalAmount, 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Total Spent</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                  {orders.reduce((sum, order) => sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Items Purchased</p>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
