// PriceTypeContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getPriceTypes } from '../api';

interface PriceType {
  id: number;
  name: string;
  description?: string;
}

interface PriceTypeContextType {
  priceTypes: PriceType[];
  loading: boolean;
  getPriceTypeName: (id: number) => string;
  refreshPriceTypes: () => Promise<void>;
}

const PriceTypeContext = createContext<PriceTypeContextType | undefined>(undefined);

export const usePriceTypes = () => {
  const context = useContext(PriceTypeContext);
  if (!context) {
    throw new Error('usePriceTypes must be used within a PriceTypeProvider');
  }
  return context;
};

export const PriceTypeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [priceTypes, setPriceTypes] = useState<PriceType[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchPriceTypes = async () => {
    setLoading(true);
    try {
      const response = await getPriceTypes();
      setPriceTypes(response.data);
    } catch (error) {
      console.error('Error fetching price types:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchPriceTypes();
    }
  }, []);

  const refreshPriceTypes = async () => {
    await fetchPriceTypes();
  };

  const getPriceTypeName = (id: number): string => {
    const priceType = priceTypes.find(pt => pt.id === id);
    return priceType ? priceType.name : 'Неизвестный тип цены';
  };

  return (
    <PriceTypeContext.Provider value={{ priceTypes, loading, getPriceTypeName, refreshPriceTypes }}>
      {children}
    </PriceTypeContext.Provider>
  );
};