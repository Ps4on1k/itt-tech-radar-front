import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { techRadarApi, migrationMetadataApi, migrationSnapshotsApi } from '../services/api';
import type { TechRadarEntity, MigrationMetadataView, MigrationStatus, MigrationStatistics, MigrationSnapshot } from '../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { Pagination } from '../ui/Pagination';
import { exportToCsv } from '../utils/exportToCsv';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface MigrationItem extends MigrationMetadataView {
  techRadar?: TechRadarEntity;
}

interface SortableRowProps {
  item: MigrationItem;
  isAdminOrManager: boolean;
  onUpdateStatus: (metadataId: string, techRadarId: string, hasMetadata: boolean, status: MigrationStatus) => Promise<void>;
  onUpdateProgress: (metadataId: string, techRadarId: string, hasMetadata: boolean, progress: number) => Promise<void>;
  onSaveFields: (techRadarId: string, fields: { versionToUpdate?: string; versionUpdateDeadline?: string; upgradePath?: string; recommendedAlternatives?: string }) => Promise<void>;
  getStatusColor: (status: MigrationStatus) => string;
  canDrag: boolean;
  onCompleteMigration: (item: MigrationItem) => Promise<void>;
}

const SortableRow: React.FC<SortableRowProps> = ({
  item,
  isAdminOrManager,
  onUpdateStatus,
  onUpdateProgress,
  onSaveFields,
  getStatusColor,
  canDrag,
  onCompleteMigration,
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [editVersion, setEditVersion] = useState(item.versionToUpdate || '');
  const [editDeadline, setEditDeadline] = useState(item.versionUpdateDeadline || '');
  const [editUpgradePath, setEditUpgradePath] = useState(item.upgradePath || '');
  const [editAlternatives, setEditAlternatives] = useState(item.recommendedAlternatives || '');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (isEditing) {
      setEditVersion(item.versionToUpdate || '');
      setEditDeadline(item.versionUpdateDeadline || '');
      setEditUpgradePath(item.upgradePath || '');
      setEditAlternatives(item.recommendedAlternatives || '');
    }
  }, [item, isEditing]);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item.metadataId });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const fields: { versionToUpdate?: string; versionUpdateDeadline?: string; upgradePath?: string; recommendedAlternatives?: string } = {};
      
      if (editVersion !== item.versionToUpdate) {
        fields.versionToUpdate = editVersion;
      }
      if (editDeadline !== item.versionUpdateDeadline) {
        fields.versionUpdateDeadline = editDeadline;
      }
      if (editUpgradePath !== item.upgradePath) {
        fields.upgradePath = editUpgradePath;
      }
      if (editAlternatives !== item.recommendedAlternatives) {
        fields.recommendedAlternatives = Array.isArray(editAlternatives) ? editAlternatives.join(',') : String(editAlternatives);
      }
      
      if (Object.keys(fields).length > 0) {
        await onSaveFields(item.techRadarId, fields);
      }
      setIsEditing(false);
    } catch (err: any) {
      console.error('Ошибка сохранения:', err);
      alert('Ошибка сохранения: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditVersion(item.versionToUpdate || '');
    setEditDeadline(item.versionUpdateDeadline || '');
    setEditUpgradePath(item.upgradePath || '');
    setEditAlternatives(item.recommendedAlternatives || '');
    setIsEditing(false);
  };

  const parseAlternatives = (str?: string) => {
    if (!str) return [];
    if (str.startsWith('[')) {
      try {
        return JSON.parse(str);
      } catch {
        return [];
      }
    }
    return str.split(',').map(s => s.trim()).filter(s => s);
  };

  const alternativesList = parseAlternatives(item.recommendedAlternatives);

  const getStatusBadge = () => {
    const badges: Record<MigrationStatus, { bg: string; text: string; icon: string; label: string }> = {
      backlog: { bg: 'bg-gray-500', text: 'text-white', icon: '📋', label: 'Бэклог' },
      planned: { bg: 'bg-blue-500', text: 'text-white', icon: '📅', label: 'Запланировано' },
      in_progress: { bg: 'bg-yellow-500', text: 'text-white', icon: '⚙️', label: 'В работе' },
      completed: { bg: 'bg-green-500', text: 'text-white', icon: '✅', label: 'Выполнено' },
    };
    const badge = badges[item.status];
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon} {badge.label}
      </span>
    );
  };

  const handleProgressClick = async (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isAdminOrManager) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percentage = Math.round((x / rect.width) * 100);
    const clampedPercentage = Math.min(100, Math.max(0, percentage));
    await onUpdateProgress(item.metadataId, item.techRadarId, item.hasMetadata, clampedPercentage);
  };

  return (
    <tr
      ref={setNodeRef}
      style={style}
      className={`border-b border-gray-200 dark:border-gray-700 transition-colors group ${
        isDragging ? 'bg-blue-50 dark:bg-blue-900/20 shadow-lg' : 'hover:bg-gray-50 dark:hover:bg-gray-800'
      } ${!item.hasMetadata ? 'opacity-75' : ''}`}
    >
      <td className="px-4 py-3" colSpan={5}>
        <div className="flex items-start gap-3">
          {/* Drag handle */}
          {isAdminOrManager && canDrag && (
            <button
              {...attributes}
              {...listeners}
              className="p-1 mt-1 cursor-grab hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors"
              title="Перетащить для изменения приоритета"
            >
              <svg className="w-4 h-4 text-gray-400 dark:text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8h16M4 16h16" />
              </svg>
            </button>
          )}

          {/* Основная информация */}
          <div className="flex-1 min-w-0">
            {/* Заголовок с кнопкой редактирования */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 flex-wrap">
                <span className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{item.techName}</span>
                <span className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs text-gray-700 dark:text-gray-300">
                  {item.currentVersion}
                </span>
                {!item.hasMetadata && (
                  <span className="text-xs text-gray-400 dark:text-gray-500 italic">(по умолчанию)</span>
                )}
              </div>
              {isAdminOrManager && !isEditing && (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-3 py-1.5 text-xs bg-blue-100 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/30 transition-colors flex items-center gap-1"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  Редактировать
                </button>
              )}
            </div>

            {/* Режим просмотра */}
            {!isEditing ? (
              <div className="space-y-2">
                {/* Версия и дедлайн */}
                <div className="flex items-center gap-4 text-sm">
                  {item.versionToUpdate && (
                    <span className="text-orange-600 dark:text-orange-400 font-medium">
                      Обновить до: {item.versionToUpdate}
                    </span>
                  )}
                  {item.versionUpdateDeadline && (
                    <span className={`text-xs ${
                      new Date(item.versionUpdateDeadline) < new Date()
                        ? 'text-red-600 dark:text-red-400 font-semibold'
                        : 'text-gray-500 dark:text-gray-500'
                    }`}>
                      до {new Date(item.versionUpdateDeadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}
                    </span>
                  )}
                </div>

                {/* Путь обновления */}
                {item.upgradePath && (
                  <div className="text-sm text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 px-3 py-2 rounded">
                    <span className="font-medium">📋 Путь:</span> {item.upgradePath}
                  </div>
                )}

                {/* Альтернативы */}
                {alternativesList.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-xs text-gray-500 dark:text-gray-400 self-center">Альтернативы:</span>
                    {alternativesList.map((alt: string, idx: number) => (
                      <span
                        key={idx}
                        className="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                      >
                        {alt}
                      </span>
                    ))}
                  </div>
                )}

                {/* Статус и кнопка завершения */}
                <div className="mt-3 flex items-center gap-2">
                  {getStatusBadge()}
                  {isAdminOrManager && item.status === 'completed' && (
                    <button
                      onClick={() => onCompleteMigration(item)}
                      className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors flex items-center gap-1"
                      title="Переместить в архив завершенных миграций"
                    >
                      ✓ Завершить
                    </button>
                  )}
                </div>
              </div>
            ) : (
              /* Режим редактирования */
              <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Версия для обновления
                    </label>
                    <input
                      type="text"
                      value={editVersion}
                      onChange={(e) => setEditVersion(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      placeholder="Например: 2.0.0"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                      Дедлайн
                    </label>
                    <input
                      type="date"
                      value={editDeadline}
                      onChange={(e) => setEditDeadline(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Путь обновления
                  </label>
                  <textarea
                    value={editUpgradePath}
                    onChange={(e) => setEditUpgradePath(e.target.value)}
                    rows={2}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="Опишите шаги миграции..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Альтернативы (через запятую)
                  </label>
                  <input
                    type="text"
                    value={(() => {
                      const parsed = parseAlternatives(editAlternatives);
                      return parsed.length > 0 ? parsed.join(', ') : editAlternatives;
                    })()}
                    onChange={(e) => setEditAlternatives(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    placeholder="React, Vue, Angular"
                  />
                </div>

                <div className="pt-2">
                  <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                    Статус
                  </label>
                  <select
                    value={item.status}
                    onChange={(e) => onUpdateStatus(item.metadataId, item.techRadarId, item.hasMetadata, e.target.value as MigrationStatus)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium border-0 ${getStatusColor(item.status)}`}
                  >
                    <option value="backlog">Бэклог</option>
                    <option value="planned">Запланировано</option>
                    <option value="in_progress">В работе</option>
                    <option value="completed">Выполнено</option>
                  </select>
                </div>

                <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={handleSave}
                    disabled={isSaving}
                    className="px-4 py-2 bg-green-500 text-white text-sm font-medium rounded hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '✓ Сохранение...' : '✓ Сохранить'}
                  </button>
                  <button
                    onClick={handleCancel}
                    disabled={isSaving}
                    className="px-4 py-2 bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 text-sm font-medium rounded hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    ✕ Отмена
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar на всю ширину строки */}
        <div className="mt-4 w-full">
          <div className="relative pt-1">
            <div className="flex mb-2 items-center justify-between">
              <div className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-gray-600 dark:text-gray-400">
                Прогресс миграции
                {isAdminOrManager && (
                  <span className="ml-2 text-xs font-normal text-gray-400 dark:text-gray-500">(кликните для изменения)</span>
                )}
              </div>
              <div className="text-right">
                <span className="text-xs font-semibold inline-block text-gray-600 dark:text-gray-400">
                  {item.progress}%
                </span>
              </div>
            </div>
            <div
              onClick={handleProgressClick}
              className={`overflow-hidden h-3 mb-4 text-xs flex rounded bg-gray-200 dark:bg-gray-700 ${
                isAdminOrManager ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''
              }`}
              title={isAdminOrManager ? 'Кликните для изменения прогресса' : ''}
            >
              <div
                style={{ width: `${item.progress}%` }}
                className={`shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center transition-all ${
                  item.progress < 50 ? 'bg-yellow-500' : item.progress < 100 ? 'bg-blue-500' : 'bg-green-500'
                }`}
              />
            </div>
          </div>
        </div>
      </td>
    </tr>
  );
};

export const MigrationsPage: React.FC = () => {
  const { isAuthenticated, isAdminOrManager } = useAuth();
  const [migrationItems, setMigrationItems] = useState<MigrationItem[]>([]);
  const [snapshots, setSnapshots] = useState<MigrationSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'backlog' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<MigrationStatistics | null>(null);
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'migrations' | 'completed'>('migrations');

  // Состояние для модального окна очистки архива
  const [isClearModalOpen, setIsClearModalOpen] = useState(false);
  const [clearConfirmText, setClearConfirmText] = useState('');
  const [isClearing, setIsClearing] = useState(false);

  // Пагинация для активных миграций
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(50);

  // Пагинация и поиск для завершенных миграций
  const [completedCurrentPage, setCompletedCurrentPage] = useState(1);
  const [completedItemsPerPage, setCompletedItemsPerPage] = useState(50);
  const [completedSearchTerm, setCompletedSearchTerm] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchData = async () => {
      try {
        setLoading(true);
        const [metadataResponse, statsResponse, snapshotsResponse] = await Promise.all([
          migrationMetadataApi.getAll(true),
          migrationMetadataApi.getStatistics(),
          migrationSnapshotsApi.getAll(),
        ]);
        setMigrationItems(metadataResponse);
        setStats(statsResponse);
        setSnapshots(snapshotsResponse);
        // Инициализируем порядок отображения: сначала активные (не бэклог), потом бэклог
        const sorted = [...metadataResponse].sort((a, b) => {
          // Активные элементы (не бэклог) выше бэклога
          const aIsBacklog = !a.hasMetadata || a.status === 'backlog';
          const bIsBacklog = !b.hasMetadata || b.status === 'backlog';
          if (aIsBacklog && !bIsBacklog) return 1;
          if (!aIsBacklog && bIsBacklog) return -1;
          // Внутри групп сортируем по priority
          return a.priority - b.priority;
        });
        setDisplayOrder(sorted.map(i => i.metadataId));
      } catch (err: any) {
        console.error('Ошибка загрузки данных:', err);
        setError(err.response?.data?.message || 'Ошибка загрузки данных');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isAuthenticated]);

  // Синхронизация displayOrder при изменении migrationItems
  useEffect(() => {
    if (migrationItems.length > 0 && displayOrder.length === 0) {
      const sorted = [...migrationItems].sort((a, b) => a.priority - b.priority);
      setDisplayOrder(sorted.map(i => i.metadataId));
    }
  }, [migrationItems]);

  // Отфильтрованные элементы (без пагинации) - для SortableContext
  const filteredItemsNoPagination = useMemo(() => {
    const items = migrationItems.filter(item => {
      if (filter === 'active') {
        if (item.status === 'completed') return false;
        if (item.status === 'backlog' || !item.hasMetadata) return false;
      }
      if (filter === 'completed' && item.status !== 'completed') return false;
      if (filter === 'backlog') {
        if (item.status !== 'backlog' && item.hasMetadata) return false;
      }
      if (searchTerm && !item.techName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    const orderMap = new Map(displayOrder.map((id, index) => [id, index]));
    return items.sort((a, b) => {
      const aIndex = orderMap.get(a.metadataId) ?? 999999;
      const bIndex = orderMap.get(b.metadataId) ?? 999999;
      return aIndex - bIndex;
    });
  }, [migrationItems, filter, searchTerm, displayOrder]);

  // Элементы для отображения (с пагинацией)
  const filteredItems = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredItemsNoPagination.slice(startIndex, endIndex);
  }, [filteredItemsNoPagination, currentPage, itemsPerPage]);

  // Фильтрация и пагинация для завершенных миграций (снапшоты)
  const filteredSnapshots = useMemo(() => {
    const items = snapshots.filter(snapshot => {
      if (completedSearchTerm && !snapshot.techName.toLowerCase().includes(completedSearchTerm.toLowerCase())) return false;
      return true;
    });

    // Применяем пагинацию
    const startIndex = (completedCurrentPage - 1) * completedItemsPerPage;
    const endIndex = startIndex + completedItemsPerPage;
    return items.slice(startIndex, endIndex);
  }, [snapshots, completedSearchTerm, completedCurrentPage, completedItemsPerPage]);

  // Подсчет общего количества элементов для пагинации
  const activeMigrationsTotalCount = useMemo(() => {
    return migrationItems.filter(item => {
      if (filter === 'active') {
        if (item.status === 'completed') return false;
        if (item.status === 'backlog' || !item.hasMetadata) return false;
      }
      if (filter === 'completed' && item.status !== 'completed') return false;
      if (filter === 'backlog') {
        if (item.status !== 'backlog' && item.hasMetadata) return false;
      }
      if (searchTerm && !item.techName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    }).length;
  }, [migrationItems, filter, searchTerm, displayOrder]);

  const snapshotsTotalCount = useMemo(() => {
    return snapshots.filter(snapshot => {
      if (completedSearchTerm && !snapshot.techName.toLowerCase().includes(completedSearchTerm.toLowerCase())) return false;
      return true;
    }).length;
  }, [snapshots, completedSearchTerm]);

  const handleSaveFields = async (techRadarId: string, fields: { versionToUpdate?: string; versionUpdateDeadline?: string; upgradePath?: string; recommendedAlternatives?: string }) => {
    // Преобразуем recommendedAlternatives в формат для API (simple-array)
    const updateFields: any = { ...fields };
    if (updateFields.recommendedAlternatives !== undefined) {
      updateFields.recommendedAlternatives = String(updateFields.recommendedAlternatives);
    }

    await techRadarApi.update(techRadarId, updateFields);
    
    // Находим элемент и создаём для него метаданные если их нет
    const item = migrationItems.find(i => i.techRadarId === techRadarId);
    if (item && !item.hasMetadata) {
      // Создаём сущность метаданных со статусом backlog
      try {
        const response = await migrationMetadataApi.updateWithTechRadarId(techRadarId, { 
          status: 'backlog',
          progress: 0,
          priority: item.priority 
        });
        setMigrationItems((prev: MigrationItem[]) => prev.map((prevItem: MigrationItem) =>
          prevItem.techRadarId === techRadarId 
            ? { ...prevItem, ...fields, hasMetadata: true, metadataId: response.id } 
            : prevItem
        ));
        return;
      } catch (err: any) {
        console.error('Ошибка создания метаданных:', err);
      }
    }
    
    setMigrationItems((prev: MigrationItem[]) => prev.map((item: MigrationItem) =>
      item.techRadarId === techRadarId ? { ...item, ...fields } : item
    ));
  };

  const handleUpdateMetadata = async (
    _metadataId: string,
    techRadarId: string,
    _hasMetadata: boolean,
    dto: { priority?: number; status?: MigrationStatus; progress?: number }
  ) => {
    try {
      // Всегда используем upsert - backend создаст или обновит запись
      const response = await migrationMetadataApi.updateWithTechRadarId(techRadarId, dto);
      
      // Обновляем локальное состояние
      setMigrationItems(prev => prev.map(item =>
        item.techRadarId === techRadarId
          ? { ...item, ...dto, hasMetadata: true, metadataId: response.id }
          : item
      ));
    } catch (err: any) {
      console.error('Ошибка обновления метаданных:', err);
      throw err;
    }
  };

  const handleCompleteMigration = async (item: MigrationItem) => {
    if (!isAdminOrManager) return;

    if (!window.confirm(`Завершить миграцию "${item.techName}"?\n\nМетаданные миграции будут перемещены в архив и удалены из активного списка.`)) {
      return;
    }

    try {
      await migrationSnapshotsApi.completeMigration(item.techRadarId, {
        techName: item.techName,
        versionBefore: item.currentVersion,
        versionAfter: item.versionToUpdate || undefined,
        deadline: item.versionUpdateDeadline || undefined,
        upgradePath: item.upgradePath || undefined,
        recommendedAlternatives: item.recommendedAlternatives || undefined,
      });

      // Удаляем из локального состояния
      setMigrationItems(prev => prev.filter(i => i.techRadarId !== item.techRadarId));
      alert('Миграция завершена и перемещена в архив');
    } catch (err: any) {
      console.error('Ошибка завершения миграции:', err);
      alert('Ошибка завершения миграции: ' + (err.response?.data?.message || err.message));
    }
  };

  const handleClearArchive = async () => {
    if (clearConfirmText !== 'ТОЧНО УДАЛИТЬ') {
      alert('Для подтверждения введите "ТОЧНО УДАЛИТЬ"');
      return;
    }

    setIsClearing(true);
    try {
      const result = await migrationSnapshotsApi.deleteAll();
      setSnapshots([]);
      setIsClearModalOpen(false);
      setClearConfirmText('');
      alert(`Архив очищен. Удалено ${result.deletedCount} записей.`);
    } catch (err: any) {
      console.error('Ошибка очистки архива:', err);
      alert('Ошибка очистки архива: ' + (err.response?.data?.message || err.message));
    } finally {
      setIsClearing(false);
    }
  };

  const handleExportActiveMigrationsCsv = () => {
    exportToCsv<MigrationItem>({
      data: filteredItemsNoPagination,
      columns: [
        { key: 'techName', label: 'Технология' },
        { key: 'currentVersion', label: 'Текущая версия' },
        { key: 'versionToUpdate', label: 'Версия для обновления', format: (_, row) => row.versionToUpdate || '-' },
        { key: 'versionUpdateDeadline', label: 'Дедлайн', format: (_, row) => row.versionUpdateDeadline ? new Date(row.versionUpdateDeadline).toLocaleDateString('ru-RU') : '-' },
        { key: 'status', label: 'Статус', format: (_, row) => {
          const statusMap: Record<MigrationStatus, string> = {
            backlog: 'Бэклог',
            planned: 'Запланировано',
            in_progress: 'В работе',
            completed: 'Выполнено',
          };
          return statusMap[row.status] || String(row.status);
        }},
        { key: 'progress', label: 'Прогресс', format: (_, row) => `${row.progress || 0}%` },
        { key: 'upgradePath', label: 'Путь обновления', format: (_, row) => row.upgradePath || '-' },
        { key: 'recommendedAlternatives', label: 'Альтернативы', format: (_, row) => {
          if (!row.recommendedAlternatives) return '-';
          try {
            const arr = typeof row.recommendedAlternatives === 'string' && row.recommendedAlternatives.startsWith('[') ? JSON.parse(row.recommendedAlternatives) : row.recommendedAlternatives.split(',');
            return Array.isArray(arr) ? arr.join(', ') : String(row.recommendedAlternatives);
          } catch {
            return String(row.recommendedAlternatives);
          }
        }},
      ],
      filename: `active-migrations-export-${new Date().toISOString().split('T')[0]}`,
    });
  };

  const handleExportCompletedMigrationsCsv = () => {
    exportToCsv<MigrationSnapshot>({
      data: snapshots,
      columns: [
        { key: 'techName', label: 'Технология' },
        { key: 'versionBefore', label: 'Версия до' },
        { key: 'versionAfter', label: 'Версия после', format: (_, row) => row.versionAfter || '-' },
        { key: 'deadline', label: 'Дедлайн', format: (_, row) => row.deadline ? new Date(row.deadline).toLocaleDateString('ru-RU') : '-' },
        { key: 'upgradePath', label: 'Путь обновления', format: (_, row) => row.upgradePath || '-' },
        { key: 'recommendedAlternatives', label: 'Альтернативы', format: (_, row) => row.recommendedAlternatives || '-' },
        { key: 'completedAt', label: 'Завершена', format: (_, row) => row.completedAt ? new Date(row.completedAt).toLocaleDateString('ru-RU') : '-' },
      ],
      filename: `completed-migrations-export-${new Date().toISOString().split('T')[0]}`,
    });
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!isAdminOrManager) return;

    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = displayOrder.indexOf(active.id as string);
      const newIndex = displayOrder.indexOf(over.id as string);

      if (oldIndex !== -1 && newIndex !== -1) {
        // Обновляем порядок отображения
        const newDisplayOrder = arrayMove(displayOrder, oldIndex, newIndex);
        setDisplayOrder(newDisplayOrder);

        // Разделяем элементы на активные (не бэклог) и бэклог
        const activeItems = newDisplayOrder.filter(id => {
          const item = migrationItems.find(i => i.metadataId === id);
          return item && item.hasMetadata && item.status !== 'backlog';
        });
        const backlogItems = newDisplayOrder.filter(id => {
          const item = migrationItems.find(i => i.metadataId === id);
          return item && (!item.hasMetadata || item.status === 'backlog');
        });

        // Активные элементы вверху, бэклог внизу
        const finalOrder = [...activeItems, ...backlogItems];
        setDisplayOrder(finalOrder);

        // Получаем новые priority только для активных элементов
        const priorities = activeItems
          .map((id, index) => {
            const item = migrationItems.find(i => i.metadataId === id);
            if (item) {
              return { id, priority: index };
            }
            return null;
          })
          .filter((p): p is { id: string; priority: number } => p !== null);

        // Создаем карту techRadarIds для элементов без метаданных
        const techRadarIds: Record<string, string> = {};
        finalOrder.forEach((id) => {
          const item = migrationItems.find(i => i.metadataId === id);
          if (item && !item.hasMetadata) {
            techRadarIds[id] = item.techRadarId;
          }
        });

        // Отправляем на сервер
        if (priorities.length > 0) {
          try {
            await migrationMetadataApi.updatePriorities(priorities, techRadarIds);
          } catch (err: any) {
            console.error('Ошибка обновления приоритетов:', err);
          }
        }
      }
    }
  };

  const getStatusColor = (status: MigrationStatus) => {
    const colors: Record<string, string> = {
      backlog: 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300',
      planned: 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      in_progress: 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      completed: 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
    };
    return colors[status] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  };

  if (!isAuthenticated) {
    return null;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600 dark:text-gray-400">Загрузка...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error}</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
            >
              Попробовать снова
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200">
      <div className="max-w-[1600px] mx-auto px-4 py-8">
        {/* Заголовок */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Миграции</h1>
          <p className="text-gray-600 dark:text-gray-400">
            План миграции и обновления технологий
            {isAdminOrManager && (
              <span className="ml-2 text-xs text-blue-600 dark:text-blue-400">
                (перетаскивайте для изменения приоритета)
              </span>
            )}
          </p>
        </div>

        {/* Вкладки */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-gray-200 dark:border-gray-700 items-center">
            <button
              onClick={() => setActiveTab('migrations')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'migrations'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Активные миграции
            </button>
            <button
              onClick={() => setActiveTab('completed')}
              className={`px-4 py-2 text-sm font-medium transition-colors border-b-2 ${
                activeTab === 'completed'
                  ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                  : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
              }`}
            >
              Завершенные ({snapshots.length})
            </button>
            <div className="flex-1" />
            {activeTab === 'migrations' ? (
              <button
                onClick={handleExportActiveMigrationsCsv}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1.5"
                title="Скачать все данные в CSV"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать CSV
              </button>
            ) : (
              <button
                onClick={handleExportCompletedMigrationsCsv}
                className="px-3 py-1.5 text-xs bg-green-600 hover:bg-green-700 text-white rounded transition-colors flex items-center gap-1.5"
                title="Скачать все данные в CSV"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Скачать CSV
              </button>
            )}
          </div>
        </div>

        {/* Статистика - показываем только на вкладке миграций */}
        {stats && activeTab === 'migrations' && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 transition-colors duration-200">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Всего</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats.total}</p>
            </div>
            <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 transition-colors duration-200">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">В работе</p>
              <p className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.byStatus.in_progress || 0}</p>
            </div>
            <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 transition-colors duration-200">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Запланировано</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{stats.byStatus.planned || 0}</p>
            </div>
            <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 transition-colors duration-200">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Бэклог</p>
              <p className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {(stats.byStatus.backlog || 0) + migrationItems.filter(i => !i.hasMetadata).length}
              </p>
            </div>
            <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 transition-colors duration-200">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Выполнено</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{stats.completedCount}</p>
            </div>
          </div>
        )}

        {/* Фильтры - только для вкладки активных миграций */}
        {activeTab === 'migrations' && (
          <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 mb-6 transition-colors duration-200">
            <div className="flex flex-wrap gap-4 items-center justify-between">
              <div className="flex gap-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filter === 'all'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Все ({migrationItems.length})
                </button>
                <button
                  onClick={() => setFilter('active')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filter === 'active'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Активные ({migrationItems.filter(i => i.status !== 'completed' && i.status !== 'backlog' && i.hasMetadata).length})
                </button>
                <button
                  onClick={() => setFilter('backlog')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filter === 'backlog'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Бэклог ({migrationItems.filter(i => i.status === 'backlog' || !i.hasMetadata).length})
                </button>
                <button
                  onClick={() => setFilter('completed')}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    filter === 'completed'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  Выполнено ({migrationItems.filter(i => i.status === 'completed').length})
                </button>
              </div>
              <input
                type="text"
                placeholder="Поиск технологии..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Поиск - только для вкладки завершенных */}
        {activeTab === 'completed' && (
          <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-4 mb-6 transition-colors duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Поиск по архиву</h3>
              <input
                type="text"
                placeholder="Поиск технологии..."
                value={completedSearchTerm}
                onChange={(e) => {
                  setCompletedSearchTerm(e.target.value);
                  setCompletedCurrentPage(1);
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>
        )}

        {/* Таблица миграций - показывается только на вкладке активных */}
        {activeTab === 'migrations' && (
          <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden transition-colors duration-200">
            <div className="p-4">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <SortableContext
                  items={filteredItemsNoPagination.map(i => i.metadataId)}
                  strategy={verticalListSortingStrategy}
                >
                  <table className="w-full">
                    <tbody>
                      {filteredItems.length === 0 ? (
                        <tr>
                          <td className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                            Нет данных для отображения
                          </td>
                        </tr>
                      ) : (
                        filteredItems.map((item) => (
                          <SortableRow
                          key={item.metadataId}
                          item={item}
                          isAdminOrManager={isAdminOrManager}
                          canDrag={item.hasMetadata && item.status !== 'backlog'}
                          onCompleteMigration={handleCompleteMigration}
                          onUpdateStatus={(metadataId, techRadarId, hasMetadata, status) => handleUpdateMetadata(metadataId, techRadarId, hasMetadata, { status })}
                          onUpdateProgress={(metadataId, techRadarId, hasMetadata, progress) => handleUpdateMetadata(metadataId, techRadarId, hasMetadata, { progress })}
                          onSaveFields={handleSaveFields}
                          getStatusColor={getStatusColor}
                        />
                      ))
                    )}
                  </tbody>
                </table>
              </SortableContext>
            </DndContext>
          </div>

          {/* Пагинация для активных миграций */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            <Pagination
              currentPage={currentPage}
              totalPages={Math.ceil(activeMigrationsTotalCount / itemsPerPage)}
              totalItems={activeMigrationsTotalCount}
              itemsPerPage={itemsPerPage}
              onPageChange={(page) => {
                setCurrentPage(page);
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              onItemsPerPageChange={(perPage) => {
                setItemsPerPage(perPage);
                setCurrentPage(1);
              }}
              showTotal
              showQuickJumper
            />
          </div>
        </div>
        )}

        {/* Таблица завершенных миграций */}
        {activeTab === 'completed' && (
          <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden transition-colors duration-200 mt-6">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Архив завершенных миграций</h2>
                {isAdminOrManager && snapshotsTotalCount > 0 && (
                  <Button
                    onClick={() => setIsClearModalOpen(true)}
                    variant="danger"
                    size="sm"
                  >
                    🗑 Очистить архив
                  </Button>
                )}
              </div>
              {snapshotsTotalCount === 0 ? (
                <p className="text-gray-500 dark:text-gray-400 text-center py-8">Нет завершенных миграций</p>
              ) : (
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-gray-800">
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Технология</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Версия до</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Версия после</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Путь обновления</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Завершена</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSnapshots.map((snapshot) => (
                      <tr
                        key={snapshot.id}
                        className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                      >
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="font-medium text-gray-900 dark:text-gray-100">{snapshot.techName}</span>
                            {snapshot.recommendedAlternatives && (
                              <span className="text-xs text-gray-500 dark:text-gray-400">
                                Альтернативы: {snapshot.recommendedAlternatives}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded font-mono text-xs text-gray-700 dark:text-gray-300">
                            {snapshot.versionBefore}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {snapshot.versionAfter ? (
                            <span className="px-2 py-1 bg-green-100 dark:bg-green-900/20 rounded font-mono text-xs text-green-700 dark:text-green-300">
                              {snapshot.versionAfter}
                            </span>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {snapshot.upgradePath ? (
                            <div className="text-sm text-gray-600 dark:text-gray-400 max-w-md truncate" title={snapshot.upgradePath}>
                              {snapshot.upgradePath}
                            </div>
                          ) : (
                            <span className="text-gray-400 dark:text-gray-500 text-xs">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(snapshot.completedAt).toLocaleDateString('ru-RU', {
                              day: 'numeric',
                              month: 'short',
                              year: '2-digit',
                            })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Пагинация для завершенных миграций */}
            <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
              <Pagination
                currentPage={completedCurrentPage}
                totalPages={Math.ceil(snapshotsTotalCount / completedItemsPerPage)}
                totalItems={snapshotsTotalCount}
                itemsPerPage={completedItemsPerPage}
                onPageChange={(page) => {
                  setCompletedCurrentPage(page);
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                onItemsPerPageChange={(perPage) => {
                  setCompletedItemsPerPage(perPage);
                  setCompletedCurrentPage(1);
                }}
                showTotal
                showQuickJumper
              />
            </div>
          </div>
        )}

        {/* Модальное окно подтверждения очистки архива */}
        <Modal
          isOpen={isClearModalOpen}
          onClose={() => {
            setIsClearModalOpen(false);
            setClearConfirmText('');
          }}
          title="Очистка архива завершенных миграций"
          size="md"
        >
          <div className="space-y-4">
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
              <p className="text-red-700 dark:text-red-400 font-medium">
                ⚠️ Внимание! Это действие необратимо удалит все завершенные миграции из архива.
              </p>
            </div>

            <p className="text-gray-700 dark:text-gray-300">
              Для подтверждения удаления введите текст ниже:
            </p>

            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                Введите "ТОЧНО УДАЛИТЬ"
              </label>
              <input
                type="text"
                value={clearConfirmText}
                onChange={(e) => setClearConfirmText(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-red-500 focus:border-red-500"
                placeholder="ТОЧНО УДАЛИТЬ"
                disabled={isClearing}
              />
            </div>

            <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={handleClearArchive}
                variant="danger"
                disabled={clearConfirmText !== 'ТОЧНО УДАЛИТЬ' || isClearing}
              >
                {isClearing ? 'Удаление...' : 'Удалить все снапшоты'}
              </Button>
              <Button
                onClick={() => {
                  setIsClearModalOpen(false);
                  setClearConfirmText('');
                }}
                variant="secondary"
                disabled={isClearing}
              >
                Отмена
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};
