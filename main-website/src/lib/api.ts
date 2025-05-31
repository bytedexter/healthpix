// Firebase Realtime Database URL
const API_BASE_URL = 'https://healthpix-3c036-default-rtdb.firebaseio.com';

// Fallback data flag - set to true to always use fallback data for development
const USE_FALLBACK_DATA = false;

// Default set of medicines for fallback - can be used directly or as a reference
// These are example medicines that match the structure needed by the application
/*
const FALLBACK_MEDICINES: Medicine[] = [
  {
    id: '1',
    name: 'Paracetamol',
    type: 'Tablet',
    dosage: '500mg',
    composition: 'Acetaminophen',
    price: 15,
    rating: 4.5,
    category: 'Pain Relief',
    image: '/medicines/paracetamol.jpg',
    inStock: true,
    stock: 100,
    description: 'Used for fever and mild to moderate pain relief',
    manufacturer: 'HealthPix Pharma',
    expiryDate: '2025-12-31'
  },
  {
    id: '2',
    name: 'Ibuprofen',
    type: 'Tablet',
    dosage: '400mg',
    composition: 'Ibuprofen',
    price: 25,
    rating: 4.2,
    category: 'Pain Relief',
    image: '/medicines/ibuprofen.jpg',
    inStock: true,
    stock: 75,
    description: 'Non-steroidal anti-inflammatory drug used for pain and fever reduction',
    manufacturer: 'HealthPix Pharma',
    expiryDate: '2025-10-15'
  },
  {
    id: '3',
    name: 'Cetirizine',
    type: 'Tablet',
    dosage: '10mg',
    composition: 'Cetirizine Hydrochloride',
    price: 30,
    rating: 4.0,
    category: 'Allergy',
    image: '/medicines/cetirizine.jpg',
    inStock: true,
    stock: 50,
    description: 'Antihistamine used to relieve allergy symptoms',
    manufacturer: 'HealthPix Pharma',
    expiryDate: '2025-09-20'
  }
];
*/

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface Medicine {
  id: string;
  name: string;
  type: string;
  dosage: string;
  composition: string;
  price: number;
  rating: number;
  category: string;
  image: string;
  inStock: boolean;
  stock?: number;
  description?: string;
  manufacturer?: string;
  expiryDate?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'cod' | 'upi' | 'card' | 'netbanking';
  shippingAddress: Address;
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingId?: string;
}

export interface OrderItem {
  medicineId: string;
  medicineName: string;
  quantity: number;
  price: number;
  image: string;
}

export interface Address {
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
  landmark?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  addresses?: Address[];
  orders?: string[];
}

class ApiService {  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    // Use fallback data if specified for development
    if (USE_FALLBACK_DATA) {
      console.log('Using fallback data for:', endpoint);
      return this.getFallbackResponse<T>(endpoint);
    }
    
    try {
      // Ensure endpoint starts with a slash and ends with .json for Firebase
      if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
      }
      
      // Add .json extension if not already present for Firebase Realtime Database
      if (!endpoint.endsWith('.json')) {
        endpoint = endpoint + '.json';
      }
      
