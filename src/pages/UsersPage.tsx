import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../services/api';
import type { User, UserRole } from '../types';
import { Navigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { Modal, Button, Input, Select } from '../ui';
import { exportToCsv } from '../utils/exportToCsv';

interface FormData {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: UserRole;
}

const initialFormData: FormData = {
  email: '',
  password: '',
  firstName: '',
  lastName: '',
  role: 'user',
};

export const UsersPage: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const notification = useNotification();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [formError, setFormError] = useState<string | null>(null);

  const roleOptions = [
    { value: 'admin', label: 'Администратор' },
    { value: 'manager', label: 'Менеджер' },
    { value: 'user', label: 'Пользователь' },
  ];

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      return;
    }
    loadUsers();
  }, [isAdmin, isAuthenticated]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const data = await authApi.getUsers();
      setUsers(data);
      setError(null);
    } catch {
      setError('Ошибка загрузки пользователей');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setEditingUser(null);
    setFormData(initialFormData);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      email: user.email,
      password: '',
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
    });
    setFormError(null);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData(initialFormData);
    setFormError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    try {
      if (editingUser) {
        await authApi.updateUser(editingUser.id, {
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });
        notification.success('Пользователь обновлен', { title: formData.email });
      } else {
        if (!formData.password) {
          setFormError('Пароль обязателен для нового пользователя');
          return;
        }
        await authApi.createUser({
          email: formData.email,
          password: formData.password,
          firstName: formData.firstName,
          lastName: formData.lastName,
          role: formData.role,
        });
        notification.success('Пользователь создан', { title: formData.email });
      }
      await loadUsers();
      handleCloseModal();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'response' in err) {
        const error = err as { response?: { data?: { error?: string } } };
        setFormError(error.response?.data?.error || 'Ошибка сохранения');
      } else {
        setFormError('Ошибка сохранения');
      }
    }
  };

  const handleSetPassword = async (user: User) => {
    const newPassword = prompt('Введите новый пароль для пользователя:');
    if (!newPassword) return;

    try {
      await authApi.setUserPassword(user.id, newPassword);
      notification.success('Пароль успешно изменен', { title: user.email });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      notification.error(error.response?.data?.error || 'Ошибка смены пароля', { title: 'Ошибка' });
    }
  };

  const handleToggleStatus = async (user: User) => {
    if (!confirm(`Вы уверены, что хотите ${user.isActive ? 'заблокировать' : 'разблокировать'} пользователя?`)) {
      return;
    }

    try {
      await authApi.toggleUserStatus(user.id);
      notification.success(`Пользователь ${user.isActive ? 'заблокирован' : 'разблокирован'}`, { title: user.email });
      await loadUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      notification.error(error.response?.data?.error || 'Ошибка изменения статуса', { title: 'Ошибка' });
    }
  };

  const handleExportCsv = () => {
    exportToCsv<User>({
      data: users,
      columns: [
        { key: 'email', label: 'Email' },
        { key: 'firstName', label: 'Имя' },
        { key: 'lastName', label: 'Фамилия' },
        { key: 'role', label: 'Роль', format: (v) => v === 'admin' ? 'Администратор' : v === 'manager' ? 'Менеджер' : 'Пользователь' },
        { key: 'isActive', label: 'Статус', format: (v) => v ? 'Активен' : 'Заблокирован' },
        { key: 'createdAt', label: 'Создан', format: (v) => v ? new Date(v as string).toLocaleDateString('ru-RU') : '-' },
      ],
      filename: `users-export-${new Date().toISOString().split('T')[0]}`,
    });
  };

  const handleDelete = async (user: User) => {
    if (!confirm(`Вы уверены, что хотите удалить пользователя ${user.firstName} ${user.lastName}?`)) {
      return;
    }

    try {
      await authApi.deleteUser(user.id);
      notification.success('Пользователь удален', { title: `${user.firstName} ${user.lastName}` });
      await loadUsers();
    } catch (err: unknown) {
      const error = err as { response?: { data?: { error?: string } } };
      notification.error(error.response?.data?.error || 'Ошибка удаления', { title: 'Ошибка' });
    }
  };

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-[#1a1a2e] transition-colors duration-200">
        <div className="flex items-center justify-center h-[calc(100vh-200px)]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-[#1a1a2e] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 py-8">
        {/* Заголовок страницы */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Управление пользователями</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Создание, редактирование и удаление пользователей</p>
        </div>

        {/* Actions */}
        <div className="mb-6 flex justify-between items-center">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            Всего пользователей: {users.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleExportCsv}
              className="px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1.5"
              title="Скачать все данные в CSV"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Скачать CSV
            </button>
            <Button onClick={handleOpenCreate} variant="primary">
              + Добавить пользователя
            </Button>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Users Table */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden transition-colors duration-200">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-800">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Email</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">ФИО</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Роль</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Статус</th>
                  <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">{user.firstName} {user.lastName}</td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.role === 'admin' ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200' :
                        user.role === 'manager' ? 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200' :
                        'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                      }`}>
                        {user.role === 'admin' ? 'Администратор' : user.role === 'manager' ? 'Менеджер' : 'Пользователь'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span className={`px-2 py-1 text-xs font-medium rounded ${
                        user.isActive ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200' : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200'
                      }`}>
                        {user.isActive ? 'Активен' : 'Заблокирован'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => handleOpenEdit(user)}
                          className="px-3 py-1.5 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          Редактировать
                        </button>
                        <button
                          onClick={() => handleSetPassword(user)}
                          className="px-3 py-1.5 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition-colors"
                        >
                          Сброс пароля
                        </button>
                        <button
                          onClick={() => handleToggleStatus(user)}
                          className={`px-3 py-1.5 text-xs rounded transition-colors ${
                            user.isActive 
                              ? 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30'
                              : 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30'
                          }`}
                        >
                          {user.isActive ? 'Заблокировать' : 'Разблокировать'}
                        </button>
                        <button
                          onClick={() => handleDelete(user)}
                          className="px-3 py-1.5 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition-colors"
                        >
                          Удалить
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingUser ? 'Редактирование пользователя' : 'Создание пользователя'}
        size="md"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {formError && (
            <div className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
              {formError}
            </div>
          )}

          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@example.com"
            required
          />

          {!editingUser && (
            <Input
              label="Пароль"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="••••••••"
              required
            />
          )}

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Имя"
              type="text"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Иван"
              required
            />
            <Input
              label="Фамилия"
              type="text"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Иванов"
              required
            />
          </div>

          <Select
            label="Роль"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
            options={roleOptions}
            required
          />

          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={handleCloseModal}>
              Отмена
            </Button>
            <Button type="submit" variant="primary">
              {editingUser ? 'Сохранить' : 'Создать'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
