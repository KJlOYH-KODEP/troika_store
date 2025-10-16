import { useState, useEffect } from 'react';
import { getStaff, updateStaffData, deleteStaff, getOffices, register } from '../../api';
import { Employee } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { UserCog, Mail, MoreVertical, Plus, Trash2, Edit, Phone, Building } from 'lucide-react';
import { Dialog, Transition, Menu } from '@headlessui/react';
import { Fragment } from 'react';
import Pagination from '../../components/Pagination';

const EmployeesPage = () => {
  const { user } = useAuth();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updateError, setUpdateError] = useState<string | null>(null); // Для ошибок обновления
  const [deleteError, setDeleteError] = useState<string | null>(null); // Для ошибок удаления
  const [createError, setCreateError] = useState<string | null>(null); // Для ошибок создания
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    first_name: '',
    last_name: '',
    phone_number: '',
    office_id: 1,
    role: { admin: false, moderator: false, staff: true },
    password: '',
    confirmPassword: ''
  });
  const [offices, setOffices] = useState<{ office_id: number, name: string }[]>([]);
  const [initialFormData, setInitialFormData] = useState(formData);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null); // Сбрасываем ошибку перед загрузкой данных
      const [staffRes, officesRes] = await Promise.all([
        getStaff(),
        getOffices()
      ]);
      setEmployees(staffRes.data);
      setOffices(officesRes.data);
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError(err.response?.data?.message || 'Ошибка при загрузке данных');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []); // Вызываем fetchData при монтировании компонента

  useEffect(() => {
    // Когда selectedEmployee меняется, обновляем formData и initialFormData
    if (selectedEmployee) {
      setFormData({
        email: selectedEmployee.email || '',
        first_name: selectedEmployee.first_name || '',
        last_name: selectedEmployee.last_name || '',
        phone_number: selectedEmployee.phone_number || '',
        office_id: selectedEmployee.office_id || 0,
        role: { ...selectedEmployee.role },  // Важно создать новый объект для role
        password: '',  // Очищаем пароль
        confirmPassword: '' // Очищаем подтверждение пароля
      });
      setInitialFormData({
        email: selectedEmployee.email || '',
        first_name: selectedEmployee.first_name || '',
        last_name: selectedEmployee.last_name || '',
        phone_number: selectedEmployee.phone_number || '',
        office_id: selectedEmployee.office_id || 0,
        role: { ...selectedEmployee.role }, // Важно создать новый объект для role
        password: '',
        confirmPassword: ''
      });
    }
  }, [selectedEmployee]);

  const getChangedFields = () => {
    const changedFields: any = {}; // Указываем тип any, чтобы не было проблем с TypeScript

    if (formData.email !== initialFormData.email) {
      changedFields.email = formData.email;
    }
    if (formData.first_name !== initialFormData.first_name) {
      changedFields.first_name = formData.first_name;
    }
    if (formData.last_name !== initialFormData.last_name) {
      changedFields.last_name = formData.last_name;
    }
    if (formData.phone_number !== initialFormData.phone_number) {
      changedFields.phone_number = formData.phone_number;
    }
    if (formData.office_id !== initialFormData.office_id) {
      changedFields.office_id = formData.office_id;
    }

    // Сравниваем объекты role глубоко
    if (formData.role.moderator !== initialFormData.role.moderator || formData.role.staff !== initialFormData.role.staff) {
      changedFields.role = { moderator: formData.role.moderator, staff: formData.role.staff };
    }

    return changedFields;
  };

  const getRoleDisplay = (role: { admin: boolean, moderator: boolean, staff: boolean }) => {
    const roles = [];
    if (role.admin) roles.push('Админ');
    if (role.moderator) roles.push('Модератор');
    if (role.staff) roles.push('Сотрудник');
    return roles.join('/') || 'Роль не определена';
  };

  const handleRoleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, checked } = e.target;
    setFormData(prevFormData => ({
      ...prevFormData,
      role: { ...prevFormData.role, [id]: checked }
    }));
  };

  const handleUpdateEmployee = async () => {
    if (!selectedEmployee) return;

    const changedFields = getChangedFields();

    if (Object.keys(changedFields).length === 0) {
      // Нет изменений, можно ничего не отправлять
      setIsEditModalOpen(false);
      return;
    }

    setUpdateError(null); // Сбрасываем ошибку перед запросом

    try {
      await updateStaffData(selectedEmployee.staff_id, changedFields);
      fetchData(); // Обновляем страницу
      setIsEditModalOpen(false); // Закрываем окно после успешного обновления
    } catch (err: any) { // Указываем тип err как any
      console.error('Error updating employee:', err);
      setUpdateError(err.response?.data?.message || 'Ошибка при обновлении данных сотрудника'); // Обрабатываем ошибку и устанавливаем ее в состояние
    }
  };

  const handleDeleteEmployee = async () => {
      if (!selectedEmployee) return;

      setDeleteError(null);  // Сбрасываем ошибку перед запросом

      try {
          await deleteStaff(selectedEmployee.staff_id);
          fetchData(); // Обновляем страницу
          setIsDeleteModalOpen(false); // Закрываем модальное окно только при успехе
      } catch (err: any) {
          console.error('Error deleting employee:', err);
          setDeleteError(err.response?.data?.message || 'Ошибка при удалении сотрудника');
      }
  };


  const handleCreateEmployee = async () => {
    setCreateError(null); // Сбрасываем ошибку перед запросом
    try {
      if (formData.password !== formData.confirmPassword) {
        setCreateError('Пароли не совпадают');
        return;
      }

      const response = await register(formData);
      setIsCreateModalOpen(false);
      fetchData(); // Обновляем страницу
      setFormData({
        email: '',
        first_name: '',
        last_name: '',
        phone_number: '',
        office_id: 1,
        role: { admin: false, moderator: false, staff: true },
        password: '',
        confirmPassword: ''
      });
    } catch (err: any) {
      console.error('Error creating employee:', err);
      setCreateError(err.response?.data?.message || 'Ошибка при создании сотрудника');
    }
  };

  const handleOpenCreateModal = () => {
    setFormData({
      email: '',
      first_name: '',
      last_name: '',
      phone_number: '',
      office_id: 1,
      role: { admin: false, moderator: false, staff: true },
      password: '',
      confirmPassword: ''
    }); // Сбрасываем форму создания
    setIsCreateModalOpen(true);
  }

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = employees.slice(indexOfFirstItem, indexOfLastItem);
  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

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

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Сотрудники</h1>
        <button
          onClick={handleOpenCreateModal}
          className="flex items-center px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700"
        >
          <Plus size={16} className="mr-2" />
          Добавить сотрудника
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {currentItems.map((employee) => (
          <div key={employee.staff_id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between">
              <div>
                <h3 className="text-lg font-semibold">
                  {employee.first_name} {employee.last_name}
                </h3>
                <p className="text-sm text-gray-500 mt-1 flex items-center">
                    <Phone size={16} className="mr-1" />
                    {employee.phone_number}
                </p>
              </div>

              <Menu as="div" className="relative">
                <Menu.Button className="p-1 rounded-full hover:bg-gray-100">
                  <MoreVertical size={18} />
                </Menu.Button>
                <Transition
                  as={Fragment}
                  enter="transition ease-out duration-100"
                  enterFrom="transform opacity-0 scale-95"
                  enterTo="transform opacity-100 scale-100"
                  leave="transition ease-in duration-75"
                  leaveFrom="transform opacity-100 scale-100"
                  leaveTo="transform opacity-0 scale-95"
                >
                  <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-10">
                    {employee.staff_id === user?.user_id ? (
                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={() => {
                              setSelectedEmployee(employee);
                              setIsEditModalOpen(true);
                            }}
                            className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                          >
                            <Edit size={14} className="inline mr-2" />
                            Редактировать
                          </button>
                        )}
                      </Menu.Item>
                    ) : !employee.role.admin && user?.role?.admin ? (
                      <>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsEditModalOpen(true);
                              }}
                              className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-gray-700 w-full text-left`}
                            >
                              <Edit size={14} className="inline mr-2" />
                              Редактировать
                            </button>
                          )}
                        </Menu.Item>
                        <Menu.Item>
                          {({ active }) => (
                            <button
                              onClick={() => {
                                setSelectedEmployee(employee);
                                setIsDeleteModalOpen(true);
                              }}
                              className={`${active ? 'bg-gray-100' : ''} block px-4 py-2 text-sm text-red-600 w-full text-left`}
                            >
                              <Trash2 size={14} className="inline mr-2" />
                              Удалить
                            </button>
                          )}
                        </Menu.Item>
                      </>
                    ) : null}
                  </Menu.Items>
                </Transition>
              </Menu>
            </div>

            <div className="mt-4 space-y-2">
              <div className="flex items-center text-sm text-gray-600">
                <Mail size={16} className="mr-2" />
                <span>{employee.email}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Building size={16} className="mr-2" />
                <span>Офис: {offices.find(office => office.office_id === employee.office_id)?.name || "Не указан"}</span>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <UserCog size={16} className="mr-2" />
                <span>{getRoleDisplay(employee.role)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <Pagination
        itemsPerPage={itemsPerPage}
        totalItems={employees.length}
        paginate={paginate}
        currentPage={currentPage}
      />

      {/* Edit Modal */}
      <Transition appear show={isEditModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsEditModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Редактирование сотрудника
                  </Dialog.Title>

                  {updateError && (
                    <div className="mt-2 bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
                      {updateError}
                    </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-base font-medium text-gray-700">Имя</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Фамилия</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Телефон</label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Офис</label>
                      <select
                        value={formData.office_id}
                        onChange={(e) => setFormData({ ...formData, office_id: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      >
                        <option value="0">Выберите офис</option>
                        {offices.map(office => (
                          <option key={office.office_id} value={office.office_id}>{office.name}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Роли</label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="moderator"
                            checked={formData.role.moderator}
                            onChange={handleRoleChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="moderator" className="ml-2 block text-base text-gray-700">
                            Модератор
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="staff"
                            checked={formData.role.staff}
                            onChange={handleRoleChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="staff" className="ml-2 block text-base text-gray-700">
                            Сотрудник
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={() => setIsEditModalOpen(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={handleUpdateEmployee}
                    >
                      Сохранить
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirmation Modal */}
      <Transition appear show={isDeleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsDeleteModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Подтверждение удаления
                  </Dialog.Title>
                  {deleteError && (
                      <div className="mt-2 bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
                          {deleteError}
                      </div>
                  )}
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">
                      Вы уверены, что хотите удалить сотрудника {selectedEmployee?.first_name} {selectedEmployee?.last_name}?
                    </p>
                  </div>

                  <div className="mt-4 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={() => setIsDeleteModalOpen(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={handleDeleteEmployee}
                    >
                      Удалить
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Create Employee Modal */}
      <Transition appear show={isCreateModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={() => setIsCreateModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black bg-opacity-25" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4 text-center">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-white p-6 text-left align-middle shadow-xl transition-all">
                  <Dialog.Title as="h3" className="text-lg font-medium leading-6 text-gray-900">
                    Добавление нового сотрудника
                  </Dialog.Title>

                  {createError && (
                      <div className="mt-2 bg-danger-50 border border-danger-500 text-danger-700 px-4 py-3 rounded-md">
                          {createError}
                      </div>
                  )}

                  <div className="mt-4 space-y-4">
                    <div>
                      <label className="block text-base font-medium text-gray-700">Имя</label>
                      <input
                        type="text"
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Фамилия</label>
                      <input
                        type="text"
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Email</label>
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Телефон</label>
                      <input
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Офис</label>
                      <select
                        value={formData.office_id}
                        onChange={(e) => setFormData({ ...formData, office_id: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      >
                        <option value="0">Выберите офис</option>
                        {offices.map(office => (
                          <option key={office.office_id} value={office.office_id}>{office.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-base font-medium text-gray-700">Пароль</label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Подтверждение пароля</label>
                      <input
                        type="password"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 text-base px-3 py-2"
                      />
                    </div>

                    <div>
                      <label className="block text-base font-medium text-gray-700">Роли</label>
                      <div className="mt-2 space-y-2">
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="moderator"
                            checked={formData.role.moderator}
                            onChange={handleRoleChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="moderator" className="ml-2 block text-base text-gray-700">
                            Модератор
                          </label>
                        </div>
                        <div className="flex items-center">
                          <input
                            type="checkbox"
                            id="staff"
                            checked={formData.role.staff}
                            onChange={handleRoleChange}
                            className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                          />
                          <label htmlFor="staff" className="ml-2 block text-base text-gray-700">
                            Сотрудник
                          </label>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-base font-medium text-gray-700 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={() => setIsCreateModalOpen(false)}
                    >
                      Отмена
                    </button>
                    <button
                      type="button"
                      className="inline-flex justify-center rounded-md border border-transparent bg-primary-600 px-4 py-2 text-base font-medium text-white hover:bg-primary-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                      onClick={handleCreateEmployee}
                    >
                      Создать
                    </button>
                  </div>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
};

export default EmployeesPage;