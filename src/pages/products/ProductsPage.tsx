import { useState, useEffect, Fragment, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useOffice } from '../../contexts/OfficeContext';
import { useCategories } from '../../contexts/CategoryContext';
import { getProducts } from '../../api';
import { Product } from '../../types';
import { Edit, Trash2, ChevronDown, ChevronRight, List, Layers, Filter, RefreshCw, Search, ArrowUp, ArrowDown } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import Pagination from '../../components/Pagination';
import ProductFiltersModal from '../../components/ProductFiltersModal';
import { ProductFilters } from '../../components/ProductFiltersModal';
import useDebounce from '../../hooks/useDebounce';

const ProductsPage = () => {
  const { user } = useAuth();
  const { currentOffice } = useOffice();
  const { categories, getCategoryName } = useCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [totalProductsCount, setTotalProductsCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Record<number, boolean>>({});
  const [showHierarchicalView, setShowHierarchicalView] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFiltersModal, setShowFiltersModal] = useState(false);
  const [filters, setFilters] = useState<ProductFilters>({});
  const [sortBy, setSortBy] = useState<string | undefined>(undefined);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const productsPerPage = 20;
  const searchInputRef = useRef<HTMLInputElement>(null);
  const [lastSelection, setLastSelection] = useState<{start: number, end: number} | null>(null);

  const applyFilters = (newFilters: Partial<ProductFilters>) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }));
    setCurrentPage(1);
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
    if (!currentOffice) return;
      try {
        setLoading(true);
        let response;
        if (searchQuery || Object.keys(filters).length > 0) {
          // For search or category filter
          response = await getProducts({
            searchQuery,
            officeId: currentOffice.office_id,
            categoryId: filters.category_id,
            offset: (currentPage - 1) * productsPerPage,
            limit: productsPerPage,
            sortBy,
            sortOrder
          });
          setProducts(response.data.products || []);
          setTotalProductsCount(response.data.total || 0);
          setShowHierarchicalView(false);
        } else if (showHierarchicalView) {
          response = await getProducts({
            officeId: currentOffice.office_id,
            categoryId: filters.category_id,
            unlimited: true,
            sortBy,
            sortOrder
          });
          setProducts(response.data.products || []);
          setTotalProductsCount(response.data.products?.length || 0);
        } else {
          // For flat view with pagination
          response = await getProducts({
            officeId: currentOffice.office_id,
            categoryId: filters.category_id,
            offset: (currentPage - 1) * productsPerPage,
            limit: productsPerPage,
            sortBy,
            sortOrder
          });
          setProducts(response.data.products || []);
          setTotalProductsCount(response.data.total || 0);
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('Ошибка при загрузке товаров');
      } finally {
        setLoading(false);
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
  }, [loading, products]);

  useEffect(() => {
    preserveSelection();
    debounceGet();
  }, [currentOffice, showHierarchicalView, currentPage, searchQuery, filters, sortBy, sortOrder]);

  const countProductsInCategory = (category: any): number => {
    let count = products.filter(p => p.category_id === category.category_id).length;

    if (category.children) {
      count += category.children.reduce(
        (sum: number, child: any) => sum + countProductsInCategory(child),
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
      const directProducts = products.filter(p => p.category_id === category.category_id);
      const totalProductsInCategory = countProductsInCategory(category);

      return (
        <Fragment key={`category-fragment-${category.category_id}`}>
          <tr
            key={`category-${category.category_id}`}
            className="bg-gray-50 hover:bg-gray-100 cursor-pointer"
            onClick={() => toggleCategory(category.category_id)}
          >
            <td colSpan={5} className="px-6 py-3">
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
                  ({totalProductsInCategory})
                </span>
              </div>
            </td>
          </tr>

          {isExpanded && directProducts.map(product => (
            <ProductRow
              key={`product-${product.product_id}-${category.category_id}`}
              product={product}
              onDeleteClick={handleDeleteClick}
              getCategoryName={getCategoryName}
            />
          ))}

          {isExpanded && category.children?.length > 0 && (
            renderCategoryTree(category.children, level + 1)
          )}
        </Fragment>
      );
    });
  };

  const handleDeleteClick = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    // TODO: Implement product deletion
    setDeleteModalOpen(false);
    setSelectedProduct(null);
  };

  const toggleViewMode = () => {
    setShowHierarchicalView(!showHierarchicalView);
    setCurrentPage(1);
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

  const handleCategorySelect = (categoryId: number) => {
    applyFilters({ category_id: categoryId });
  };

  const handleSort = (column: string) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  if (loading && !products.length) {
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
        <h1 className="text-2xl font-bold">Товары</h1>
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
                onChange={(e) => setSearchQuery(e.target.value)}
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
            onClick={toggleViewMode}
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
            <Link to="/products/" className="btn btn-primary">
              Добавить товар
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden mb-4">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
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
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Описание
                    <button onClick={() => handleSort('description')} className="ml-2">
                      {sortBy === 'description' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
                    </button>
                  </div>
                </th>
                <th className="w-48 px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <div className="flex items-center">
                    Категория
                    <button onClick={() => handleSort('category_id')} className="ml-2">
                      {sortBy === 'category_id' ? (sortOrder === 'asc' ? <ArrowUp size={16} /> : <ArrowDown size={16} />) : <ArrowUp size={16} className="text-gray-400" />}
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
                products.length > 0 ? (
                  products.map(product => (
                    <ProductRow
                      key={product.product_id}
                      product={product}
                      onDeleteClick={handleDeleteClick}
                      getCategoryName={getCategoryName}
                    />
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                      Товары не найдены
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
          totalPages={Math.ceil(totalProductsCount / productsPerPage)}
          onPageChange={setCurrentPage}
          hasMore={currentPage < Math.ceil(totalProductsCount / productsPerPage)}
        />
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteConfirm}
        title="Удаление товара"
        message={`Вы действительно хотите удалить товар "${selectedProduct?.name}"? Будут удалены соответствующие записи из цен и складов!`}
        confirmText="Удалить"
        cancelText="Отмена"
        isDanger
      />

      <ProductFiltersModal
        isOpen={showFiltersModal}
        onClose={() => setShowFiltersModal(false)}
        onApply={(newFilters) => setFilters(newFilters)}
        categories={categories}
        initialFilters={filters}
        filterType="category" // Change this to "categoryPrice" or "categoryStock" as needed
      />
    </div>
  );
};

const ProductRow = ({ product, onDeleteClick, getCategoryName }: {
  product: Product;
  onDeleteClick: (product: Product) => void;
  getCategoryName: (id: number) => string;
}) => {
  const {user} = useAuth();
  return (
  <tr className="hover:bg-gray-50">
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <Link
        to={`/products/${product.product_id}`}
        className="text-primary-600 hover:text-primary-900"
      >
        {product.article}
      </Link>
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      <Link
        to={`/products/${product.product_id}`}
        className="text-primary-600 hover:text-primary-900"
      >
        {product.name}
      </Link>
    </td>
    <td className="px-6 py-4 text-sm text-gray-900">
      {product.description || '-'}
    </td>
    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
      {getCategoryName(product.category_id) || 'Неизвестная категория'}
    </td>
    {(user?.role.admin || user?.role.moderator) && (
      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
        <div className="flex justify-end space-x-2">
          <Link
            to={`/products/${product.product_id}`}
            className="text-primary-600 hover:text-primary-900"
            title="Редактировать"
          >
             <Edit size={22} />
          </Link>
          <button
            onClick={() => onDeleteClick(product)}
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

export default ProductsPage;