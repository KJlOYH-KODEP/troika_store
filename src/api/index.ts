import axios from 'axios';

const REMOTE_API_URL = "https://troika-server.serveo.net/api";
const LOCAL_API_URL = 'http://localhost:3000/api';

const API_URL = LOCAL_API_URL; // По умолчанию используем локальный URL

async function checkApiAvailability(url: string) {
  try {
    const response = await axios.get(url, { timeout: 2000 });
    return response.status >= 200 && response.status < 300;
  } catch (error) {
    console.warn(`API URL ${url} is not available. Error:`, error.message);
    return false;
  }
}
export const IMAGES_BASE_URL = 'http://localhost:3000/';

// Создаем базовый экземпляр axios с возможностью изменения baseURL
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Функция для инициализации API
async function initializeApi() {
  const isRemoteAvailable = await checkApiAvailability(REMOTE_API_URL);
  
  if (isRemoteAvailable) {
    api.defaults.baseURL = REMOTE_API_URL;
    console.log(`Using remote API URL: ${REMOTE_API_URL}`);
  } else {
    api.defaults.baseURL = LOCAL_API_URL;
    console.log(`Using local API URL: ${LOCAL_API_URL}`);
  }
}

// Вызываем инициализацию при загрузке модуля
initializeApi().catch(error => {
  console.error('Failed to initialize API:', error);
});

// Интерцептор для добавления токена авторизации
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('Request config:', config);
    console.log('URL', config.baseURL, config.url)
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Интерцептор для обработки ошибок
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      // Структурируем ошибку для UI
      return Promise.reject({
        message: error.response?.data?.message || 'Неверный email или пароль',
        isAxiosError: true,
      });
    }
    
    return Promise.reject(error);
  }
);

// 1. Аутентификация
export const loginStaff = (email: string, password: string) => 
  api.post('/auth/staff/login', { email, password });

// upd. Новый сотрудник от имени админа
export const register = (userData: {
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}) => api.post('/staff/register', userData);

// 2. Категории
export const getCategories = (offset = 0, limit = 20) => 
  api.get(`/categories?offset=${offset}&limit=${limit}`);

export const getCategoryImage = (categoryId: number) => 
  api.get(`/categories/image?categoryId=${categoryId}`);

export const createCategory = (name: string) => 
  api.post('/categories', { name });

export const updateCategory = (categoryId: number, name?: string) => 
  api.put(`/categories/${categoryId}`, { name });

export const deleteCategory = (categoryId: number) => 
  api.delete(`/categories/${categoryId}`);

// 3. Офисы
export const getOffices = (offset = 0, limit = 20) => 
  api.get(`/offices/?offset=${offset}&limit=${limit}`);

export const searchOffices = (settlement = '', addressLine = '') => {
  const params = new URLSearchParams();
  if (settlement) {
    params.append('settlement', settlement);
  }
  if (addressLine) {
    params.append('addressLine', addressLine);
  }
  return api.get(`/offices/?${params.toString()}`);
};

export const getOfficeById = (officeId: number) => 
  api.get(`/offices/${officeId}`); 

export const createOffice = (officeData: {
  name: string;
  address_line1: string;
  city: string;
  postal_code: string;
  country: string;
}) => api.post('/offices', officeData);

export const updateOffice = (id: number, officeData: {
  name?: string;
  address_line1?: string;
  city?: string;
  postal_code?: string;
  country?: string;
}) => api.put(`/offices/${id}`, officeData);

// 4. Заказы
export const createOrder = (orderData: {
  items: Array<{ product_price_id: number; quantity: number }>;
  address: { address_line1: string; city: string; postal_code: string; country: string };
  delivery_method: string;
  payment_method: string;
  office_id?: number;
}) => api.post('/orders', orderData);

export const updateOrderItems = (orderId: number) => 
  api.put(`/orders/${orderId}/items`);

export const getOrder = (orderId: string) => 
  api.get(`/orders/${orderId}`);

export const getUserOrders = (userId: string, params: {
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });

  return api.get(`/orders/user/${userId}?${queryParams.toString()}`);
};


