import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: 'admin' | 'moderator' | 'staff';
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  requiredRole 
}) => {
  const { user } = useAuth();


  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Проверка роли пользователя, если указана требуемая роль
  if (requiredRole) {
    if (
      (requiredRole === 'admin' && !user.role.admin) ||
      (requiredRole === 'moderator' && !user.role.admin && user.role.moderator)
    ) {
      return ; // return <Navigate to="/" replace />;
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute;