import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../config';
import { Loan, LoanSummary, User } from '../types';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor to inject JWT token from storage
apiClient.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem('@miniledger_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch (error) {
    console.error('Error fetching token from storage', error);
  }
  return config;
});

export const authApi = {
  sendOtp: async (phoneNumber: string) => {
    const res = await apiClient.post('/auth/send-otp', { phoneNumber });
    return res.data;
  },

  verifyOtp: async (phoneNumber: string, code: string) => {
    const res = await apiClient.post<{
      success: boolean;
      token: string;
      user: User;
      message: string;
    }>('/auth/verify-otp', { phoneNumber, code });
    return res.data;
  },

  getMe: async () => {
    const res = await apiClient.get<{ success: boolean; user: User }>('/auth/me');
    return res.data.user;
  },
};

export const loanApi = {
  getSummary: async (): Promise<LoanSummary> => {
    const res = await apiClient.get<{ success: boolean; data: LoanSummary }>('/loans/summary');
    return res.data.data;
  },

  getLoans: async (status?: string): Promise<Loan[]> => {
    const res = await apiClient.get<{ success: boolean; count: number; data: Loan[] }>('/loans', {
      params: status && status !== 'all' ? { status } : undefined,
    });
    return res.data.data;
  },

  createLoan: async (params: {
    friendName: string;
    amount: number;
    dueDate: string;
    notes?: string;
    receiptUri?: string;
  }): Promise<Loan> => {
    if (params.receiptUri) {
      // Use FormData for file upload
      const formData = new FormData();
      formData.append('friendName', params.friendName);
      formData.append('amount', params.amount.toString());
      formData.append('dueDate', params.dueDate);
      if (params.notes) {
        formData.append('notes', params.notes);
      }

      const filename = params.receiptUri.split('/').pop() || 'receipt.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : `image/jpeg`;

      // @ts-ignore - React Native FormData accepts uri object
      formData.append('receipt', {
        uri: params.receiptUri,
        name: filename,
        type,
      });

      const res = await apiClient.post<{ success: boolean; data: Loan }>('/loans', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return res.data.data;
    } else {
      const res = await apiClient.post<{ success: boolean; data: Loan }>('/loans', {
        friendName: params.friendName,
        amount: params.amount,
        dueDate: params.dueDate,
        notes: params.notes,
      });
      return res.data.data;
    }
  },

  markAsRepaid: async (id: string, isRepaid: boolean = true): Promise<Loan> => {
    const res = await apiClient.patch<{ success: boolean; data: Loan }>(`/loans/${id}/repay`, {
      isRepaid,
    });
    return res.data.data;
  },

  deleteLoan: async (id: string): Promise<void> => {
    await apiClient.delete(`/loans/${id}`);
  },
};
