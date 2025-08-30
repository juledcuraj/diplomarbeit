/**
 * Theme Management Hook
 * React hook for managing medical record themes and dark mode
 */

import { useState, useEffect, useCallback } from 'react';
import { ThemeConfigManager } from '@/lib/theme/config';
import { MEDICAL_RECORD_THEMES, HEALTH_STATUS_THEMES, APPOINTMENT_STATUS_THEMES } from '@/lib/theme';

export type ThemeMode = 'light' | 'dark' | 'system';

interface UseThemeReturn {
  // Current theme mode
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  
  // System theme detection
  systemTheme: 'light' | 'dark';
  resolvedTheme: 'light' | 'dark';
  
  // Medical record theme utilities
  getMedicalRecordClasses: (recordType: string) => string;
  getHealthStatusClasses: (status: string) => string;
  getAppointmentStatusClasses: (status: string) => string;
  
  // Theme customization
  updateMedicalRecordColor: (recordType: string, colors: any) => void;
  resetToDefaultColors: () => void;
  
  // Theme persistence
  saveThemePreferences: () => void;
  loadThemePreferences: () => void;
}

export function useTheme(): UseThemeReturn {
  const [theme, setThemeState] = useState<ThemeMode>('system');
  const [systemTheme, setSystemTheme] = useState<'light' | 'dark'>('light');
  
  // Detect system theme
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    setSystemTheme(mediaQuery.matches ? 'dark' : 'light');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setSystemTheme(e.matches ? 'dark' : 'light');
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);
  
  // Resolved theme (actual light/dark value)
  const resolvedTheme = theme === 'system' ? systemTheme : theme;
  
  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(resolvedTheme);
  }, [resolvedTheme]);
  
  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('medical-app-theme') as ThemeMode;
    if (savedTheme && ['light', 'dark', 'system'].includes(savedTheme)) {
      setThemeState(savedTheme);
    }
  }, []);
  
  // Save theme to localStorage
  const setTheme = useCallback((newTheme: ThemeMode) => {
    setThemeState(newTheme);
    localStorage.setItem('medical-app-theme', newTheme);
  }, []);
  
  // Get themed classes for medical records
  const getMedicalRecordClasses = useCallback((recordType: string): string => {
    // Use the new theme system
    const recordTypeMapped = recordType.replace('_', '-') as keyof typeof MEDICAL_RECORD_THEMES;
    
    if (recordTypeMapped in MEDICAL_RECORD_THEMES) {
      return `bg-medical-${recordTypeMapped} text-medical-${recordTypeMapped}-foreground border-medical-${recordTypeMapped}-border hover:bg-medical-${recordTypeMapped}-hover`;
    }
    
    // Fallback to legacy system
    return ThemeConfigManager.getMedicalRecordClasses(recordType, resolvedTheme);
  }, [resolvedTheme]);
  
  // Get themed classes for health status
  const getHealthStatusClasses = useCallback((status: string): string => {
    return `bg-health-${status} text-health-${status}-foreground border-health-${status}-border`;
  }, []);
  
  // Get themed classes for appointment status
  const getAppointmentStatusClasses = useCallback((status: string): string => {
    return `bg-appointment-${status} text-appointment-${status}-foreground border-appointment-${status}-border`;
  }, []);
  
  // Update medical record color
  const updateMedicalRecordColor = useCallback((recordType: string, colors: any) => {
    // Update theme configuration
    ThemeConfigManager.updateConfig({
      medicalRecordColors: {
        [recordType]: colors
      }
    });
    
    // Re-inject CSS
    ThemeConfigManager.injectThemeCSS();
  }, []);
  
  // Reset to default colors
  const resetToDefaultColors = useCallback(() => {
    ThemeConfigManager.updateConfig({
      medicalRecordColors: {},
      healthStatusColors: {},
      appointmentStatusColors: {}
    });
    
    ThemeConfigManager.injectThemeCSS();
  }, []);
  
  // Save theme preferences
  const saveThemePreferences = useCallback(() => {
    const preferences = {
      theme,
      timestamp: Date.now()
    };
    localStorage.setItem('medical-app-theme-preferences', JSON.stringify(preferences));
  }, [theme]);
  
  // Load theme preferences
  const loadThemePreferences = useCallback(() => {
    try {
      const saved = localStorage.getItem('medical-app-theme-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        setThemeState(preferences.theme);
      }
    } catch (error) {
      console.warn('Failed to load theme preferences:', error);
    }
  }, []);
  
  return {
    theme,
    setTheme,
    systemTheme,
    resolvedTheme,
    getMedicalRecordClasses,
    getHealthStatusClasses,
    getAppointmentStatusClasses,
    updateMedicalRecordColor,
    resetToDefaultColors,
    saveThemePreferences,
    loadThemePreferences,
  };
}
