// src/pages/ClientsPage.tsx
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getUsers } from '../api';
import { ArrowUp, ArrowDown, Search } from 'lucide-react'; // Импортируем иконки
import useDebounce from '../hooks/useDebounce';
import { Client } from '../types';


const ClientsPage = () => {
    const [clients, setClients] = useState<Client[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [sortBy, setSortBy] = useState<string | undefined>(undefined);
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');

    const debounceSearch = useDebounce(async () => {
        try {
            setLoading(true);
            setError(null);
            const usersData = await getUsers({
                searchQuery,
                sortBy,
                sortOrder
            }); //  Передаем параметры поиска
            
            setClients(usersData.data);
        } catch (err: any) {
            console.error('Error fetching users:', err);
            setError(err.response?.data?.message || 'Ошибка при загрузке пользователей');
        } finally {
            setLoading(false);
        }
    }, 300);

    useEffect(() => {
        debounceSearch();
    }, [searchQuery, sortBy, sortOrder]); //  Добавляем зависимости

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchQuery(e.target.value);
    };

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(column);
            setSortOrder('asc');
        }
    };

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold mb-4">Клиенты</h1>

            <div className="flex items-center mb-4">
                <div className="relative">
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={handleSearchChange}
                        placeholder="Поиск..."
                        className="w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                    />
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                </div>
            </div>

            {loading && (
                <div className="flex items-center justify-center h-24">
                  <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
            )}

            {error && (
                <div className="bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md mb-4">
                    {error}
                </div>
            )}

            {!loading && !error && (
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
                                            Имя
                                        </div>
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        <div className="flex items-center">
                                            Фамилия
                                            <button onClick={() => handleSort('last_name')} className="ml-2">
                                                {sortBy === 'last_name' ? (
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
                                        Email
                                    </th>
                                    <th
                                        scope="col"
                                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                                    >
                                        Телефон
                                    </th>
                                    <th scope="col" className="relative px-6 py-3">
                                        <span className="sr-only">Перейти к заказам</span>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {clients.map(user => (
                                    <tr key={user.client_id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.first_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.last_name}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.email}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {user.phone_number}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <Link
                                                to={`/client/${user.client_id}/orders`}
                                                className="text-primary-600 hover:text-primary-900"
                                            >
                                                Перейти к заказам
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ClientsPage;