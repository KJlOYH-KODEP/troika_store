import { Link } from 'react-router-dom';

const NotFoundPage = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <h1 className="text-9xl font-bold text-primary-500">404</h1>
        <h2 className="text-2xl font-bold text-gray-800 mt-4">Страница не найдена</h2>
        <p className="text-gray-600 mt-2">
          Страница, которую вы ищете, не существует или была перемещена.
        </p>
        <Link 
          to="/"
          className="mt-6 inline-block px-6 py-3 bg-primary-500 text-white rounded-md hover:bg-primary-600 transition-colors"
        >
          Вернуться на главную
        </Link>
      </div>
    </div>
  );
};

export default NotFoundPage;