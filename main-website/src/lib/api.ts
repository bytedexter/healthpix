// Backend API URL
const API_BASE_URL = 'http://healthpix-backend-env.eba-dkmy2f3p.ap-south-1.elasticbeanstalk.com';

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
      // Ensure endpoint starts with a slash for REST API
      if (!endpoint.startsWith('/')) {
        endpoint = '/' + endpoint;
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
      
      // Check if content type is application/json (be more lenient for our backend)
      const contentType = response.headers.get('content-type');
      console.log('Response content type:', contentType);
      
      const isJson = contentType && (
        contentType.includes('application/json') || 
        contentType.includes('text/plain') ||
        response.headers.get('content-length') // If there's content, try to parse as JSON
      );
      
      if (!isJson) {
        console.error('Non-JSON response received:', contentType);
        const responseText = await response.text();
        console.error('Response text:', responseText.substring(0, 200));
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

      // Handle backend response format { success: true, data: [...] } or direct array
      if (data && Array.isArray(data)) {
        // Direct array response from backend
        console.log(`Received ${data.length} items from backend`);
        return {
          success: true,
          data: data as T,
        };
      } else if (data && data.success && data.data !== undefined) {
        // Wrapped response format
        return {
          success: true,
          data: data.data as T,
        };
      }

      // Fallback for any other response format
      return {
        success: true,
        data: data as T,
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
      // Return empty array for orders, component will use fallback
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
      // Use REST API endpoint for medicines
      const endpoint = '/api/medicines';
      
      const response = await this.makeRequest<Medicine[]>(endpoint);
      
      if (!response.success || !response.data) {
        console.log('API request failed, using fallback medicines');
        const fallbackMedicines = this.getFallbackMedicines();
        const filtered = this.filterMedicines(fallbackMedicines, category, search);
        return { success: true, data: filtered };
      }
        // Transform backend data format to frontend format
      const medicineArray: Medicine[] = response.data.map((item: unknown) => {
        const medicineItem = item as Record<string, unknown>;
        return {
          id: medicineItem.id?.toString() || '',
          name: medicineItem.name?.toString() || '',
          type: medicineItem.type?.toString() || '',
          dosage: medicineItem.dosage?.toString() || '',
          composition: medicineItem.composition?.toString() || '',
          price: parseFloat(medicineItem.price?.toString() || '0') || 0,
          rating: 4.0 + Math.random() * 1.0, // Random rating between 4.0-5.0
          category: this.mapToCategory(medicineItem.name?.toString() || '', medicineItem.type?.toString() || '', medicineItem.composition?.toString() || ''),          image: '/health.png', // Default image for all medicines
          inStock: (parseFloat(medicineItem.stock?.toString() || '0') || 0) > 0,
          stock: parseFloat(medicineItem.stock?.toString() || '0') || 0,
          description: `${medicineItem.type?.toString() || ''} containing ${medicineItem.composition?.toString() || ''}`,
          manufacturer: 'HealthPix Pharma',
          expiryDate: '2025-12-31'
        };
      });
      
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
      // REST API endpoint for orders
      const endpoint = `/api/orders/${userId}`;
      
      const response = await this.makeRequest<Order[]>(endpoint);
      
      if (!response.success || !response.data) {
        console.log('API request failed, using fallback orders');
        return { 
          success: true, 
          data: this.getFallbackOrders(userId) 
        };
      }
      
      // Handle backend response - should be direct array
      let orders: Order[];
      if (Array.isArray(response.data)) {
        orders = response.data;
      } else {
        orders = this.getFallbackOrders(userId);
      }
      
      // If no orders from backend, show fallback orders for demo
      if (orders.length === 0) {
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
    try {
      // Backend doesn't have user profile endpoint yet, return mock data
      console.log('getUserProfile called for:', userId);
      
      // For now, return mock user data since backend doesn't have this endpoint
      const mockUser: User = {
        id: userId,
        name: 'HealthPix User',
        email: 'user@healthpix.com',
        phone: '9876543210',
        addresses: [
          {
            fullName: 'HealthPix User',
            phone: '9876543210',
            addressLine1: '123 Main Street',
            addressLine2: 'Apartment 4B',
            city: 'Mumbai',
            state: 'Maharashtra',
            pincode: '400001',
            landmark: 'Near City Mall'
          }
        ],
        orders: []
      };
      
      return {
        success: true,
        data: mockUser
      };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return {
        success: false,
        error: 'Failed to load user profile'
      };
    }
  }
  async updateUserProfile(userId: string, userData: Partial<User>): Promise<ApiResponse<User>> {
    try {
      // Backend doesn't have user update endpoint yet, return success with updated data
      console.log('updateUserProfile called for:', userId, 'with data:', userData);
      
      const updatedUser: User = {
        id: userId,
        name: userData.name || 'HealthPix User',
        email: userData.email || 'user@healthpix.com',
        phone: userData.phone || '9876543210',
        addresses: userData.addresses || [],
        orders: userData.orders || []
      };
      
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('Failed to update user profile:', error);
      return {
        success: false,
        error: 'Failed to update user profile'
      };
    }
  }

  async addUserAddress(userId: string, address: Address): Promise<ApiResponse<User>> {
    try {
      // Backend doesn't have address endpoint yet, return success
      console.log('addUserAddress called for:', userId, 'with address:', address);
      
      const updatedUser: User = {
        id: userId,
        name: 'HealthPix User',
        email: 'user@healthpix.com',
        phone: '9876543210',
        addresses: [address], // Add the new address
        orders: []
      };
      
      return {
        success: true,
        data: updatedUser
      };
    } catch (error) {
      console.error('Failed to add user address:', error);
      return {
        success: false,
        error: 'Failed to add address'
      };
    }
  }

  private mapToCategory(name: string, type: string, composition: string): string {
    const nameLower = name.toLowerCase();
    const compositionLower = composition.toLowerCase();
    
    if (nameLower.includes('paracetamol') || nameLower.includes('dolo') || nameLower.includes('aspirin') || compositionLower.includes('acetylsalicylic')) {
      return 'Pain Relief';
    }
    if (nameLower.includes('cetirizine') || nameLower.includes('levocetirizine') || nameLower.includes('benadryl')) {
      return 'Allergy';
    }
    if (nameLower.includes('insulin') || nameLower.includes('metformin')) {
      return 'Diabetes';
    }
    if (nameLower.includes('omeprazole') || nameLower.includes('pantoprazole') || nameLower.includes('ranitidine')) {
      return 'Gastric';
    }
    if (type === 'Ointment' || nameLower.includes('diclofenac')) {
      return 'Topical';
    }
    if (nameLower.includes('amoxicillin') || nameLower.includes('ciprofloxacin') || nameLower.includes('azithromycin')) {
      return 'Antibiotics';
    }
    if (nameLower.includes('loperamide') || nameLower.includes('domperidone') || nameLower.includes('ondansetron')) {
      return 'Gastrointestinal';
    }
    
    return 'Other';
  }
}

export const apiService = new ApiService();
