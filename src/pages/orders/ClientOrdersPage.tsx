// src/pages/ClientOrdersPage.tsx
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getUser, getUserOrders } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { Client, Order } from '../../types'; // Импортируем типы

const ClientOrdersPage = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const [user, setUser] = useState<Client | null>(null); // Используем тип Client
    const [orders, setOrders] = useState<Order[]>([]); // Используем тип Order
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user: currentUser } = useAuth(); // Get current user
    const navigate = useNavigate();
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                if (!clientId) {
                    setError("Неверный ID клиента");
                    return;
                }

                const [userData, ordersData] = await Promise.all([
                    getUser(clientId),
                    getUserOrders(clientId, { sortBy, sortOrder })
                ]);
                
                setUser(userData.data);
                setOrders(ordersData.data.orders);
            } catch (err: any) {
                console.error('Error fetching data:', err);
                setError(err.response?.data?.message || 'Ошибка при загрузке данных');
                navigate('/orders');
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [clientId, sortBy, sortOrder, navigate]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

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

    if (!user) {
        return <p>Клиент не найден</p>;
    }

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Заказы клиента</h1>

            {/* Информация о клиенте */}
            <div className="bg-white shadow-md rounded-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-800">Информация о клиенте</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <p className="text-gray-700">
                            <span className="font-semibold">Имя:</span> {user.first_name} {user.last_name}
                        </p>
                        <p className="text-gray-700">
                            <span className="font-semibold">Email:</span> {user.email}
                        </p>
                    </div>
                    <div>
                        <p className="text-gray-700">
                            <span className="font-semibold">Телефон:</span> {user.phone_number}
                        </p>
                    </div>
                </div>
            </div>

            {/* Список заказов */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
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
                                        <button onClick={() => handleSort('status')} className="ml-2"> {/* Добавлена сортировка по статусу */}
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
                                        Сумма
                                        <button onClick={() => handleSort('total_amount')} className="ml-2"> {/* Добавлена сортировка по сумме */}
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
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.map(order => (
                                <tr key={order.order_id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        <Link
                                            to={`/orders/${order.order_id}`}
                                            className="text-primary-600 hover:text-primary-900"
                                        >
                                            {order.public_order_id}
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
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default ClientOrdersPage;