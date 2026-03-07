import React from 'react';

export interface GaugeProps {
  value: number; // 0-100
  label: string;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
  thresholds?: {
    good: number; // до этого значения - зелёный
    warning: number; // до этого - жёлтый
    // выше - красный
  };
}

export const Gauge: React.FC<GaugeProps> = ({
  value,
  label,
  size = 'md',
  showValue = true,
  thresholds = { good: 20, warning: 50 },
}) => {
  // Размеры в зависимости от size
  const sizeConfig = {
    sm: { width: 120, strokeWidth: 8, fontSize: 14 },
    md: { width: 160, strokeWidth: 12, fontSize: 18 },
    lg: { width: 200, strokeWidth: 16, fontSize: 24 },
  };

  const { width, strokeWidth, fontSize } = sizeConfig[size];
  const radius = (width - strokeWidth) / 2;
  const circumference = radius * Math.PI; // Полукруг
  const offset = circumference - (Math.min(100, Math.max(0, value)) / 100) * circumference;

  // Определяем цвет в зависимости от значения
  const getColor = () => {
    if (value <= thresholds.good) return '#10B981'; // green-500
    if (value <= thresholds.warning) return '#F59E0B'; // amber-500
    return '#EF4444'; // red-500
  };

  const color = getColor();

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width, height: width / 2 + strokeWidth }}>
        <svg
          width={width}
          height={width / 2 + strokeWidth}
          viewBox={`0 0 ${width} ${width / 2 + strokeWidth}`}
        >
          {/* Фоновая дуга */}
          <path
            d={`M ${strokeWidth / 2} ${width / 2} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${width / 2}`}
            fill="none"
            stroke="#E5E7EB"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            className="dark:stroke-gray-700"
          />
          
          {/* Активная дуга */}
          <path
            d={`M ${strokeWidth / 2} ${width / 2} A ${radius} ${radius} 0 0 1 ${width - strokeWidth / 2} ${width / 2}`}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={offset}
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Значение в центре */}
        {showValue && (
          <div
            className="absolute bottom-0 left-1/2 transform -translate-x-1/2 -translate-y-1/4 text-center"
            style={{ fontSize }}
          >
            <span className="font-bold" style={{ color }}>
              {value.toFixed(1)}%
            </span>
          </div>
        )}
      </div>
      
      {/* Подпись */}
      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
        {label}
      </p>
    </div>
  );
};
