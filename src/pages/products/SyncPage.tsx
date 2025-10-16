import { useState } from 'react';
import { Upload, Download, Image, CheckCircle, AlertCircle } from 'lucide-react';
import { importXml, uploadImages } from '../../api';

const SyncPage = () => {
  const [xmlFiles, setXmlFiles] = useState<File[]>([]);
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showXmlModal, setShowXmlModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showImagesModal, setShowImagesModal] = useState(false);
  const [imageUploadType, setImageUploadType] = useState<'articles' | 'categories'>('articles');

  const handleXmlUpload = async () => {
    if (xmlFiles.length === 0) {
      setError('Выберите файлы для загрузки');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      // Загружаем каждый файл по очереди
      for (const file of xmlFiles) {
        await importXml(file, localStorage.getItem('office_id'));
      }
      setSuccess('XML файлы успешно загружены и обработаны');
      setXmlFiles([]);
      setShowXmlModal(false);
    } catch (err) {
      console.error('Error uploading XML:', err);
      setError('Ошибка при загрузке XML файлов');
    } finally {
      setUploading(false);
    }
  };

  const handleImagesUpload = async () => {
    if (imageFiles.length === 0) {
      setError('Выберите файлы для загрузки');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadImages(imageUploadType, imageFiles);
      setSuccess('Изображения успешно загружены');
      setImageFiles([]);
      setShowImagesModal(false);
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка при загрузке изображений');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Синхронизация данных</h1>

      {error && (
        <div className="mb-4 flex items-center bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
          <AlertCircle size={20} className="mr-2" />
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 flex items-center bg-success-50 border border-success-500 text-success-700 px-4 py-3 rounded-md">
          <CheckCircle size={20} className="mr-2" />
          {success}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Импорт XML */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Upload size={24} className="text-primary-500 mr-2" />
            <h2 className="text-lg font-semibold">Импорт XML</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Загрузите XML файлы для синхронизации данных о товарах
          </p>
          <button
            onClick={() => setShowXmlModal(true)}
            className="btn btn-primary w-full"
          >
            Загрузить XML
          </button>
        </div>

        {/* Экспорт XML */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Download size={24} className="text-primary-500 mr-2" />
            <h2 className="text-lg font-semibold">Экспорт XML</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Выгрузите данные о товарах в формате XML
          </p>
          <p></p>
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-primary w-full"
          >
            Экспортировать
          </button>
        </div>

        {/* Загрузка изображений */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center mb-4">
            <Image size={24} className="text-primary-500 mr-2" />
            <h2 className="text-lg font-semibold">Загрузка изображений</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Загрузите изображения для товаров или категорий
          </p>
          <button
            onClick={() => setShowImagesModal(true)}
            className="btn btn-primary w-full"
          >
            Загрузить изображения
          </button>
        </div>
      </div>

      {/* Модальное окно импорта XML */}
      {showXmlModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Загрузка XML файлов</h3>
            <div className="space-y-4">
              <input
                type="file"
                accept=".xml"
                multiple
                onChange={(e) => setXmlFiles(Array.from(e.target.files || []))}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-md file:border-0
                  file:text-sm file:font-semibold
                  file:bg-primary-50 file:text-primary-700
                  hover:file:bg-primary-100"
              />

              {xmlFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Выбранные файлы:
                  </h4>
                  <ul className="space-y-1">
                    {xmlFiles.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowXmlModal(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleXmlUpload}
                className="btn btn-primary"
                disabled={uploading || xmlFiles.length === 0}
              >
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно экспорта XML */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Экспорт данных</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Категория
                </label>
                <select className="input">
                  <option value="">Все категории</option>
                  {/* Список категорий будет добавлен позже */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип цены
                </label>
                <select className="input">
                  <option value="">Базовая цена</option>
                  {/* Список типов цен будет добавлен позже */}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Формат экспорта
                </label>
                <div className="space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="xml"
                      defaultChecked
                      className="mr-2"
                    />
                    XML файл
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      name="format"
                      value="zip"
                      className="mr-2"
                    />
                    ZIP архив
                  </label>
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowExportModal(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button className="btn btn-primary">
                Экспортировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Модальное окно загрузки изображений */}
      {showImagesModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Загрузка изображений</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Тип привязки
                </label>
                <div className="flex space-x-4">
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="articles"
                      checked={imageUploadType === 'articles'}
                      onChange={(e) => setImageUploadType(e.target.value as 'articles' | 'categories')}
                      className="mr-2"
                    />
                    Артикулы
                  </label>
                  <label className="inline-flex items-center">
                    <input
                      type="radio"
                      value="categories"
                      checked={imageUploadType === 'categories'}
                      onChange={(e) => setImageUploadType(e.target.value as 'articles' | 'categories')}
                      className="mr-2"
                    />
                    Категории
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Изображения
                </label>
                <input
                  type="file"
                  accept=".jpg,.jpeg,.png"
                  multiple
                  onChange={(e) => setImageFiles(Array.from(e.target.files || []))}
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-semibold
                    file:bg-primary-50 file:text-primary-700
                    hover:file:bg-primary-100"
                />
              </div>

              {imageFiles.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-gray-700 mb-2">
                    Выбранные файлы:
                  </h4>
                  <ul className="space-y-1">
                    {imageFiles.map((file, index) => (
                      <li key={index} className="text-sm text-gray-600">
                        {file.name}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <p className="text-sm text-gray-500 italic">
                *Загруженные файлы будут переименованы в соответствии с артикулами/категориями
              </p>
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowImagesModal(false)}
                className="btn btn-secondary"
              >
                Отмена
              </button>
              <button
                onClick={handleImagesUpload}
                className="btn btn-primary"
                disabled={uploading || imageFiles.length === 0}
              >
                {uploading ? 'Загрузка...' : 'Загрузить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyncPage;