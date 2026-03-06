import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { VersionModal } from './VersionModal';
import { ThemeToggle } from '../ui/ThemeToggle';
import axios from 'axios';

// Используем тот же инстанс axios что и в api.ts
const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Интерцептор для добавления токена
api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'error' | 'info';
  isRead: boolean;
  createdAt: string;
}

export const Navbar: React.FC = () => {
  const auth = useAuth();
  const location = useLocation();
  const [showVersionModal, setShowVersionModal] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);

  // Polling уведомлений каждые 30 секунд
  useEffect(() => {
    if (!auth.isAuthenticated) return;

    const fetchNotifications = async () => {
      try {
        const [notificationsRes, unreadRes] = await Promise.all([
          api.get('/notifications?limit=5&isRead=false'),
          api.get('/notifications/unread-count'),
        ]);
        console.log('Notifications response:', notificationsRes.data);
        console.log('Unread count response:', unreadRes.data);
        // API возвращает { notifications: Notification[], unreadCount, total }
        const notificationsData = Array.isArray(notificationsRes.data) 
          ? notificationsRes.data 
          : notificationsRes.data?.notifications || notificationsRes.data?.data || [];
        console.log('Parsed notifications:', notificationsData);
        setNotifications(notificationsData);
        // unreadRes возвращает { count: number } или просто число
        setUnreadCount(unreadRes.data?.count || unreadRes.data || 0);
      } catch (error) {
        console.error('Failed to fetch notifications:', error);
      }
    };

    // Первоначальная загрузка
    fetchNotifications();

    // Polling каждые 30 секунд
    const interval = setInterval(fetchNotifications, 30000);

    return () => clearInterval(interval);
  }, [auth.isAuthenticated]);

  // Закрытие dropdown при клике вне
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.notifications-dropdown')) {
        setShowNotifications(false);
      }
    };

    if (showNotifications) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications]);

  const markAsRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await api.put('/notifications/read-all');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  };

  if (!auth.isAuthenticated) {
    return null;
  }

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-white dark:bg-[#16213e] shadow-md border-b border-gray-200 dark:border-[#0f3460] transition-colors duration-200">
      <div className="max-w-[1400px] mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center gap-6">
          <Link to="/" className="text-xl font-bold text-blue-600 dark:text-blue-400 no-underline hover:underline">Tech Radar</Link>
          {auth.isAdmin && (
            <div className="flex gap-4">
              <Link
                to="/users"
                className={`text-sm ${isActive('/users') ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-300'} no-underline hover:underline transition-colors`}
              >
                Пользователи
              </Link>
              <Link
                to="/audit"
                className={`text-sm ${isActive('/audit') ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-300'} no-underline hover:underline transition-colors`}
              >
                Аудит
              </Link>
              <Link
                to="/import"
                className={`text-sm ${isActive('/import') ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-300'} no-underline hover:underline transition-colors`}
              >
                Импорт/Экспорт
              </Link>
            </div>
          )}
          {auth.user?.role === 'manager' && (
            <Link
              to="/import"
              className={`text-sm ${isActive('/import') ? 'text-blue-600 dark:text-blue-400 font-semibold' : 'text-gray-600 dark:text-gray-300'} no-underline hover:underline transition-colors`}
            >
              Импорт/Экспорт
            </Link>
          )}
        </div>
        <div className="flex items-center gap-3">
          {/* Уведомления */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 flex items-center justify-center cursor-pointer border-none transition-colors"
              title="Уведомления"
            >
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Выпадающий список уведомлений */}
            {showNotifications && (
              <div className="notifications-dropdown absolute right-0 mt-2 w-80 bg-white dark:bg-[#16213e] rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">Уведомления</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Прочитать все
                    </button>
                  )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {!notifications || notifications.length === 0 ? (
                    <p className="p-4 text-center text-gray-500 dark:text-gray-400 text-sm">Нет уведомлений</p>
                  ) : (
                    notifications.map(notification => (
                      <div
                        key={notification.id}
                        className={`p-3 border-b border-gray-200 dark:border-gray-700 last:border-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${!notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start gap-2">
                          <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'error' ? 'bg-red-500' : 'bg-blue-500'
                          }`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{notification.title}</p>
                            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{notification.message}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {new Date(notification.createdAt).toLocaleString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {auth.isAdmin && (
            <span className="px-2.5 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              Администратор
            </span>
          )}
          {auth.user?.role === 'manager' && (
            <span className="px-2.5 py-1 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
              Менеджер
            </span>
          )}
          <span className="text-gray-600 dark:text-gray-300 text-sm">
            {auth.user?.firstName} {auth.user?.lastName}
          </span>
          <ThemeToggle size="md" />
          <button
            onClick={() => {
              console.log('Version button clicked!');
              setShowVersionModal(true);
            }}
            className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center cursor-pointer border-none shadow-md transition-colors"
            title="О системе (версии)"
          >
            ?
          </button>
          <button
            onClick={() => auth.logout()}
            className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-transparent hover:bg-gray-100 dark:hover:bg-gray-700 border-none cursor-pointer transition-colors rounded"
          >
            Выйти
          </button>
        </div>
      </div>
      <VersionModal isOpen={showVersionModal} onClose={() => setShowVersionModal(false)} />
    </nav>
  );
};
