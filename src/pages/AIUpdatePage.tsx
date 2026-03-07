import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { aiConfigApi } from '../services/api';
import type { AIConfig, AIConfigGlobalSettings } from '../types';
import { Navigate } from 'react-router-dom';
import { useNotification } from '../hooks/useNotification';
import { Modal, Button, Input, Switch } from '../ui';

// Список всех полей TechRadar сущности с отображаемыми именами
const TECH_RADAR_FIELDS = [
  { fieldName: 'name', displayName: 'Название' },
  { fieldName: 'version', displayName: 'Версия' },
  { fieldName: 'versionReleaseDate', displayName: 'Дата выпуска версии' },
  { fieldName: 'type', displayName: 'Тип' },
  { fieldName: 'subtype', displayName: 'Подтип' },
  { fieldName: 'category', displayName: 'Категория' },
  { fieldName: 'description', displayName: 'Описание' },
  { fieldName: 'firstAdded', displayName: 'Дата первого добавления' },
  { fieldName: 'lastUpdated', displayName: 'Дата последнего обновления' },
  { fieldName: 'owner', displayName: 'Владелец' },
  { fieldName: 'stakeholders', displayName: 'Заинтересованные стороны' },
  { fieldName: 'dependencies', displayName: 'Зависимости' },
  { fieldName: 'maturity', displayName: 'Зрелость' },
  { fieldName: 'riskLevel', displayName: 'Уровень риска' },
  { fieldName: 'license', displayName: 'Лицензия' },
  { fieldName: 'usageExamples', displayName: 'Примеры использования' },
  { fieldName: 'documentationUrl', displayName: 'URL документации' },
  { fieldName: 'internalGuideUrl', displayName: 'URL внутреннего руководства' },
  { fieldName: 'adoptionRate', displayName: 'Уровень внедрения' },
  { fieldName: 'recommendedAlternatives', displayName: 'Рекомендуемые альтернативы' },
  { fieldName: 'relatedTechnologies', displayName: 'Связанные технологии' },
  { fieldName: 'endOfLifeDate', displayName: 'Дата окончания поддержки' },
  { fieldName: 'supportStatus', displayName: 'Статус поддержки' },
  { fieldName: 'upgradePath', displayName: 'Путь обновления' },
  { fieldName: 'performanceImpact', displayName: 'Влияние на производительность' },
  { fieldName: 'resourceRequirements', displayName: 'Требования к ресурсам' },
  { fieldName: 'securityVulnerabilities', displayName: 'Уязвимости безопасности' },
  { fieldName: 'complianceStandards', displayName: 'Стандарты соответствия' },
  { fieldName: 'communitySize', displayName: 'Размер сообщества' },
  { fieldName: 'contributionFrequency', displayName: 'Частота внесения изменений' },
  { fieldName: 'popularityIndex', displayName: 'Индекс популярности' },
  { fieldName: 'compatibility', displayName: 'Совместимость' },
  { fieldName: 'costFactor', displayName: 'Фактор стоимости' },
  { fieldName: 'vendorLockIn', displayName: 'Зависимость от вендора' },
  { fieldName: 'businessCriticality', displayName: 'Бизнес-критичность' },
  { fieldName: 'versionToUpdate', displayName: 'Версия для обновления' },
  { fieldName: 'versionUpdateDeadline', displayName: 'Срок обновления версии' },
];

const DEFAULT_PROMPT = 'Проведи анализ публичных доступных данных, сделай вывод и обнови это значение';