      const url = `${API_BASE_URL}${endpoint}`;
      console.log('Making request to:', url);
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });
      
      // Check if content type is application/json
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        console.error('Non-JSON response received:', contentType);
        // Return fallback data for this endpoint
        return this.getFallbackResponse<T>(endpoint);
      }

      // Safely parse the JSON
      let data;
      try {
        data = await response.json();
      } catch (error) {
        console.error('Failed to parse JSON response:', error);
        return {
          success: false,
          error: 'Failed to parse response from server',
        };
      }

      if (!response.ok) {
        return {
          success: false,
          error: data.message || 'An error occurred',
        };
      }

      // Handle backend response format { success: true, data: [...] }
      if (data.success && data.data !== undefined) {
        return {
          success: true,
          data: data.data,
        };
      }

      // Fallback for direct data response
      return {
        success: true,
        data: data,
      };
    } catch (error) {
      console.error('API Request failed:', error);
      return {
        success: false,
        error: 'Network error occurred',
      };
    }  }
  
  private getFallbackResponse<T>(endpoint: string): ApiResponse<T> {
    console.log('Using fallback data for:', endpoint);
    
    // Extract the base endpoint name
    const path = endpoint.replace(/^\/?|\/?$|\/?\.json$/g, '');
    
    if (path.includes('medicines')) {
      return {
        success: true,
        data: this.getFallbackMedicines() as unknown as T
      };
    }
    
    if (path.includes('orders')) {
      return {
        success: true,
        data: [] as unknown as T
      };
    }
    
    // Default fallback
    return {
      success: true,
      data: [] as unknown as T
    };
  }
  
  // Medicine APIs
  async getMedicines(category?: string, search?: string): Promise<ApiResponse<Medicine[]>> {
    try {
      // For Firebase, we'll use /medicines endpoint
      const endpoint = '/medicines';
      
      const response = await this.makeRequest<Record<string, Medicine> | null>(endpoint);
      
      if (!response.success || !response.data) {
        console.log('API request failed, using fallback medicines');
        const fallbackMedicines = this.getFallbackMedicines();
        const filtered = this.filterMedicines(fallbackMedicines, category, search);
        return { success: true, data: filtered };
      }
      
      // Convert Firebase object format to array
      let medicineArray: Medicine[] = [];
      if (response.data) {
        // Handle Firebase's object format {key1: medicine1, key2: medicine2}
        medicineArray = Object.entries(response.data).map(([key, value]) => ({
          ...value,
          id: key, // Use Firebase key as the ID if not already present
        }));
      }
      
      // Apply filtering on the client side
      const filtered = this.filterMedicines(medicineArray, category, search);
      return { success: true, data: filtered };
    } catch (err) {
      console.error('Failed to fetch medicines:', err);
      const fallbackMedicines = this.getFallbackMedicines();
      const filtered = this.filterMedicines(fallbackMedicines, category, search);
      return { success: true, data: filtered };
    }
  }

  private filterMedicines(medicines: Medicine[], category?: string, search?: string): Medicine[] {
    let filtered = medicines;

    if (category && category !== 'All') {
      filtered = filtered.filter(medicine => medicine.category === category);
    }

    if (search) {
      const query = search.toLowerCase();
      filtered = filtered.filter(medicine => 
        medicine.name.toLowerCase().includes(query) ||
        medicine.composition.toLowerCase().includes(query) ||
        medicine.type.toLowerCase().includes(query)
      );
    }

    return filtered;
  }

  private getFallbackMedicines(): Medicine[] {
    // Based on backend/Data/data.csv structure
    return [
      { id: '1', name: 'Omeprazole', type: 'Ointment', dosage: '5 mg', composition: 'Ciprofloxacin 5 mg', price: 45.99, rating: 4.5, category: 'Topical', image: '/health.png', inStock: true },
      { id: '2', name: 'Ascoril', type: 'Tablet', dosage: '3 ml', composition: 'Acetylsalicylic Acid 3 ml', price: 32.50, rating: 4.8, category: 'Pain Relief', image: '/health.png', inStock: true },
      { id: '3', name: 'Amoxicillin', type: 'Syrup', dosage: '100 ml', composition: 'Ibuprofen 100 ml', price: 55.75, rating: 4.3, category: 'Antibiotics', image: '/health.png', inStock: true },
      { id: '4', name: 'Insulin', type: 'Tablet', dosage: '10 mg', composition: 'Azithromycin 10 mg', price: 89.25, rating: 4.7, category: 'Diabetes', image: '/health.png', inStock: true },
      { id: '5', name: 'Levocetirizine', type: 'Capsule', dosage: '250 mg', composition: 'Levocetirizine Dihydrochloride 250 mg', price: 28.00, rating: 4.4, category: 'Allergy', image: '/health.png', inStock: true },
      { id: '6', name: 'Pantoprazole', type: 'Injection', dosage: '250 mg', composition: 'Bromhexine + Guaiphenesin + Terbutaline 250 mg', price: 125.90, rating: 4.6, category: 'Gastric', image: '/health.png', inStock: true },
      { id: '7', name: 'Loperamide', type: 'Capsule', dosage: '100 mg', composition: 'Amoxicillin Trihydrate 100 mg', price: 38.75, rating: 4.2, category: 'Gastrointestinal', image: '/health.png', inStock: true },
      { id: '8', name: 'Cetirizine', type: 'Tablet', dosage: '100 ml', composition: 'Ciprofloxacin 100 ml', price: 22.50, rating: 4.5, category: 'Allergy', image: '/health.png', inStock: true },
      { id: '9', name: 'Metformin', type: 'Capsule', dosage: '5 mg', composition: 'Ibuprofen 5 mg', price: 42.25, rating: 4.8, category: 'Diabetes', image: '/health.png', inStock: true },
      { id: '10', name: 'Ranitidine', type: 'Tablet', dosage: '1000 mg', composition: 'Bromhexine + Guaiphenesin + Terbutaline 1000 mg', price: 35.80, rating: 4.3, category: 'Gastric', image: '/health.png', inStock: false },
      { id: '11', name: 'Dolo', type: 'Injection', dosage: '3 ml', composition: 'Levocetirizine Dihydrochloride 3 ml', price: 95.50, rating: 4.7, category: 'Pain Relief', image: '/health.png', inStock: true },
      { id: '12', name: 'Paracetamol', type: 'Capsule', dosage: '3 ml', composition: 'Diphenhydramine HCl + Ammonium Chloride 3 ml', price: 18.75, rating: 4.9, category: 'Pain Relief', image: '/health.png', inStock: true },
      { id: '13', name: 'Ciprofloxacin', type: 'Ointment', dosage: '75 mg', composition: 'Ranitidine 75 mg', price: 62.25, rating: 4.4, category: 'Topical', image: '/health.png', inStock: true },
    ];
  }

  async getMedicineById(id: string): Promise<ApiResponse<Medicine>> {
    return this.makeRequest<Medicine>(`/api/medicines/${id}`);
  }

  // Order APIs
  async createOrder(orderData: Omit<Order, 'id' | 'createdAt' | 'updatedAt'>): Promise<ApiResponse<Order>> {
    return this.makeRequest<Order>('/api/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });  }  async getOrders(userId: string): Promise<ApiResponse<Order[]>> {
    try {
      // Firebase Realtime Database format
      const endpoint = `/orders/${userId}`;
      
      const response = await this.makeRequest<Record<string, Order> | Order[] | null>(endpoint);
      
      if (!response.success || !response.data) {
        console.log('API request failed, using fallback orders');
        return { 
          success: true, 
          data: this.getFallbackOrders(userId) 
        };
      }
      
      // Handle different response formats
      let orders: Order[];
      if (Array.isArray(response.data)) {
        orders = response.data;
      } else if (typeof response.data === 'object' && response.data !== null) {
        // Firebase format: { key1: order1, key2: order2 }
        orders = Object.values(response.data);
      } else {
        orders = this.getFallbackOrders(userId);
      }
      
      return { success: true, data: orders };
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      return { 
        success: true, 
        data: this.getFallbackOrders(userId) 
      };
    }
  }
  
  private getFallbackOrders(userId: string): Order[] {
    // Return demo orders if API fails
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const lastWeek = new Date(today);
    lastWeek.setDate(lastWeek.getDate() - 7);
    
    return [
      {
        id: 'order123456789',
        userId: userId,
        items: [
          {
            medicineId: '1',
            medicineName: 'Omeprazole',
            quantity: 2,
            price: 45.99,
            image: '/health.png'
          },
          {
            medicineId: '2',
            medicineName: 'Ascoril',
            quantity: 1,
            price: 32.50,
            image: '/health.png'
          }
        ],
        totalAmount: 124.48,
        status: 'delivered',
        paymentMethod: 'cod',
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        createdAt: lastWeek.toISOString(),
        updatedAt: yesterday.toISOString(),
        estimatedDelivery: yesterday.toISOString(),
        trackingId: 'TRACK123456'
      },
      {
        id: 'order987654321',
        userId: userId,
        items: [
          {
            medicineId: '3',
            medicineName: 'Amoxicillin',
            quantity: 1,
            price: 55.75,
            image: '/health.png'
          }
        ],
        totalAmount: 55.75,
        status: 'shipped',
        paymentMethod: 'upi',
        shippingAddress: {
          fullName: 'Test User',
          phone: '9876543210',
          addressLine1: '123 Test Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          pincode: '400001'
        },
        createdAt: yesterday.toISOString(),
        updatedAt: today.toISOString(),
        estimatedDelivery: new Date(today.setDate(today.getDate() + 2)).toISOString(),
        trackingId: 'TRACK654321'
      }
    ];
  }

  async getOrderById(orderId: string): Promise<ApiResponse<Order>> {
    return this.makeRequest<Order>(`/api/orders/${orderId}`);
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<ApiResponse<Order>> {
    return this.makeRequest<Order>(`/api/orders/${orderId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    });
  }

  // User APIs
  async getUserProfile(userId: string): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/api/users/${userId}`);
  }

  async updateUserProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/api/users/${userId}`, {
      method: 'PATCH',
      body: JSON.stringify(userData),
    });
  }

  async addUserAddress(userId: string, address: Address): Promise<ApiResponse<User>> {
    return this.makeRequest<User>(`/api/users/${userId}/addresses`, {
      method: 'POST',
      body: JSON.stringify(address),
    });
  }
}

export const apiService = new ApiService();
