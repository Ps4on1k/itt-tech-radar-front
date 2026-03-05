import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { techRadarApi } from '../services/api';
import type { TechRadarEntity, TechRadarType, TechRadarSubtype, TechRadarCategory, MaturityLevel, RiskLevel, SupportStatus, CostFactor, ContributionFrequency, PerformanceImpact } from '../types';
import { validateTechRadarEntity } from '../utils/validation';

interface TechRadarModalProps {
  entity?: TechRadarEntity | null; // Если null/undefined - режим создания
  onClose: () => void;
  onUpdate?: () => void;
}

interface InfoRowProps {
  label: string;
  value?: string | number;
  onEdit?: (value: string) => void;
  type?: 'text' | 'url';
  error?: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value, onEdit, type = 'text', error }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(String(value || ''));

  const handleSave = async () => {
    if (onEdit) {
      await onEdit(editValue);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue(String(value || ''));
    setEditing(false);
  };

  if (!value && !editing && !error) return null;

  return (
    <div style={{ display: 'flex', borderBottom: error ? '1px solid #ef4444' : '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
      <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{label}</span>
      {editing ? (
        <div style={{ display: 'flex', gap: '8px', flex: 1, flexDirection: 'column' }}>
          <input
            className="input-field"
            type={type}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: error ? '1px solid #ef4444' : '1px solid #3b82f6', borderRadius: '4px' }}
          />
          {error && <p style={{ margin: 0, fontSize: '11px', color: '#ef4444' }}>{error}</p>}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className="btn-save" onClick={handleSave} style={{ padding: '4px 8px', fontSize: '12px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
            <button className="btn-cancel" onClick={handleCancel} style={{ padding: '4px 8px', fontSize: '12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      ) : (
        <div style={{ display: 'flex', gap: '8px', flex: 1, flexDirection: 'column', alignItems: 'flex-start' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%' }}>
            <span style={{ fontSize: '13px', color: type === 'url' ? '#2563eb' : '#1f2937', textDecoration: type === 'url' ? 'underline' : 'none' }}>
              {type === 'url' && value ? (
                <a href={String(value)} target="_blank" rel="noopener noreferrer">{value}</a>
              ) : (
                value
              )}
            </span>
            {onEdit && (
              <button
                className="btn-edit"
                onClick={() => setEditing(true)}
                style={{ padding: '2px 6px', fontSize: '11px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
              >
                ✎
              </button>
            )}
          </div>
          {error && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>{error}</p>}
        </div>
      )}
    </div>
  );
};

interface EditableTagsProps {
  label: string;
  values?: string[];
  onEdit?: (values: string[]) => void;
}

const EditableTags: React.FC<EditableTagsProps> = ({ label, values, onEdit }) => {
  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState((values || []).join(', '));

  const handleSave = async () => {
    if (onEdit) {
      const newValues = editValue.split(',').map(s => s.trim()).filter(s => s);
      await onEdit(newValues);
      setEditing(false);
    }
  };

  const handleCancel = () => {
    setEditValue((values || []).join(', '));
    setEditing(false);
  };

  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{label}</span>
        {onEdit && (
          editing ? (
            <div style={{ display: 'flex', gap: '4px' }}>
              <button className="btn-save" onClick={handleSave} style={{ padding: '2px 6px', fontSize: '11px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✓</button>
              <button className="btn-cancel" onClick={handleCancel} style={{ padding: '2px 6px', fontSize: '11px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✕</button>
            </div>
          ) : (
            <button className="btn-edit" onClick={() => setEditing(true)} style={{ padding: '2px 6px', fontSize: '11px', background: '#e5e7eb', color: '#6b7280', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>✎ Добавить</button>
          )
        )}
      </div>
      {editing ? (
        <textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          placeholder="Введите значения через запятую"
          style={{ width: '100%', fontSize: '13px', padding: '8px', border: '1px solid #3b82f6', borderRadius: '4px', minHeight: '60px' }}
        />
      ) : (values || []).length > 0 ? (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(values || []).map((v, i) => (
            <span key={i} style={{ fontSize: '12px', background: '#e5e7eb', padding: '3px 8px', borderRadius: '9999px', color: '#374151' }}>{v}</span>
          ))}
        </div>
      ) : (
        <span style={{ fontSize: '12px', color: '#9ca3af', fontStyle: 'italic' }}>Не указано</span>
      )}
    </div>
  );
};

interface SelectRowProps {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}

const SelectRow: React.FC<SelectRowProps> = ({ label, value, options, onChange, disabled }) => (
  <div className="select-row" style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
    <span className="label-text" style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>{label}</span>
    <select
      className="select-field"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      disabled={disabled}
      style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: disabled ? '1px solid #e5e7eb' : '1px solid #3b82f6', borderRadius: '4px', background: disabled ? '#f9fafb' : 'white' }}
    >
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>{opt.label}</option>
      ))}
    </select>
  </div>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div className="section-container" style={{ marginBottom: '20px' }}>
    <h3 className="section-title" style={{ fontSize: '14px', fontWeight: '600', color: '#1f2937', margin: '0 0 12px 0', paddingBottom: '8px', borderBottom: '2px solid #3b82f6' }}>{title}</h3>
    {children}
  </div>
);

export const TechRadarModal: React.FC<TechRadarModalProps> = ({ entity, onClose, onUpdate }) => {
  const { isAdmin, isAdminOrManager } = useAuth();
  const isCreateMode = !entity;
  const [localEntity, setLocalEntity] = useState<TechRadarEntity | null>(
    entity || null
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [hasChanges, setHasChanges] = useState(false);

  // Инициализация новой сущности для режима создания
  const createEmptyEntity = (): TechRadarEntity => ({
    id: undefined as any, // ID будет сгенерирован на бэкенде
    name: '',
    version: '',
    type: 'библиотека',
    subtype: undefined,
    category: 'assess',
    firstAdded: new Date().toISOString().split('T')[0],
    owner: '',
    maturity: 'active',
    riskLevel: 'medium',
    license: '',
    supportStatus: 'active',
    businessCriticality: 'medium',
    vendorLockIn: false,
  });

  React.useEffect(() => {
    if (entity) {
      setLocalEntity(entity);
    } else if (isCreateMode) {
      setLocalEntity(createEmptyEntity());
    }
    setFieldErrors({});
    setHasChanges(false);
  }, [entity, isCreateMode]);

  if (!localEntity) return null;

  // Обновление поля (только локально, без отправки на сервер)
  const updateField = (field: keyof TechRadarEntity, value: any) => {
    setError(null);
    const updatedEntity = { ...localEntity, [field]: value };
    setLocalEntity(updatedEntity);
    setHasChanges(true);
    // Очищаем ошибку поля при изменении
    setFieldErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  };

  const handleSaveCreate = async () => {
    if (!isCreateMode) return;

    try {
      setSaving(true);
      setError(null);

      // Очищаем пустые значения перед валидацией
      const entityToValidate = {
        ...localEntity,
        adoptionRate: localEntity.adoptionRate == null ? undefined : localEntity.adoptionRate,
        popularityIndex: localEntity.popularityIndex == null ? undefined : localEntity.popularityIndex,
      };

      // Полная валидация сущности
      const validationResult = validateTechRadarEntity(entityToValidate, false);

      if (!validationResult.valid) {
        setFieldErrors(validationResult.errors.reduce((acc, err) => {
          if (err.field) {
            acc[err.field] = err.message;
          }
          return acc;
        }, {} as Record<string, string>));
        setError('Пожалуйста, исправьте ошибки валидации');
        return;
      }

      // ID генерируется на бэкенде автоматически (UUID), удаляем его из payload
      const { id, ...entityToSave } = entityToValidate;

      await techRadarApi.create(entityToSave as TechRadarEntity);
      onUpdate?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка создания');
    } finally {
      setSaving(false);
    }
  };

  // Сохранение изменений для режима редактирования
  const handleSaveEdit = async () => {
    if (isCreateMode) return;

    try {
      setSaving(true);
      setError(null);

      // Очищаем пустые значения перед валидацией
      const entityToValidate = {
        ...localEntity,
        adoptionRate: localEntity.adoptionRate == null ? undefined : localEntity.adoptionRate,
        popularityIndex: localEntity.popularityIndex == null ? undefined : localEntity.popularityIndex,
      };

      // Полная валидация сущности (isUpdate=true)
      const validationResult = validateTechRadarEntity(entityToValidate, true);

      if (!validationResult.valid) {
        setFieldErrors(validationResult.errors.reduce((acc, err) => {
          if (err.field) {
            acc[err.field] = err.message;
          }
          return acc;
        }, {} as Record<string, string>));
        setError('Пожалуйста, исправьте ошибки валидации');
        return;
      }

      // Отправляем все изменения на сервер
      const updatePayload: Partial<TechRadarEntity> = { ...entityToValidate };
      delete (updatePayload as any).createdAt;
      delete (updatePayload as any).updatedAt;

      await techRadarApi.update(localEntity.id, updatePayload);
      onUpdate?.();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка сохранения');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isCreateMode) {
      onClose();
      return;
    }

    if (!confirm(`Вы уверены, что хотите удалить технологию "${localEntity.name}"?`)) return;

    try {
      setSaving(true);
      await techRadarApi.delete(localEntity.id);
      onClose();
      onUpdate?.();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Ошибка удаления');
    } finally {
      setSaving(false);
    }
  };

  const getFieldLabel = (field: string): string => {
    const labels: Record<string, string> = {
      name: 'Название',
      version: 'Версия',
      versionReleaseDate: 'Дата выпуска версии',
      type: 'Тип',
      subtype: 'Подтип',
      category: 'Категория',
      description: 'Описание',
      firstAdded: 'Дата первого добавления',
      lastUpdated: 'Дата последнего обновления',
      owner: 'Владелец',
      stakeholders: 'Заинтересованные стороны',
      dependencies: 'Зависимости',
      maturity: 'Зрелость',
      riskLevel: 'Уровень риска',
      license: 'Лицензия',
      usageExamples: 'Примеры использования',
      documentationUrl: 'Документация',
      internalGuideUrl: 'Внутреннее руководство',
      adoptionRate: 'Процент внедрения',
      recommendedAlternatives: 'Рекомендуемые альтернативы',
      relatedTechnologies: 'Связанные технологии',
      endOfLifeDate: 'Дата окончания поддержки',
      supportStatus: 'Статус поддержки',
      upgradePath: 'Путь обновления',
      performanceImpact: 'Влияние на производительность',
      resourceRequirements: 'Требования к ресурсам',
      'resourceRequirements.cpu': 'CPU',
      'resourceRequirements.memory': 'Память',
      'resourceRequirements.storage': 'Хранилище',
      securityVulnerabilities: 'Уязвимости безопасности',
      complianceStandards: 'Стандарты соответствия',
      communitySize: 'Размер сообщества',
      contributionFrequency: 'Частота вклада',
      popularityIndex: 'Индекс популярности',
      compatibility: 'Совместимость',
      'compatibility.os': 'ОС',
      'compatibility.browsers': 'Браузеры',
      'compatibility.frameworks': 'Фреймворки',
      costFactor: 'Стоимость',
      vendorLockIn: 'Привязка к вендору',
      businessCriticality: 'Критичность для бизнеса',
      versionToUpdate: 'Обновить до версии',
      versionUpdateDeadline: 'Дедлайн обновления',
    };
    return labels[field] || field;
  };

  const typeOptions = [
    { value: 'фреймворк', label: 'Фреймворк' },
    { value: 'библиотека', label: 'Библиотека' },
    { value: 'язык программирования', label: 'Язык программирования' },
    { value: 'инструмент', label: 'Инструмент' },
  ];

  const subtypeOptions = [
    { value: 'фронтенд', label: 'Фронтенд' },
    { value: 'бэкенд', label: 'Бэкенд' },
    { value: 'мобильная разработка', label: 'Мобильная разработка' },
    { value: 'инфраструктура', label: 'Инфраструктура' },
    { value: 'аналитика', label: 'Аналитика' },
    { value: 'DevOps', label: 'DevOps' },
    { value: 'SaaS', label: 'SaaS' },
    { value: 'библиотека', label: 'Библиотека' },
    { value: 'data engineering', label: 'Data Engineering' },
    { value: 'AI', label: 'AI' },
    { value: 'observability', label: 'Observability' },
    { value: 'базы данных', label: 'Базы данных' },
    { value: 'тестирование', label: 'Тестирование' },
    { value: 'автотесты', label: 'Автотесты' },
    { value: 'нагрузочные тесты', label: 'Нагрузочные тесты' },
    { value: 'безопасность', label: 'Безопасность' },
    { value: 'очереди', label: 'Очереди' },
    { value: 'desktop', label: 'Desktop' },
    { value: 'прочее', label: 'Прочее' },
  ];

  const categoryOptions = [
    { value: 'adopt', label: 'Adopt' },
    { value: 'trial', label: 'Trial' },
    { value: 'assess', label: 'Assess' },
    { value: 'hold', label: 'Hold' },
    { value: 'drop', label: 'Drop' },
  ];

  const maturityOptions = [
    { value: 'experimental', label: 'Experimental' },
    { value: 'active', label: 'Active' },
    { value: 'stable', label: 'Stable' },
    { value: 'deprecated', label: 'Deprecated' },
    { value: 'end-of-life', label: 'End of Life' },
  ];

  const riskLevelOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
    { value: 'critical', label: 'Critical' },
  ];

  const supportStatusOptions = [
    { value: 'active', label: 'Active' },
    { value: 'limited', label: 'Limited' },
    { value: 'end-of-life', label: 'End of Life' },
    { value: 'community-only', label: 'Community Only' },
  ];

  const costFactorOptions = [
    { value: 'free', label: 'Free' },
    { value: 'paid', label: 'Paid' },
    { value: 'subscription', label: 'Subscription' },
    { value: 'enterprise', label: 'Enterprise' },
  ];

  const performanceImpactOptions = [
    { value: 'low', label: 'Low' },
    { value: 'medium', label: 'Medium' },
    { value: 'high', label: 'High' },
  ];

  const contributionFrequencyOptions = [
    { value: 'frequent', label: 'Frequent' },
    { value: 'regular', label: 'Regular' },
    { value: 'occasional', label: 'Occasional' },
    { value: 'rare', label: 'Rare' },
    { value: 'none', label: 'None' },
  ];

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 50,
        padding: '16px'
      }}
      onClick={onClose}
    >
      <div
        className="modal-content"
        style={{
          background: 'white',
          borderRadius: '12px',
          maxWidth: '800px',
          width: '100%',
          maxHeight: '90vh',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          className="modal-header"
          style={{
            padding: '20px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            background: 'linear-gradient(135deg, #eff6ff 0%, #ffffff 100%)',
            gap: '16px'
          }}
        >
          <div style={{ flex: 1, minWidth: 0 }}>
            {isAdminOrManager || isCreateMode ? (
              <div>
                <input
                  value={localEntity.name}
                  onChange={(e) => updateField('name', e.target.value)}
                  placeholder="Название технологии"
                  style={{
                    fontSize: '22px',
                    fontWeight: 'bold',
                    border: fieldErrors.name ? '2px solid #ef4444' : '2px solid #3b82f6',
                    background: 'white',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    width: 'calc(100% - 16px)',
                    boxSizing: 'border-box',
                    outline: 'none',
                    color: '#1f2937'
                  }}
                />
                {fieldErrors.name && (
                  <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.name}</p>
                )}
              </div>
            ) : (
              <h2 style={{ fontSize: '22px', fontWeight: 'bold', margin: 0, color: '#1f2937' }}>{localEntity.name || 'Новая технология'}</h2>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Версия:</span>
              {isAdminOrManager || isCreateMode ? (
                <div>
                  <input
                    value={localEntity.version}
                    onChange={(e) => updateField('version', e.target.value)}
                    placeholder="Например: 1.0.0"
                    style={{
                      fontSize: '14px',
                      border: fieldErrors.version ? '2px solid #ef4444' : '1px solid #3b82f6',
                      background: 'white',
                      padding: '6px 10px',
                      borderRadius: '4px',
                      minWidth: '120px',
                      outline: 'none',
                      color: '#1f2937'
                    }}
                  />
                  {fieldErrors.version && (
                    <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: '#ef4444' }}>{fieldErrors.version}</p>
                  )}
                </div>
              ) : (
                <p style={{ fontSize: '14px', color: '#6b7280', margin: 0 }}>{localEntity.version}</p>
              )}
              {localEntity.versionReleaseDate && (
                <span style={{ fontSize: '12px', color: '#9ca3af' }}>• {localEntity.versionReleaseDate}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
            {isAdminOrManager && !isCreateMode && (
              <button
                className="btn-delete"
                onClick={handleDelete}
                disabled={saving}
                style={{
                  background: '#fee2e2',
                  border: 'none',
                  fontSize: '14px',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  color: '#dc2626',
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
                title="Удалить технологию"
              >
                🗑
              </button>
            )}
            {(isAdminOrManager || isCreateMode) && (
              <button
                className="btn-save"
                onClick={isCreateMode ? handleSaveCreate : handleSaveEdit}
                disabled={saving || !localEntity.name || !localEntity.version}
                style={{
                  background: (saving || !localEntity.name || !localEntity.version) ? '#9ca3af' : '#22c55e',
                  border: 'none',
                  fontSize: '14px',
                  cursor: (saving || !localEntity.name || !localEntity.version) ? 'not-allowed' : 'pointer',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: '6px',
                }}
                title={isCreateMode ? 'Создать технологию' : 'Сохранить изменения'}
              >
                {isCreateMode ? '✓ Создать' : (hasChanges ? '✓ Сохранить' : '✓')}
              </button>
            )}
            <button
              className="btn-close"
              onClick={onClose}
              style={{
                background: '#f3f4f6',
                border: 'none',
                fontSize: '20px',
                cursor: 'pointer',
                color: '#6b7280',
                padding: '8px 12px',
                borderRadius: '6px',
                transition: 'background 0.2s'
              }}
            >
              ×
            </button>
          </div>
        </div>

        {/* Error message */}
        {(error || Object.keys(fieldErrors).length > 0) && (
          <div style={{ padding: '12px 20px', background: '#fee2e2', color: '#dc2626', fontSize: '14px' }}>
            {error && <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>{error}</p>}
            {Object.keys(fieldErrors).length > 0 && (
              <ul style={{ margin: 0, paddingLeft: '20px' }}>
                {Object.entries(fieldErrors).map(([field, message]) => (
                  <li key={field} style={{ marginTop: '4px' }}>
                    <strong>{getFieldLabel(field)}:</strong> {message}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Content */}
        <div style={{ padding: '24px' }}>
          {/* Основная информация - редактирование для админа и менеджера */}
          <Section title="Основная информация">
            {isAdminOrManager ? (
              <>
                <SelectRow
                  label="Тип"
                  value={localEntity.type}
                  options={typeOptions}
                  onChange={(v) => updateField('type', v as TechRadarType)}
                />
                <SelectRow
                  label="Подтип"
                  value={localEntity.subtype || ''}
                  options={subtypeOptions}
                  onChange={(v) => updateField('subtype', v as TechRadarSubtype)}
                />
                <SelectRow
                  label="Категория"
                  value={localEntity.category}
                  options={categoryOptions}
                  onChange={(v) => updateField('category', v as TechRadarCategory)}
                />
                <SelectRow
                  label="Зрелость"
                  value={localEntity.maturity}
                  options={maturityOptions}
                  onChange={(v) => updateField('maturity', v as MaturityLevel)}
                />
                <SelectRow
                  label="Уровень риска"
                  value={localEntity.riskLevel}
                  options={riskLevelOptions}
                  onChange={(v) => updateField('riskLevel', v as RiskLevel)}
                />
                <SelectRow
                  label="Статус поддержки"
                  value={localEntity.supportStatus}
                  options={supportStatusOptions}
                  onChange={(v) => updateField('supportStatus', v as SupportStatus)}
                />
                <SelectRow
                  label="Критичность для бизнеса"
                  value={localEntity.businessCriticality}
                  options={riskLevelOptions}
                  onChange={(v) => updateField('businessCriticality', v as RiskLevel)}
                />
                <SelectRow
                  label="Стоимость"
                  value={localEntity.costFactor || ''}
                  options={costFactorOptions}
                  onChange={(v) => updateField('costFactor', v as CostFactor)}
                />
                <SelectRow
                  label="Влияние на производительность"
                  value={localEntity.performanceImpact || ''}
                  options={performanceImpactOptions}
                  onChange={(v) => updateField('performanceImpact', v as PerformanceImpact)}
                />
                {isAdminOrManager ? (
                  <>
                    <div style={{ display: 'flex', borderBottom: fieldErrors.license ? '1px solid #ef4444' : '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                      <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Лицензия</span>
                      <input
                        value={localEntity.license}
                        onChange={(e) => updateField('license', e.target.value)}
                        placeholder="Например: MIT"
                        style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: fieldErrors.license ? '1px solid #ef4444' : '1px solid #3b82f6', borderRadius: '4px' }}
                      />
                    </div>
                    {fieldErrors.license && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>{fieldErrors.license}</p>}
                  </>
                ) : (
                  <InfoRow label="Лицензия" value={localEntity.license} />
                )}
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Привязка к вендору</span>
                  <button
                    onClick={() => updateField('vendorLockIn', !localEntity.vendorLockIn)}
                    style={{
                      padding: '4px 12px',
                      fontSize: '13px',
                      background: localEntity.vendorLockIn ? '#fee2e2' : '#d1fae5',
                      color: localEntity.vendorLockIn ? '#dc2626' : '#059669',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                    }}
                  >
                    {localEntity.vendorLockIn ? 'Да' : 'Нет'}
                  </button>
                </div>
              </>
            ) : (
              <>
                <InfoRow label="Тип" value={localEntity.type} />
                <InfoRow label="Подтип" value={localEntity.subtype} />
                <InfoRow label="Категория" value={localEntity.category} />
                <InfoRow label="Зрелость" value={localEntity.maturity} />
                <InfoRow label="Уровень риска" value={localEntity.riskLevel} />
                <InfoRow label="Лицензия" value={localEntity.license} />
                <InfoRow label="Статус поддержки" value={localEntity.supportStatus} />
                <InfoRow label="Критичность для бизнеса" value={localEntity.businessCriticality} />
                {localEntity.costFactor && <InfoRow label="Стоимость" value={localEntity.costFactor} />}
                {localEntity.vendorLockIn !== undefined && <InfoRow label="Привязка к вендору" value={localEntity.vendorLockIn ? 'Да' : 'Нет'} />}
              </>
            )}
          </Section>

          {/* Описание */}
          <Section title="Описание">
            {isAdminOrManager ? (
              <textarea
                value={localEntity.description || ''}
                onChange={(e) => updateField('description', e.target.value)}
                placeholder="Введите описание технологии"
                style={{ width: '100%', fontSize: '14px', padding: '8px', border: '1px solid #3b82f6', borderRadius: '4px', minHeight: '80px', fontFamily: 'inherit' }}
              />
            ) : (
              localEntity.description && (
                <p style={{ fontSize: '14px', color: '#4b5563', margin: 0, lineHeight: '1.6' }}>{localEntity.description}</p>
              )
            )}
          </Section>

          {/* Даты */}
          <Section title="Даты">
            <InfoRow label="Первое добавление" value={localEntity.firstAdded} />
            {isAdminOrManager ? (
              <>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Последнее обновление</span>
                  <input
                    type="date"
                    value={localEntity.lastUpdated?.split('T')[0] || ''}
                    onChange={(e) => updateField('lastUpdated', e.target.value)}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Дата выпуска версии</span>
                  <input
                    type="date"
                    value={localEntity.versionReleaseDate?.split('T')[0] || ''}
                    onChange={(e) => updateField('versionReleaseDate', e.target.value)}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Дата окончания поддержки</span>
                  <input
                    type="date"
                    value={localEntity.endOfLifeDate?.split('T')[0] || ''}
                    onChange={(e) => updateField('endOfLifeDate', e.target.value)}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                  />
                </div>
                <div style={{ display: 'flex', borderBottom: fieldErrors.versionToUpdate ? '1px solid #ef4444' : '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Обновить до версии</span>
                  <input
                    value={localEntity.versionToUpdate || ''}
                    onChange={(e) => updateField('versionToUpdate', e.target.value)}
                    placeholder="Например: 2.0.0"
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: fieldErrors.versionToUpdate ? '1px solid #ef4444' : '1px solid #3b82f6', borderRadius: '4px' }}
                  />
                </div>
                {fieldErrors.versionToUpdate && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>{fieldErrors.versionToUpdate}</p>}
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Дедлайн обновления</span>
                  <input
                    type="date"
                    value={localEntity.versionUpdateDeadline?.split('T')[0] || ''}
                    onChange={(e) => updateField('versionUpdateDeadline', e.target.value)}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                  />
                </div>
              </>
            ) : (
              <>
                {localEntity.lastUpdated && <InfoRow label="Последнее обновление" value={localEntity.lastUpdated} />}
                {localEntity.versionReleaseDate && <InfoRow label="Дата выпуска версии" value={localEntity.versionReleaseDate} />}
                {localEntity.endOfLifeDate && <InfoRow label="Дата окончания поддержки" value={localEntity.endOfLifeDate} />}
                {localEntity.versionToUpdate && <InfoRow label="Обновить до версии" value={localEntity.versionToUpdate} />}
                {localEntity.versionUpdateDeadline && <InfoRow label="Дедлайн обновления" value={localEntity.versionUpdateDeadline} />}
              </>
            )}
          </Section>

          {/* Владелец и команда */}
          <Section title="Владелец и команда">
            {isAdminOrManager ? (
              <>
                <div style={{ display: 'flex', borderBottom: fieldErrors.owner ? '1px solid #ef4444' : '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Владелец</span>
                  <input
                    value={localEntity.owner}
                    onChange={(e) => updateField('owner', e.target.value)}
                    placeholder="Например: Frontend Team"
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: fieldErrors.owner ? '1px solid #ef4444' : '1px solid #3b82f6', borderRadius: '4px' }}
                  />
                </div>
                {fieldErrors.owner && <p style={{ margin: '4px 0 0 0', fontSize: '11px', color: '#ef4444' }}>{fieldErrors.owner}</p>}
              </>
            ) : (
              <InfoRow label="Владелец" value={localEntity.owner} />
            )}
            <EditableTags
              label="Заинтересованные стороны"
              values={localEntity.stakeholders}
              onEdit={isAdminOrManager ? (v) => updateField('stakeholders', v) : undefined}
            />
          </Section>

          {/* Технические характеристики */}
          <Section title="Технические характеристики">
            {isAdminOrManager ? (
              <>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderBottom: '1px solid #f3f4f6', padding: '8px 0' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>CPU</span>
                    <select
                      value={localEntity.resourceRequirements?.cpu || ''}
                      onChange={(e) => updateField('resourceRequirements', { ...localEntity.resourceRequirements, cpu: e.target.value })}
                      style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                    >
                      <option value="">Не указано</option>
                      <option value="низкие">Низкие</option>
                      <option value="средние">Средние</option>
                      <option value="высокие">Высокие</option>
                      <option value="очень высокие">Очень высокие</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Память</span>
                    <select
                      value={localEntity.resourceRequirements?.memory || ''}
                      onChange={(e) => updateField('resourceRequirements', { ...localEntity.resourceRequirements, memory: e.target.value })}
                      style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                    >
                      <option value="">Не указано</option>
                      <option value="низкие">Низкие</option>
                      <option value="средние">Средние</option>
                      <option value="высокие">Высокие</option>
                      <option value="очень высокие">Очень высокие</option>
                    </select>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Хранилище</span>
                    <select
                      value={localEntity.resourceRequirements?.storage || ''}
                      onChange={(e) => updateField('resourceRequirements', { ...localEntity.resourceRequirements, storage: e.target.value })}
                      style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px' }}
                    >
                      <option value="">Не указано</option>
                      <option value="минимальные">Минимальные</option>
                      <option value="низкие">Низкие</option>
                      <option value="средние">Средние</option>
                      <option value="высокие">Высокие</option>
                    </select>
                  </div>
                </div>
              </>
            ) : (
              localEntity.resourceRequirements && (
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Требования к ресурсам</span>
                  <div style={{ display: 'flex', gap: '12px', fontSize: '13px', color: '#4b5563' }}>
                    {localEntity.resourceRequirements.cpu && <span>CPU: {localEntity.resourceRequirements.cpu}</span>}
                    {localEntity.resourceRequirements.memory && <span>Память: {localEntity.resourceRequirements.memory}</span>}
                    {localEntity.resourceRequirements.storage && <span>Хранилище: {localEntity.resourceRequirements.storage}</span>}
                  </div>
                </div>
              )
            )}
            {localEntity.performanceImpact && <InfoRow label="Влияние на производительность" value={localEntity.performanceImpact} />}
          </Section>

          {/* Метрики */}
          <Section title="Метрики">
            {isAdminOrManager ? (
              <>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Внедрение (%)</span>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    max="100"
                    value={localEntity.adoptionRate !== undefined && localEntity.adoptionRate !== null ? Math.round(localEntity.adoptionRate * 100) : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null || value === undefined) {
                        updateField('adoptionRate', null);
                      } else {
                        const percentValue = parseFloat(value);
                        if (!isNaN(percentValue)) {
                          // Конвертируем проценты в долю (0-1) и ограничиваем диапазоном
                          const normalizedValue = Math.max(0, Math.min(100, percentValue)) / 100;
                          updateField('adoptionRate', Number(normalizedValue.toFixed(2)));
                        }
                      }
                    }}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px', width: '100px' }}
                  />
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Популярность (%)</span>
                  <input
                    className="input-field"
                    type="number"
                    min="0"
                    max="100"
                    value={localEntity.popularityIndex !== undefined && localEntity.popularityIndex !== null ? Math.round(localEntity.popularityIndex * 100) : ''}
                    onChange={(e) => {
                      const value = e.target.value;
                      if (value === '' || value === null || value === undefined) {
                        updateField('popularityIndex', null);
                      } else {
                        const percentValue = parseFloat(value);
                        if (!isNaN(percentValue)) {
                          // Конвертируем проценты в долю (0-1) и ограничиваем диапазоном
                          const normalizedValue = Math.max(0, Math.min(100, percentValue)) / 100;
                          updateField('popularityIndex', Number(normalizedValue.toFixed(2)));
                        }
                      }
                    }}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px', width: '100px' }}
                  />
                </div>
                <div style={{ display: 'flex', borderBottom: '1px solid #f3f4f6', padding: '8px 0', alignItems: 'center' }}>
                  <span style={{ width: '140px', fontSize: '12px', color: '#6b7280', fontWeight: '500' }}>Размер сообщества</span>
                  <input
                    type="number"
                    min="0"
                    value={localEntity.communitySize || ''}
                    onChange={(e) => updateField('communitySize', e.target.value ? parseInt(e.target.value) : undefined)}
                    style={{ flex: 1, fontSize: '13px', padding: '4px 8px', border: '1px solid #3b82f6', borderRadius: '4px', width: '150px' }}
                  />
                </div>
                <SelectRow
                  label="Частота вклада"
                  value={localEntity.contributionFrequency || ''}
                  options={contributionFrequencyOptions}
                  onChange={(v) => updateField('contributionFrequency', v as ContributionFrequency)}
                />
              </>
            ) : (
              <>
                {localEntity.adoptionRate !== undefined && (
                  <InfoRow label="Внедрение в компании" value={`${(localEntity.adoptionRate * 100).toFixed(0)}%`} />
                )}
                {localEntity.popularityIndex !== undefined && (
                  <InfoRow label="Индекс популярности" value={(localEntity.popularityIndex * 100).toFixed(0) + '%'} />
                )}
                {localEntity.communitySize && <InfoRow label="Размер сообщества" value={localEntity.communitySize.toLocaleString()} />}
                {localEntity.contributionFrequency && <InfoRow label="Частота вклада" value={localEntity.contributionFrequency} />}
              </>
            )}
          </Section>

          {/* Зависимости */}
          <Section title="Зависимости">
            <EditableTags
              label="Зависимости (формат: name:version)"
              values={localEntity.dependencies?.map(d => `${d.name}:${d.version}${d.optional ? ':optional' : ''}`) || []}
              onEdit={isAdminOrManager ? (values) => {
                const deps = values.map(v => {
                  const parts = v.split(':');
                  return {
                    name: parts[0],
                    version: parts[1] || 'latest',
                    optional: parts[2] === 'optional',
                  };
                });
                updateField('dependencies', deps);
              } : undefined}
            />
          </Section>

          {/* Связанные технологии */}
          <Section title="Связанные технологии">
            <EditableTags
              label="Связанные технологии"
              values={localEntity.relatedTechnologies}
              onEdit={isAdminOrManager ? (v) => updateField('relatedTechnologies', v) : undefined}
            />
          </Section>

          {/* Альтернативы */}
          <Section title="Рекомендуемые альтернативы">
            <EditableTags
              label="Альтернативы"
              values={localEntity.recommendedAlternatives}
              onEdit={isAdminOrManager ? (v) => updateField('recommendedAlternatives', v) : undefined}
            />
          </Section>

          {/* Примеры использования */}
          <Section title="Примеры использования">
            <EditableTags
              label="Примеры использования"
              values={localEntity.usageExamples}
              onEdit={isAdminOrManager ? (v) => updateField('usageExamples', v) : undefined}
            />
          </Section>

          {/* Безопасность и соответствие */}
          {(localEntity.securityVulnerabilities || localEntity.complianceStandards || isAdmin) && (
            <Section title="Безопасность и соответствие">
              <EditableTags
                label="Уязвимости безопасности"
                values={localEntity.securityVulnerabilities}
                onEdit={isAdminOrManager ? (v) => updateField('securityVulnerabilities', v) : undefined}
              />
              <EditableTags
                label="Стандарты соответствия"
                values={localEntity.complianceStandards}
                onEdit={isAdminOrManager ? (v) => updateField('complianceStandards', v) : undefined}
              />
            </Section>
          )}

          {/* Ссылки */}
          <Section title="Документация и ссылки">
            <InfoRow
              label="Документация"
              value={localEntity.documentationUrl}
              type="url"
              onEdit={isAdminOrManager ? (v) => updateField('documentationUrl', v) : undefined}
            />
            <InfoRow
              label="Внутреннее руководство"
              value={localEntity.internalGuideUrl}
              type="url"
              onEdit={isAdminOrManager ? (v) => updateField('internalGuideUrl', v) : undefined}
            />
            <InfoRow
              label="Путь обновления"
              value={localEntity.upgradePath}
              onEdit={isAdminOrManager ? (v) => updateField('upgradePath', v) : undefined}
            />
          </Section>

          {/* Saving indicator */}
          {saving && (
            <div style={{ textAlign: 'center', padding: '16px', color: '#6b7280', fontSize: '14px' }}>
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Сохранение...
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

