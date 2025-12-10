import React from 'react';

interface SliderProps {
  label: string;
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
}

export const Slider: React.FC<SliderProps> = ({ label, value, onChange, min = 0, max = 100 }) => {
  return (
    <div className="mb-4">
      <div className="flex justify-between text-xs font-medium text-slate-400 mb-2">
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-indigo-500 hover:accent-indigo-400 transition-all"
      />
    </div>
  );
};
