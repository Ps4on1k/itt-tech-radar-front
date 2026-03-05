import React from 'react';
import { List } from 'react-window';
import { AutoSizer } from 'react-virtualized-auto-sizer';

export interface VirtualListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (item: T, index: number) => React.ReactNode;
  overscanCount?: number;
  className?: string;
  emptyMessage?: string;
}

export function VirtualList<T>({
  items,
  itemHeight,
  renderItem,
  overscanCount = 5,
  className = '',
  emptyMessage = 'Нет данных',
}: VirtualListProps<T>) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`h-full ${className}`}>
      <AutoSizer
        renderProp={({ height, width }) => (
          <div style={{ height, width }}>
            <List
              rowHeight={itemHeight}
              rowCount={items.length}
              overscanCount={overscanCount}
              rowProps={{}}
              rowComponent={({ style, index }) => (
                <div style={style}>
                  {renderItem(items[index], index)}
                </div>
              )}
            />
          </div>
        )}
      />
    </div>
  );
}

export interface VirtualTableProps<T> {
  items: T[];
  rowHeight: number;
  headerHeight?: number;
  renderRow: (item: T, index: number) => React.ReactNode;
  renderHeader?: () => React.ReactNode;
  overscanCount?: number;
  className?: string;
  emptyMessage?: string;
}

export function VirtualTable<T>({
  items,
  rowHeight,
  headerHeight = 48,
  renderRow,
  renderHeader,
  overscanCount = 5,
  className = '',
  emptyMessage = 'Нет данных',
}: VirtualTableProps<T>) {
  if (items.length === 0) {
    return (
      <div className="flex items-center justify-center py-12 text-gray-500 dark:text-gray-400">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {renderHeader && (
        <div
          className="flex-shrink-0 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
          style={{ height: headerHeight }}
        >
          {renderHeader()}
        </div>
      )}
      <div className="flex-1 overflow-hidden">
        <AutoSizer
          renderProp={({ height, width }) => (
            <div style={{ height, width }}>
              <List
                rowHeight={rowHeight}
                rowCount={items.length}
                overscanCount={overscanCount}
                rowProps={{}}
                rowComponent={({ style, index }) => (
                  <div style={style}>
                    {renderRow(items[index], index)}
                  </div>
                )}
              />
            </div>
          )}
        />
      </div>
    </div>
  );
}
