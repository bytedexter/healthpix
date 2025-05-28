'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, 
  MapPin, 
  Phone, 
  User, 
  CreditCard, 
  Truck, 
  CheckCircle, 
  ShoppingCart,
  Plus,
  Minus,
  X,
  Smartphone,
  Building2,
  Wallet
} from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';
import { apiService } from '@/lib/api';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  type: string;
  dosage: string;
}

interface Address {
  id: string;
  name: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface CheckoutProps {
  cartItems: CartItem[];
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemoveItem: (id: string) => void;
  onBack: () => void;
  onOrderComplete: () => void;
}

export default function Checkout({ cartItems, onUpdateQuantity, onRemoveItem, onBack, onOrderComplete }: CheckoutProps) {
  const { isDarkMode } = useTheme();
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(1);
  const [selectedAddress, setSelectedAddress] = useState<string>('');
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [selectedPayment, setSelectedPayment] = useState<'cod' | 'upi' | 'card' | 'netbanking'>('cod');
  
  // Sample addresses - in real app, this would come from user profile
  const [addresses, setAddresses] = useState<Address[]>([
    {
      id: '1',
      name: 'John Doe',
      phone: '+91 98765 43210',
      addressLine1: '123 Main Street',
      addressLine2: 'Apartment 4B',
      city: 'Mumbai',
      state: 'Maharashtra',
      pincode: '400001',
      isDefault: true
    }
  ]);

  const [newAddress, setNewAddress] = useState({
    name: '',
    phone: '',
    addressLine1: '',
    addressLine2: '',
    city: '',
    state: '',
    pincode: ''
  });

  const totalAmount = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const deliveryFee = totalAmount > 500 ? 0 : 40;
  const finalAmount = totalAmount + deliveryFee;

  const steps = [
    { id: 1, title: 'Cart Review', icon: ShoppingCart },
    { id: 2, title: 'Delivery Address', icon: MapPin },
    { id: 3, title: 'Payment Method', icon: CreditCard },
    { id: 4, title: 'Order Confirmation', icon: CheckCircle }
  ];

  const handleAddAddress = () => {
    if (newAddress.name && newAddress.phone && newAddress.addressLine1 && newAddress.city && newAddress.state && newAddress.pincode) {
      const address: Address = {
        id: Date.now().toString(),
        ...newAddress,
        isDefault: addresses.length === 0
      };
      setAddresses([...addresses, address]);
      setSelectedAddress(address.id);
      setNewAddress({
        name: '',
        phone: '',
        addressLine1: '',
        addressLine2: '',
        city: '',
        state: '',
        pincode: ''
      });
      setShowAddAddress(false);
    }
  };  const handlePlaceOrder = async () => {
    if (!user) {
      setOrderError('Please login to place an order');
      return;
    }

    const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
    if (!selectedAddr) {
      setOrderError('Please select a delivery address');
      return;
    }

    setPlacingOrder(true);
    setOrderError(null);

    try {      // Prepare order data
      const orderData = {
        userId: user.uid,
        customerName: selectedAddr.name,
        customerEmail: user.email || 'customer@healthpix.com',
        items: cartItems.map(item => ({
          medicineName: item.name,
          quantity: item.quantity,
          price: item.price,
          image: item.image
        })),
        totalAmount: finalAmount,
        status: 'placed' as const,
        paymentMethod: selectedPayment,
        shippingAddress: {
          street: selectedAddr.addressLine1 + (selectedAddr.addressLine2 ? ', ' + selectedAddr.addressLine2 : ''),
          city: selectedAddr.city,
          state: selectedAddr.state,
          zipCode: selectedAddr.pincode,
          country: 'India'
        }
      };

      const response = await apiService.createOrder(orderData);
      
      if (response.success && response.data) {
        setOrderId(response.data.id);
        setOrderPlaced(true);
        setTimeout(() => {
          setOrderPlaced(false);
          setCurrentStep(1);
          onOrderComplete();
        }, 5000);
      } else {
        setOrderError(response.error || 'Failed to place order');
      }
    } catch (error) {
      console.error('Order placement failed:', error);
      setOrderError('Network error. Please try again.');
    } finally {
      setPlacingOrder(false);
    }
  };
  const renderStepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      {steps.map((step, index) => (
        <div key={step.id} className="flex items-center">
          <div className={`flex flex-col items-center ${index < steps.length - 1 ? 'mr-8' : ''}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${
              currentStep >= step.id 
                ? 'bg-blue-600 dark:bg-blue-700 border-blue-600 dark:border-blue-700 text-white' 
                : 'border-gray-300 dark:border-gray-600 text-gray-400 dark:text-gray-500'
            }`}>
              <step.icon className="w-5 h-5" />
            </div>
            <span className={`mt-2 text-sm font-medium ${
              currentStep >= step.id ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'
            }`}>
              {step.title}
            </span>
          </div>
          {index < steps.length - 1 && (
            <div className={`w-16 h-0.5 mb-6 ${
              currentStep > step.id ? 'bg-blue-600 dark:bg-blue-700' : 'bg-gray-300 dark:bg-gray-600'
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  const renderCartReview = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Review Your Cart</h3>
      
      <div className="space-y-4">
        {cartItems.map((item) => (
          <div key={item.id} className="flex items-center space-x-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <img src={item.image} alt={item.name} className="w-16 h-16 object-contain" />            <div className="flex-1">
              <h4 className="font-medium text-gray-900 dark:text-white">{item.name}</h4>
              <p className="text-sm text-gray-500 dark:text-gray-400">{item.type} • {item.dosage}</p>
              <p className="text-lg font-semibold text-gray-900 dark:text-white">₹{item.price}</p>
            </div>            <div className="flex items-center space-x-2">
              <button
                onClick={() => onUpdateQuantity(item.id, Math.max(1, item.quantity - 1))}
                className="w-8 h-8 rounded-full bg-red-500 dark:bg-red-600 text-white flex items-center justify-center hover:bg-red-600 dark:hover:bg-red-700 transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-8 text-center font-medium text-gray-900 dark:text-white">{item.quantity}</span>
              <button
                onClick={() => onUpdateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-green-500 dark:bg-green-600 text-white flex items-center justify-center hover:bg-green-600 dark:hover:bg-green-700 transition-colors"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>            <button
              onClick={() => onRemoveItem(item.id)}
              className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        ))}
      </div>      <div className="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Subtotal</span>
          <span>₹{totalAmount}</span>
        </div>
        <div className="flex justify-between text-gray-600 dark:text-gray-400">
          <span>Delivery Fee</span>
          <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
        </div>
        <div className="flex justify-between text-lg font-semibold text-gray-900 dark:text-white">
          <span>Total</span>
          <span>₹{finalAmount}</span>
        </div>
      </div>      <button
        onClick={() => setCurrentStep(2)}
        disabled={cartItems.length === 0}
        className="w-full bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
      >
        Continue to Delivery Address
      </button>
    </div>
  );

  const renderAddressSelection = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Select Delivery Address</h3>
      
      <div className="space-y-4">
        {addresses.map((address) => (
          <div
            key={address.id}            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
              selectedAddress === address.id 
                ? 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20' 
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            onClick={() => setSelectedAddress(address.id)}
          >
            <div className="flex items-start justify-between">
              <div>                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-900 dark:text-white">{address.name}</h4>
                  {address.isDefault && (
                    <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded">Default</span>
                  )}
                </div>
                <p className="text-gray-600 dark:text-gray-400">{address.phone}</p>
                <p className="text-gray-600 dark:text-gray-400">
                  {address.addressLine1}
                  {address.addressLine2 && `, ${address.addressLine2}`}
                </p>
                <p className="text-gray-600 dark:text-gray-400">{address.city}, {address.state} - {address.pincode}</p>
              </div>
              <input
                type="radio"
                checked={selectedAddress === address.id}
                onChange={() => setSelectedAddress(address.id)}
                className="mt-1"
              />
            </div>
          </div>
        ))}
      </div>

      {!showAddAddress && (        <button
          onClick={() => setShowAddAddress(true)}
          className="w-full border-2 border-dashed border-gray-300 dark:border-gray-600 py-4 rounded-lg text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
        >
          + Add New Address
        </button>
      )}

      {showAddAddress && (        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Add New Address</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">            <input
              type="text"
              placeholder="Full Name"
              value={newAddress.name}
              onChange={(e) => setNewAddress({ ...newAddress, name: e.target.value })}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <input
              type="tel"
              placeholder="Phone Number"
              value={newAddress.phone}
              onChange={(e) => setNewAddress({ ...newAddress, phone: e.target.value })}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />            <input
              type="text"
              placeholder="Address Line 1"
              value={newAddress.addressLine1}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine1: e.target.value })}
              className="md:col-span-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="Address Line 2 (Optional)"
              value={newAddress.addressLine2}
              onChange={(e) => setNewAddress({ ...newAddress, addressLine2: e.target.value })}
              className="md:col-span-2 p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />            <input
              type="text"
              placeholder="City"
              value={newAddress.city}
              onChange={(e) => setNewAddress({ ...newAddress, city: e.target.value })}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="State"
              value={newAddress.state}
              onChange={(e) => setNewAddress({ ...newAddress, state: e.target.value })}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
            <input
              type="text"
              placeholder="PIN Code"
              value={newAddress.pincode}
              onChange={(e) => setNewAddress({ ...newAddress, pincode: e.target.value })}
              className="p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400"
            />
          </div>          <div className="flex space-x-3 mt-4">
            <button
              onClick={handleAddAddress}
              className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-2 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
            >
              Add Address
            </button>
            <button
              onClick={() => setShowAddAddress(false)}
              className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-2 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep(1)}
          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back to Cart
        </button>
        <button
          onClick={() => setCurrentStep(3)}
          disabled={!selectedAddress}
          className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600 disabled:bg-gray-300 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
        >
          Continue to Payment
        </button>
      </div>
    </div>
  );

  const renderPaymentMethod = () => (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Choose Payment Method</h3>
      
      <div className="space-y-4">
        {/* Cash on Delivery - Available */}
        <div 
          className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
            selectedPayment === 'cod' 
              ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
              : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
          }`}
          onClick={() => setSelectedPayment('cod')}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                selectedPayment === 'cod' ? 'bg-green-600' : 'bg-gray-400'
              }`}>
                <Truck className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Cash on Delivery</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pay when your order is delivered</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-1 rounded mr-3">
                Available
              </span>
              <input
                type="radio"
                checked={selectedPayment === 'cod'}
                onChange={() => setSelectedPayment('cod')}
                className="w-4 h-4 text-green-600"
              />
            </div>
          </div>
        </div>

        {/* UPI - Coming Soon */}
        <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg opacity-60 cursor-not-allowed">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                <Smartphone className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">UPI Payment</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pay using Google Pay, PhonePe, Paytm</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded mr-3">
                Coming Soon
              </span>
              <input
                type="radio"
                disabled
                className="w-4 h-4 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Credit/Debit Card - Coming Soon */}
        <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg opacity-60 cursor-not-allowed">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Credit/Debit Card</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pay using Visa, Mastercard, RuPay</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded mr-3">
                Coming Soon
              </span>
              <input
                type="radio"
                disabled
                className="w-4 h-4 text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Net Banking - Coming Soon */}
        <div className="p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg opacity-60 cursor-not-allowed">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-gray-400 rounded-full flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white">Net Banking</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">Pay using your bank account</p>
              </div>
            </div>
            <div className="flex items-center">
              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-1 rounded mr-3">
                Coming Soon
              </span>
              <input
                type="radio"
                disabled
                className="w-4 h-4 text-gray-400"
              />
            </div>
          </div>
        </div>
      </div>

      {/* COD Benefits - Only show when COD is selected */}
      {selectedPayment === 'cod' && (
        <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
          <h5 className="font-medium text-green-900 dark:text-green-100 mb-2">COD Benefits:</h5>
          <ul className="text-sm text-green-700 dark:text-green-300 space-y-1">
            <li>• No need for online payment</li>
            <li>• Pay only after receiving your order</li>
            <li>• Inspect products before payment</li>
            <li>• Safe and secure transaction</li>
          </ul>
        </div>
      )}

      {/* Order Summary */}
      <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
        <h4 className="font-medium text-gray-900 dark:text-white mb-3">Order Summary</h4>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Items Total</span>
            <span>₹{totalAmount}</span>
          </div>
          <div className="flex justify-between text-gray-600 dark:text-gray-400">
            <span>Delivery Fee</span>
            <span>{deliveryFee === 0 ? 'FREE' : `₹${deliveryFee}`}</span>
          </div>
          <div className="flex justify-between font-semibold text-lg text-gray-900 dark:text-white">
            <span>Amount to Pay ({selectedPayment.toUpperCase()})</span>
            <span>₹{finalAmount}</span>
          </div>
        </div>
      </div>

      <div className="flex space-x-3">
        <button
          onClick={() => setCurrentStep(2)}
          className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          Back to Address
        </button>
        <button
          onClick={() => {
            if (selectedPayment === 'cod') {
              setCurrentStep(4);
            } else {
              setOrderError('This payment method is not available yet. Please select Cash on Delivery.');
            }
          }}
          className="flex-1 bg-blue-600 dark:bg-blue-700 text-white py-3 rounded-lg font-medium hover:bg-blue-700 dark:hover:bg-blue-600"
        >
          Continue to Confirmation
        </button>
      </div>

      {orderError && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400 text-sm">{orderError}</p>
        </div>
      )}
    </div>
  );

  const renderOrderConfirmation = () => {
    const selectedAddr = addresses.find(addr => addr.id === selectedAddress);
    
    return (
      <div className="space-y-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Confirm Your Order</h3>
        
        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Delivery Address</h4>
          {selectedAddr && (
            <div className="text-gray-600 dark:text-gray-400">
              <p className="font-medium text-gray-900 dark:text-white">{selectedAddr.name}</p>
              <p>{selectedAddr.phone}</p>
              <p>{selectedAddr.addressLine1}{selectedAddr.addressLine2 && `, ${selectedAddr.addressLine2}`}</p>
              <p>{selectedAddr.city}, {selectedAddr.state} - {selectedAddr.pincode}</p>
            </div>
          )}
        </div>

        <div className="bg-gray-50 dark:bg-gray-800 p-6 rounded-lg">
          <h4 className="font-medium text-gray-900 dark:text-white mb-4">Order Items ({cartItems.length})</h4>
          <div className="space-y-3">
            {cartItems.map((item) => (
              <div key={item.id} className="flex justify-between items-center">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{item.name}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Qty: {item.quantity}</p>
                </div>
                <p className="font-medium text-gray-900 dark:text-white">₹{item.price * item.quantity}</p>
              </div>
            ))}
          </div>
        </div>        <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg border border-green-200 dark:border-green-800">
          <div className="flex items-center space-x-3 mb-4">
            <Truck className="w-6 h-6 text-green-600 dark:text-green-400" />
            <div>
              <h4 className="font-medium text-green-900 dark:text-green-100">Cash on Delivery</h4>
              <p className="text-green-700 dark:text-green-300">Amount to pay: ₹{finalAmount}</p>
            </div>
          </div>
          <p className="text-sm text-green-600 dark:text-green-400">
            Expected delivery: 2-3 business days
          </p>
        </div>

        <div className="flex space-x-3">
          <button
            onClick={() => setCurrentStep(3)}
            className="flex-1 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 py-3 rounded-lg font-medium hover:bg-gray-50 dark:hover:bg-gray-700"
            disabled={placingOrder}
          >
            Back to Payment
          </button>
          <button
            onClick={handlePlaceOrder}
            disabled={placingOrder || !selectedAddress}
            className="flex-1 bg-green-600 dark:bg-green-700 text-white py-3 rounded-lg font-medium hover:bg-green-700 dark:hover:bg-green-600 disabled:bg-gray-400 dark:disabled:bg-gray-600 disabled:cursor-not-allowed"
          >
            {placingOrder ? 'Placing Order...' : 'Place Order'}
          </button>
        </div>

        {orderError && (
          <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-red-600 dark:text-red-400 text-sm">{orderError}</p>
          </div>
        )}
      </div>
    );
  };
  const renderOrderSuccess = () => (
    <div className="text-center space-y-6">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
        <CheckCircle className="w-12 h-12 text-green-600 dark:text-green-400" />
      </div>
      <div>
        <h3 className="text-2xl font-bold text-green-900 dark:text-green-100 mb-2">Order Placed Successfully!</h3>
        <p className="text-gray-600 dark:text-gray-400">Your order has been confirmed and will be delivered soon.</p>
      </div>
      <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
        <p className="text-green-800 dark:text-green-200 font-medium">
          Order ID: {orderId ? `#${orderId}` : `#ORD${Date.now()}`}
        </p>
        <p className="text-green-600 dark:text-green-400 text-sm mt-1">You will receive SMS updates about your order</p>
      </div>
    </div>
  );

  return (    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-4xl mx-auto py-8 px-4">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm">
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center space-x-3">
              <button
                onClick={onBack}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-gray-900 dark:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Checkout</h2>
            </div>
          </div>

          <div className="p-6">
            {!orderPlaced && renderStepIndicator()}
            
            {orderPlaced ? renderOrderSuccess() : (
              <>
                {currentStep === 1 && renderCartReview()}
                {currentStep === 2 && renderAddressSelection()}
                {currentStep === 3 && renderPaymentMethod()}
                {currentStep === 4 && renderOrderConfirmation()}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
