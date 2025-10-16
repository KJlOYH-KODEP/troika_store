import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Box, ChevronLeft, ChevronRight, LayoutDashboard, 
  Package, Users, FileText, Upload, Image, ShoppingCart
} from 'lucide-react';
import clsx from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

interface NavItem {
  title: string;
  icon: React.ReactNode;
  path: string;
  requiresAdmin?: boolean;
  requiresModerator?: boolean;
  subItems?: {
    title: string;
    path: string;
    requiresAdmin?: boolean;
    requiresModerator?: boolean;
  }[];
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const location = useLocation();
  const { user } = useAuth();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  const navItems: NavItem[] = [
    {
      title: 'Панель управления',
      icon: <LayoutDashboard size={20} />,
      path: '/',
    },
    {
      title: 'Сотрудники',
      icon: <Users size={20} />,
      path: '/employees',
      requiresAdmin: true,
    },
    {
      title: 'Товары',
      icon: <Package size={20} />,
      path: '/products',
      subItems: [
        {
          title: 'Список товаров',
          path: '/products',
        },
        {
          title: 'Цены',
          path: '/products/prices',
        },
        {
          title: 'Склады',
          path: '/products/warehouses',
        },
        {
          title: 'Синхронизация',
          path: '/products/sync',
          requiresModerator: true,
        },
        {
          title: 'Изображения',
          path: '/products/images',
          requiresModerator: true,
        },
      ],
    },
    {
      title: 'Заказы',
      icon: <ShoppingCart size={20} />,
      path: '/orders',
    },
  ];

  const canAccess = (item: { requiresAdmin?: boolean; requiresModerator?: boolean }) => {
    if (!user) return false;
    if (item.requiresAdmin && !user.role.admin) return false;
    if (item.requiresModerator && !user.role.moderator && !user.role.admin) return false;
    return true;
  };

  const filteredNavItems = navItems.filter(item => canAccess(item));

  return (
    <>
      <div 
        className={clsx(
          "fixed inset-0 bg-black z-20 transition-opacity lg:hidden",
          isOpen ? "opacity-50" : "opacity-0 pointer-events-none"
        )}
        onClick={toggle}
      />
      
      <aside 
        className={clsx(
          "fixed top-0 left-0 z-30 h-full bg-white border-r border-gray-200 transition-all duration-300 ease-in-out shadow-md lg:shadow-none lg:static lg:h-screen",
          isOpen ? "w-64" : "w-0 lg:w-20 overflow-hidden"
        )}
      >
        <div className="flex justify-between items-center p-4 h-14">
          <div className={clsx("flex items-center", !isOpen && "lg:hidden")}>
            <Box size={24} className="text-primary-500" />
            <span className="ml-2 font-bold text-primary-800">Тройка</span>
          </div>
          
          <button 
            onClick={toggle}
            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 lg:hidden"
          >
            <ChevronLeft size={20} />
          </button>
          
          <button 
            onClick={toggle}
            className={clsx(
              "p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hidden lg:block",
              !isOpen && "rotate-180"
            )}
          >
            <ChevronLeft size={20} />
          </button>
        </div>

        <nav className="mt-4 px-2">
          <ul className="space-y-1">
            {filteredNavItems.map((item) => {
              const isActive = location.pathname === item.path || 
                             (item.subItems && item.subItems.some(sub => location.pathname === sub.path));
              
              return (
                <li key={item.path} className="relative"
                  onMouseEnter={() => setHoveredItem(item.path)}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <Link 
                    to={item.path}
                    className={clsx(
                      "flex items-center px-3 py-2 rounded-md transition-colors",
                      isActive 
                        ? "bg-primary-50 text-primary-700" 
                        : "text-gray-700 hover:bg-gray-100"
                    )}
                  >
                    <span className="mr-3">{item.icon}</span>
                    {(isOpen || hoveredItem === item.path) && (
                      <span className={clsx(
                        !isOpen && "lg:fixed lg:left-20 lg:bg-white lg:shadow-md lg:px-3 lg:py-2 lg:rounded-md lg:whitespace-nowrap lg:z-50"
                      )}>
                        {item.title}
                      </span>
                    )}
                    {item.subItems && isOpen && (
                      <ChevronRight size={16} className="ml-auto" />
                    )}
                  </Link>
                  
                  {item.subItems && (hoveredItem === item.path || (isActive && isOpen)) && (
                    <ul className={clsx(
                      "py-1 text-sm",
                      isOpen 
                        ? "pl-10" 
                        : "lg:fixed lg:left-[calc(5rem+0.5rem)] lg:top-0 lg:mt-8 lg:bg-white lg:shadow-md lg:rounded-md lg:p-2 lg:w-48 lg:z-50"
                    )}>
                      {item.subItems
                        .filter(subItem => canAccess(subItem))
                        .map((subItem) => {
                          const isSubActive = location.pathname === subItem.path;
                          
                          return (
                            <li key={subItem.path}>
                              <Link 
                                to={subItem.path}
                                className={clsx(
                                  "block py-1.5 px-3 rounded-md transition-colors",
                                  isSubActive 
                                    ? "bg-primary-50 text-primary-700" 
                                    : "text-gray-600 hover:bg-gray-100"
                                )}
                              >
                                {subItem.title}
                              </Link>
                            </li>
                          );
                        })}
                    </ul>
                  )}
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;