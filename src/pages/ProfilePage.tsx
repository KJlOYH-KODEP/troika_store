import { useState, useEffect } from 'react';
import { getStaffMember, updateStaffCredentials } from '../api';
import { StaffMember } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Phone, Key } from 'lucide-react';

const ProfilePage = () => {
  const { user } = useAuth();
  const [staffMember, setStaffMember] = useState<StaffMember | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Модальные окна
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showPhoneModal, setShowPhoneModal] = useState(false);

  // Формы
  const [email, setEmail] = useState('');
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [phone, setPhone] = useState('');

  useEffect(() => {
    const fetchStaffMember = async () => {
      if (!user) return;

      try {
        setLoading(true);
        const response = await getStaffMember(user.user_id);
        setStaffMember(response.data);
      } catch (err) {
        console.error('Error fetching staff member:', err);
        setError('Ошибка при загрузке данных профиля');
      } finally {
        setLoading(false);
      }
    };

    fetchStaffMember();
  }, [user]);

  const handleEmailUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStaffCredentials({ email });
      setSuccess('Email успешно обновлен');
      setShowEmailModal(false);
      if (staffMember) {
        setStaffMember({ ...staffMember, email });
      }
    } catch (err) {
      setError('Ошибка при обновлении email');
    }
  };

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setError('Пароли не совпадают');
      return;
    }
    try {
      await updateStaffCredentials({ password: newPassword });
      setSuccess('Пароль успешно обновлен');
      setShowPasswordModal(false);
    } catch (err) {
      setError('Ошибка при обновлении пароля');
    }
  };

  const handlePhoneUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateStaffCredentials({ phone_number: phone });
      setSuccess('Телефон успешно обновлен');
      setShowPhoneModal(false);
      if (staffMember) {
        setStaffMember({ ...staffMember, phone_number: phone });
      }
    } catch (err) {
      setError('Ошибка при обновлении телефона');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!staffMember) {
    return (
      <div className="p-6">
        <div className="bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
          Профиль не найден
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Профиль</h1>

      {error && (
        <div className="mb-4 bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 bg-success-50 border border-success-500 text-success-700 px-4 py-3 rounded-md">
          {success}
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h2 className="text-lg font-semibold mb-4">Основная информация</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Имя</label>
                <p className="mt-1 text-gray-900">{staffMember.first_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Фамилия</label>
                <p className="mt-1 text-gray-900">{staffMember.last_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Офис</label>
                <p className="mt-1 text-gray-900">{staffMember.office_name}</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Роль</label>
                <p className="mt-1 text-gray-900">
                  {staffMember.role.admin ? 'Администратор' : 
                   staffMember.role.moderator ? 'Модератор' : 'Сотрудник'}
                </p>
              </div>
            </div>
          </div>

          <div>
            <h2 className="text-lg font-semibold mb-4">Контактная информация</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <p className="mt-1 text-gray-900">{staffMember.email}</p>
                </div>
                <button
                  onClick={() => setShowEmailModal(true)}
                  className="btn btn-secondary flex items-center"
                >
                  <Mail size={16} className="mr-2" />
                  Изменить
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Телефон</label>
                  <p className="mt-1 text-gray-900">{staffMember.phone_number}</p>
                </div>
                <button
                  onClick={() => setShowPhoneModal(true)}
                  className="btn btn-secondary flex items-center"
                >
                  <Phone size={16} className="mr-2" />
                  Изменить
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Пароль</label>
                  <p className="mt-1 text-gray-900">••••••••</p>
                </div>
                <button
                  onClick={() => setShowPasswordModal(true)}
                  className="btn btn-secondary flex items-center"
                >
                  <Key size={16} className="mr-2" />
                  Изменить
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Модальное окно изменения email */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Изменение email</h3>
            <form onSubmit={handleEmailUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новый email
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно изменения пароля */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Изменение пароля</h3>
            <form onSubmit={handlePasswordUpdate}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Текущий пароль
                  </label>
                  <input
                    type="password"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Новый пароль
                  </label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Подтверждение пароля
                  </label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="input"
                    required
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Модальное окно изменения телефона */}
      {showPhoneModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
            <h3 className="text-lg font-bold mb-4">Изменение телефона</h3>
            <form onSubmit={handlePhoneUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Новый телефон
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowPhoneModal(false)}
                  className="btn btn-secondary"
                >
                  Отмена
                </button>
                <button type="submit" className="btn btn-primary">
                  Сохранить
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProfilePage;