import { create } from 'zustand';

interface UIState {
  // Modal states
  isModalOpen: boolean;
  modalType: 'create' | 'edit' | 'view' | null;
  selectedEntityId: string | undefined;

  // Sidebar/Navigation
  isSidebarOpen: boolean;
  isMobileMenuOpen: boolean;

  // Notifications
  unreadNotifications: number;

  // Actions
  openModal: (type: UIState['modalType'], entityId?: string) => void;
  closeModal: () => void;
  toggleSidebar: () => void;
  toggleMobileMenu: () => void;
  setUnreadNotifications: (count: number) => void;
  markNotificationsRead: () => void;
}

export const useUIStore = create<UIState>()((set) => ({
  isModalOpen: false,
  modalType: null,
  selectedEntityId: undefined,
  isSidebarOpen: true,
  isMobileMenuOpen: false,
  unreadNotifications: 0,

  openModal: (type, entityId) => set({
    isModalOpen: true,
    modalType: type,
    selectedEntityId: entityId
  }),
  closeModal: () => set({
    isModalOpen: false,
    modalType: null,
    selectedEntityId: undefined
  }),
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
  toggleMobileMenu: () => set((state) => ({ isMobileMenuOpen: !state.isMobileMenuOpen })),
  setUnreadNotifications: (unreadNotifications) => set({ unreadNotifications }),
  markNotificationsRead: () => set({ unreadNotifications: 0 }),
}));
