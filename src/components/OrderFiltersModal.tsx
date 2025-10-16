import { useState } from 'react';
import { Filter } from 'lucide-react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface OrderFilters {
    statuses: string[];
    dateRange: [Date | null, Date | null];
    priceFloor: number | null;
    priceCeiling: number | null;
    deliveryMethods: string[];
    paymentMethods: string[];
}

interface OrderFiltersModalProps {
    isOpen: boolean;
    onClose: () => void;
    onApply: (filters: OrderFilters) => void;
    initialFilters: OrderFilters;
}

const OrderFiltersModal: React.FC<OrderFiltersModalProps> = ({ isOpen, onClose, onApply, initialFilters }) => {
    const [filters, setFilters] = useState<OrderFilters>(initialFilters);

    const handleStatusChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedStatuses = Array.from(e.target.selectedOptions, option => option.value);
        setFilters(prev => ({ ...prev, statuses: selectedStatuses }));
    };

    const handleDateChange = (dates: [Date | null, Date | null]) => {
        setFilters(prev => ({ ...prev, dateRange: dates }));
    };

    const handlePriceFloorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? null : parseFloat(e.target.value);
        setFilters(prev => ({ ...prev, priceFloor: value }));
    };

    const handlePriceCeilingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = e.target.value === '' ? null : parseFloat(e.target.value);
        setFilters(prev => ({ ...prev, priceCeiling: value }));
    };

    const handleDeliveryMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedDeliveryMethods = Array.from(e.target.selectedOptions, option => option.value);
        setFilters(prev => ({ ...prev, deliveryMethods: selectedDeliveryMethods }));
    };

    const handlePaymentMethodChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedPaymentMethods = Array.from(e.target.selectedOptions, option => option.value);
        setFilters(prev => ({ ...prev, paymentMethods: selectedPaymentMethods }));
    };

    const handleApply = () => {
        onApply(filters);
        onClose();
    };

    const handleClose = () => {
        onClose();
    };

    return (
        <>
            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl">
                        <div className="p-6">
                            <h2 className="text-xl font-bold mb-4">Фильтры заказов</h2>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Статус:
                                    </label>
                                    <select
                                        multiple
                                        value={filters.statuses}
                                        onChange={handleStatusChange}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="Новый">Новый</option>
                                        <option value="В обработке">В обработке</option>
                                        <option value="В доставке">В доставке</option>
                                        <option value="Выполнен">Выполнен</option>
                                        <option value="Отменен">Отменен</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Диапазон дат:
                                    </label>
                                    <DatePicker
                                        selectsRange
                                        startDate={filters.dateRange[0]}
                                        endDate={filters.dateRange[1]}
                                        onChange={handleDateChange}
                                        className="w-full border rounded-lg p-2"
                                        dateFormat="dd.MM.yyyy"
                                        placeholderText="Выберите диапазон"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Мин. Цена:
                                    </label>
                                    <input
                                        type="number"
                                        value={filters.priceFloor === null ? '' : filters.priceFloor.toString()}
                                        onChange={handlePriceFloorChange}
                                        placeholder="Мин. Цена"
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Макс. Цена:
                                    </label>
                                    <input
                                        type="number"
                                        value={filters.priceCeiling === null ? '' : filters.priceCeiling.toString()}
                                        onChange={handlePriceCeilingChange}
                                        placeholder="Макс. Цена"
                                        className="w-full border rounded-lg p-2"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Способ доставки:
                                    </label>
                                    <select
                                        multiple
                                        value={filters.deliveryMethods}
                                        onChange={handleDeliveryMethodChange}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="Самовывоз">Самовывоз</option>
                                        <option value="Доставка">Доставка</option>
                                    </select>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Способ оплаты:
                                    </label>
                                    <select
                                        multiple
                                        value={filters.paymentMethods}
                                        onChange={handlePaymentMethodChange}
                                        className="w-full border rounded-lg p-2"
                                    >
                                        <option value="Оплата при получении">Оплата при получении</option>
                                        <option value="Онлайн">Онлайн</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 mt-6">
                                <button
                                    onClick={handleClose}
                                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    Отмена
                                </button>
                                <button
                                    onClick={handleApply}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                >
                                    Применить
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

export default OrderFiltersModal;