import { useState, useEffect } from 'react';
import { Dialog } from '@headlessui/react';
import { MapPin } from 'lucide-react';
import { useOffice } from '../contexts/OfficeContext';
import { useAuth } from '../contexts/AuthContext';
import { getOffices, searchOffices } from '../api';
import { Office } from '../types';

const OfficeSelector = () => {
  const { user } = useAuth();
  const { currentOffice, setCurrentOffice } = useOffice();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [offices, setOffices] = useState<Office[]>([]);
  const [settlement, setSettlement] = useState('');
  const [address_line, setAddressLine] = useState('');
  const [loading, setLoading] = useState(false);
  const [lastSelectedOffice, setLastSelectedOffice] = useState<Office | null>(null);


  useEffect(() => {
    const fetchData = async () => {
      if (settlement == '' && address_line == '') {
        handleSearch()
      }
    }
    fetchData();
  }, [settlement, address_line]);
  
  useEffect(() => {
    if (currentOffice) {
      setLastSelectedOffice(currentOffice);
    } 
  }, [currentOffice]);
  
  const openModal = async () => {
    if (!user?.role.admin && !user?.role.moderator) return;
    
    setIsModalOpen(true);
    
    try {
      setLoading(true);
      const response = await getOffices();
      setOffices(response.data);
    } catch (error) {
      console.error('Ошибка при загрузке списка офисов:', error);
    } finally {
      setLoading(false);
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSettlement('');
    setAddressLine('');
  };

  const handleSearch = async () => {
    try {
      setLoading(true);
      const response = await searchOffices(settlement, address_line);
      setOffices(response.data);
    } catch (error) {
      console.error('Ошибка при поиске офисов:', error);
    } finally {
      setLoading(false);
    }
  };

  const selectOffice = (office: Office) => {
    setCurrentOffice(office);
    setLastSelectedOffice(office);
    closeModal();
  };

  return (
    <>
      <button 
        onClick={openModal}
        className={`flex items-center text-sm rounded-md py-1 px-2 ${
          user?.role.staff
            ? 'text-gray-600 cursor-default' 
            : 'hover:bg-primary-50 text-primary-600'
        }`}
      >
        <MapPin size={16} className="mr-1" />
        {currentOffice ? (
          <span>
            {currentOffice.settlement}, {currentOffice.address_line}
          </span>
        ) : (
          <span>Загрузка офиса...</span>
        )}
      </button>

      <Dialog 
        open={isModalOpen} 
        onClose={closeModal}
        as="div"
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/50" aria-hidden="true" />
        
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl rounded-xl bg-white shadow-lg p-6 max-h-[80vh] flex flex-col">
            <Dialog.Title className="text-xl font-bold mb-4">
              Выбор офиса
            </Dialog.Title>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Город
                </label>
                <input
                  type="text"
                  value={settlement}
                  onChange={(e) => setSettlement(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Введите город"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Адрес
                </label>
                <input
                  type="text"
                  value={address_line}
                  onChange={(e) => setAddressLine(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                  placeholder="Введите адрес"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
              </div>
            </div>
            <div className="flex space-x-3 mb-4">
              <button 
                onClick={handleSearch}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors flex-1"
                disabled={loading}
              >
                {loading ? (
                  <span className="inline-flex items-center justify-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Поиск...
                  </span>
                ) : 'Найти'}
              </button>
              
              <button 
                onClick={() => {
                  setSettlement('');
                  setAddressLine('');
                  handleSearch();
                }}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                disabled={loading}
              >
                Сбросить фильтры
              </button>
            </div>
            
            <div className="overflow-y-auto flex-grow border border-gray-200 rounded-lg">
              {loading ? (
                <div className="flex items-center justify-center h-40">
                  <div className="w-8 h-8 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
                </div>
              ) : offices.length > 0 ? (
                <ul className="divide-y divide-gray-200">
                  {offices.map((office) => (
                    <li 
                      key={office.office_id}
                      onClick={() => selectOffice(office)}
                      className={`p-3 cursor-pointer transition-colors duration-200 ${
                        lastSelectedOffice?.office_id === office.office_id 
                          ? 'bg-gray-100'
                          : 'hover:bg-primary-50'
                      } ${
                        currentOffice?.office_id === office.office_id ? 'bg-primary-50' : ''
                      }`}
                    >
                      <p className="font-medium">{office.settlement}</p>
                      <p className="text-sm text-gray-600">
                        {office.address_line}
                        {office.postalCode && `, ${office.postalCode}`}
                      </p>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="flex items-center justify-center h-40 text-gray-500">
                  Офисы не найдены
                </div>
              )}
            </div>
            
            <div className="flex justify-end mt-4 space-x-3">
              <button 
                onClick={closeModal}
                className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
              >
                Отмена
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </>
  );
};

export default OfficeSelector;