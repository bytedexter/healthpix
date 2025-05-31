'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, 
  Package, 
  Truck, 
  CheckCircle, 
  Clock, 
  MapPin,
  Phone,
  Calendar,
  Filter
} from 'lucide-react';
import { apiService, type Order } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

interface OrdersProps {
  onBack: () => void;
}

export default function Orders({ onBack }: OrdersProps) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const { user } = useAuth();
  const statusColors = {
    placed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200',
    confirmed: 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200',
    packed: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200',
    shipped: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200',
    delivered: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200',
    cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
  };

  const statusIcons = {
    placed: Clock,
    confirmed: CheckCircle,
    packed: Package,
    shipped: Truck,
    delivered: CheckCircle,
    cancelled: CheckCircle
  };  useEffect(() => {
    const loadOrders = async () => {
      if (!user?.uid) {
        console.log('No user found, user:', user);
        setIsLoading(false);
        return;
      }
      
      console.log('Loading orders for user:', user.uid);
      setIsLoading(true);
      
      try {
        const response = await apiService.getOrders(user.uid);
        console.log('Orders API response:', response);
        
        if (response.success && response.data) {
          // Ensure we have an array of orders
          const ordersData = Array.isArray(response.data) ? response.data : [];
          console.log('Setting orders:', ordersData);
          setOrders(ordersData);
        } else {
          console.error('Invalid orders data received:', response);
          // Set empty array instead of null to avoid rendering issues
          setOrders([]);
        }
      } catch (error) {
        console.error('Failed to load orders:', error);
        // Use fallback demo orders if API fails
        setOrders([
          {
            id: 'demo1',
            userId: user.uid,
            items: [
              {
                medicineId: '1',
                medicineName: 'Paracetamol',
                quantity: 2,
                price: 15,
                image: '/health.png'
              }
            ],
            totalAmount: 30,
            status: 'delivered',
            paymentMethod: 'cod',
            shippingAddress: {
              fullName: 'Demo User',
              phone: '1234567890',
              addressLine1: '123 Demo Street',
              city: 'Demo City',
              state: 'Demo State',
              pincode: '123456'
            },
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    loadOrders();
  }, [user]);
  // Add polling to check for status updates - using a reduced frequency to avoid unnecessary API calls
  useEffect(() => {
    if (!user?.uid) return;
    
    const pollOrders = async () => {
      try {
        const response = await apiService.getOrders(user.uid);
        if (response.success && response.data) {
          // Ensure we have an array of orders
          const ordersData = Array.isArray(response.data) ? response.data : [];
          setOrders(ordersData);
        }
      } catch (error) {
        console.error('Failed to poll orders:', error);
        // Do not update state on error to keep existing data
      }
    };

    // Poll every 60 seconds to get status updates (reduced from 30 seconds)
    const interval = setInterval(pollOrders, 60000);
    
    return () => clearInterval(interval);
  }, [user]);  const filteredOrders = (Array.isArray(orders) ? orders : []).filter(order => 
    selectedStatus === 'all' || order.status === selectedStatus
  );

  console.log('Orders state:', orders);
  console.log('Filtered orders:', filteredOrders);
  console.log('Selected status:', selectedStatus);

  const getOrderProgress = (status: Order['status']) => {
    const statusOrder = ['placed', 'confirmed', 'packed', 'shipped', 'delivered'];
    return statusOrder.indexOf(status) + 1;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center mb-6">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors mr-4"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
          </div>
          
          <div className="space-y-4">
            {[...Array(3)].map((_, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-sm border border-gray-200 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <button
              onClick={onBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors mr-4 text-gray-900 dark:text-white"
            >
              <ArrowLeft className="w-6 h-6" />
            </button>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <select              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
            >
              <option value="all">All Orders</option>
              <option value="placed">Placed</option>
              <option value="confirmed">Confirmed</option>
              <option value="packed">Packed</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>
        </div>

        {/* Debug info - remove in production */}
        <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
          <p className="text-sm text-yellow-800 dark:text-yellow-200">
            Debug: User ID: {user?.uid || 'No user'} | Orders count: {orders.length} | Filtered: {filteredOrders.length} | Loading: {isLoading.toString()}
          </p>
        </div>

        {filteredOrders.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center py-12"
          >            <Package className="w-16 h-16 text-gray-400 dark:text-gray-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">No orders found</h3>
            <p className="text-gray-600 dark:text-gray-400">You haven&apos;t placed any orders yet.</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => {
              const StatusIcon = statusIcons[order.status];
              const progress = getOrderProgress(order.status);
              
              return (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-1">
                        Order #{order.id.slice(-8).toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Placed on {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${statusColors[order.status]}`}>
                        <StatusIcon className="w-4 h-4 mr-1" />
                        {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                      </span>
                    </div>
                  </div>

                  {/* Order Progress */}
                  {order.status !== 'cancelled' && (
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Order Progress</span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">{progress}/5</span>                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-300"
                          style={{ width: `${(progress / 5) * 100}%` }}
                        />
                      </div>
                    </div>
                  )}

                  {/* Order Items */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-2">Items ({order.items.length})</h4>
                    <div className="space-y-2">
                      {order.items.slice(0, 2).map((item, index) => (
                        <div key={index} className="flex items-center space-x-3">
                          <Image src={item.image} alt={item.medicineName} width={48} height={48} className="w-12 h-12 object-contain" />
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900 dark:text-white">{item.medicineName}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400">Qty: {item.quantity}</p>
                          </div>
                          <p className="text-sm font-medium text-gray-900 dark:text-white">₹{item.price}</p>
                        </div>
                      ))}
                      {order.items.length > 2 && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 pl-15">
                          +{order.items.length - 2} more items
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Order Details */}
                  <div className="flex justify-between items-center pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="flex items-center space-x-4 text-sm text-gray-600 dark:text-gray-400">
                      <div className="flex items-center space-x-1">
                        <MapPin className="w-4 h-4" />
                        <span>{order.shippingAddress.city}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Phone className="w-4 h-4" />
                        <span>{order.paymentMethod.toUpperCase()}</span>
                      </div>
                      {order.estimatedDelivery && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Est. {new Date(order.estimatedDelivery).toLocaleDateString()}</span>
                        </div>
                      )}                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">₹{order.totalAmount}</p>
                      {order.trackingId && (
                        <p className="text-xs text-gray-600 dark:text-gray-400">Tracking: {order.trackingId}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
