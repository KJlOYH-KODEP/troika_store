import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getOrder, updateOrderStatus } from '../../api';
import { useAuth } from '../../contexts/AuthContext';
import { Building } from 'lucide-react';
import {
    Dialog,
    Transition,
    Menu
} from '@headlessui/react'
import { Fragment } from 'react';
import { ArrowLeft, ArrowRight, CheckCircle, XCircle, RotateCw } from 'lucide-react'; // Импортируем новые иконки

const OrderDetailsPage = () => {
    const { orderId } = useParams<{ orderId: string }>();
    const [order, setOrder] = useState<OrderDetails | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const [updateStatusError, setUpdateStatusError] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError(null);
                if (!orderId) {
                    console.error("orderId is undefined");
                    setError("Не удалось загрузить детали заказа: orderId не определен");
                    return;
                }

                const orderData = await getOrder(orderId);
                setOrder(orderData.data);
            } catch (err: any) {
                console.error('Error fetching order details:', err);
                setError(err.response?.data?.message || 'Ошибка при загрузке деталей заказа');
                navigate('/orders');
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [orderId, navigate]);

    // Функция для получения следующего статуса
    const getNextStatus = (currentStatus: string): string | null => {
        switch (currentStatus) {
            case 'Новый':
                return 'В обработке';
            case 'В обработке':
                return 'В доставке';
            case 'В доставке':
                return 'Выполнен'; // Завершаем доставку
            default:
                return null; // Нет следующего статуса
        }
    };
    // Функция для получения предыдущего статуса
    const getPreviousStatus = (currentStatus: string): string | null => {
        switch (currentStatus) {
            case 'В обработке':
                return 'Новый';
            case 'В доставке':
                return 'В обработке';
            case 'Выполнен':
                return 'В доставке';
            default:
                return null; // Нет предыдущего статуса
        }
    };


    const handleStatusChange = async (newStatus: string) => {
        setUpdateStatusError(null);
        try {
            setLoading(true);
            if (!orderId) {
                throw new Error("orderId is undefined");
            }
            await updateOrderStatus(orderId, newStatus); //  Передаем только newStatus
            setOrder({ ...order!, status: newStatus });
        } catch (err: any) {
            console.error('Error updating order status:', err);
            setUpdateStatusError(err.response?.data?.message || 'Ошибка при обновлении статуса заказа');
        } finally {
            setLoading(false);
        }
    };

    const handleNextStatus = async () => {
        if (!order) return;
        const nextStatus = getNextStatus(order.status);
        if (nextStatus) {
            await handleStatusChange(nextStatus);
        }
    };

    const handlePreviousStatus = async () => {
        if (!order) return;
        const previousStatus = getPreviousStatus(order.status);
        if (previousStatus) {
            await handleStatusChange(previousStatus);
        }
    };
    const handleCancelOrder = async () => {
        if (!order) return;
        await handleStatusChange('Отменен'); // Отправляем запрос на отмену
    };
    const isFinishable = order?.status === 'В доставке';
    const isCancelable = order?.status !== 'Выполнен' && order?.status !== 'Отменен';
    const isRestorable = order?.status === 'Отменен';

    const showPreviousButton = getPreviousStatus(order?.status) !== null && order?.status !== 'Отменен';

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

    if (!order) {
        return <p>Заказ не найден</p>;
    }

    return (
        <div className="container mx-auto mt-8 p-6 bg-white shadow-md rounded-md">
            <div className="flex justify-between items-start mb-6">
                <h1 className="text-3xl font-semibold text-gray-800">Детали заказа #{order.public_order_id}</h1>
                {/* Состав заказа (таблица справа) */}
                <div className="w-2/5">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Состав заказа</h2>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead>
                                <tr>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Артикул
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Цена
                                    </th>
                                    <th className="px-6 py-3 bg-gray-50 text-left text-xs leading-4 font-medium text-gray-500 uppercase tracking-wider">
                                        Количество
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {order.order_items.map(item => (
                                    <tr key={item.order_item_id}>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-gray-900">
                                            <Link
                                                to={`/products/${item.product_price.product_id}`}
                                                className="text-primary-600 hover:text-primary-900"
                                            >
                                                {item.product_price.product.article}
                                            </Link>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-gray-900">
                                            {item.product_price.price}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm leading-5 text-gray-900">
                                            {item.quantity}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 gap-6">
                <div>
                    {/* Основная информация о заказе (левая колонка) */}
                    <div className="mb-4 text-base">
                        <p className="text-gray-700 mb-2"><b className="font-semibold">ID заказа:</b> {order.order_id}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Дата заказа:</b> {new Date(order.order_date).toLocaleDateString()}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Последнее изменение:</b> {new Date(order.last_change).toLocaleDateString()}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Статус:</b> {order.status}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Сумма заказа:</b> {order.total_amount}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Способ доставки:</b> {order.delivery_method}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Способ оплаты:</b> {order.payment_method}</p>
                        <p className="text-gray-700 mb-2"><b className="font-semibold">Комментарий:</b> {order.comment || 'Нет'}</p>
                    </div>

                    {order.shipping_address && (
                        <div>
                            <h2 className="text-xl font-semibold mb-2 text-gray-800">Адрес доставки</h2>
                            <div className="text-base">
                                <p className="text-gray-700 mb-1">{order.shipping_address.address_line1}</p>
                                <p className="text-gray-700 mb-1">{order.shipping_address.address_line2}</p>
                                <p className="text-gray-700 mb-1">{order.shipping_address.city}, {order.shipping_address.region} {order.shipping_address.postal_code}</p>
                                <p className="text-gray-700">{order.shipping_address.country}</p>
                            </div>
                        </div>
                    )}
                        {/*  Ссылка на страницу заказов клиента */}
            {order && order.client_id && (
                <div className="mt-4">
                    <Link to={`/client/${order.client_id}/orders`} className="text-primary-600 hover:text-primary-800">
                        Перейти к заказам клиента
                    </Link>
                </div>
            )}
                </div>
            </div>

            {/* Действия (смена статуса, завершение, отмена, восстановление) */}
            {(user?.role.admin || user?.role.moderator || user?.role.staff) && (
                <div className="mt-8">
                    <h2 className="text-xl font-semibold mb-2 text-gray-800">Действия</h2>
                    {updateStatusError && (
                        <div className="mb-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
                            <strong className="font-bold">Ошибка!</strong>
                            <span className="block sm:inline">{updateStatusError}</span>
                        </div>
                    )}
                    <div className="flex items-center space-x-4">

                        {/* Кнопка "Назад" */}
                        {showPreviousButton && (
                            <button
                                onClick={() => {
                                    handlePreviousStatus()
                                }}
                                className="bg-gray-200 hover:bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded inline-flex items-center"
                            >
                                <ArrowLeft size={16} className="mr-2" />
                                Назад
                            </button>
                        )}

                        {/* Кнопка "Далее" / "Завершить" / "Восстановить" */}
                        {isFinishable && ( // Если в доставке, показываем "Завершить"
                            <button
                                onClick={handleNextStatus}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 inline-flex items-center"
                            >
                                Завершить
                                <CheckCircle size={16} className="ml-2" />
                            </button>
                        )}

                        {!isFinishable && getNextStatus(order.status) && ( // Если можно перевести дальше, показываем "Далее"
                            <button
                                onClick={handleNextStatus}
                                className="bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 inline-flex items-center"
                            >
                                Далее
                                <ArrowRight size={16} className="ml-2" />
                            </button>
                        )}
                        {/* Кнопка "Восстановить" */}
                        {isRestorable && (
                            <button
                                onClick={() => handleStatusChange('Новый')}
                                className="bg-yellow-500 text-white px-4 py-2 rounded-md hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 inline-flex items-center"
                            >
                                <RotateCw size={16} className="mr-2" />
                                Восстановить
                            </button>
                        )}


                        {/* Кнопка "Отменить" */}
                        {isCancelable && (
                            <button
                                onClick={handleCancelOrder}
                                className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 inline-flex items-center"
                            >
                                Отменить
                                <XCircle size={16} className="ml-2" />
                            </button>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default OrderDetailsPage;