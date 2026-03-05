import { describe, it, expect } from 'vitest';
import { techRadarSchema } from '../../schemas/techRadarSchema';

describe('techRadarSchema', () => {
  const validBaseData = {
    name: 'React',
    version: '18.2.0',
    type: 'фреймворк' as const,
    subtype: 'фронтенд' as const,
    category: 'adopt' as const,
    firstAdded: '2023-01-15',
    owner: 'Frontend Team',
    maturity: 'stable' as const,
    riskLevel: 'low' as const,
    license: 'MIT',
    supportStatus: 'active' as const,
    businessCriticality: 'high' as const,
    vendorLockIn: false,
  };

  describe('Обязательные поля', () => {
    it('должен проходить валидацию с полным набором обязательных полей', () => {
      const result = techRadarSchema.safeParse(validBaseData);
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку при отсутствии name', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, name: undefined });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some((e: any) => e.path.includes('name'))).toBe(true);
      }
    });

    it('должен возвращать ошибку при пустом name', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, name: '' });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии version', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, version: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии type', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, type: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии category', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, category: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии firstAdded', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, firstAdded: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии owner', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, owner: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии maturity', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, maturity: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии riskLevel', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, riskLevel: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии license', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, license: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии supportStatus', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, supportStatus: undefined });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку при отсутствии businessCriticality', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, businessCriticality: undefined });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация type enum', () => {
    const validTypes = ['фреймворк', 'библиотека', 'язык программирования', 'инструмент'];

    validTypes.forEach((type) => {
      it(`должен проходить валидацию для type: ${type}`, () => {
        const result = techRadarSchema.safeParse({ ...validBaseData, type });
        expect(result.success).toBe(true);
      });
    });

    it('должен возвращать ошибку для недопустимого type', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, type: 'недопустимый' });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация category enum', () => {
    const validCategories = ['adopt', 'trial', 'assess', 'hold', 'drop'];

    validCategories.forEach((category) => {
      it(`должен проходить валидацию для category: ${category}`, () => {
        const result = techRadarSchema.safeParse({ ...validBaseData, category });
        expect(result.success).toBe(true);
      });
    });

    it('должен возвращать ошибку для недопустимого category', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, category: 'invalid' });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация adoptionRate', () => {
    it('должен проходить валидацию для adoptionRate = 0', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: 0 });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для adoptionRate = 0.5', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: 0.5 });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для adoptionRate = 1', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: 1 });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для adoptionRate = null', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: null });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для adoptionRate = undefined', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: undefined });
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку для adoptionRate < 0', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: -0.1 });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку для adoptionRate > 1', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, adoptionRate: 1.1 });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация popularityIndex', () => {
    it('должен проходить валидацию для popularityIndex = 0', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: 0 });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для popularityIndex = 0.5', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: 0.5 });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для popularityIndex = 1', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: 1 });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для popularityIndex = null', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: null });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для popularityIndex = undefined', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: undefined });
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку для popularityIndex < 0', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: -0.1 });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку для popularityIndex > 1', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, popularityIndex: 1.1 });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация дат', () => {
    it('должен проходить валидацию для даты в формате YYYY-MM-DD', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, versionReleaseDate: '2024-01-15' });
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку для даты в неверном формате', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, versionReleaseDate: '01-15-2024' });
      expect(result.success).toBe(false);
    });

    it('должен проходить валидацию для null даты', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, versionReleaseDate: null });
      expect(result.success).toBe(true);
    });
  });

  describe('Валидация URL', () => {
    it('должен проходить валидацию для HTTPS URL', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, documentationUrl: 'https://react.dev' });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для HTTP URL', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, documentationUrl: 'http://example.com' });
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку для некорректного URL', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, documentationUrl: 'not-a-url' });
      expect(result.success).toBe(false);
    });

    it('должен проходить валидацию для null URL', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, documentationUrl: null });
      expect(result.success).toBe(true);
    });
  });

  describe('Валидация dependencies', () => {
    it('должен проходить валидацию для корректных dependencies', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        dependencies: [
          { name: 'react', version: '18.2.0' },
          { name: 'react-dom', version: '18.2.0', optional: true },
        ],
      });
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку если у зависимости нет name', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        dependencies: [{ version: '1.0.0' }],
      });
      expect(result.success).toBe(false);
    });

    it('должен возвращать ошибку если у зависимости нет version', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        dependencies: [{ name: 'react' }],
      });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация массивов', () => {
    it('должен проходить валидацию для корректных массивов', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        stakeholders: ['Team A', 'Team B'],
        usageExamples: ['Example 1'],
        relatedTechnologies: ['Redux', 'React Query'],
      });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для null массивов', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        stakeholders: null,
      });
      expect(result.success).toBe(true);
    });
  });

  describe('Валидация vendorLockIn', () => {
    it('должен проходить валидацию для vendorLockIn = true', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, vendorLockIn: true });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для vendorLockIn = false', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, vendorLockIn: false });
      expect(result.success).toBe(true);
    });

    it('должен возвращать ошибку для vendorLockIn не boolean', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, vendorLockIn: 'yes' as any });
      expect(result.success).toBe(false);
    });
  });

  describe('Валидация versionToUpdate и versionUpdateDeadline', () => {
    it('должен проходить валидацию для versionToUpdate', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, versionToUpdate: '2.0.0' });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для versionUpdateDeadline', () => {
      const result = techRadarSchema.safeParse({ ...validBaseData, versionUpdateDeadline: '2024-12-31' });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для обоих полей', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        versionToUpdate: '2.0.0',
        versionUpdateDeadline: '2024-12-31',
      });
      expect(result.success).toBe(true);
    });

    it('должен проходить валидацию для null полей', () => {
      const result = techRadarSchema.safeParse({
        ...validBaseData,
        versionToUpdate: null,
        versionUpdateDeadline: null,
      });
      expect(result.success).toBe(true);
    });
  });
});
