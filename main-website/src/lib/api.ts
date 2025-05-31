const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://healthpix-backend-env.eba-dkmy2f3p.ap-south-1.elasticbeanstalk.com';

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

class ApiService {
  private async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });      const data = await response.json();

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
    }
  }
  // Medicine APIs
  async getMedicines(category?: string, search?: string): Promise<ApiResponse<Medicine[]>> {
    try {
      const params = new URLSearchParams();
      if (category && category !== 'All') params.append('category', category);
      if (search) params.append('search', search);
      
      const response = await this.makeRequest<Medicine[]>(`/api/medicines?${params.toString()}`);
      
      if (!response.success) {
        // Return fallback medicines if API fails
        const fallbackMedicines = this.getFallbackMedicines();
        const filtered = this.filterMedicines(fallbackMedicines, category, search);
        return { success: true, data: filtered };
      }
        return response;
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
    });
  }
  async getOrders(userId: string): Promise<ApiResponse<Order[]>> {
    return this.makeRequest<Order[]>(`/api/orders/${userId}`);
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
