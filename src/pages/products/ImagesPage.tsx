import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, X } from 'lucide-react';
import { uploadImages, checkImages } from '../../api';

const ImagesPage = () => {
  const [filesArt, setFilesArt] = useState<File[]>([]);
  const [filesCat, setFilesCat] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const artInputRef = useRef<HTMLInputElement>(null);
  const catInputRef = useRef<HTMLInputElement>(null);

  const handleArtFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFilesArt(Array.from(e.target.files));
    }
  };
  const handleCatFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFilesCat(Array.from(e.target.files));
    }
  };

  const handleArtUpload = async () => {
    if (filesArt.length === 0) {
      setError('Выберите файлы для загрузки');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadImages('articles', filesArt);
      setSuccess('Изображения успешно загружены');
      setFilesArt([]);
      if (artInputRef.current) {
        artInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка при загрузке изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleCatUpload = async () => {
    if (filesCat.length === 0) {
      setError('Выберите файлы для загрузки');
      return;
    }

    try {
      setUploading(true);
      setError(null);
      await uploadImages('categories', filesCat);
      setSuccess('Изображения успешно загружены');
      setFilesCat([]);
      if (catInputRef.current) {
        catInputRef.current.value = '';
      }
    } catch (err) {
      console.error('Error uploading images:', err);
      setError('Ошибка при загрузке изображений');
    } finally {
      setUploading(false);
    }
  };

  const handleCheckImages = async () => {
    try {
      setUploading(true);
      await checkImages();
      setSuccess('Проверка изображений завершена');
    } catch (err) {
      console.error('Error checking images:', err);
      setError('Ошибка при проверке изображений');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Управление изображениями</h1>
        <button
          onClick={handleCheckImages}
          className="btn btn-secondary"
          disabled={uploading}
        >
          {uploading ? 'Загрузка...' : 'Проверить изображения'}
        </button>
      </div>

      {error && (
        <div className="bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md mb-4">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-success-50 border border-success-500 text-success-700 px-4 py-3 rounded-md mb-4">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg  shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Изображения для артикулов</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleArtFileChange}
              className="hidden"
              id="imagesArt"
              ref={artInputRef}
            />
            <label
              htmlFor="imagesArt"
              className="btn btn-secondary flex items-center"
            >
              <Upload size={18} className="mr-2" />
              Выбрать файлы
            </label>
            <button
              onClick={handleArtUpload}
              className="btn btn-primary"
              disabled={uploading || filesArt.length === 0}
            >
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </div>

        {filesArt.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Выбранные файлы:
            </h3>
            <div className="space-y-2">
              {filesArt.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <ImageIcon size={18} className="text-gray-500 mr-2" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setFilesArt(filesArt.filter((_, i) => i !== index))}
                    className="text-gray-500 hover:text-danger-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
      <div className="mt-4"></div>
      <div className="bg-white rounded-lg  shadow-sm border border-gray-200 p-6">
        <div className="mb-6">
          <div className="mb-6">
            <h3 className="text-lg font-medium mb-4">Изображения для категорий</h3>
          </div>
          
          <div className="flex items-center space-x-3">
            <input
              type="file"
              multiple
              accept="image/*"
              onChange={handleCatFileChange}
              className="hidden"
              id="imagesCat"
              ref={catInputRef}
            />
            <label
              htmlFor="imagesCat"
              className="btn btn-secondary flex items-center"
            >
              <Upload size={18} className="mr-2" />
              Выбрать файлы
            </label>
            <button
              onClick={handleCatUpload}
              className="btn btn-primary"
              disabled={uploading || filesCat.length === 0}
            >
              {uploading ? 'Загрузка...' : 'Загрузить'}
            </button>
          </div>
        </div>

        {filesCat.length > 0 && (
          <div>
            <h3 className="text-sm font-medium text-gray-700 mb-2">
              Выбранные файлы:
            </h3>
            <div className="space-y-2">
              {filesCat.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between bg-gray-50 p-2 rounded"
                >
                  <div className="flex items-center">
                    <ImageIcon size={18} className="text-gray-500 mr-2" />
                    <span className="text-sm">{file.name}</span>
                  </div>
                  <button
                    onClick={() => setFilesCat(filesCat.filter((_, i) => i !== index))}
                    className="text-gray-500 hover:text-danger-500"
                  >
                    <X size={18} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImagesPage;