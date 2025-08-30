/**
 * Theme Utility Functions
 * Helper functions for converting between theme systems and generating CSS
 */

import { MEDICAL_RECORD_THEMES, type MedicalRecordType } from '@/lib/theme';

/**
 * Get theme-aware CSS classes for medical record types
 */
export function getMedicalRecordThemeClasses(recordType: string): string {
  const normalizedType = recordType.replace('_', '-') as any;
  
  // Map record types to new theme classes
  const themeClassMap: Record<string, string> = {
    'lab-result': 'bg-medical-lab-result text-medical-lab-result-foreground border-medical-lab-result-border hover:bg-medical-lab-result-hover',
    'imaging': 'bg-medical-imaging text-medical-imaging-foreground border-medical-imaging-border hover:bg-medical-imaging-hover',
    'prescription': 'bg-medical-prescription text-medical-prescription-foreground border-medical-prescription-border hover:bg-medical-prescription-hover',
    'consultation': 'bg-medical-consultation text-medical-consultation-foreground border-medical-consultation-border hover:bg-medical-consultation-hover',
    'vaccination': 'bg-medical-vaccination text-medical-vaccination-foreground border-medical-vaccination-border hover:bg-medical-vaccination-hover',
    'discharge-summary': 'bg-medical-discharge-summary text-medical-discharge-summary-foreground border-medical-discharge-summary-border hover:bg-medical-discharge-summary-hover',
    'other': 'bg-medical-other text-medical-other-foreground border-medical-other-border hover:bg-medical-other-hover',
  };
  
  return themeClassMap[normalizedType] || themeClassMap['other'];
}

/**
 * Get theme-aware CSS classes for health status
 */
export function getHealthStatusThemeClasses(status: string): string {
  const themeClassMap: Record<string, string> = {
    'normal': 'bg-health-normal text-health-normal-foreground border-health-normal-border',
    'warning': 'bg-health-warning text-health-warning-foreground border-health-warning-border',
    'critical': 'bg-health-critical text-health-critical-foreground border-health-critical-border',
  };
  
  return themeClassMap[status] || themeClassMap['normal'];
}

/**
 * Get theme-aware CSS classes for appointment status
 */
export function getAppointmentStatusThemeClasses(status: string): string {
  const themeClassMap: Record<string, string> = {
    'scheduled': 'bg-appointment-scheduled text-appointment-scheduled-foreground border-appointment-scheduled-border',
    'completed': 'bg-appointment-completed text-appointment-completed-foreground border-appointment-completed-border',
    'cancelled': 'bg-appointment-cancelled text-appointment-cancelled-foreground border-appointment-cancelled-border',
    'missed': 'bg-appointment-missed text-appointment-missed-foreground border-appointment-missed-border',
  };
  
  return themeClassMap[status] || themeClassMap['scheduled'];
}

/**
 * Convert legacy hardcoded colors to theme classes
 * This function provides backward compatibility
 */
export function convertLegacyToThemeClasses(legacyClasses: string): string {
  // Map old hardcoded classes to new theme-based classes
  const conversionMap: Record<string, string> = {
    'bg-blue-100 text-blue-800': getMedicalRecordThemeClasses('lab_result'),
    'bg-green-100 text-green-800': getMedicalRecordThemeClasses('imaging'),
    'bg-purple-100 text-purple-800': getMedicalRecordThemeClasses('prescription'),
    'bg-orange-100 text-orange-800': getMedicalRecordThemeClasses('consultation'),
    'bg-pink-100 text-pink-800': getMedicalRecordThemeClasses('vaccination'),
    'bg-red-100 text-red-800': getMedicalRecordThemeClasses('discharge_summary'),
    'bg-gray-100 text-gray-800': getMedicalRecordThemeClasses('other'),
  };
  
  return conversionMap[legacyClasses] || legacyClasses;
}

/**
 * Generate CSS custom properties dynamically
 */
export function generateDynamicCSS(customColors?: Record<string, any>): string {
  if (!customColors) return '';
  
  let css = '';
  
  Object.entries(customColors).forEach(([type, colors]) => {
    const cssVarName = type.replace('_', '-');
    
    if (colors.light) {
      css += `
        --medical-${cssVarName}-bg: ${colors.light.background || ''};
        --medical-${cssVarName}-fg: ${colors.light.foreground || ''};
        --medical-${cssVarName}-border: ${colors.light.border || ''};
        --medical-${cssVarName}-hover: ${colors.light.hover || ''};
      `;
    }
    
    if (colors.dark) {
      css += `
        --medical-${cssVarName}-bg-dark: ${colors.dark.background || ''};
        --medical-${cssVarName}-fg-dark: ${colors.dark.foreground || ''};
        --medical-${cssVarName}-border-dark: ${colors.dark.border || ''};
        --medical-${cssVarName}-hover-dark: ${colors.dark.hover || ''};
      `;
    }
  });
  
  return css;
}

/**
 * Validate theme color values
 */
export function validateThemeColors(colors: any): boolean {
  if (!colors || typeof colors !== 'object') return false;
  
  const requiredProperties = ['background', 'foreground', 'border'];
  
  if (colors.light) {
    const hasAllLight = requiredProperties.every(prop => colors.light[prop]);
    if (!hasAllLight) return false;
  }
  
  if (colors.dark) {
    const hasAllDark = requiredProperties.every(prop => colors.dark[prop]);
    if (!hasAllDark) return false;
  }
  
  return true;
}

/**
 * Get all available medical record types for theming
 */
export function getAvailableMedicalRecordTypes(): string[] {
  return [
    'lab_result',
    'imaging',
    'prescription',
    'consultation',
    'vaccination',
    'discharge_summary',
    'other'
  ];
}

/**
 * Get all available health status types for theming
 */
export function getAvailableHealthStatusTypes(): string[] {
  return ['normal', 'warning', 'critical'];
}

/**
 * Get all available appointment status types for theming
 */
export function getAvailableAppointmentStatusTypes(): string[] {
  return ['scheduled', 'completed', 'cancelled', 'missed'];
}

/**
 * Theme-aware badge component classes
 */
export function getThemeBadgeClasses(type: string, category: 'medical' | 'health' | 'appointment'): string {
  const baseClasses = 'inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ring-1 ring-inset transition-colors';
  
  let themeClasses = '';
  
  switch (category) {
    case 'medical':
      themeClasses = getMedicalRecordThemeClasses(type);
      break;
    case 'health':
      themeClasses = getHealthStatusThemeClasses(type);
      break;
    case 'appointment':
      themeClasses = getAppointmentStatusThemeClasses(type);
      break;
  }
  
  return `${baseClasses} ${themeClasses}`;
}
