import React, { useState, useMemo } from 'react';
import type { TechRadarEntity, TechRadarCategory, TechRadarType } from '../types';

interface TechRadarTableProps {
  data: TechRadarEntity[];
  radarCategory?: TechRadarCategory;
  radarType?: TechRadarType;
  onRowClick?: (entity: TechRadarEntity) => void;
  onRadarFilter?: (category?: TechRadarCategory, type?: TechRadarType) => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  adopt: '#00C49F',
  trial: '#4DB8FF',
  assess: '#FFBB28',
  hold: '#FF8042',
  drop: '#FF4444',
};

const RISK_COLORS: Record<string, string> = {
  low: '#00C49F',
  medium: '#FFBB28',
  high: '#FF8042',
  critical: '#FF4444',
};

type SortField = 'name' | 'version' | 'category' | 'riskLevel' | 'type' | 'subtype' | 'license' | 'owner' | 'versionUpdateDeadline';
type SortOrder = 'asc' | 'desc';

export const TechRadarTable: React.FC<TechRadarTableProps> = ({ data, radarCategory, radarType, onRowClick, onRadarFilter }) => {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filters, setFilters] = useState({
    name: '',
    version: '',
    category: '',
    riskLevel: '',
    type: '',
    subtype: '',
    license: '',
    owner: '',
  });
  // Сортировка по умолчанию: по дате обновления (чем ближе дата, тем выше)
  const [sortField, setSortField] = useState<SortField>('versionUpdateDeadline');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');

  const filteredData = useMemo(() => {
    return data.filter(entity => {
      const nameMatch = entity.name.toLowerCase().includes(filters.name.toLowerCase());
      const versionMatch = entity.version.toLowerCase().includes(filters.version.toLowerCase());
      const categoryMatch = !filters.category || entity.category === filters.category;
      const riskMatch = !filters.riskLevel || entity.riskLevel === filters.riskLevel;
      const typeMatch = !filters.type || entity.type === filters.type;
      const subtypeMatch = !filters.subtype || entity.subtype === filters.subtype;
      const licenseMatch = !filters.license || entity.license.toLowerCase().includes(filters.license.toLowerCase());
      const ownerMatch = entity.owner.toLowerCase().includes(filters.owner.toLowerCase());
      return nameMatch && versionMatch && categoryMatch && riskMatch && typeMatch && subtypeMatch && licenseMatch && ownerMatch;
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    return [...filteredData].sort((a, b) => {
      // Специальная сортировка для versionUpdateDeadline - по близости к текущей дате
      if (sortField === 'versionUpdateDeadline') {
        const now = new Date();
        const dateA = a.versionUpdateDeadline ? new Date(a.versionUpdateDeadline) : null;
        const dateB = b.versionUpdateDeadline ? new Date(b.versionUpdateDeadline) : null;
        
        // Записи без даты в конце
        if (!dateA && !dateB) return 0;
        if (!dateA) return 1;
        if (!dateB) return -1;
        
        // Считаем разницу в днях от текущей даты
        const diffA = Math.abs(dateA.getTime() - now.getTime());
        const diffB = Math.abs(dateB.getTime() - now.getTime());
        
        // Чем меньше разница (ближе дата), тем выше в списке
        return sortOrder === 'asc' ? diffA - diffB : diffB - diffA;
      }
      
      // Стандартная сортировка для остальных полей
      const aVal = String(a[sortField] || '').toLowerCase();
      const bVal = String(b[sortField] || '').toLowerCase();
      const cmp = aVal.localeCompare(bVal, 'ru');
      return sortOrder === 'asc' ? cmp : -cmp;
    });
  }, [filteredData, sortField, sortOrder]);

  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = sortedData.slice(startIndex, endIndex);

  const uniqueTypes = useMemo(() => Array.from(new Set(data.map(d => d.type))), [data]);
  const uniqueSubtypes = useMemo(() => Array.from(new Set(data.map(d => d.subtype).filter(Boolean))), [data]);
  const uniqueCategories = useMemo(() => Array.from(new Set(data.map(d => d.category))), [data]);
  const uniqueRisks = useMemo(() => Array.from(new Set(data.map(d => d.riskLevel))), [data]);

  const clearFilters = () => {
    setFilters({ name: '', version: '', category: '', riskLevel: '', type: '', subtype: '', license: '', owner: '' });
    setPage(1);
    if (onRadarFilter) {
      onRadarFilter(undefined, undefined);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const goToPage = (newPage: number) => {
    if (newPage >= 1 && newPage <= totalPages) {
      setPage(newPage);
    }
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) return <span className="text-gray-300 dark:text-gray-600 ml-1">⇅</span>;
    return <span className="ml-1">{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  if (!data || data.length === 0) {
    return <p className="text-gray-600 dark:text-gray-400 text-center py-5">Нет данных</p>;
  }

  return (
    <div className="bg-white dark:bg-[#16213e] rounded-lg overflow-hidden shadow-md transition-colors duration-200">
      {/* Индикатор активных фильтров радара */}
      {(radarCategory || radarType) && (
        <div className="px-4 py-2.5 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
          <div className="flex gap-2 flex-wrap">
            {radarCategory && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium" style={{ background: CATEGORY_COLORS[radarCategory] + '20', color: CATEGORY_COLORS[radarCategory] }}>
                Категория: {radarCategory}
              </span>
            )}
            {radarType && (
              <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300">
                Тип: {radarType}
              </span>
            )}
          </div>
          <button
            onClick={clearFilters}
            className="px-2.5 py-1 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-none rounded cursor-pointer transition-colors"
          >
            ✕ Сбросить
          </button>
        </div>
      )}

      <div className="p-4 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
        {/* Фильтры в порядке колонок */}
        <div className="grid grid-cols-8 gap-2 mb-3">
          <input
            type="text"
            placeholder="Название..."
            value={filters.name}
            onChange={(e) => { setFilters({ ...filters, name: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Версия..."
            value={filters.version}
            onChange={(e) => { setFilters({ ...filters, version: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <select
            value={filters.category}
            onChange={(e) => { setFilters({ ...filters, category: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все категории</option>
            {uniqueCategories.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <select
            value={filters.riskLevel}
            onChange={(e) => { setFilters({ ...filters, riskLevel: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все риски</option>
            {uniqueRisks.map(r => <option key={r} value={r}>{r}</option>)}
          </select>
          <select
            value={filters.type}
            onChange={(e) => { setFilters({ ...filters, type: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все типы</option>
            {uniqueTypes.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select
            value={filters.subtype}
            onChange={(e) => { setFilters({ ...filters, subtype: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Все подтипы</option>
            {uniqueSubtypes.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <input
            type="text"
            placeholder="Лицензия..."
            value={filters.license}
            onChange={(e) => { setFilters({ ...filters, license: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <input
            type="text"
            placeholder="Владелец..."
            value={filters.owner}
            onChange={(e) => { setFilters({ ...filters, owner: e.target.value }); setPage(1); }}
            className="px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs w-full bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>
        <div className="flex justify-between items-center">
          <span className="text-xs text-gray-600 dark:text-gray-400">
            Найдено: {filteredData.length} из {data.length}
          </span>
          <button
            onClick={clearFilters}
            className="px-3 py-1.5 text-xs bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 border-none rounded cursor-pointer text-gray-700 dark:text-gray-300 transition-colors"
          >
            Сбросить фильтры
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[1000px] border-collapse">
          <thead className="bg-gray-50 dark:bg-gray-800">
            <tr>
              <th onClick={() => handleSort('name')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Название <SortIcon field="name" />
              </th>
              <th onClick={() => handleSort('version')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Версия <SortIcon field="version" />
              </th>
              <th onClick={() => handleSort('versionUpdateDeadline')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Обновление <SortIcon field="versionUpdateDeadline" />
              </th>
              <th onClick={() => handleSort('category')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Категория <SortIcon field="category" />
              </th>
              <th onClick={() => handleSort('riskLevel')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Риск <SortIcon field="riskLevel" />
              </th>
              <th onClick={() => handleSort('type')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Тип <SortIcon field="type" />
              </th>
              <th onClick={() => handleSort('subtype')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Подтип <SortIcon field="subtype" />
              </th>
              <th onClick={() => handleSort('license')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Лицензия <SortIcon field="license" />
              </th>
              <th onClick={() => handleSort('owner')} className="px-3 py-2.5 text-left text-[11px] font-semibold text-gray-600 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700 cursor-pointer select-none whitespace-nowrap hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                Владелец <SortIcon field="owner" />
              </th>
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((entity) => (
              <tr
                key={entity.id}
                onClick={() => onRowClick?.(entity)}
                className={`border-b border-gray-200 dark:border-gray-700 transition-colors ${onRowClick ? 'cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800' : ''}`}
              >
                <td className="px-3 py-2.5 text-sm">
                  <span className="font-medium text-gray-900 dark:text-gray-100">{entity.name}</span>
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <span className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded font-mono text-gray-900 dark:text-gray-100">{entity.version}</span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">
                  {entity.versionUpdateDeadline ? (
                    <div className="flex flex-col gap-0.5">
                      {entity.versionToUpdate && (
                        <span className="font-medium text-red-600 dark:text-red-400">{entity.versionToUpdate}</span>
                      )}
                      <span className={`text-[10px] ${
                        new Date(entity.versionUpdateDeadline) < new Date() 
                          ? 'text-red-600 dark:text-red-400 font-semibold' 
                          : 'text-gray-500 dark:text-gray-500'
                      }`}>
                        до {new Date(entity.versionUpdateDeadline).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', year: '2-digit' })}
                      </span>
                    </div>
                  ) : (
                    <span className="text-gray-300 dark:text-gray-600">—</span>
                  )}
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium text-xs" style={{ background: CATEGORY_COLORS[entity.category] + '20', color: CATEGORY_COLORS[entity.category] }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: CATEGORY_COLORS[entity.category] }} />
                    {entity.category}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs">
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full font-medium text-xs" style={{ background: RISK_COLORS[entity.riskLevel] + '20', color: RISK_COLORS[entity.riskLevel] }}>
                    <span className="w-1 h-1 rounded-full" style={{ background: RISK_COLORS[entity.riskLevel] }} />
                    {entity.riskLevel}
                  </span>
                </td>
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{entity.type}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{entity.subtype || '—'}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{entity.license}</td>
                <td className="px-3 py-2.5 text-xs text-gray-600 dark:text-gray-400">{entity.owner}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-600 dark:text-gray-400">Показывать:</span>
          <select 
            value={pageSize} 
            onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }} 
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
          >
            <option value={10}>10</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
            <option value={9999}>Все</option>
          </select>
        </div>
        <div className="flex items-center gap-1">
          <button 
            onClick={() => goToPage(1)} 
            disabled={page === 1} 
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Первая
          </button>
          <button 
            onClick={() => goToPage(page - 1)} 
            disabled={page === 1} 
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            ←
          </button>
          <span className="text-xs px-2 text-gray-600 dark:text-gray-400">Стр. {page} из {totalPages || 1}</span>
          <button 
            onClick={() => goToPage(page + 1)} 
            disabled={page === totalPages} 
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            →
          </button>
          <button 
            onClick={() => goToPage(totalPages)} 
            disabled={page === totalPages} 
            className="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 disabled:cursor-not-allowed disabled:opacity-50 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors"
          >
            Последняя
          </button>
        </div>
      </div>
    </div>
  );
};