import { GetOrdersParams } from '../types';
export const getOrders = ({
    offset = 0,
    limit = 20,
    statuses = '',
    orderDate = '',
    minPrice = '',
    maxPrice = '',
    deliveryMethods = '',
    paymentMethods = '',
    sortBy = '',
    sortOrder = 'desc',
    searchQuery = ''
}: GetOrdersParams) => {
    const queryParams = new URLSearchParams();

    if (offset !== undefined) queryParams.append('offset', offset.toString());
    if (limit !== undefined) queryParams.append('limit', limit.toString());
    if (statuses) queryParams.append('statuses', statuses);
    if (orderDate) queryParams.append('orderDate', orderDate);
    if (minPrice) queryParams.append('priceFloor', minPrice);
    if (maxPrice) queryParams.append('priceCeiling', maxPrice);
    if (deliveryMethods) queryParams.append('deliveryMethods', deliveryMethods);
    if (paymentMethods) queryParams.append('paymentMethods', paymentMethods);
    if (sortBy) queryParams.append('sortBy', sortBy);
    if (sortOrder) queryParams.append('sortOrder', sortOrder);
    if (searchQuery) queryParams.append('searchQuery', searchQuery);

    return api.get(`/orders/?${queryParams.toString()}`);
};

export const updateOrderStatus = (orderId: string, status: string) => 
  api.put(`/orders/${orderId}/status`, { status });

export const cancelOrder = (orderId: number) => 
  api.put(`/orders/${orderId}/cancel`);

// 5. Товары
// Получение общего количества товаров
export const getProdsCount = () =>
  api.get('/products/count');

export const getProducts = (params: {
  searchQuery?: string;
  officeId?: number;
  categoryId?: number;
  priceTypeId?: number;
  priceFloor?: number;
  priceCeiling?: number;
  quantityFloor?: number;
  quantityCeiling?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  offset?: number;
  limit?: number;
  unlimited?: boolean;
}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });

  return api.get(`/products/?${queryParams.toString()}`);
};

export const getProduct = (productId: number, params: {
  officeId?: number;
}) => {
  const queryParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined) queryParams.append(key, value.toString());
  });
  return  api.get(`/products/${productId}?${queryParams.toString()}`);
}

export const getImages = (productIds: number[]) => {
  const params = new URLSearchParams();
  productIds.forEach(id => {
    params.append('productIds', id.toString());
  });
  return api.get(`/products/images?${params.toString()}`);
};

export const updateProduct = (productId: number, productData: {
  name?: string;
  description?: string;
  article?: string;
}) => api.put(`/products/${productId}`, productData);

export const deleteProduct = (productId: number) => 
  api.delete(`/products/${productId}`);

export const removeProductFromOffice = (productId: number, officeId: number) => 
  api.delete(`/products/${productId}/office/${officeId}`);

export const getLowStockProducts = (officeId: string) => 
  api.get(`/products/low-stock?officeId=${officeId}`);

// 6. Типы цен
export const getPriceTypes = () => 
  api.get('/price-types');

export const getPriceType = (priceTypeId: number) => 
  api.get(`/price-types/${priceTypeId}`);

export const createPriceType = (name: string) => 
  api.post('/price-types', { name });

export const updatePriceType = (priceTypeId: number, name: string) => 
  api.put(`/price-types/${priceTypeId}`, { name });

export const deletePriceType = (priceTypeId: number) => 
  api.delete(`/price-types/${priceTypeId}`);

// 7. Цены на товары
export const getPrices = (params: {
  searchQuery?: string;
  offset?: number;
  limit?: number;
  productId?: number;
  categoryId?: number;
  priceTypeId?: number;
  priceFloor?: number;
  priceCeiling?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  unlimited?: boolean;
}) => {
  const queryParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0  ) queryParams.append(key, value.toString());
    });
  return api.get(`/product-prices/?${queryParams.toString()}`);
};

export const getPrice = (productPriceId: number) => 
  api.get(`/product-prices/${productPriceId}`);

export const createPrice = (priceData: {
  product_id: number;
  price: string;
  price_type_id: number;
  data_s: string;
  data_e: string;
}) => api.post('/product-prices', priceData);

export const updatePrice = (productPriceId: number, priceData: {
  price?: string;
  price_type_id?: number;
  data_s?: string;
  data_e?: string;
}) => api.put(`/product-prices/${productPriceId}`, priceData);

