export interface User {
  user_id: number;
  role: {admin: boolean, moderator: boolean, staff: boolean};
  office_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}
export interface Client {
  client_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
}

export interface StaffMember {
  user_id: number;
  email: string;
  first_name: string;
  last_name: string;
  phone_number: string;
  role: {
    admin: boolean;
    moderator: boolean;
    staff: boolean;
  };
  office_id: number;
  office_name: string;
}

export interface Office {
  office_id: number;
  settlement: string;
  address_line: string;
  postalCode: string;
}
export interface ProductFullInfo {
  product_id: number;
  article: string;
  name: string;
  description: string;
  category_id: number;
  inventory: {
    inventory_id: number;
    quantity: number;
    product_id: number;
    office_id: number;
    ordered_quantity: number;
  }[];
  prices: {
    product_price_id: number;
    price: string;
    data_s: string;
    data_e: string | null;
    product_id: number;
    price_type_id: number;
    price_type: {
      price_type_id: number;
      name: string;
      description: string | null;
    };
  }[];
}

export interface Product {
  product_id: number;
  article: string;
  name: string;
  description?: string;
  category_id: number;
  inventory?: ProductInventory[];
  prices?: ProductPrice[];
}

export interface ProductInventory {
  id: number;
  product_id: number;
  office_id: number;
  quantity: number;
  ordered_quantity: number;
  product?: {
    article: string;
    name: string;
  };
}

export interface ProductPrice {
  id: number;
  product_id: number;
  price_type_id: number;
  price: number;
  product?: {
    article: string;
    name: string;
  };
  price_type?: {
    name: string;
  };
}

export interface PriceType {
  id: number;
  name: string;
  description?: string;
}

export interface PaginatedResponse<T> {
  total: number;
  limit: number;
  offset: number;
  items: T[];
}

export interface LowStockProduct {
  product_id: number;
  name: string;
  article: string;
  inventory: {
    inventory_id: number;
    quantity: number;
    product_id: number;
    office_id: number;
    ordered_quantity: number;
  }[];
}

export interface Warehouse {
  id: number;
  productId: number;
  productName: string;
  productArticle: string;
  office_id: number;
  officeName: string;
  quantity: number;
}

export interface Category {
  category_id: number;
  name: string;
  parent_id: number | null;
  children?: Category[];
}

export interface DashboardStats {
  weekSales: number;
  todaySales: number;
  weekCompletedOrders: number;
  weekCancelledOrders: number;
  processingOrders: number;
}
export interface Notification {
  id: number;
  type: 'info' | 'warning' | 'success' | 'error';
  message: string;
  createdAt: string;
  read: boolean;
}
export interface Order {
  order_id: number;
  public_order_id: string;
  client_id: number;
  order_date: string;
  status: string;
  total_amount: string;
  delivery_method: string;
  payment_method: string;
  comment: string;
  office_id: number;
  last_change: string;
}

export interface OrderItem {
  order_item_id: number;
  order_id: number;
  product_price_id: number;
  quantity: number;
}

export interface ShippingAddress {
  order_address_id: number;
  address_line1: string;
  address_line2: string;
  settlement: string;
  region: string;
  postal_code: string;
  country: string;
  order_id: number;
}

export interface OrdersResponse {
  total: number;
  limit: number;
  offset: number;
  orders: Order[];
}

export interface GetOrdersParams {
    offset?: number;
    limit?: number;
    statuses?: string;
    orderDate?: string;
    amountFloor?: string;
    amountCeiling?: string;
    minPrice?: string;
    maxPrice?: string;
    deliveryMethods?: string;
    paymentMethods?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    searchQuery?: string;
}


export interface GetOrdersResponse {
    data: {
        total: number;
        limit: number;
        offset: number;
        sortField: string;
        sortDirection: string;
        orders: any[];
    };
}

export interface Employee {
  staff_id: number;
  email: string;
  role: {admin: boolean, moderator: boolean, staff: boolean};
  first_name: string;
  last_name: string;
  phone_number: string;
  office_id: number;
}