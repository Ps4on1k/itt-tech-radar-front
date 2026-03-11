import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { techRadarApi, migrationMetadataApi } from '../services/api';
import type { TechRadarEntity, MigrationMetadataView, MigrationStatus, MigrationStatistics } from '../types';
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
}

const SortableRow: React.FC<SortableRowProps> = ({
  item,
  isAdminOrManager,
  onUpdateStatus,
  onUpdateProgress,
  onSaveFields,
  getStatusColor,
  canDrag,
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

                {/* Статус */}
                <div className="mt-3">
                  {getStatusBadge()}
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'backlog' | 'completed'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [stats, setStats] = useState<MigrationStatistics | null>(null);
  const [displayOrder, setDisplayOrder] = useState<string[]>([]);

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
        const [metadataResponse, statsResponse] = await Promise.all([
          migrationMetadataApi.getAll(true),
          migrationMetadataApi.getStatistics(),
        ]);
        setMigrationItems(metadataResponse);
        setStats(statsResponse);
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

  const filteredItems = useMemo(() => {
    // Сначала фильтруем по статусу и поиску
    const items = migrationItems.filter(item => {
      // Фильтр по статусу
      if (filter === 'active') {
        // Активные = не completed и не backlog (включая без статуса)
        if (item.status === 'completed') return false;
        if (item.status === 'backlog' || !item.hasMetadata) return false;
      }
      if (filter === 'completed' && item.status !== 'completed') return false;
      if (filter === 'backlog') {
        // Бэклог = backlog + без статуса (hasMetadata = false)
        if (item.status !== 'backlog' && item.hasMetadata) return false;
      }
      
      // Поиск по названию
      if (searchTerm && !item.techName.toLowerCase().includes(searchTerm.toLowerCase())) return false;
      return true;
    });

    // Сортируем по displayOrder (порядку перетаскивания)
    const orderMap = new Map(displayOrder.map((id, index) => [id, index]));
    return items.sort((a, b) => {
      const aIndex = orderMap.get(a.metadataId) ?? 999999;
      const bIndex = orderMap.get(b.metadataId) ?? 999999;
      return aIndex - bIndex;
    });
  }, [migrationItems, filter, searchTerm, displayOrder]);

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

        {/* Статистика */}
        {stats && (
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

        {/* Фильтры */}
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

        {/* Таблица миграций */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden transition-colors duration-200">
          <div className="p-4">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={filteredItems.map(i => i.metadataId)}
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
        </div>
      </div>
    </div>
  );
};
