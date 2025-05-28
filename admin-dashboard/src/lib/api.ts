const API_BASE_URL = 'http://localhost:3000/api';

export interface Order {
  id: string;
  userId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    medicineName: string;
    quantity: number;
    price: number;
    image: string;
  }>;
  totalAmount: number;
  status: 'placed' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: string;
  shippingAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  createdAt: string;
  updatedAt: string;
  estimatedDelivery?: string;
  trackingId?: string;
}

export interface AdminLoginCredentials {
  email: string;
  password: string;
}

class AdminApiService {  async login(credentials: AdminLoginCredentials): Promise<{ success: boolean; message?: string }> {
    try {
      console.log('Attempting admin login with:', credentials);
      console.log('API URL:', `${API_BASE_URL}/admin/login`);
      
      const response = await fetch(`${API_BASE_URL}/admin/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials),
      });

      console.log('Response status:', response.status);
      const data = await response.json();
      console.log('Response data:', data);
      return data;
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, message: 'Login failed' };
    }
  }

  async getAllOrders(): Promise<{ success: boolean; data?: Order[]; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get orders error:', error);
      return { success: false, message: 'Failed to fetch orders' };
    }
  }

  async updateOrderStatus(
    orderId: string, 
    status: Order['status'], 
    trackingId?: string
  ): Promise<{ success: boolean; message?: string }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status, trackingId }),
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Update order status error:', error);
      return { success: false, message: 'Failed to update order status' };
    }
  }

  async getOrderStats(): Promise<{ 
    success: boolean; 
    data?: {
      totalOrders: number;
      pendingOrders: number;
      shippedOrders: number;
      deliveredOrders: number;
      revenue: number;
    }; 
    message?: string 
  }> {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/stats`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get stats error:', error);
      return { success: false, message: 'Failed to fetch stats' };
    }
  }
}

export const adminApiService = new AdminApiService();
