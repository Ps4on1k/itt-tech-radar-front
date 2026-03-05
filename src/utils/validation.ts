import type { TechRadarEntity } from '../types';

export interface ValidationError {
  field?: string;
  message: string;
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
}

// Валидация enum значений
const VALID_TYPES = ['фреймворк', 'библиотека', 'язык программирования', 'инструмент'] as const;
const VALID_SUBTYPES = ['фронтенд', 'бэкенд', 'мобильная разработка', 'инфраструктура', 'аналитика', 'DevOps', 'SaaS', 'библиотека', 'data engineering', 'AI', 'observability', 'базы данных', 'тестирование', 'автотесты', 'нагрузочные тесты', 'безопасность', 'очереди', 'desktop', 'прочее'] as const;
const VALID_CATEGORIES = ['adopt', 'trial', 'assess', 'hold', 'drop'] as const;
const VALID_MATURITY = ['experimental', 'active', 'stable', 'deprecated', 'end-of-life'] as const;
const VALID_RISK_LEVEL = ['low', 'medium', 'high', 'critical'] as const;
const VALID_SUPPORT_STATUS = ['active', 'limited', 'end-of-life', 'community-only'] as const;
const VALID_PERFORMANCE_IMPACT = ['low', 'medium', 'high'] as const;
const VALID_CONTRIBUTION_FREQUENCY = ['frequent', 'regular', 'occasional', 'rare', 'none'] as const;
const VALID_COST_FACTOR = ['free', 'paid', 'subscription', 'enterprise'] as const;
const VALID_BUSINESS_CRITICALITY = ['low', 'medium', 'high', 'critical'] as const;
const VALID_CPU = ['низкие', 'средние', 'высокие', 'очень высокие'] as const;
const VALID_MEMORY = ['низкие', 'средние', 'высокие', 'очень высокие'] as const;
const VALID_STORAGE = ['минимальные', 'низкие', 'средние', 'высокие'] as const;

/**
 * Валидация сущности TechRadar при создании/обновлении
 */
