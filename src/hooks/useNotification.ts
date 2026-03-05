import { toast, type ToastContent, type ToastOptions, type Id } from 'react-toastify';

const defaultOptions: ToastOptions = {
  position: 'top-right',
  autoClose: 3000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  theme: 'light',
};

export interface NotificationOptions extends Omit<ToastOptions, 'type'> {
  title?: string;
}

/**
 * Хук для управления уведомлениями
 */
export const useNotification = () => {
  const notify = (message: string | ToastContent, options: NotificationOptions = {}): Id => {
    const { title, ...restOptions } = options;
    const content = title ? `${title}: ${message}` : message;
    
    return toast(content, {
      ...defaultOptions,
      ...restOptions,
    });
  };

  const success = (message: string | ToastContent, options: NotificationOptions = {}): Id => {
    const { title, ...restOptions } = options;
    const content = title ? `${title}: ${message}` : message;
    
    return toast.success(content, {
      ...defaultOptions,
      ...restOptions,
    });
  };

  const error = (message: string | ToastContent, options: NotificationOptions = {}): Id => {
    const { title, ...restOptions } = options;
    const content = title ? `${title}: ${message}` : message;
    
    return toast.error(content, {
      ...defaultOptions,
      ...restOptions,
      autoClose: restOptions.autoClose ?? 5000, // Ошибки показываем дольше
    });
  };

  const warning = (message: string | ToastContent, options: NotificationOptions = {}): Id => {
    const { title, ...restOptions } = options;
    const content = title ? `${title}: ${message}` : message;
    
    return toast.warn(content, {
      ...defaultOptions,
      ...restOptions,
    });
  };

  const info = (message: string | ToastContent, options: NotificationOptions = {}): Id => {
    const { title, ...restOptions } = options;
    const content = title ? `${title}: ${message}` : message;
    
    return toast.info(content, {
      ...defaultOptions,
      ...restOptions,
    });
  };

  const dismiss = (id?: Id): void => {
    toast.dismiss(id);
  };

  const promise = <T,>(
    promise: Promise<T>,
    messages: {
      pending: string;
      success: string;
      error: string;
    },
    options?: NotificationOptions
  ): Promise<T> => {
    const { title, ...restOptions } = options || {};

    return toast.promise<T>(
      promise,
      {
        pending: title ? `${title}: ${messages.pending}` : messages.pending,
        success: title ? `${title}: ${messages.success}` : messages.success,
        error: title ? `${title}: ${messages.error}` : messages.error,
      },
      {
        ...defaultOptions,
        ...restOptions,
      } as any
    );
  };

  return {
    notify,
    success,
    error,
    warning,
    info,
    dismiss,
    promise,
  };
};

// Экспорт для удобства
export { toast };