export const deletePrice = (productPriceId: number) => 
  api.delete(`/product-prices/${productPriceId}`);

// 8. Инвентарь
export const getWarehouses = (params?: {
  searchQuery?: string;
  offset?: number;
  limit?: number;
  productId?: number;
  categoryId?: number;
  quantityFloor?: number;
  quantityCeiling?: number;
  quantityOrderedFloor?: number;
  quantityOrderedCeiling?: number;
  officeId?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  unlimited?: boolean;
}) => {
  const queryParams = new URLSearchParams();

  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 0) {
        queryParams.append(key, value.toString());
      }
    });
  }

  return api.get(`/product-inventories/?${queryParams.toString()}`);
};

export const getWarehouse = (inventoryId: number) => 
  api.get(`/product-inventories/${inventoryId}`);

export const createWarehouse = (inventoryData: {
  product_id: number;
  office_id: number;
  quantity: number;
  data_s: string;
  data_e: string;
}) => api.post('/product-inventories', inventoryData);

export const updateWarehouse = (inventoryId: number, inventoryData: {
  product_id: number;
  office_id: number;
  quantity: number;
  data_s: string;
  data_e: string;
}) => 
  api.put(`/product-inventories/${inventoryId}`, inventoryData);

export const deleteWarehouse = (inventoryId: number) => 
  api.delete(`/product-inventories/${inventoryId}`);

// 9. Сотрудники
export const getStaff = () => 
  api.get('/staff');

export const getStaffMember = (staffId: number) => 
  api.get(`/staff/${staffId}`);

export const getStaffApplications = () => 
  api.get('/staff/applications');

// export const approveStaffApplication = (applicationId: number) => 
//   api.post(`/staff/applications/${applicationId}/approve`);

// export const rejectStaffApplication = (applicationId: number) => 
//   api.post(`/staff/applications/${applicationId}/reject`);

export const updateStaffData = (staffId: number, data: {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  office_id?: number;
  role?: {
  admin?: boolean;
  moderator?: boolean;
  staff?: boolean;
};
}) => {
  return api.put(`/staff/${staffId}/data`, data);
};

export const updateStaffCredentials = (credentials: {
  email?: string;
  password?: string;
  phone_number?: string;
}) => api.put('/staff/credentials', credentials);

export const deleteStaff = (staffId: number) => {
  return  api.delete(`/staff/${staffId}`);
};

// 10. Пользователи
export const getUser = (clientId: string) => {
    return api.get(`/users/${clientId}`);
};

export const getUsers = async ({searchQuery, sortBy, sortOrder }: { searchQuery?: string; sortBy?: string; sortOrder?: string}) => {
  const params = new URLSearchParams();
  if (searchQuery) params.append('searchQuery', searchQuery);
  if (sortBy) params.append('sortBy', sortBy);
  if (sortOrder) params.append('sortOrder', sortOrder);
  return api.get(`/users?${params.toString()}`);
};

export const updateUserCredentials = (credentials: {
  email?: string;
  password?: string;
  phone_number?: string;
  data_s?: string;
  data_e?: string;
}) => api.put('/users/credentials', credentials);

// 11. Синхронизация товаров
export const importXml = (file: File, officeId: string) => {
  const formData = new FormData();
  const encodedFileName = encodeURIComponent(file.name);
  formData.append('xmlFile', file, encodedFileName);
  formData.append('office_id', officeId); // Добавляем office_id в FormData
  
  return api.post('/sync/import', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const uploadImageByArticle = (article: string, type: string, file: File) => {
  const formData = new FormData();
  const encodedFileName = encodeURIComponent(file.name);
  formData.append('image', file, encodedFileName);
  return api.post(`/sync/new-img-to-art/${article}/${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export const checkImages = () => 
  api.post('/sync/img/check');

export const uploadImages = (type: string, files: File[]) => {
  const formData = new FormData();
  files.forEach((file) => {
    const encodedFileName = encodeURIComponent(file.name);
    formData.append('images', file, encodedFileName);
  });
  return api.post(`/sync/new-imgs/${type}`, formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
};

export default api;