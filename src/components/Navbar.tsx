import { Bell, LogOut, Menu, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import { useState } from 'react';
import OfficeSelector from './OfficeSelector';
import { Notification } from '../types';


interface NavbarProps {
  toggleSidebar: () => void;
}

const Navbar: React.FC<NavbarProps> = ({ toggleSidebar }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications] = useState<Notification[]>([]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };
  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'admin': return 'Администратор';
      case 'moderator': return 'Модератор';
      case 'staff': return 'Сотрудник';
      default: return role;
    }
  };
  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-2.5 flex items-center justify-between">
      <div className="flex items-center">
        <button 
          onClick={toggleSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-primary-500 hover:bg-primary-50 focus:outline-none"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-3 text-xl font-semibold text-primary-700 hidden md:block">
          Панель управления
        </h1>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Селектор офиса */}
        <OfficeSelector />
        
        {/* Уведомления */}
        <div className="relative">
          <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="p-2 rounded-full hover:bg-primary-50 text-gray-500 hover:text-primary-500 relative"
          >
            <Bell size={20} />
            {notifications.length > 0 && (
              <span className="absolute top-0 right-0 h-4 w-4 rounded-full bg-danger-500 text-white text-xs flex items-center justify-center">
                {notifications.length}
              </span>
            )}
          </button>

          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50 border border-gray-200">
              <div className="p-4">
                <h3 className="text-lg font-semibold mb-2">Уведомления</h3>
                {notifications.length > 0 ? (
                  <div className="space-y-2">
                    {notifications.map((notification) => (
                      <div 
                        key={notification.id}
                        className={`p-3 rounded-md ${
                          notification.read ? 'bg-gray-50' : 'bg-primary-50'
                        }`}
                      >
                        <p className="text-sm">{notification.message}</p>
                        <span className="text-xs text-gray-500">
                          {new Date(notification.createdAt).toLocaleString('ru-RU')}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-2">Уведомлений нет</p>
                )}
              </div>
            </div>
          )}
        </div>
        
        {/* Профиль */}
        <div className="flex items-center">
          <div className="hidden md:block mr-3">
          <p className="text-sm font-medium text-gray-700">
            {user?.first_name} {user?.last_name}
          </p>
          <p className="text-xs text-gray-500">
            {user?.role?.admin ? 'Администратор' : 
            user?.role?.moderator ? 'Модератор' : 
            'Сотрудник'}
          </p>
          </div>
          <div className="flex items-center space-x-2">
            <Link
              to="/profile"
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-primary-500"
              title="Профиль"
            >
              <User size={20} />
            </Link>
            <button 
              onClick={handleLogout} 
              className="p-2 rounded-full hover:bg-gray-100 text-gray-500 hover:text-danger-500"
              title="Выйти"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;