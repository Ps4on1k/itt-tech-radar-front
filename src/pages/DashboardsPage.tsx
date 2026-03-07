import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Gauge } from '../ui/Gauge';
import { Tooltip, InfoIcon } from '../ui/Tooltip';
import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

interface DashboardMetrics {
  stackHealth: {
    badTechnologiesPercent: number;
    technologiesWithVulnerabilitiesPercent: number;
    technologiesNeedingUpdatePercent: number;
    totalTechnologies: number;
  };
  cto: {
    adoptTrialPercent: number;
    holdDropPercent: number;
    technologiesByCategory: Record<string, number>;
  };
  devops: {
    documentationPercent: number;
    internalGuidePercent: number;
    vendorLockInPercent: number;
  };
  infosec: {
    vulnerabilitiesCount: number;
    highRiskPercent: number;
    criticalRiskPercent: number;
  };
  development: {
    technologiesByType: Record<string, number>;
    examplesPercent: number;
    averageCommunitySize: number;
  };
}

const MetricCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple' | 'orange';
  tooltip?: string;
}> = ({ title, value, subtitle, color = 'blue', tooltip }) => {
  const colorClasses = {
    blue: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20',
    green: 'text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20',
    yellow: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20',
    red: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20',
    purple: 'text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20',
    orange: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20',
  };

  return (
    <Tooltip content={tooltip || ''}>
      <div className={`rounded-lg p-4 ${colorClasses[color]} transition-colors duration-200 cursor-help`}>
        <div className="flex items-center gap-2 mb-1">
          <p className="text-sm opacity-80">{title}</p>
          {tooltip && <InfoIcon className="opacity-60" />}
        </div>
        <p className="text-2xl font-bold">{value}</p>
        {subtitle && <p className="text-xs mt-1 opacity-70">{subtitle}</p>}
      </div>
    </Tooltip>
  );
};

