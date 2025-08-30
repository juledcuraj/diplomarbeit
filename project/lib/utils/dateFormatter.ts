/**
 * Date and Time Formatting Utilities
 * Centralized date/time formatting with configurable preferences
 */

import { UI_CONFIG } from '@/lib/config';

// Date formatting options
export const DATE_FORMAT_OPTIONS = {
  SHORT: {
    year: '2-digit' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  MEDIUM: {
    year: 'numeric' as const,
    month: 'short' as const,
    day: 'numeric' as const,
  },
  LONG: {
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  FULL: {
    weekday: 'long' as const,
    year: 'numeric' as const,
    month: 'long' as const,
    day: 'numeric' as const,
  },
  ISO: {
    year: 'numeric' as const,
    month: '2-digit' as const,
    day: '2-digit' as const,
  }
} as const;

// Time formatting options
export const TIME_FORMAT_OPTIONS = {
  SHORT: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
  },
  MEDIUM: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    second: '2-digit' as const,
  },
  LONG: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    second: '2-digit' as const,
    timeZoneName: 'short' as const,
  },
  FULL: {
    hour: '2-digit' as const,
    minute: '2-digit' as const,
    second: '2-digit' as const,
    timeZoneName: 'long' as const,
  }
} as const;

// DateTime formatting options
export const DATETIME_FORMAT_OPTIONS = {
  SHORT: {
    ...DATE_FORMAT_OPTIONS.SHORT,
    ...TIME_FORMAT_OPTIONS.SHORT
  },
  MEDIUM: {
    ...DATE_FORMAT_OPTIONS.MEDIUM,
    ...TIME_FORMAT_OPTIONS.SHORT
  },
  LONG: {
    ...DATE_FORMAT_OPTIONS.LONG,
    ...TIME_FORMAT_OPTIONS.MEDIUM
  },
  FULL: {
    ...DATE_FORMAT_OPTIONS.FULL,
    ...TIME_FORMAT_OPTIONS.LONG
  }
} as const;

// Utility functions for formatting dates
export class DateFormatter {
  private locale: string;

  constructor(locale: string = UI_CONFIG.DATE_LOCALE) {
    this.locale = locale;
  }

  /**
   * Format a date using the specified format
   */
  formatDate(date: Date | string, format: keyof typeof DATE_FORMAT_OPTIONS = 'MEDIUM'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleDateString(this.locale, DATE_FORMAT_OPTIONS[format]);
  }

  /**
   * Format a time using the specified format
   */
  formatTime(date: Date | string, format: keyof typeof TIME_FORMAT_OPTIONS = 'SHORT'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleTimeString(this.locale, TIME_FORMAT_OPTIONS[format]);
  }

  /**
   * Format a datetime using the specified format
   */
  formatDateTime(date: Date | string, format: keyof typeof DATETIME_FORMAT_OPTIONS = 'MEDIUM'): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    return dateObj.toLocaleString(this.locale, DATETIME_FORMAT_OPTIONS[format]);
  }

  /**
   * Format relative time (e.g., "2 hours ago", "in 3 days")
   */
  formatRelativeTime(date: Date | string): string {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = dateObj.getTime() - now.getTime();
    const diffSeconds = Math.round(diffMs / 1000);
    const diffMinutes = Math.round(diffSeconds / 60);
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (Math.abs(diffSeconds) < 60) {
      return diffSeconds >= 0 ? 'in a few seconds' : 'a few seconds ago';
    } else if (Math.abs(diffMinutes) < 60) {
      const minutes = Math.abs(diffMinutes);
      return diffMinutes >= 0 
        ? `in ${minutes} minute${minutes !== 1 ? 's' : ''}`
        : `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffHours) < 24) {
      const hours = Math.abs(diffHours);
      return diffHours >= 0 
        ? `in ${hours} hour${hours !== 1 ? 's' : ''}`
        : `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (Math.abs(diffDays) < 7) {
      const days = Math.abs(diffDays);
      return diffDays >= 0 
        ? `in ${days} day${days !== 1 ? 's' : ''}`
        : `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
      // For longer periods, use standard date format
      return this.formatDate(dateObj, 'MEDIUM');
    }
  }

  /**
   * Calculate age from birth date
   */
  calculateAge(birthDate: Date | string): number {
    const birthDateObj = typeof birthDate === 'string' ? new Date(birthDate) : birthDate;
    const today = new Date();
    let age = today.getFullYear() - birthDateObj.getFullYear();
    const monthDiff = today.getMonth() - birthDateObj.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDateObj.getDate())) {
      age--;
    }
    
    return age;
  }

  /**
   * Format duration between two dates
   */
  formatDuration(startDate: Date | string, endDate: Date | string): string {
    const start = typeof startDate === 'string' ? new Date(startDate) : startDate;
    const end = typeof endDate === 'string' ? new Date(endDate) : endDate;
    const diffMs = end.getTime() - start.getTime();
    const diffMinutes = Math.round(diffMs / (1000 * 60));
    const diffHours = Math.round(diffMinutes / 60);
    const diffDays = Math.round(diffHours / 24);

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? 's' : ''}`;
    } else if (diffHours < 24) {
      const hours = Math.floor(diffHours);
      const minutes = diffMinutes % 60;
      return minutes > 0 
        ? `${hours}h ${minutes}m`
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
    } else {
      const days = Math.floor(diffDays);
      const hours = diffHours % 24;
      return hours > 0 
        ? `${days}d ${hours}h`
        : `${days} day${days !== 1 ? 's' : ''}`;
    }
  }

  /**
   * Check if a date is today
   */
  isToday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const today = new Date();
    return dateObj.toDateString() === today.toDateString();
  }

  /**
   * Check if a date is tomorrow
   */
  isTomorrow(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return dateObj.toDateString() === tomorrow.toDateString();
  }

  /**
   * Check if a date is yesterday
   */
  isYesterday(date: Date | string): boolean {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    return dateObj.toDateString() === yesterday.toDateString();
  }

  /**
   * Format date with contextual labels (Today, Tomorrow, Yesterday)
   */
  formatDateWithContext(date: Date | string, format: keyof typeof DATE_FORMAT_OPTIONS = 'MEDIUM'): string {
    if (this.isToday(date)) {
      return 'Today';
    } else if (this.isTomorrow(date)) {
      return 'Tomorrow';
    } else if (this.isYesterday(date)) {
      return 'Yesterday';
    } else {
      return this.formatDate(date, format);
    }
  }
}

// Default formatter instance
export const dateFormatter = new DateFormatter();

// Convenience functions using the default formatter
export const formatDate = (date: Date | string, format?: keyof typeof DATE_FORMAT_OPTIONS) => 
  dateFormatter.formatDate(date, format);

export const formatTime = (date: Date | string, format?: keyof typeof TIME_FORMAT_OPTIONS) => 
  dateFormatter.formatTime(date, format);

export const formatDateTime = (date: Date | string, format?: keyof typeof DATETIME_FORMAT_OPTIONS) => 
  dateFormatter.formatDateTime(date, format);

export const formatRelativeTime = (date: Date | string) => 
  dateFormatter.formatRelativeTime(date);

export const calculateAge = (birthDate: Date | string) => 
  dateFormatter.calculateAge(birthDate);

export const formatDuration = (startDate: Date | string, endDate: Date | string) => 
  dateFormatter.formatDuration(startDate, endDate);

export const formatDateWithContext = (date: Date | string, format?: keyof typeof DATE_FORMAT_OPTIONS) => 
  dateFormatter.formatDateWithContext(date, format);
