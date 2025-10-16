// CategoryContext.tsx
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { getCategories } from '../api';

interface Category {
  category_id: number;
  name: string;
  parent_category_id: number | null;
  children?: Category[];
}

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  getCategoryName: (id: number) => string;
  refreshCategories: () => Promise<void>;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export const useCategories = () => {
  const context = useContext(CategoryContext);
  if (!context) {
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
};

export const CategoryProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);

  const normalizeCategories = (categories: any[]): Category[] => {
    return categories.map(cat => ({
      category_id: cat.category_id,
      name: cat.name,
      parent_category_id: cat.parent_category_id,
      children: cat.children ? normalizeCategories(cat.children) : []
    }));
  };

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories();
      // Если приходит массив, нормализуем его, если один объект - делаем массив
      const categoriesData = Array.isArray(response.data) ? response.data : [response.data];
      const normalizedCategories = normalizeCategories(categoriesData);
      setCategories(normalizedCategories);
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      fetchCategories();
    }
  }, []);

  const refreshCategories = async () => {
    await fetchCategories();
  };

  const getCategoryName = (id: number): string => {
    const findCategory = (cats: Category[], targetId: number): string | null => {
      for (const cat of cats) {
        if (cat.category_id === targetId) return cat.name;
        if (cat.children) {
          const found = findCategory(cat.children, targetId);
          if (found) return found;
        }
      }
      return null;
    };

    const categoryName = findCategory(categories, id);
    return categoryName || 'Неизвестная категория';
  };

  return (
    <CategoryContext.Provider value={{ categories, loading, getCategoryName, refreshCategories }}>
      {children}
    </CategoryContext.Provider>
  );
};