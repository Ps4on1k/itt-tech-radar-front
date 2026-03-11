import axios from 'axios';
import type { TechRadarEntity, RadarStatistics, FilterState, SortState, User, UserRole, AIConfig, AIConfigGlobalSettings, MigrationMetadata, MigrationStatistics, MigrationStatus, MigrationMetadataView } from '../types';

// Use relative path - nginx will proxy /api to backend
const API_BASE_URL = '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
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

export interface AuditLog {
  id: string;
  userId?: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'IMPORT' | 'EXPORT' | 'PASSWORD_CHANGE';
  entity: 'TechRadar' | 'User' | 'Import' | 'Auth';
  entityId?: string;
  ipAddress?: string;
  details?: Record<string, any>;
  status: 'SUCCESS' | 'FAILURE';
  timestamp: string;
}

export interface AuditLogFilter {
  userId?: string;
  action?: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'LOGOUT' | 'IMPORT' | 'EXPORT' | 'PASSWORD_CHANGE';
  entity?: 'TechRadar' | 'User' | 'Import' | 'Auth';
  status?: 'SUCCESS' | 'FAILURE';
  startDate?: string;
  endDate?: string;
}

export interface PaginatedAuditLogs {
  data: AuditLog[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface AuditStatistics {
  total: number;
  byAction: Record<string, number>;
  byEntity: Record<string, number>;
  byStatus: Record<string, number>;
  last7Days: Array<{ date: string; count: number }>;
}

export const techRadarApi = {
  getAll: async (): Promise<TechRadarEntity[]> => {
    const response = await api.get('/tech-radar');
    return response.data;
  },

  getFiltered: async (
    filters: FilterState,
    sort?: SortState
  ): Promise<TechRadarEntity[]> => {
    const params = new URLSearchParams();

    if (filters.category) params.append('category', filters.category);
    if (filters.type) params.append('type', filters.type);
    if (filters.subtype) params.append('subtype', filters.subtype);
    if (filters.maturity) params.append('maturity', filters.maturity);
    if (filters.search) params.append('search', filters.search);
    if (sort?.sortBy) params.append('sortBy', sort.sortBy);
    if (sort?.sortOrder) params.append('sortOrder', sort.sortOrder);

    const response = await api.get(`/tech-radar/filtered?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<TechRadarEntity> => {
    const response = await api.get(`/tech-radar/${id}`);
    return response.data;
  },

  search: async (query: string): Promise<TechRadarEntity[]> => {
    const response = await api.get(`/tech-radar/search?q=${encodeURIComponent(query)}`);
    return response.data;
  },

  getStatistics: async (): Promise<RadarStatistics> => {
    const response = await api.get('/tech-radar/statistics');
    return response.data;
  },

  getByCategory: async (category: string): Promise<TechRadarEntity[]> => {
    const response = await api.get(`/tech-radar/category/${category}`);
    return response.data;
  },

  getByType: async (type: string): Promise<TechRadarEntity[]> => {
    const response = await api.get(`/tech-radar/type/${type}`);
    return response.data;
  },

  create: async (entity: TechRadarEntity): Promise<TechRadarEntity> => {
    const response = await api.post('/tech-radar', entity);
    return response.data;
  },

  update: async (id: string, entity: Partial<TechRadarEntity>): Promise<TechRadarEntity> => {
    const response = await api.put(`/tech-radar/${id}`, entity);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/tech-radar/${id}`);
  },
};

export const authApi = {
  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },

  getMe: async (): Promise<{ user: User }> => {
    const response = await api.get('/auth/me');
    return response.data;
  },

  getUsers: async (): Promise<User[]> => {
    const response = await api.get('/auth/users');
    return response.data;
  },

  createUser: async (userData: { email: string; password: string; firstName: string; lastName: string; role: UserRole }) => {
    const response = await api.post('/auth/users', userData);
    return response.data;
  },

  updateUser: async (id: string, userData: Partial<User>) => {
    const response = await api.put(`/auth/users/${id}`, userData);
    return response.data;
  },

  deleteUser: async (id: string) => {
    await api.delete(`/auth/users/${id}`);
  },

  changePassword: async (currentPassword: string, newPassword: string) => {
    const response = await api.post('/auth/change-password', { currentPassword, newPassword });
    return response.data;
  },

  setUserPassword: async (id: string, newPassword: string) => {
    const response = await api.post(`/auth/users/${id}/password`, { newPassword });
    return response.data;
  },

  toggleUserStatus: async (id: string) => {
    const response = await api.post(`/auth/users/${id}/toggle-status`);
    return response.data;
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },
};

export const importApi = {
  importTechRadar: async (data: TechRadarEntity[], options?: { skipExisting?: boolean; updateExisting?: boolean; overwrite?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.skipExisting) params.append('skipExisting', 'true');
    if (options?.updateExisting) params.append('updateExisting', 'true');
    if (options?.overwrite) params.append('overwrite', 'true');
    const response = await api.post(`/import/tech-radar?${params.toString()}`, data);
    return response.data;
  },

  exportTechRadar: async (): Promise<TechRadarEntity[]> => {
    const response = await api.get('/import/tech-radar');
    return response.data;
  },

  validateTechRadar: async (data: TechRadarEntity[], options?: { skipExisting?: boolean; updateExisting?: boolean; overwrite?: boolean }) => {
    const params = new URLSearchParams();
    if (options?.skipExisting) params.append('skipExisting', 'true');
    if (options?.updateExisting) params.append('updateExisting', 'true');
    if (options?.overwrite) params.append('overwrite', 'true');
    const response = await api.post(`/import/tech-radar/validate?${params.toString()}`, data);
    return response.data;
  },
};

export const versionApi = {
  getVersion: async (): Promise<{ version: string; name: string }> => {
    const response = await api.get('/version');
    return response.data;
  },
};

export const auditApi = {
  getLogs: async (filter: AuditLogFilter = {}, page: number = 1, limit: number = 20): Promise<PaginatedAuditLogs> => {
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    if (filter.userId) params.append('userId', filter.userId);
    if (filter.action) params.append('action', filter.action);
    if (filter.entity) params.append('entity', filter.entity);
    if (filter.status) params.append('status', filter.status);
    if (filter.startDate) params.append('startDate', filter.startDate);
    if (filter.endDate) params.append('endDate', filter.endDate);

    const response = await api.get(`/audit?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<AuditLog> => {
    const response = await api.get(`/audit/${id}`);
    return response.data;
  },

  getStatistics: async (): Promise<AuditStatistics> => {
    const response = await api.get('/audit/statistics');
    return response.data;
  },
};

export const aiConfigApi = {
  getAll: async (): Promise<AIConfig[]> => {
    const response = await api.get('/ai-config');
    return response.data;
  },

  getById: async (id: string): Promise<AIConfig> => {
    const response = await api.get(`/ai-config/${id}`);
    return response.data;
  },

  create: async (config: { fieldName: string; displayName: string; enabled?: boolean; prompt?: string }): Promise<AIConfig> => {
    const response = await api.post('/ai-config', config);
    return response.data;
  },

  update: async (id: string, config: { enabled?: boolean; prompt?: string }): Promise<AIConfig> => {
    const response = await api.put(`/ai-config/${id}`, config);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/ai-config/${id}`);
  },

  getGlobalSettings: async (): Promise<AIConfigGlobalSettings> => {
    const response = await api.get('/ai-config/global-settings');
    return response.data;
  },

  updateGlobalSettings: async (settings: AIConfigGlobalSettings): Promise<AIConfigGlobalSettings> => {
    const response = await api.put('/ai-config/global-settings', settings);
    return response.data;
  },
};

export const migrationMetadataApi = {
  getAll: async (includeCompleted: boolean = false): Promise<MigrationMetadataView[]> => {
    const params = new URLSearchParams();
    params.append('includeCompleted', includeCompleted.toString());
    const response = await api.get(`/migration-metadata?${params.toString()}`);
    return response.data;
  },

  getById: async (id: string): Promise<MigrationMetadata> => {
    const response = await api.get(`/migration-metadata/${id}`);
    return response.data;
  },

  getByTechRadarId: async (techRadarId: string): Promise<MigrationMetadata | null> => {
    const response = await api.get(`/migration-metadata/tech-radar/${techRadarId}`);
    return response.data;
  },

  create: async (dto: { techRadarId: string; priority?: number; status?: MigrationStatus; progress?: number }): Promise<MigrationMetadata> => {
    const response = await api.post('/migration-metadata', dto);
    return response.data;
  },

  update: async (id: string, dto: { priority?: number; status?: MigrationStatus; progress?: number }): Promise<MigrationMetadata> => {
    const response = await api.put(`/migration-metadata/${id}`, dto);
    return response.data;
  },

  /**
   * Обновить или создать метаданные по techRadarId (upsert)
   */
  updateWithTechRadarId: async (techRadarId: string, dto: { priority?: number; status?: MigrationStatus; progress?: number }): Promise<MigrationMetadata> => {
    const response = await api.put(`/migration-metadata/upsert/${techRadarId}`, dto);
    return response.data;
  },

  updatePriorities: async (
    items: Array<{ id: string; priority: number }>,
    techRadarIds?: Record<string, string>
  ): Promise<MigrationMetadataView[]> => {
    const response = await api.put('/migration-metadata/priorities', { items, techRadarIds });
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/migration-metadata/${id}`);
  },

  getStatistics: async (): Promise<MigrationStatistics> => {
    const response = await api.get('/migration-metadata/statistics');
    return response.data;
  },
};
