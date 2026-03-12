import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { auditApi, type AuditLog, type AuditLogFilter, type PaginatedAuditLogs } from '../services/api';
import { Navigate } from 'react-router-dom';
import { exportToCsv } from '../utils/exportToCsv';

const ACTION_COLORS: Record<AuditLog['action'], string> = {
  CREATE: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  IMPORT: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  EXPORT: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/20 dark:text-indigo-400',
  PASSWORD_CHANGE: 'bg-pink-100 text-pink-800 dark:bg-pink-900/20 dark:text-pink-400',
};

const ENTITY_COLORS: Record<AuditLog['entity'], string> = {
  TechRadar: 'bg-teal-100 text-teal-800 dark:bg-teal-900/20 dark:text-teal-400',
  User: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  Import: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900/20 dark:text-cyan-400',
  Auth: 'bg-violet-100 text-violet-800 dark:bg-violet-900/20 dark:text-violet-400',
};

const STATUS_COLORS: Record<AuditLog['status'], string> = {
  SUCCESS: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  FAILURE: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
};

export const AuditLogPage: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [pagination, setPagination] = useState<PaginatedAuditLogs['pagination']>({
    total: 0,
    page: 1,
    limit: 20,
    totalPages: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Фильтры
  const [filter, setFilter] = useState<AuditLogFilter>({});
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(20);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      return;
    }
    loadLogs();
  }, [isAdmin, isAuthenticated, page, limit, filter]);

  const loadLogs = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await auditApi.getLogs(filter, page, limit);
      setLogs(response.data);
      setPagination(response.pagination);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки аудит логов');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof AuditLogFilter, value: string) => {
    setFilter(prev => ({
      ...prev,
      [key]: value || undefined,
    }));
    setPage(1); // Сброс на первую страницу при изменении фильтра
  };

  const handleClearFilters = () => {
    setFilter({});
    setPage(1);
  };

  const handleExportCsv = () => {
    exportToCsv<AuditLog>({
      data: logs,
      columns: [
        { key: 'timestamp', label: 'Время', format: (v) => v ? new Date(v as string).toLocaleString('ru-RU') : '-' },
        { key: 'action', label: 'Действие' },
        { key: 'entity', label: 'Сущность' },
        { key: 'entityId', label: 'ID сущности' },
        { key: 'status', label: 'Статус' },
        { key: 'userId', label: 'Пользователь' },
        { key: 'ipAddress', label: 'IP адрес' },
        { key: 'details', label: 'Детали', format: (v) => v ? JSON.stringify(v as any) : '-' },
      ],
      filename: `audit-log-export-${new Date().toISOString().split('T')[0]}`,
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const formatDetails = (details?: Record<string, any>) => {
    if (!details) return '-';
    return JSON.stringify(details, null, 2);
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const totalPages = pagination.totalPages;
    
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (page <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (page >= totalPages - 3) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 4; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = page - 1; i <= page + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    
    return pages;
  };

  if (!isAuthenticated || !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Аудит лог</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Журнал действий пользователей в системе
          </p>
        </div>
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
      </div>

      {/* Фильтры */}
      <div className="bg-white dark:bg-[#16213e] rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Действие
            </label>
            <select
              value={filter.action || ''}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все действия</option>
              <option value="CREATE">Создание</option>
              <option value="UPDATE">Обновление</option>
              <option value="DELETE">Удаление</option>
              <option value="LOGIN">Вход</option>
              <option value="LOGOUT">Выход</option>
              <option value="IMPORT">Импорт</option>
              <option value="EXPORT">Экспорт</option>
              <option value="PASSWORD_CHANGE">Смена пароля</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Сущность
            </label>
            <select
              value={filter.entity || ''}
              onChange={(e) => handleFilterChange('entity', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все сущности</option>
              <option value="TechRadar">Технологии</option>
              <option value="User">Пользователи</option>
              <option value="Import">Импорт</option>
              <option value="Auth">Аутентификация</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Статус
            </label>
            <select
              value={filter.status || ''}
              onChange={(e) => handleFilterChange('status', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Все статусы</option>
              <option value="SUCCESS">Успешно</option>
              <option value="FAILURE">Ошибка</option>
            </select>
          </div>

          <div className="flex items-end">
            <button
              onClick={handleClearFilters}
              className="w-full px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-md hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
            >
              Сбросить фильтры
            </button>
          </div>
        </div>
      </div>

      {/* Таблица */}
      <div className="bg-white dark:bg-[#16213e] rounded-lg shadow overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-400">
            {error}
          </div>
        ) : logs.length === 0 ? (
          <div className="text-center py-12 text-gray-500 dark:text-gray-400">
            Нет записей для отображения
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Время
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Действие
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Сущность
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Статус
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Пользователь
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      IP адрес
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                      Детали
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-[#16213e] divide-y divide-gray-200 dark:divide-gray-700">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                        {formatDate(log.timestamp)}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ACTION_COLORS[log.action]}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${ENTITY_COLORS[log.entity]}`}>
                          {log.entity}
                        </span>
                        {log.entityId && (
                          <span className="ml-2 text-xs text-gray-500 dark:text-gray-400">
                            {log.entityId.slice(0, 8)}...
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[log.status]}`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100">
                        {log.userId ? log.userId.slice(0, 8) + '...' : 'Система'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                        {log.ipAddress || '-'}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-500 dark:text-gray-400 max-w-xs truncate">
                        <details>
                          <summary className="cursor-pointer hover:text-blue-600 dark:hover:text-blue-400">
                            {log.details ? 'Показать' : '-'}
                          </summary>
                          <pre className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-900 dark:text-gray-100 overflow-auto max-h-48">
                            {formatDetails(log.details)}
                          </pre>
                        </details>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Пагинация */}
            <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <label className="text-sm text-gray-700 dark:text-gray-300">
                    Записей на странице:
                    <select
                      value={limit}
                      onChange={(e) => {
                        setLimit(Number(e.target.value));
                        setPage(1);
                      }}
                      className="ml-2 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value={10}>10</option>
                      <option value={20}>20</option>
                      <option value={50}>50</option>
                      <option value={100}>100</option>
                    </select>
                  </label>
                  <span className="text-sm text-gray-700 dark:text-gray-300">
                    Всего: {pagination.total}
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setPage(1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Первая
                  </button>
                  <button
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Пред.
                  </button>

                  {getPageNumbers().map((pageNum, index) => (
                    <React.Fragment key={index}>
                      {pageNum === '...' ? (
                        <span className="px-3 py-1 text-sm text-gray-500 dark:text-gray-400">...</span>
                      ) : (
                        <button
                          onClick={() => setPage(Number(pageNum))}
                          className={`px-3 py-1 text-sm border rounded-md ${
                            page === pageNum
                              ? 'bg-blue-600 text-white border-blue-600'
                              : 'border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                          }`}
                        >
                          {pageNum}
                        </button>
                      )}
                    </React.Fragment>
                  ))}

                  <button
                    onClick={() => setPage(page + 1)}
                    disabled={page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    След.
                  </button>
                  <button
                    onClick={() => setPage(pagination.totalPages)}
                    disabled={page === pagination.totalPages}
                    className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md disabled:opacity-50 disabled:cursor-not-allowed bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600"
                  >
                    Последняя
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
