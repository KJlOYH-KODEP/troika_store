import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOffice } from '../../contexts/OfficeContext';
import { getOrders } from '../../api';
import {
  Filter,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  X, // Import the X icon
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Pagination from '../../components/Pagination';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useDebounce from '../../hooks/useDebounce';
import { Order } from '../../types';


const OrdersPage = () => {
  const { user } = useAuth();
  const { currentOffice } = useOffice();
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrdersCount, setTotalOrdersCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    statuses: [],
    order_date: [],
    amount_floor: '',
    amount_ceiling: '',
    delivery_methods: [],
    payment_methods: []
  });
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const ordersPerPage = 20;

  const debounceGet = useDebounce(async () => {
    try {
      setLoading(true);
      const ordersRes = await getOrders({
        limit: ordersPerPage,
        offset: (currentPage - 1) * ordersPerPage,
        sortBy: sortBy,
        sortOrder: sortOrder,
        statuses: filters.statuses.length > 0 ? filters.statuses.join(',') : undefined,
        orderDate: filters.order_date.length === 2 ? JSON.stringify(filters.order_date) : undefined,
        amountFloor: filters.amount_floor,
        amountCeiling: filters.amount_ceiling,
        deliveryMethods: filters.delivery_methods.length > 0 ? filters.delivery_methods.join(',') : undefined,
        paymentMethods: filters.payment_methods.length > 0 ? filters.payment_methods.join(',') : undefined,
        searchQuery: searchQuery
      });
      console.log(ordersRes)
      setOrders(ordersRes.data.orders || []);
      setTotalOrdersCount(ordersRes.data.total || 0);
    } catch (err) {
      console.error('Error fetching orders:', err);
      setError('Ошибка при загрузке заказов');
    } finally {
      setLoading(false);
    }
  }, 300);

  useEffect(() => {
    debounceGet();
  }, [currentPage, sortBy, sortOrder, filters, searchQuery]); // searchQuery добавлен в зависимости

  const handleSearch = () => {
    setCurrentPage(1);
    debounceGet();
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFilters({
      statuses: [],
      order_date: [],
      amount_floor: '',
      amount_ceiling: '',
      delivery_methods: [],
      payment_methods: []
    });
    setCurrentPage(1);
    debounceGet();
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const handleStatusChange = (status: string) => {
    setFilters((prev): Filters => ({ // Явно указываем тип
      ...prev,
      statuses: prev.statuses.includes(status)
        ? prev.statuses.filter(s => s !== status)
        : [...prev.statuses, status]
    }));
    setCurrentPage(1);
  };

  const handleDateChange = (dates: [Date | null, Date | null]) => {
    if (dates && dates[0] && dates[1]) {
      const startDate = dates[0].toISOString();
      const endDate = dates[1].toISOString();

      // Проверка, что startDate меньше или равно endDate
      if (startDate <= endDate) {
        setFilters((prev): Filters => ({
          ...prev,
          order_date: [startDate, endDate]
        }));
      } else {
        // Если startDate > endDate, очищаем фильтр и, возможно, выводим сообщение об ошибке
        console.warn("Start date is after end date. Clearing date filter.");
        setFilters((prev): Filters => ({ ...prev, order_date: [] }));
      }
    } else {
      setFilters((prev): Filters => ({ ...prev, order_date: [] }));
    }
    setCurrentPage(1);
  };

  const handleAmountFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
        ...prev,
        amount_floor: e.target.value
    }));
    setCurrentPage(1);
  };

  const handleAmountCeilingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      setFilters(prev => ({
          ...prev,
          amount_ceiling: e.target.value
      }));
    setCurrentPage(1);
  };

  const handleDeliveryMethodsChange = (method: string) => {
      setFilters((prev): Filters => ({ // Явно указываем тип
          ...prev,
          delivery_methods: prev.delivery_methods.includes(method)
              ? prev.delivery_methods.filter(m => m !== method)
              : [...prev.delivery_methods, method]
      }));
      setCurrentPage(1);
  };

  const handlePaymentMethodsChange = (method: string) => {
      setFilters((prev): Filters => ({ // Явно указываем тип
          ...prev,
          payment_methods: prev.payment_methods.includes(method)
              ? prev.payment_methods.filter(m => m !== method)
              : [...prev.payment_methods, method]
      }));
      setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setFilters(prev => ({ ...prev, order_date: [] }));
    setCurrentPage(1);
  };

    const isFilterActive =
        filters.statuses.length > 0 ||
        filters.order_date.length > 0 ||
        filters.amount_floor !== '' ||
        filters.amount_ceiling !== '' ||
        filters.delivery_methods.length > 0 ||
        filters.payment_methods.length > 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление заказами</h1>
        <div className="flex space-x-3 items-center">
          <div className="flex items-center gap-2">
            <button
              className="btn btn-secondary"
              onClick={handleResetSearch}
              title="Сбросить поиск"
              disabled={
                !searchQuery && !isFilterActive
              }
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
                placeholder="Поиск по ID заказа"
                className="w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <button onClick={handleSearch} className="btn btn-secondary">
              Найти
            </button>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 btn btn-secondary"
            >
              <Filter size={18} />
              Фильтры
            </button>
          </div>
        </div>
      </div>

      {showFilters && (
        <div className="bg-white rounded-lg shadow overflow-hidden mb-4 p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Status Filters */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Статус:</label>
              <div className="flex flex-wrap gap-2">
                {["Новый", "В обработке", "В доставке", "Выполнен", "Отменен"].map(status => (
                  <button
                    key={status}
                    onClick={() => handleStatusChange(status)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${filters.statuses.includes(status)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Дата заказа:</label>
              <div className="flex items-center">
                <DatePicker
                  selectsRange
                  startDate={filters.order_date[0] ? new Date(filters.order_date[0]) : null}
                  endDate={filters.order_date[1] ? new Date(filters.order_date[1]) : null}
                  onChange={handleDateChange}
                  className="w-full rounded-md shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                  dateFormat="dd.MM.yyyy"
                  placeholderText="Выберите период"
                />
                {filters.order_date.length > 0 && (
                  <button
                    onClick={clearDateFilter}
                    className="ml-2 p-1 rounded-full hover:bg-gray-200"
                    title="Очистить дату"
                  >
                    <X size={16} />
                  </button>
                )}
              </div>
            </div>

            {/* Amount Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Сумма заказа:</label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={filters.amount_floor}
                  onChange={handleAmountFloorChange}
                  placeholder="От"
                  className="w-1/2 rounded-md shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
                <input
                  type="number"
                  value={filters.amount_ceiling}
                  onChange={handleAmountCeilingChange}
                  placeholder="До"
                  className="w-1/2 rounded-md shadow-sm border-gray-300 focus:border-primary-500 focus:ring-primary-500 sm:text-sm"
                />
              </div>
            </div>

            {/* Delivery Methods Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Способы доставки:</label>
              <div className="flex flex-wrap gap-2">
                {["Самовывоз", "Доставка"].map(method => (
                  <button
                    key={method}
                    onClick={() => handleDeliveryMethodsChange(method)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${filters.delivery_methods.includes(method)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Methods Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Способы оплаты:</label>
              <div className="flex flex-wrap gap-2">
                {["Оплата при получении", "Онлайн"].map(method => (
                  <button
                    key={method}
                    onClick={() => handlePaymentMethodsChange(method)}
                    className={`px-3 py-1 rounded-full text-sm font-medium ${filters.payment_methods.includes(method)
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    {method}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    ID заказа
                    <button onClick={() => handleSort('order_id')} className="ml-2">
                      {sortBy === 'order_id' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        )
                      ) : (
                        <ArrowUp size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Клиент
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    Дата заказа
                    <button onClick={() => handleSort('order_date')} className="ml-2">
                      {sortBy === 'order_date' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        )
                      ) : (
                        <ArrowUp size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    Статус
                    <button onClick={() => handleSort('status')} className="ml-2">
                      {sortBy === 'status' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        )
                      ) : (
                        <ArrowUp size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  <div className="flex items-center">
                    Сумма заказа
                    <button onClick={() => handleSort('total_amount')} className="ml-2">
                      {sortBy === 'total_amount' ? (
                        sortOrder === 'asc' ? (
                          <ArrowUp size={16} />
                        ) : (
                          <ArrowDown size={16} />
                        )
                      ) : (
                        <ArrowUp size={16} className="text-gray-400" />
                      )}
                    </button>
                  </div>
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Метод доставки
                </th>
                <th
                  scope="col"
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  Метод оплаты
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.length > 0 ? (
                orders.map((order) => (
                  <OrderRow key={order.order_id} order={order} />
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                    Заказы не найдены
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={Math.ceil(totalOrdersCount / ordersPerPage)}
        onPageChange={setCurrentPage}
        hasMore={currentPage < Math.ceil(totalOrdersCount / ordersPerPage)}
      />

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={() => { }} // Replace with actual delete logic
        title="Удаление заказа"
        message={`Вы действительно хотите удалить заказ #${selectedOrder?.order_id}?`}
        confirmText="Удалить"
        cancelText="Отмена"
        isDanger
      />
    </div>
  );
};

// src/pages/OrdersPage.tsx
const OrderRow = ({ order }: { order: Order }) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <Link to={`/orders/${order.order_id}`} className="text-primary-600 hover:text-primary-900">
          {order.public_order_id}
        </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
           <Link
                to={`/client/${order.client_id}/orders`}
                className="text-primary-600 hover:text-primary-900"
            >
              {order.client.first_name} {order.client.last_name}
            </Link>
        </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {new Date(order.order_date).toLocaleDateString()}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.status}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {parseFloat(order.total_amount).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.delivery_method}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {order.payment_method}
      </td>
    </tr>
  );
};

export default OrdersPage;