export const AIUpdatePage: React.FC = () => {
  const { isAdmin, isAuthenticated } = useAuth();
  const notification = useNotification();
  const [configs, setConfigs] = useState<AIConfig[]>([]);
  const [globalSettings, setGlobalSettings] = useState<AIConfigGlobalSettings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showGlobalSettingsModal, setShowGlobalSettingsModal] = useState(false);

  useEffect(() => {
    if (isAuthenticated && !isAdmin) {
      return;
    }
    loadData();
  }, [isAdmin, isAuthenticated]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [configsData, settingsData] = await Promise.all([
        aiConfigApi.getAll(),
        aiConfigApi.getGlobalSettings(),
      ]);
      
      // Создаем конфиги для всех полей, которых нет в базе
      const existingFieldNames = new Set(configsData.map(c => c.fieldName));
      const newConfigs = [...configsData];
      
      for (const field of TECH_RADAR_FIELDS) {
        if (!existingFieldNames.has(field.fieldName)) {
          const newConfig = await aiConfigApi.create({
            fieldName: field.fieldName,
            displayName: field.displayName,
            enabled: false,
            prompt: DEFAULT_PROMPT,
          });
          newConfigs.push(newConfig);
        }
      }
      
      setConfigs(newConfigs.sort((a, b) => a.displayName.localeCompare(b.displayName)));
      setGlobalSettings(settingsData);
      setError(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Ошибка загрузки данных');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleEnabled = async (config: AIConfig, enabled: boolean) => {
    try {
      const updated = await aiConfigApi.update(config.id, { enabled });
      setConfigs(configs.map(c => c.id === config.id ? updated : c));
      notification.success(
        enabled ? 'AI обновление включено' : 'AI обновление выключено',
        { title: config.displayName }
      );
    } catch (err: any) {
      notification.error('Ошибка обновления', { title: err.response?.data?.message || 'Ошибка' });
    }
  };

  const handleSaveGlobalSettings = async () => {
    try {
      setSaving(true);
      await aiConfigApi.updateGlobalSettings(globalSettings);
      notification.success('Настройки AI API сохранены');
      setShowGlobalSettingsModal(false);
    } catch (err: any) {
      notification.error('Ошибка сохранения настроек', { title: err.response?.data?.message || 'Ошибка' });
    } finally {
      setSaving(false);
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
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">AI Обновление данных</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Настройка автоматического обновления полей с помощью AI
            </p>
          </div>
          <Button onClick={() => setShowGlobalSettingsModal(true)} variant="primary">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Настройки AI API
          </Button>
        </div>

        {/* Статус глобальных настроек */}
        <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-900 dark:text-blue-200">
                {globalSettings.apiKey ? 'AI API настроено' : 'AI API не настроено'}
              </p>
              <p className="text-xs text-blue-700 dark:text-blue-300 mt-1">
                {globalSettings.apiEndpoint || 'Endpoint не указан'}
              </p>
            </div>
            <div className="text-sm text-blue-700 dark:text-blue-300">
              Частота обновления: {globalSettings.updateFrequency || 24} ч.
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Список полей */}
        <div className="bg-white dark:bg-[#16213e] rounded-lg shadow-md overflow-hidden transition-colors duration-200">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Поля для AI обновления
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Включите переключатель для полей, которые должны обновляться автоматически
            </p>
          </div>

          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {configs.map((config) => (
              <div
                key={config.id}
                className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
              >
                <div className="flex items-center gap-4">
                  <Switch
                    checked={config.enabled}
                    onChange={(e) => handleToggleEnabled(config, e.target.checked)}
                    size="md"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {config.displayName}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                        {config.fieldName}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Модалка глобальных настроек */}
      <Modal
        isOpen={showGlobalSettingsModal}
        onClose={() => setShowGlobalSettingsModal(false)}
        title="Настройки AI API"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="API Key"
            type="password"
            value={globalSettings.apiKey || ''}
            onChange={(e) => setGlobalSettings({ ...globalSettings, apiKey: e.target.value })}
            placeholder="Введите API ключ"
          />
          <Input
            label="API Endpoint"
            type="text"
            value={globalSettings.apiEndpoint || ''}
            onChange={(e) => setGlobalSettings({ ...globalSettings, apiEndpoint: e.target.value })}
            placeholder="https://api.example.com/v1/chat/completions"
          />
          <Input
            label="Частота обновления (часы)"
            type="number"
            value={globalSettings.updateFrequency || 24}
            onChange={(e) => setGlobalSettings({ ...globalSettings, updateFrequency: parseInt(e.target.value, 10) })}
            min={1}
            max={168}
          />
          <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-400 rounded-lg text-sm">
            <p className="font-medium">Рекомендуемые AI сервисы:</p>
            <ul className="mt-2 space-y-1 list-disc list-inside">
              <li>GigaChat (Сбер) - бесплатно, работает из России</li>
              <li>YandexGPT (Яндекс) - бесплатно, работает из России</li>
              <li>Kandinsky - бесплатно, работает из России</li>
            </ul>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button type="button" variant="secondary" onClick={() => setShowGlobalSettingsModal(false)}>
              Отмена
            </Button>
            <Button type="button" variant="primary" onClick={handleSaveGlobalSettings} loading={saving}>
              Сохранить
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