export const DashboardsPage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchMetrics = async () => {
      try {
        setLoading(true);
        const response = await api.get('/dashboards/metrics');
        setMetrics(response.data);
      } catch (err: any) {
        console.error('Ошибка загрузки метрик:', err);
        setError(err.response?.data?.message || 'Ошибка загрузки метрик');
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [isAuthenticated]);

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

  if (error || !metrics) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-[#0f172a] transition-colors duration-200">
        <div className="max-w-[1400px] mx-auto px-4 py-8">
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6 text-center">
            <p className="text-red-600 dark:text-red-400 mb-4">{error || 'Ошибка загрузки данных'}</p>
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
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">Дашборды</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Мониторинг технологического стека для разных ролей
          </p>
        </div>

        {/* Stack Health - Gauge метрики */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span>🏥</span> Здоровье стека
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <Tooltip content="Процент технологий в категориях Hold или Drop от общего числа. Формула: (Hold + Drop) / Всего * 100">
              <div className="cursor-help">
                <Gauge
                  value={metrics.stackHealth.badTechnologiesPercent}
                  label="Hold/Drop технологии"
                  size="lg"
                  thresholds={{ good: 10, warning: 25 }}
                />
              </div>
            </Tooltip>
            <Tooltip content="Процент технологий с хотя бы одной уязвимостью безопасности. Формула: Тех с уязвимостями / Всего * 100">
              <div className="cursor-help">
                <Gauge
                  value={metrics.stackHealth.technologiesWithVulnerabilitiesPercent}
                  label="С уязвимостями"
                  size="lg"
                  thresholds={{ good: 5, warning: 15 }}
                />
              </div>
            </Tooltip>
            <Tooltip content="Процент технологий требующих обновления (есть versionToUpdate, устаревшая maturity или прошёл deadline). Формула: Требующих обновления / Всего * 100">
              <div className="cursor-help">
                <Gauge
                  value={metrics.stackHealth.technologiesNeedingUpdatePercent}
                  label="Требуют обновления"
                  size="lg"
                  thresholds={{ good: 20, warning: 40 }}
                />
              </div>
            </Tooltip>
          </div>
        </div>

        {/* CTO Metrics */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span>👔</span> Для CTO
            <Tooltip content="Метрики для принятия стратегических решений о технологическом стеке">
              <InfoIcon className="opacity-60 cursor-help" />
            </Tooltip>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="Всего технологий"
              value={metrics.stackHealth.totalTechnologies}
              color="blue"
              tooltip="Общее количество технологий в техрадаре"
            />
            <MetricCard
              title="Adopt/Trial"
              value={`${metrics.cto.adoptTrialPercent}%`}
              subtitle="Здоровые технологии"
              color="green"
              tooltip="Процент технологий рекомендованных к использованию (Adopt) или находящихся на стадии тестирования (Trial). Формула: (Adopt + Trial) / Всего * 100"
            />
            <MetricCard
              title="Hold/Drop"
              value={`${metrics.cto.holdDropPercent}%`}
              subtitle="Проблемные технологии"
              color="red"
              tooltip="Процент технологий которые следует избегать (Hold) или удалить (Drop). Формула: (Hold + Drop) / Всего * 100"
            />
            <div className="rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">По категориям</p>
              <div className="space-y-1">
                {Object.entries(metrics.cto.technologiesByCategory).map(([cat, count]) => (
                  <div key={cat} className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300 capitalize">{cat}</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DevOps Metrics */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span>⚙️</span> Для DevOps
            <Tooltip content="Метрики для оценки готовности инфраструктуры и документирования">
              <InfoIcon className="opacity-60 cursor-help" />
            </Tooltip>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="С документацией"
              value={`${metrics.devops.documentationPercent}%`}
              color="green"
              tooltip="Процент технологий с ссылкой на официальную документацию. Формула: С documentationUrl / Всего * 100"
            />
            <MetricCard
              title="С внутренним гайдом"
              value={`${metrics.devops.internalGuidePercent}%`}
              color="blue"
              tooltip="Процент технологий с внутренним руководством компании. Формула: С internalGuideUrl / Всего * 100"
            />
            <MetricCard
              title="Vendor Lock-in"
              value={`${metrics.devops.vendorLockInPercent}%`}
              subtitle="Зависимые технологии"
              color="orange"
              tooltip="Процент технологий с зависимостью от вендора. Формула: С vendorLockIn=true / Всего * 100"
            />
          </div>
        </div>

        {/* InfoSec Metrics */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span>🔒</span> Для InfoSec
            <Tooltip content="Метрики безопасности технологического стека">
              <InfoIcon className="opacity-60 cursor-help" />
            </Tooltip>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              title="Уязвимостей"
              value={metrics.infosec.vulnerabilitiesCount}
              subtitle="Общее количество"
              color="red"
              tooltip="Суммарное количество уязвимостей безопасности во всех технологиях"
            />
            <MetricCard
              title="Высокий риск"
              value={`${metrics.infosec.highRiskPercent}%`}
              color="orange"
              tooltip="Процент технологий с уровнем риска High. Формула: С riskLevel=high / Всего * 100"
            />
            <MetricCard
              title="Критический риск"
              value={`${metrics.infosec.criticalRiskPercent}%`}
              color="red"
              tooltip="Процент технологий с уровнем риска Critical. Формула: С riskLevel=critical / Всего * 100"
            />
          </div>
        </div>

        {/* Development Metrics */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md p-6 mb-8 transition-colors duration-200">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-6 flex items-center gap-2">
            <span>💻</span> Для команды разработки
            <Tooltip content="Метрики для разработчиков">
              <InfoIcon className="opacity-60 cursor-help" />
            </Tooltip>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <MetricCard
              title="С примерами"
              value={`${metrics.development.examplesPercent}%`}
              color="green"
              tooltip="Процент технологий с примерами использования. Формула: С usageExamples / Всего * 100"
            />
            <MetricCard
              title="Средний размер сообщества"
              value={metrics.development.averageCommunitySize.toLocaleString()}
              color="blue"
              tooltip="Средний размер сообщества вокруг технологий. Формула: Сумма communitySize / Всего"
            />
            <div className="rounded-lg p-4 bg-purple-50 dark:bg-purple-900/20 md:col-span-2">
              <p className="text-sm text-purple-600 dark:text-purple-400 mb-2">По типам</p>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(metrics.development.technologiesByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="text-purple-700 dark:text-purple-300">{type}</span>
                    <span className="font-semibold text-purple-900 dark:text-purple-100">{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