export function validateTechRadarEntity(entity: Partial<TechRadarEntity>, isUpdate: boolean = false): ValidationResult {
  const errors: ValidationError[] = [];
  const entityAny = entity as any;

  // Для создания ID не требуется (генерируется автоматически), для обновления некоторые поля не обязательны
  if (!isUpdate) {
    const requiredFields = ['name', 'version', 'type', 'category', 'firstAdded', 'owner', 'maturity', 'riskLevel', 'license', 'supportStatus', 'businessCriticality'];
    for (const field of requiredFields) {
      if (entityAny[field] === undefined || entityAny[field] === null || entityAny[field] === '') {
        errors.push({ field, message: `Отсутствует обязательное поле: ${field}` });
      }
    }
  }

  // Проверка типов данных для предоставленных полей
  if (entity.id !== undefined && entity.id !== null && typeof entity.id !== 'string') {
    errors.push({ field: 'id', message: 'Поле id должно быть строкой' });
  }
  if (entity.name !== undefined && entity.name !== null && typeof entity.name !== 'string') {
    errors.push({ field: 'name', message: 'Поле name должно быть строкой' });
  }
  if (entity.version !== undefined && entity.version !== null && typeof entity.version !== 'string') {
    errors.push({ field: 'version', message: 'Поле version должно быть строкой' });
  }
  if (entity.owner !== undefined && entity.owner !== null && typeof entity.owner !== 'string') {
    errors.push({ field: 'owner', message: 'Поле owner должно быть строкой' });
  }
  if (entity.license !== undefined && entity.license !== null && typeof entity.license !== 'string') {
    errors.push({ field: 'license', message: 'Поле license должно быть строкой' });
  }
  if (entity.description !== undefined && entity.description !== null && typeof entity.description !== 'string') {
    errors.push({ field: 'description', message: 'Поле description должно быть строкой' });
  }
  if (entity.upgradePath !== undefined && entity.upgradePath !== null && typeof entity.upgradePath !== 'string') {
    errors.push({ field: 'upgradePath', message: 'Поле upgradePath должно быть строкой' });
  }

  // Валидация enum полей (проверяем только если значение не null/undefined)
  if (entity.type !== undefined && entity.type !== null && !VALID_TYPES.includes(entity.type as any)) {
    errors.push({ field: 'type', message: `Недопустимое значение type: ${entity.type}` });
  }
  if (entity.subtype !== undefined && entity.subtype !== null && !VALID_SUBTYPES.includes(entity.subtype as any)) {
    errors.push({ field: 'subtype', message: `Недопустимое значение subtype: ${entity.subtype}` });
  }
  if (entity.category !== undefined && entity.category !== null && !VALID_CATEGORIES.includes(entity.category as any)) {
    errors.push({ field: 'category', message: `Недопустимое значение category: ${entity.category}` });
  }
  if (entity.maturity !== undefined && entity.maturity !== null && !VALID_MATURITY.includes(entity.maturity as any)) {
    errors.push({ field: 'maturity', message: `Недопустимое значение maturity: ${entity.maturity}` });
  }
  if (entity.riskLevel !== undefined && entity.riskLevel !== null && !VALID_RISK_LEVEL.includes(entity.riskLevel as any)) {
    errors.push({ field: 'riskLevel', message: `Недопустимое значение riskLevel: ${entity.riskLevel}` });
  }
  if (entity.supportStatus !== undefined && entity.supportStatus !== null && !VALID_SUPPORT_STATUS.includes(entity.supportStatus as any)) {
    errors.push({ field: 'supportStatus', message: `Недопустимое значение supportStatus: ${entity.supportStatus}` });
  }
  if (entity.performanceImpact !== undefined && entity.performanceImpact !== null && !VALID_PERFORMANCE_IMPACT.includes(entity.performanceImpact as any)) {
    errors.push({ field: 'performanceImpact', message: `Недопустимое значение performanceImpact: ${entity.performanceImpact}` });
  }
  if (entity.contributionFrequency !== undefined && entity.contributionFrequency !== null && !VALID_CONTRIBUTION_FREQUENCY.includes(entity.contributionFrequency as any)) {
    errors.push({ field: 'contributionFrequency', message: `Недопустимое значение contributionFrequency: ${entity.contributionFrequency}` });
  }
  if (entity.costFactor !== undefined && entity.costFactor !== null && !VALID_COST_FACTOR.includes(entity.costFactor as any)) {
    errors.push({ field: 'costFactor', message: `Недопустимое значение costFactor: ${entity.costFactor}` });
  }
  if (entity.businessCriticality !== undefined && entity.businessCriticality !== null && !VALID_BUSINESS_CRITICALITY.includes(entity.businessCriticality as any)) {
    errors.push({ field: 'businessCriticality', message: `Недопустимое значение businessCriticality: ${entity.businessCriticality}` });
  }

  // Валидация resourceRequirements
  if (entity.resourceRequirements !== undefined && entity.resourceRequirements !== null) {
    if (typeof entity.resourceRequirements !== 'object' || Array.isArray(entity.resourceRequirements)) {
      errors.push({ field: 'resourceRequirements', message: 'resourceRequirements должно быть объектом' });
    } else {
      if (entity.resourceRequirements.cpu && !VALID_CPU.includes(entity.resourceRequirements.cpu as any)) {
        errors.push({ field: 'resourceRequirements.cpu', message: `Недопустимое значение cpu: ${entity.resourceRequirements.cpu}` });
      }
      if (entity.resourceRequirements.memory && !VALID_MEMORY.includes(entity.resourceRequirements.memory as any)) {
        errors.push({ field: 'resourceRequirements.memory', message: `Недопустимое значение memory: ${entity.resourceRequirements.memory}` });
      }
      if (entity.resourceRequirements.storage && !VALID_STORAGE.includes(entity.resourceRequirements.storage as any)) {
        errors.push({ field: 'resourceRequirements.storage', message: `Недопустимое значение storage: ${entity.resourceRequirements.storage}` });
      }
    }
  }

  // Валидация числовых полей (проверяем только если значение задано)
  if (entity.adoptionRate !== undefined && entity.adoptionRate !== null) {
    const adoptionRate = typeof entity.adoptionRate === 'string' ? parseFloat(entity.adoptionRate) : entity.adoptionRate;
    if (typeof adoptionRate !== 'number' || isNaN(adoptionRate) || adoptionRate < 0 || adoptionRate > 1) {
      errors.push({ field: 'adoptionRate', message: 'adoptionRate должно быть числом от 0 до 1' });
    }
  }
  if (entity.popularityIndex !== undefined && entity.popularityIndex !== null) {
    const popularityIndex = typeof entity.popularityIndex === 'string' ? parseFloat(entity.popularityIndex) : entity.popularityIndex;
    if (typeof popularityIndex !== 'number' || isNaN(popularityIndex) || popularityIndex < 0 || popularityIndex > 1) {
      errors.push({ field: 'popularityIndex', message: 'popularityIndex должно быть числом от 0 до 1' });
    }
  }
  if (entity.communitySize !== undefined && entity.communitySize !== null) {
    if (typeof entity.communitySize !== 'number' || entity.communitySize < 0) {
      errors.push({ field: 'communitySize', message: 'communitySize должно быть неотрицательным числом' });
    }
  }

  // Валидация массивов (проверяем только если значение не null/undefined)
  const arrayFields = ['stakeholders', 'usageExamples', 'recommendedAlternatives', 'relatedTechnologies', 'securityVulnerabilities', 'complianceStandards'];
  for (const field of arrayFields) {
    if (entityAny[field] !== undefined && entityAny[field] !== null && !Array.isArray(entityAny[field])) {
      errors.push({ field, message: `Поле ${field} должно быть массивом` });
    }
  }

  // Валидация dependencies
  if (entity.dependencies !== undefined && entity.dependencies !== null) {
    if (!Array.isArray(entity.dependencies)) {
      errors.push({ field: 'dependencies', message: 'dependencies должно быть массивом' });
    } else {
      for (let i = 0; i < entity.dependencies.length; i++) {
        const dep = entity.dependencies[i];
        if (!dep || typeof dep !== 'object') {
          errors.push({ field: `dependencies[${i}]`, message: 'Зависимость должна быть объектом' });
        } else if (typeof dep.name !== 'string' || typeof dep.version !== 'string') {
          errors.push({ field: `dependencies[${i}]`, message: 'Зависимость должна иметь name и version (строки)' });
        }
      }
    }
  }

  // Валидация compatibility
  if (entity.compatibility !== undefined && entity.compatibility !== null) {
    if (typeof entity.compatibility !== 'object' || Array.isArray(entity.compatibility)) {
      errors.push({ field: 'compatibility', message: 'compatibility должно быть объектом' });
    } else {
      const compatFields: (keyof NonNullable<TechRadarEntity['compatibility']>)[] = ['os', 'browsers', 'frameworks'];
      for (const field of compatFields) {
        if (entity.compatibility[field] !== undefined && entity.compatibility[field] !== null && !Array.isArray(entity.compatibility[field])) {
          errors.push({ field: `compatibility.${field}`, message: `compatibility.${field} должно быть массивом` });
        }
      }
    }
  }

  // Валидация vendorLockIn
  if (entity.vendorLockIn !== undefined && entity.vendorLockIn !== null && typeof entity.vendorLockIn !== 'boolean') {
    errors.push({ field: 'vendorLockIn', message: 'vendorLockIn должно быть булевым значением' });
  }

  // Валидация versionToUpdate
  if (entity.versionToUpdate !== undefined && entity.versionToUpdate !== null && typeof entity.versionToUpdate !== 'string') {
    errors.push({ field: 'versionToUpdate', message: 'versionToUpdate должно быть строкой' });
  }

  // Валидация дат
  const dateFields = ['versionReleaseDate', 'firstAdded', 'lastUpdated', 'endOfLifeDate', 'versionUpdateDeadline'];
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  for (const field of dateFields) {
    const fieldValue = entityAny[field];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      if (typeof fieldValue !== 'string' || !dateRegex.test(fieldValue)) {
        errors.push({ field, message: `Поле ${field} должно быть в формате YYYY-MM-DD` });
      }
    }
  }

  // Валидация URL
  const urlFields = ['documentationUrl', 'internalGuideUrl'];
  const urlRegex = /^https?:\/\/.+/;
  for (const field of urlFields) {
    const fieldValue = entityAny[field];
    if (fieldValue !== undefined && fieldValue !== null && fieldValue !== '') {
      if (typeof fieldValue !== 'string' || !urlRegex.test(fieldValue)) {
        errors.push({ field, message: `Поле ${field} должно быть корректным URL` });
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
