import { Dialog } from '@headlessui/react';
import { useState } from 'react';
import { ChevronDown, ChevronRight, Check } from 'lucide-react';

interface Category {
  category_id: number;
  name: string;
  parent_category_id: number | null;
  children?: Category[];
}

interface PriceType {
  price_type_id: number;
  name: string;
}

interface Warehouse {
  warehouse_id: number;
  name: string;
}

interface ProductFiltersModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: ProductFilters) => void;
  categories: Category[];
  priceTypes?: PriceType[];
  warehouses?: Warehouse[];
  initialFilters: ProductFilters;
  filterType: 'category' | 'categoryPrice' | 'categoryStock';
}

export interface ProductFilters {
  category_id?: number;
  price_floor?: number;
  price_ceiling?: number;
  price_type_id?: number;
  quantity_floor?: number;
  quantity_ceiling?: number;
  quantity_ordered_floor?: number;
  quantity_ordered_ceiling?: number;
  office_id?: number;
}

export const ProductFiltersModal = ({
  isOpen,
  onClose,
  onApply,
  categories,
  priceTypes,
  warehouses,
  initialFilters,
  filterType,
}: ProductFiltersModalProps) => {
  const [filters, setFilters] = useState<ProductFilters>(initialFilters);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

  const toggleCategory = (categoryId: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleApply = () => {
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    setFilters({});
  };

  const handleFilterChange = (key: keyof ProductFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const renderCategory = (category: Category, level = 0) => {
    const hasChildren = category.children && category.children.length > 0;
    const isExpanded = expandedCategories[category.category_id] || false;
    const isSelected = filters.category_id === category.category_id;

    return (
      <div key={category.category_id} className="mb-1">
        <div
          className={`flex items-center py-1 px-2 rounded-md hover:bg-gray-100 cursor-pointer ${
            isSelected ? 'bg-blue-50' : ''
          }`}
          style={{ paddingLeft: `${level * 12}px` }}
        >
          {hasChildren ? (
            <button
              onClick={() => toggleCategory(category.category_id)}
              className="mr-2 text-gray-500 hover:text-gray-700"
            >
              {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
            </button>
          ) : (
            <span className="w-6"></span>
          )}

          <label className="flex items-center flex-1 cursor-pointer">
            <input
              type="radio"
              name="category"
              checked={isSelected}
              onChange={() => handleFilterChange('category_id', category.category_id)}
              className="hidden"
            />
            <span className={`flex-1 ${isSelected ? 'font-medium text-blue-600' : ''}`}>
              {category.name}
            </span>
            {isSelected && <Check size={16} className="text-blue-500 ml-2" />}
          </label>
        </div>

        {hasChildren && isExpanded && (
          <div className="ml-6">
            {category.children?.map(child => renderCategory(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="w-full max-w-md rounded-xl bg-white p-6 shadow-lg">
          <Dialog.Title className="text-lg font-bold mb-4">Фильтры товаров</Dialog.Title>

          <div className="mb-6">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-medium">Категории</h3>
              <button
                onClick={handleReset}
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                Сбросить
              </button>
            </div>

            <div className="max-h-64 overflow-y-auto border rounded-lg p-2">
              {categories.map(category => renderCategory(category))}
            </div>
          </div>

          {filterType === 'categoryPrice' && (
            <>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Цена</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={filters.price_floor || ''}
                    onChange={e => handleFilterChange('price_floor', Number(e.target.value))}
                    className="flex-1 border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={filters.price_ceiling || ''}
                    onChange={e => handleFilterChange('price_ceiling', Number(e.target.value))}
                    className="flex-1 border rounded-lg p-2"
                  />
                </div>
              </div>

              <div className="mb-6">
                <h3 className="font-medium mb-2">Тип цены</h3>
                <select
                  value={filters.price_type_id || ''}
                  onChange={e => handleFilterChange('price_type_id', Number(e.target.value))}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Выберите тип цены</option>
                  {priceTypes?.map(priceType => (
                    <option key={priceType.price_type_id} value={priceType.price_type_id}>
                      {priceType.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          {filterType === 'categoryStock' && (
            <>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Остаток</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={filters.quantity_floor || ''}
                    onChange={e => handleFilterChange('quantity_floor', Number(e.target.value))}
                    className="flex-1 border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={filters.quantity_ceiling || ''}
                    onChange={e => handleFilterChange('quantity_ceiling', Number(e.target.value))}
                    className="flex-1 border rounded-lg p-2"
                  />
                </div>
              </div>
            <div className="mb-6">
                <h3 className="font-medium mb-2">Заказано</h3>
                <div className="flex space-x-2">
                  <input
                    type="number"
                    placeholder="От"
                    value={filters.quantity_floor || ''}
                    onChange={e => handleFilterChange('quantity_floor', Number(e.target.value))}
                    className="flex-1 border rounded-lg p-2"
                  />
                  <input
                    type="number"
                    placeholder="До"
                    value={filters.quantity_ceiling || ''}
                    onChange={e => handleFilterChange('quantity_ceiling', Number(e.target.value))}
                    className="flex-1 border rounded-lg p-2"
                  />
                </div>
              </div>
              <div className="mb-6">
                <h3 className="font-medium mb-2">Склад</h3>
                <select
                  value={filters.office_id || ''}
                  onChange={e => handleFilterChange('office_id', Number(e.target.value))}
                  className="w-full border rounded-lg p-2"
                >
                  <option value="">Выберите склад</option>
                  {warehouses?.map(warehouse => (
                    <option key={warehouse.warehouse_id} value={warehouse.warehouse_id}>
                      {warehouse.name}
                    </option>
                  ))}
                </select>
              </div>
            </>
          )}

          <div className="flex justify-end space-x-3">
            <button
              onClick={onClose}
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
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default ProductFiltersModal;