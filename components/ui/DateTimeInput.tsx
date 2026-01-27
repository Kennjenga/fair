'use client';

import { useState, useEffect } from 'react';

/**
 * Props for DateTimeInput component
 */
export interface DateTimeInputProps {
  /** Label for the input */
  label: string;
  /** Input ID */
  id: string;
  /** Current value in datetime-local format (YYYY-MM-DDTHH:mm) */
  value: string;
  /** Change handler */
  onChange: (value: string) => void;
  /** Whether the input is required */
  required?: boolean;
  /** Minimum date/time value */
  min?: string;
  /** Maximum date/time value */
  max?: string;
  /** Helper text to display below the input */
  helperText?: string;
  /** Whether the input is disabled */
  disabled?: boolean;
}

/**
 * Cross-browser compatible date and time input component
 * Works in Firefox, Chrome, Safari, and Edge by using separate date and time inputs
 * and combining them into a datetime-local format
 */
export default function DateTimeInput({
  label,
  id,
  value,
  onChange,
  required = false,
  min,
  max,
  helperText,
  disabled = false,
}: DateTimeInputProps) {
  // Parse the datetime-local value into separate date and time
  const parseValue = (val: string): { date: string; time: string } => {
    if (!val) {
      return { date: '', time: '' };
    }
    
    // Handle datetime-local format: YYYY-MM-DDTHH:mm
    const parts = val.split('T');
    return {
      date: parts[0] || '',
      time: parts[1] || '',
    };
  };

  const [dateValue, setDateValue] = useState(parseValue(value).date);
  const [timeValue, setTimeValue] = useState(parseValue(value).time);

  // Update local state when value prop changes
  useEffect(() => {
    const parsed = parseValue(value);
    setDateValue(parsed.date);
    setTimeValue(parsed.time);
  }, [value]);

  // Combine date and time into datetime-local format
  const handleDateChange = (newDate: string) => {
    setDateValue(newDate);
    // If time is not set, default to 00:00
    const time = timeValue || '00:00';
    const combined = newDate && time ? `${newDate}T${time}` : '';
    onChange(combined);
  };

  const handleTimeChange = (newTime: string) => {
    setTimeValue(newTime);
    // If date is not set, use today's date
    const date = dateValue || new Date().toISOString().split('T')[0];
    const combined = date && newTime ? `${date}T${newTime}` : date || '';
    onChange(combined);
  };

  // Parse min/max values for date and time inputs
  const minDate = min ? min.split('T')[0] : undefined;
  const minTime = min && min.includes('T') ? min.split('T')[1] : undefined;
  const maxDate = max ? max.split('T')[0] : undefined;
  const maxTime = max && max.includes('T') ? max.split('T')[1] : undefined;

  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-medium text-[#334155]">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      
      <div className="grid grid-cols-2 gap-3">
        {/* Date input - well supported across all browsers */}
        <div className="relative">
          <input
            type="date"
            id={`${id}-date`}
            value={dateValue}
            onChange={(e) => handleDateChange(e.target.value)}
            required={required}
            min={minDate}
            max={maxDate}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label={`${label} date`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
            📅
          </div>
        </div>

        {/* Time input - well supported across all browsers */}
        <div className="relative">
          <input
            type="time"
            id={`${id}-time`}
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
            required={required}
            min={minTime}
            max={maxTime}
            disabled={disabled}
            className="w-full px-4 py-2.5 rounded-xl border-1.5 border-[#E2E8F0] focus:outline-none focus:ring-2 focus:ring-[#EEF2FF] focus:border-[#4F46E5] bg-white transition-all disabled:bg-gray-100 disabled:cursor-not-allowed"
            aria-label={`${label} time`}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#64748B]">
            🕐
          </div>
        </div>
      </div>

      {/* Hidden input for form validation (uses datetime-local format) */}
      <input
        type="datetime-local"
        id={id}
        value={value}
        onChange={() => {}} // Controlled by date/time inputs above
        required={required}
        min={min}
        max={max}
        disabled={disabled}
        className="sr-only"
        aria-hidden="true"
      />

      {helperText && (
        <p className="text-xs text-[#64748B] mt-1">{helperText}</p>
      )}
    </div>
  );
}
