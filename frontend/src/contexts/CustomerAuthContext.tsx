import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as customerAuthService from '../services/customerAuthService';

interface CustomerUser {
  id: string;
  nameEnglish: string;
  username: string;
  roomNumber: string;
  mobile: string;
}

interface CustomerAuthContextType {
  customer: CustomerUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | undefined>(undefined);

export const CustomerAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('customerToken');
    const stored = localStorage.getItem('customerUser');
    if (token && stored) {
      try {
        setCustomer(JSON.parse(stored));
      } catch {
        localStorage.removeItem('customerToken');
        localStorage.removeItem('customerUser');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const result = await customerAuthService.customerLogin(username, password);
    localStorage.setItem('customerToken', result.token);
    localStorage.setItem('customerUser', JSON.stringify(result.customer));
    setCustomer(result.customer);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerUser');
    setCustomer(null);
  }, []);

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        isAuthenticated: !!customer,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
};

export const useCustomerAuth = () => {
  const context = useContext(CustomerAuthContext);
  if (!context) throw new Error('useCustomerAuth must be used within CustomerAuthProvider');
  return context;
};
