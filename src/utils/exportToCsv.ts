/**
 * Преобразует значение в строку для CSV
 * Экранирует кавычки и обрабатывает специальные символы
 */
const escapeCsvValue = (value: unknown): string => {
  if (value === null || value === undefined) {
    return '';
  }
  
  const stringValue = String(value);
  
  // Если значение содержит кавычки, запятые или переносы строк - экранируем
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('\r')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  
  return stringValue;
};

/**
 * Параметры для экспорта в CSV
 */
export interface CsvExportOptions<T> {
  /** Данные для экспорта */
  data: T[];
  /** Заголовки колонок */
  columns: Array<{
    /** Ключ поля в объекте данных */
    key: keyof T | string;
    /** Заголовок колонки в CSV */
    label: string;
    /** Опциональная функция для форматирования значения */
    format?: (value: T[keyof T], row: T) => string;
  }>;
  /** Имя файла (без расширения) */
  filename: string;
  /** Разделитель (по умолчанию ';') */
  delimiter?: string;
}

/**
 * Экспортирует данные в CSV файл и инициирует скачивание
 */
export const exportToCsv = <T>({
  data,
  columns,
  filename,
  delimiter = ';',
}: CsvExportOptions<T>): void => {
  if (!data || data.length === 0) {
    console.warn('Нет данных для экспорта в CSV');
    return;
  }

  // Создаем заголовок CSV
  const headerRow = columns.map(col => escapeCsvValue(col.label)).join(delimiter);
  
  // Создаем строки данных
  const dataRows = data.map(row => {
    return columns
      .map(col => {
        const value = (row as any)[col.key as keyof T];
        const formattedValue = col.format ? col.format(value, row) : escapeCsvValue(value);
        return formattedValue;
      })
      .join(delimiter);
  });
  
  // Объединяем все строки
  const csvContent = [headerRow, ...dataRows].join('\n');
  
  // Создаем BOM для корректного отображения кириллицы в Excel
  const BOM = '\uFEFF';
  const csvWithBOM = BOM + csvContent;
  
  // Создаем Blob и инициируем скачивание
  const blob = new Blob([csvWithBOM], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Освобождаем URL
  URL.revokeObjectURL(url);
};
