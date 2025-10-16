import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProduct, updateProduct, deleteProduct, uploadImageByArticle, getImages } from '../../api';
import { ProductFullInfo } from '../../types';
import { Save, Trash2, Upload } from 'lucide-react';
import ConfirmationModal from '../../components/ConfirmationModal';
import { useCategories } from '../../contexts/CategoryContext';
import { IMAGES_BASE_URL } from '../../api';

const ProductDetailsPage = () => {;
  const { id } = useParams();
  const navigate = useNavigate();
  const { getCategoryName } = useCategories();
  const [product, setProduct] = useState<ProductFullInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [uploadType, setUploadType] = useState<'article' | 'category'>('article');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    article: ''
  });

  useEffect(() => {
    if (id) {
      fetchProduct(parseInt(id));
    }
  }, [id]);

  const fetchProduct = async (productId: number) => {
    try {
      setLoading(true);
      const officeId = Number(localStorage.getItem('office_id'));
      if (!officeId) {
        throw new Error('Не выбран офис');
      }
      
      const response = await getProduct(productId, { officeId });
      const productData = response.data;
      setProduct(productData);
      setFormData({
        name: productData.name,
        description: productData.description || '',
        article: productData.article
      });
    } catch (err) {
      console.error('Error fetching product:', err);
      setError(err instanceof Error ? err.message : 'Ошибка при загрузке данных товара');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (product) {
      loadProductImage(product.product_id);
    }
  }, [product]);
  
  const loadProductImage = async (productId: number) => {
  try {
    const response = await getImages([productId]);
    if (response?.data) {
      const imagePaths = response.data;

      const imagePath = Object.keys(imagePaths)[0];

      if (imagePath) {
        setImageUrl(IMAGES_BASE_URL + imagePath);
      } else {
        setImageUrl(null);
      }
    } else {
      setImageUrl(null);
    }
  } catch (err) {
    console.error('Error loading product image:', err);
    setImageUrl(null);
  }
};

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!product) return;

    try {
      await updateProduct(product.product_id, formData);
      setProduct(prev => prev ? { ...prev, ...formData } : null);
      setError(null);
      setSuccess('Данные товара успешно обновлены');
    } catch (err) {
      console.error('Error updating product:', err);
      setError('Ошибка при обновлении товара');
    }
  };

  const handleDelete = async () => {
    if (!product) return;

    try {
      await deleteProduct(product.product_id);
      navigate('/products');
    } catch (err) {
      console.error('Error deleting product:', err);
      setError('Ошибка при удалении товара');
    }
  };

  const handleImageUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageFile || !product) return;
  
    try {
      const identifier = uploadType === 'article' ? product.article : product.category_id.toString();
      await uploadImageByArticle(identifier, uploadType, imageFile);
      setSuccess('Изображение успешно загружено');
      setImageModalOpen(false);
      setImageFile(null);
      // Перезагружаем изображение
      await loadProductImage(product.product_id);
    } catch (err) {
      console.error('Error uploading image:', err);
      setError('Ошибка при загрузке изображения');
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

  if (!product) {
    return (
      <div className="p-6">
        <div className="bg-warning-50 border border-warning-500 text-warning-700 px-4 py-3 rounded-md">
          Товар не найден
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {success && (
        <div className="mb-4 bg-success-50 border border-success-500 text-success-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Информация о товаре</h1>
        <button
          onClick={() => setDeleteModalOpen(true)}
          className="btn btn-danger flex items-center"
        >
          <Trash2 size={18} className="mr-2" />
          Удалить товар
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Основная информация */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Артикул
                </label>
                <input
                  type="text"
                  name="article"
                  value={formData.article}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Наименование
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Описание
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={4}
                  className="input"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Категория
                </label>
                <p className="text-gray-900">
                  {getCategoryName(product.category_id)}
                </p>
              </div>

              <button type="submit" className="btn btn-primary flex items-center">
                <Save size={18} className="mr-2" />
                Сохранить изменения
              </button>
            </div>
          </form>
        </div>

        {/* Изображение товара */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold mb-4">Изображение товара</h2>
          <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center mb-4">
            {imageUrl ? (
              <img
                src={imageUrl}
                alt={product.name}
                className="max-h-full max-w-full object-contain"
                onError={() => setImageUrl(null)} // Обработка ошибок загрузки
              />
            ) : (
              <div className="text-gray-400">Изображение отсутствует</div>
            )}
          </div>
          <button
            onClick={() => setImageModalOpen(true)}
            className="btn btn-secondary w-full flex items-center justify-center"
          >
            <Upload size={18} className="mr-2" />
            Добавить изображение
          </button>
        </div>
      </div>

      {/* Модальное окно загрузки изображения */}
      {imageModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Загрузка изображения</h3>
            <form onSubmit={handleImageUpload}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Тип привязки
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="article"
                        checked={uploadType === 'article'}
                        onChange={(e) => setUploadType(e.target.value as 'article' | 'category')}
                        className="mr-2"
                      />
                      Артикул
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        value="category"
                        checked={uploadType === 'category'}
                        onChange={(e) => setUploadType(e.target.value as 'article' | 'category')}
                        className="mr-2"
                      />
                      Категория
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Изображение
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                    className="block w-full text-sm text-gray-500
                      file:mr-4 file:py-2 file:px-4
                      file:rounded-md file:border-0
                      file:text-sm file:font-semibold
                      file:bg-primary-50 file:text-primary-700
                      hover:file:bg-primary-100"
                  />
                </div>

                <p className="text-sm text-gray-500 italic">
                  *Загруженный файл будет переименован в соответствии с выбранными артикулом/категорией
                </p>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setImageModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button
                  type="submit"
                  className="btn btn-primary"
                  disabled={!imageFile}
                >
                  Загрузить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDelete}
        title="Удаление товара"
        message={`Вы действительно хотите удалить товар "${product.name}"?`}
        confirmText="Удалить"
        cancelText="Отмена"
        isDanger
      />
    </div>
  );
};

export default ProductDetailsPage;