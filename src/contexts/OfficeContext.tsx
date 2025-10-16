import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Office } from '../types';
import { getOfficeById } from '../api/index';
import { useAuth } from './AuthContext';

interface OfficeContextType {
  currentOffice: Office | null;
  setCurrentOffice: (office: Office) => void;
  loading: boolean;
}

const OfficeContext = createContext<OfficeContextType | undefined>(undefined);

export const useOffice = () => {
  const context = useContext(OfficeContext);
  if (!context) {
    throw new Error('useOffice must be used within an OfficeProvider');
  }
  return context;
};

export const OfficeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentOffice, setCurrentOffice] = useState<Office | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  // Загрузка информации об офисе при запуске или изменении пользователя
  useEffect(() => {
    const fetchOffice = async () => {
      if (user) {
        try {
          const officeId = user.office_id;
          const response = await getOfficeById(officeId);
          setCurrentOffice(response.data);
          localStorage.setItem('office_id', officeId.toString());
        } catch (error) {
          console.error('Ошибка при загрузке информации об офисе:', error);
        } finally {
          setLoading(false);
        }
      } else {
        setCurrentOffice(null);
        setLoading(false);
      }
    };

    fetchOffice();
  }, [user]);

  const updateCurrentOffice = (office: Office) => {
    if (user && (user.role.admin || user.role.moderator)) {
      setCurrentOffice(office);
      localStorage.setItem('officeId', office.office_id.toString());
    }
  };

  return (
    <OfficeContext.Provider value={{
      currentOffice,
      setCurrentOffice: updateCurrentOffice,
      loading,
    }}>
      {children}
    </OfficeContext.Provider>
  );
};