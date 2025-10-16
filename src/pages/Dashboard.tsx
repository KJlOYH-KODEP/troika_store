import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ShoppingCart, Package, Users, TrendingUp, BoxSelect } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useOffice } from '../contexts/OfficeContext';
import { DashboardStats, LowStockProduct, Order, OrderItem, ShippingAddress, OrdersResponse } from '../types';
import { getOrders, getLowStockProducts } from '../api';

const Dashboard = () => {
  const { user } = useAuth();
  const { currentOffice } = useOffice();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [lowStockProducts, setLowStockProducts] = useState<LowStockProduct[]>([]);

  const isAdmin = user?.role.admin;
  const isModerator = user?.role.moderator || isAdmin;

  useEffect(() => {
    const fetchDashboardData = async () => {
      // if (!currentOffice) return;
  
      try {
        setLoading(true);
  
        localStorage.setItem('office_id', String(currentOffice?.office_id))
        // Получаем заказы за последнюю неделю
        const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const weekEnd = new Date().toISOString();
        const weekOrdersResponse = await getOrders(0, 1000, '', JSON.stringify([weekStart, weekEnd]));
        const weekOrders: OrdersResponse = weekOrdersResponse.data;
  
        // Получаем заказы за сегодня
        const todayStart = new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
        const todayEnd = new Date().toISOString();
        const todayOrdersResponse = await getOrders(0, 1000, '', JSON.stringify([todayStart, todayEnd]));
        const todayOrders: OrdersResponse = todayOrdersResponse.data;

        // Рассчитываем статистику
        const weekCompletedOrders = weekOrders.orders.filter(order => order.status === 'Выполнен').length;
        const weekCancelledOrders = weekOrders.orders.filter(order => order.status === 'Отменён').length;
        const processingOrders = weekOrders.orders.filter(order => order.status === 'В обработке').length;
  
        const weekSales = weekOrders.orders
          .filter(order => order.status === 'Выполнен')
          .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

        const todaySales = todayOrders.orders
          .filter(order => order.status === 'Выполнен')
          .reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

        setStats({
          weekSales,
          todaySales,
          weekCompletedOrders,
          weekCancelledOrders,
          processingOrders,
        });
  
        // Получаем товары с низким остатком
        const lowStockResponse = await getLowStockProducts(String(localStorage.getItem('office_id')));
        console.log('Low stock response:', lowStockResponse); // Для отладки
        const lowStockData = lowStockResponse.data?.data || lowStockResponse.data || [];
        setLowStockProducts(lowStockData);
      } catch (error) {
        console.error('Ошибка при загрузке данных:', error);
      } finally {
        setLoading(false);
      }
    };
  
    fetchDashboardData();
  }, [currentOffice]);

  // Карточки для быстрого доступа
  const quickAccess = [
    { 
      title: 'Товары', 
      icon: <Package size={24} />, 
      description: 'Управление товарами и ценами', 
      path: '/products',
      color: 'bg-primary-500',
      available: true,
    },
    { 
      title: 'Заказы', 
      icon: <ShoppingCart size={24} />, 
      description: 'Просмотр и обработка заказов', 
      path: '/orders',
      color: 'bg-success-500',
      available: true,
    },
    { 
      title: 'Сотрудники', 
      icon: <Users size={24} />, 
      description: 'Управление персоналом', 
      path: '/employees',
      color: 'bg-warning-500',
      available: isAdmin,
    },
    // { 
    //   title: 'Отчеты', 
    //   icon: <TrendingUp size={24} />, 
    //   description: 'Финансовая статистика и отчеты', 
    //   path: '/reports',
    //   color: 'bg-danger-500',
    //   available: isModerator,
    // },
  ];

  const formatCurrency = (amount: number) => 
    new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' })
      .format(amount)
      .replace(/\s/g, ' ');

  const formatDate = () => {
    const now = new Date();
    const days = ['Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'];
    const day = days[now.getDay()];
    const date = now.toLocaleDateString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
    const time = now.toLocaleTimeString('ru-RU', {
      hour: '2-digit',
      minute: '2-digit'
    });
    
    return (
      <div className="text-right">
        <p className="text-2xl font-bold text-gray-800">{time}</p>
        <p className="text-gray-500">{day}, {date}</p>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Панель управления</h1>
        {formatDate()}
      </div>

      {/* Основные показатели */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Продажи за неделю</h3>
            <p className="text-2xl font-semibold mt-2">{formatCurrency(stats.weekSales)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Продажи сегодня</h3>
            <p className="text-2xl font-semibold mt-2">{formatCurrency(stats.todaySales)}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Заказов выполнено за неделю</h3>
            <p className="text-2xl font-semibold mt-2">{stats.weekCompletedOrders}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Заказов отменено за неделю</h3>
            <p className="text-2xl font-semibold mt-2">{stats.weekCancelledOrders}</p>
          </div>
          
          <div className="bg-white rounded-lg shadow-sm p-5 border border-gray-200">
            <h3 className="text-gray-500 text-sm font-medium">Заказы в обработке</h3>
            <p className="text-2xl font-semibold mt-2">{stats.processingOrders}</p>
          </div>
        </div>
      )}

      {/* Основной контент - теперь в две колонки */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Левая колонка - Быстрый доступ (2/3 ширины) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5">
            <h2 className="font-semibold text-lg mb-4">Быстрый доступ</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {quickAccess
                .filter(item => item.available)
                .map((item, index) => (
                  <Link 
                    key={index}
                    to={item.path}
                    className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
                  >
                    <div className={`w-12 h-12 rounded-full ${item.color} text-white flex items-center justify-center mb-3`}>
                      {item.icon}
                    </div>
                    <h3 className="font-semibold text-lg">{item.title}</h3>
                    <p className="text-gray-500 text-sm mt-1">{item.description}</p>
                  </Link>
                ))
              }
            </div>
          </div>
        </div>

        {/* Правая колонка - Заканчиваются на складе (1/3 ширины) */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-5 h-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-semibold text-lg">Заканчиваются на складе</h2>
              <Link to="/products/warehouses" className="text-primary-500 hover:text-primary-600 text-sm font-medium">
                Подробнее
              </Link>
            </div>
            <div className="space-y-3">
            <div className="space-y-3">
                {lowStockProducts.length > 0 ? (
                  lowStockProducts.map((product) => {
                    // Находим инвентарь для текущего офиса
                    const officeInventory = product.inventory?.find(
                      inv => inv.office_id === currentOffice?.office_id
                    );
                    const quantity = officeInventory?.quantity ?? 0;

                    return (
                      <div key={product.product_id} className="flex items-center justify-between px-3 py-2 rounded-md bg-gray-50">
                        <div>
                          <p className="font-medium">{product.name}</p>
                          <p className="text-xs text-gray-500">{product.article}</p>
                        </div>
                        <div className="flex items-center">
                          <BoxSelect size={16} className="text-warning-500 mr-1" />
                          <span className="font-semibold text-warning-700">
                            {quantity} шт.
                          </span>
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500 text-center py-4">Нет товаров с низким остатком</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;