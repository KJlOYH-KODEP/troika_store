import { useState, useEffect, Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOffice } from '../../contexts/OfficeContext';
import { useCategories } from '../../contexts/CategoryContext';
import { getWarehouses, getProducts, createWarehouse, updateWarehouse, deleteWarehouse } from '../../api';
import {
  ChevronDown,
  ChevronRight,
  List,
  Layers,
  Filter,
  RefreshCw,
  Search,
  ArrowUp,
  ArrowDown,
  Trash2,
  Edit,
} from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Pagination from '../../components/Pagination';
import ProductFiltersModal, { ProductFilters } from '../../components/ProductFiltersModal';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import useDebounce from '../../hooks/useDebounce';

interface Warehouse {
  inventory_id: number;
  quantity: number;
  product_id: number;
  office_id: number;
  ordered_quantity: number;
  product_dates_id: number;
  product: {
    article: string;
    name: string;
    category_id: number;
  };
  product_dates: {
    data_s: string;
    data_e: string;
  };
}

const WarehousesPage = () => {
  const { user } = useAuth();
  const { currentOffice } = useOffice();
  const { categories } = useCategories();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [totalWarehousesCount, setTotalWarehousesCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [showHierarchicalView, setShowHierarchicalView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const warehousesPerPage = 20;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastSelection, setLastSelection] = useState<{start: number, end: number} | null>(null);
  const [isProductSearchOpen, setIsProductSearchOpen] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});

  const applyFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1);
    setShowHierarchicalView(false);
  };

  const preserveSelection = () => {
    if (searchInputRef.current) {
      setLastSelection({
        start: searchInputRef.current.selectionStart || 0,
        end: searchInputRef.current.selectionEnd || 0
      });
    }
  };

  const debounceGet = useDebounce(async () => {
    try {
        setLoading(true);
        let warehousesRes;
        if (!showHierarchicalView) {
          warehousesRes = await getWarehouses({
            searchQuery,
            categoryId: filters.category_id,
            quantityFloor: filters.quantity_floor,
            quantityCeiling: filters.quantity_ceiling,
            quantityOrderedFloor: filters.quantity_ordered_floor,
            quantityOrderedCeiling: filters.quantity_ordered_ceiling,
            officeId: currentOffice?.office_id,
            offset: (currentPage-1)*warehousesPerPage,
            limit: warehousesPerPage,
            sortBy,
            sortOrder
          });
        } else {
          warehousesRes = await getWarehouses({
            searchQuery,
            categoryId: filters.category_id,
            quantityFloor: filters.quantity_floor,
            quantityCeiling: filters.quantity_ceiling,
            quantityOrderedFloor: filters.quantity_ordered_floor,
            quantityOrderedCeiling: filters.quantity_ordered_ceiling,
            officeId: currentOffice?.office_id,
            sortBy,
            sortOrder,
            unlimited: true
          });
        } 
        if (warehousesRes.data.total < currentPage*20) {
          setCurrentPage(1);
        }
        setWarehouses(warehousesRes.data.inventories || []);
        setTotalWarehousesCount(warehousesRes.data.total || 0);
      } catch (err) {
        console.error('Error fetching warehouses:', err);
        setError('Ошибка при загрузке складов');
      } finally {
        setLoading(false);
      }
  }, 300);

   const debouncedSearch = useDebounce(async (query: string) => {
    if (!query.trim()) return;

    try {
      const response = await getProducts({
        limit: 5,
        searchQuery: query
      });
      setProducts(response.data.products);
    } catch (err) {
      console.error('Search error:', err);
    }
  }, 300);

  useEffect(() => {
    if (lastSelection && searchInputRef.current) {
      searchInputRef.current.focus();
      searchInputRef.current.setSelectionRange(
        lastSelection.start,
        lastSelection.end
      );
      setLastSelection(null);
    }
  }, [loading, warehouses]);

  useEffect(() => {
    preserveSelection();
    debounceGet();
  }, [currentOffice, currentPage, searchQuery, filters, sortBy, sortOrder, showHierarchicalView]);


  const handleDeleteClick = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDeleteModalOpen(true);
  };

  const handleEditClick = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setEditModalOpen(true);
  };

  const handleAddClick = () => {
    setSelectedWarehouse({
      inventory_id: 0,
      quantity: 0,
      product_id: 0,
      office_id: currentOffice?.office_id || 0,
      ordered_quantity: 0,
      product_dates_id: 0,
      product: { article: '', name: '', category_id: 0},
      product_dates: { data_s: new Date().toISOString(), data_e: new Date().toISOString() }
    });
    setEditModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!selectedWarehouse) return;

    try {
      await deleteWarehouse(selectedWarehouse.inventory_id);
      setDeleteModalOpen(false);
      // Обновляем данные
      const res = await getWarehouses({
        limit: warehousesPerPage,
        ...filters
      });
      setWarehouses(res.data.warehouses || []);
      setTotalWarehousesCount(res.data.total || 0);
    } catch (err) {
      console.error('Error deleting warehouse:', err);
      setError('Ошибка при удалении записи');
    }
  };

  const handleSaveWarehouse = async () => {
    if (!selectedWarehouse) return;

    try {
      if (selectedWarehouse.inventory_id) {
        await updateWarehouse(selectedWarehouse.inventory_id, {
          product_id: selectedWarehouse.product_id,
          office_id: selectedWarehouse.office_id,
          quantity: selectedWarehouse.quantity,
          data_s: selectedWarehouse.product_dates.data_s,
          data_e: selectedWarehouse.product_dates.data_e
        });
      } else {
        await createWarehouse({
          product_id: selectedWarehouse.product_id,
          quantity: selectedWarehouse.quantity,
          office_id: selectedWarehouse.office_id,
          data_s: selectedWarehouse.product_dates.data_s,
          data_e: selectedWarehouse.product_dates.data_e
        });
      }
      setEditModalOpen(false);
      // Обновляем данные
      const res = await getWarehouses({
        offset: 0,
        limit: warehousesPerPage,
        ...filters
      });
      setWarehouses(res.data.warehouses || []);
      setTotalWarehousesCount(res.data.total || 0);
    } catch (err) {
      console.error('Error saving warehouse:', err);
      setError('Ошибка при сохранении склада');
    }
  };

  const handleSearch = () => {
    const currentSearch = searchQuery;
    setSearchQuery(currentSearch);
    setCurrentPage(1);
  };

  const handleResetSearch = () => {
    setSearchQuery('');
    setFilters({});
    setCurrentPage(1);
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  const countWarehousesInCategory = (category: any): number => {
    let count = warehouses.filter(w => w.product.category_id === category.category_id).length;

    if (category.children) {
      count += category.children.reduce(
        (sum: number, child: any) => sum + countWarehousesInCategory(child),
        0
      );
    }

    return count;
  };

  const toggleCategory = (category_id: number) => {
    setExpandedCategories(prev => ({
      ...prev,
      [category_id]: !prev[category_id]
    }));
  };

  const renderCategoryTree = (categories: any[], level = 0) => {
    return categories.map(category => {
      const isExpanded = expandedCategories[category.category_id] ?? false;
      const directWarehouses = warehouses.filter(w => w.product.category_id === category.category_id);
      const totalWarehousesInCategory = countWarehousesInCategory(category);

      return (
        <Fragment key={`category-fragment-${category.category_id}`}>
          <tr
            key={`category-${category.category_id}`}
            className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
            onClick={() => toggleCategory(category.category_id)}
          >
            <td colSpan={7} className="px-6 py-3">
              <div className="flex items-center" style={{ paddingLeft: `${level * 20}px` }}>
                {category.children?.length ? (
                  isExpanded ? (
                    <ChevronDown size={16} className="mr-2" />
                  ) : (
                    <ChevronRight size={16} className="mr-2" />
                  )
                ) : (
                  <span className="w-6"></span>
                )}
                <span className="font-medium">{category.name}</span>
                <span className="ml-2 text-sm text-gray-500">
                  ({totalWarehousesInCategory})
                </span>
              </div>
            </td>
          </tr>

          {isExpanded && directWarehouses.map(warehouse => (
            <WarehouseRow
              key={`warehouse-${warehouse.inventory_id}-${category.category_id}`}
              warehouse={warehouse}
              onDeleteClick={handleDeleteClick}
              onEditClick={handleEditClick}
            />
          ))}

          {isExpanded && category.children?.length > 0 && (
            renderCategoryTree(category.children, level + 1)
          )}
        </Fragment>
      );
    });
  };

  if (loading && !warehouses.length) {
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
        <h1 className="text-2xl font-bold">Управление складами</h1>
        <div className="flex space-x-3 items-center">
          <div className="flex items-center gap-2">
            <button className='btn btn-secondary'
              onClick={handleResetSearch}
              title="Сбросить поиск"
              disabled={!searchQuery && !Object.keys(filters).length}
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            <div className="relative">
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  debouncedGet();
                }}
                placeholder="Название или артикул"
                className="w-64 pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    handleSearch();
                  }
                }}
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>

            <button onClick={handleSearch} className='btn btn-secondary' >
              Найти
            </button>

            <button
              onClick={() => setShowFiltersModal(true)}
              className="flex items-center gap-2 btn btn-secondary"
            >
              <Filter size={18} />
              Фильтры
            </button>
          </div>
          <button
            onClick={() => setShowHierarchicalView(!showHierarchicalView)}
            className="flex items-center btn btn-secondary"
            title={showHierarchicalView ? 'Плоский вид' : 'Иерархический вид'}
          >
            {showHierarchicalView ? (
              <>
                <List size={18} className="mr-2" />
                Плоский вид
              </>
            ) : (
              <>
                <Layers size={18} className="mr-2" />
                Иерархический вид
              </>
            )}
          </button>
          {(user?.role.admin || user?.role.moderator) && (
            <button
              onClick={handleAddClick}
              className="btn btn-primary"
            >
              Добавить запись
            </button>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Артикул
                    <button onClick={() => handleSort('article')} className="ml-2">
                      {sortBy === 'article' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Наименование
                    <button onClick={() => handleSort('name')} className="ml-2">
                      {sortBy === 'name' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Количество
                    <button onClick={() => handleSort('quantity')} className="ml-2">
                      {sortBy === 'quantity' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Заказанное количество
                    <button onClick={() => handleSort('ordered_quantity')} className="ml-2">
                      {sortBy === 'ordered_quantity' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Дата начала
                    <button onClick={() => handleSort('data_s')} className="ml-2">
                      {sortBy === 'data_s' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                <th className="w-32 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Дата окончания
                    <button onClick={() => handleSort('data_e')} className="ml-2">
                      {sortBy === 'data_e' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                {(user?.role.admin || user?.role.moderator) && (
                  <th className="w-24 px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Действия
                </th>
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {showHierarchicalView ? (
                renderCategoryTree(categories)
              ) : (
                warehouses.length > 0 ? (
                  warehouses.map(warehouse => (
                    <WarehouseRow
                      key={warehouse.inventory_id}
                      warehouse={warehouse}
                      onDeleteClick={handleDeleteClick}
                      onEditClick={handleEditClick}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="px-6 py-4 text-center text-sm text-gray-500">
                      Склады не найдены
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!showHierarchicalView && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(totalWarehousesCount / warehousesPerPage)}
          onPageChange={setCurrentPage}
          hasMore={currentPage < Math.ceil(totalWarehousesCount / warehousesPerPage)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удаление склада"
        message={`Вы действительно хотите удалить склад для товара "${selectedWarehouse?.product.name}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        isDanger
      />

      {/* Модальное окно редактирования/добавления склада */}
      {editModalOpen && selectedWarehouse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <h2 className="text-xl font-bold mb-4">
                {selectedWarehouse.inventory_id ? 'Редактировать запись' : 'Добавить новую запись'}
              </h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Товар
                  </label>
                  <div>
                    {selectedWarehouse.inventory_id ? (
                      <input
                        type="text"
                        value={selectedWarehouse.product.name || ''}
                        readOnly
                        className="w-full border rounded-lg p-2 bg-gray-100"
                      />
                      ) : (
                       <button
                        type="button"
                        onClick={() => setIsProductSearchOpen(true)}
                        className="w-full border rounded-lg p-2 text-left hover:bg-gray-50"
                      >
                        {selectedWarehouse?.product?.name || 'Выберите товар'}
                      </button>
                      )}
                    {isProductSearchOpen && (
                      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
                          <h3 className="text-lg font-bold mb-4">Поиск товара</h3>

                          <input
                            type="text"
                            placeholder="Поиск по названию или артикулу"
                            className="w-full border rounded-lg p-2 mb-4"
                            onChange={(e) => debouncedSearch(e.target.value)}
                          />
                          <div className="max-h-96 overflow-y-auto">
                            {products.map(product => (
                              <div
                                key={product.product_id}
                                onClick={() => {
                                  setSelectedWarehouse(prev => ({
                                    ...prev!,
                                    product_id: product.product_id,
                                    product: {
                                      article: product.article,
                                      name: product.name,
                                      category_id: product.category_id
                                    }
                                  }));
                                  setIsProductSearchOpen(false);
                                }}
                                className="p-2 hover:bg-blue-50 cursor-pointer"
                              >
                                {product.article} - {product.name}
                              </div>
                            ))}
                          </div>
                          <button
                            onClick={() => setIsProductSearchOpen(false)}
                            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                          >
                            Отмена
                          </button>
                        </div>
                      </div>
                    )}
                </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Количество
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={selectedWarehouse.quantity || ''}
                    onChange={(e) => setSelectedWarehouse({
                      ...selectedWarehouse,
                      quantity: e.target.value
                    })}
                    className="w-full border rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата начала
                  </label>
                  <DatePicker
                    selected={selectedWarehouse.product_dates.data_s ? new Date(selectedWarehouse.product_dates.data_s) : new Date()}
                    onChange={(date) => setSelectedWarehouse({
                      ...selectedWarehouse,
                      product_dates: {
                        ...selectedWarehouse.product_dates,
                        data_s: date?.toISOString() || selectedWarehouse.product_dates.data_s
                      }
                    })}
                    className="w-full border rounded-lg p-2"
                    dateFormat="dd.MM.yyyy"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Дата окончания
                  </label>
                  <DatePicker
                    selected={selectedWarehouse.product_dates.data_e ? new Date(selectedWarehouse.product_dates.data_e) : new Date()}
                    onChange={(date) => setSelectedWarehouse({
                      ...selectedWarehouse,
                      product_dates: {
                        ...selectedWarehouse.product_dates,
                        data_e: date?.toISOString() || selectedWarehouse.product_dates.data_e
                      }
                    })}
                    className="w-full border rounded-lg p-2"
                    dateFormat="dd.MM.yyyy"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Отмена
                </button>
                <button
                  onClick={handleSaveWarehouse}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {selectedWarehouse.inventory_id ? 'Сохранить' : 'Добавить'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <ProductFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApply={(newFilters) => {
          setCurrentPage(1);
          setFilters(newFilters)
        }}
        categories={categories}
        initialFilters={filters}
        filterType="categoryStock"
      />
    </div>
  );
};

const WarehouseRow = ({ warehouse, onDeleteClick, onEditClick }: {
  warehouse: Warehouse;
  onDeleteClick: (warehouse: Warehouse) => void;
  onEditClick: (warehouse: Warehouse) => void;
}) => {
  const {user} = useAuth();

  return (
    <tr className="hover:bg-gray-50">
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        <Link
        to={`/products/${warehouse.product_id}`}
        className="text-primary-600 hover:text-primary-900"
      >
        {warehouse.product.article}
      </Link>
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {(user?.role.admin || user?.role.moderator) ? (
          <Link
            onClick={() => onEditClick(warehouse)}
            className="text-primary-600 hover:text-primary-900"
            to={''}
          >
            {warehouse.product.name}
          </Link>
        ) : (
          <span>{warehouse.product.name}</span>
        )}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {parseFloat(warehouse.quantity).toFixed(2)}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {warehouse.ordered_quantity}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {warehouse.product_dates.data_s}
      </td>
      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
        {warehouse.product_dates.data_e}
      </td>
      {(user?.role.admin || user?.role.moderator) && (
        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <button
            onClick={() => onEditClick(warehouse)}
            className="text-primary-600 hover:text-primary-900"
            title="Редактировать"
          >
            <Edit size={22} />
          </button>
          <button
            onClick={() => onDeleteClick(warehouse)}
            className="text-danger-600 hover:text-danger-900"
            title="Удалить"
          >
            <Trash2 size={22} />
          </button>
        </div>
      </td>
      )}
    </tr>
  );
};

export default WarehousesPage;