/**
 * Medical Theme System
 * Configurable theming for medical records, health metrics, and UI components
 */

// Medical Record Type Theme Colors
export const MEDICAL_RECORD_THEMES = {
  lab_result: {
    light: {
      background: 'hsl(var(--medical-lab-bg))',
      foreground: 'hsl(var(--medical-lab-fg))',
      border: 'hsl(var(--medical-lab-border))',
      hover: 'hsl(var(--medical-lab-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-lab-bg-dark))',
      foreground: 'hsl(var(--medical-lab-fg-dark))',
      border: 'hsl(var(--medical-lab-border-dark))',
      hover: 'hsl(var(--medical-lab-hover-dark))',
    }
  },
  imaging: {
    light: {
      background: 'hsl(var(--medical-imaging-bg))',
      foreground: 'hsl(var(--medical-imaging-fg))',
      border: 'hsl(var(--medical-imaging-border))',
      hover: 'hsl(var(--medical-imaging-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-imaging-bg-dark))',
      foreground: 'hsl(var(--medical-imaging-fg-dark))',
      border: 'hsl(var(--medical-imaging-border-dark))',
      hover: 'hsl(var(--medical-imaging-hover-dark))',
    }
  },
  prescription: {
    light: {
      background: 'hsl(var(--medical-prescription-bg))',
      foreground: 'hsl(var(--medical-prescription-fg))',
      border: 'hsl(var(--medical-prescription-border))',
      hover: 'hsl(var(--medical-prescription-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-prescription-bg-dark))',
      foreground: 'hsl(var(--medical-prescription-fg-dark))',
      border: 'hsl(var(--medical-prescription-border-dark))',
      hover: 'hsl(var(--medical-prescription-hover-dark))',
    }
  },
  consultation: {
    light: {
      background: 'hsl(var(--medical-consultation-bg))',
      foreground: 'hsl(var(--medical-consultation-fg))',
      border: 'hsl(var(--medical-consultation-border))',
      hover: 'hsl(var(--medical-consultation-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-consultation-bg-dark))',
      foreground: 'hsl(var(--medical-consultation-fg-dark))',
      border: 'hsl(var(--medical-consultation-border-dark))',
      hover: 'hsl(var(--medical-consultation-hover-dark))',
    }
  },
  vaccination: {
    light: {
      background: 'hsl(var(--medical-vaccination-bg))',
      foreground: 'hsl(var(--medical-vaccination-fg))',
      border: 'hsl(var(--medical-vaccination-border))',
      hover: 'hsl(var(--medical-vaccination-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-vaccination-bg-dark))',
      foreground: 'hsl(var(--medical-vaccination-fg-dark))',
      border: 'hsl(var(--medical-vaccination-border-dark))',
      hover: 'hsl(var(--medical-vaccination-hover-dark))',
    }
  },
  discharge_summary: {
    light: {
      background: 'hsl(var(--medical-discharge-bg))',
      foreground: 'hsl(var(--medical-discharge-fg))',
      border: 'hsl(var(--medical-discharge-border))',
      hover: 'hsl(var(--medical-discharge-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-discharge-bg-dark))',
      foreground: 'hsl(var(--medical-discharge-fg-dark))',
      border: 'hsl(var(--medical-discharge-border-dark))',
      hover: 'hsl(var(--medical-discharge-hover-dark))',
    }
  },
  other: {
    light: {
      background: 'hsl(var(--medical-other-bg))',
      foreground: 'hsl(var(--medical-other-fg))',
      border: 'hsl(var(--medical-other-border))',
      hover: 'hsl(var(--medical-other-hover))',
    },
    dark: {
      background: 'hsl(var(--medical-other-bg-dark))',
      foreground: 'hsl(var(--medical-other-fg-dark))',
      border: 'hsl(var(--medical-other-border-dark))',
      hover: 'hsl(var(--medical-other-hover-dark))',
    }
  }
} as const;

// Health Status Colors
export const HEALTH_STATUS_THEMES = {
  normal: {
    light: {
      background: 'hsl(var(--health-normal-bg))',
      foreground: 'hsl(var(--health-normal-fg))',
      border: 'hsl(var(--health-normal-border))',
    },
    dark: {
      background: 'hsl(var(--health-normal-bg-dark))',
      foreground: 'hsl(var(--health-normal-fg-dark))',
      border: 'hsl(var(--health-normal-border-dark))',
    }
  },
  warning: {
    light: {
      background: 'hsl(var(--health-warning-bg))',
      foreground: 'hsl(var(--health-warning-fg))',
      border: 'hsl(var(--health-warning-border))',
    },
    dark: {
      background: 'hsl(var(--health-warning-bg-dark))',
      foreground: 'hsl(var(--health-warning-fg-dark))',
      border: 'hsl(var(--health-warning-border-dark))',
    }
  },
  critical: {
    light: {
      background: 'hsl(var(--health-critical-bg))',
      foreground: 'hsl(var(--health-critical-fg))',
      border: 'hsl(var(--health-critical-border))',
    },
    dark: {
      background: 'hsl(var(--health-critical-bg-dark))',
      foreground: 'hsl(var(--health-critical-fg-dark))',
      border: 'hsl(var(--health-critical-border-dark))',
    }
  }
} as const;

// Appointment Status Colors
export const APPOINTMENT_STATUS_THEMES = {
  scheduled: {
    light: {
      background: 'hsl(var(--appointment-scheduled-bg))',
      foreground: 'hsl(var(--appointment-scheduled-fg))',
      border: 'hsl(var(--appointment-scheduled-border))',
    },
    dark: {
      background: 'hsl(var(--appointment-scheduled-bg-dark))',
      foreground: 'hsl(var(--appointment-scheduled-fg-dark))',
      border: 'hsl(var(--appointment-scheduled-border-dark))',
    }
  },
  completed: {
    light: {
      background: 'hsl(var(--appointment-completed-bg))',
      foreground: 'hsl(var(--appointment-completed-fg))',
      border: 'hsl(var(--appointment-completed-border))',
    },
    dark: {
      background: 'hsl(var(--appointment-completed-bg-dark))',
      foreground: 'hsl(var(--appointment-completed-fg-dark))',
      border: 'hsl(var(--appointment-completed-border-dark))',
    }
  },
  cancelled: {
    light: {
      background: 'hsl(var(--appointment-cancelled-bg))',
      foreground: 'hsl(var(--appointment-cancelled-fg))',
      border: 'hsl(var(--appointment-cancelled-border))',
    },
    dark: {
      background: 'hsl(var(--appointment-cancelled-bg-dark))',
      foreground: 'hsl(var(--appointment-cancelled-fg-dark))',
      border: 'hsl(var(--appointment-cancelled-border-dark))',
    }
  },
  missed: {
    light: {
      background: 'hsl(var(--appointment-missed-bg))',
      foreground: 'hsl(var(--appointment-missed-fg))',
      border: 'hsl(var(--appointment-missed-border))',
    },
    dark: {
      background: 'hsl(var(--appointment-missed-bg-dark))',
      foreground: 'hsl(var(--appointment-missed-fg-dark))',
      border: 'hsl(var(--appointment-missed-border-dark))',
    }
  }
} as const;

// Type definitions
export type MedicalRecordType = keyof typeof MEDICAL_RECORD_THEMES;
export type HealthStatusType = keyof typeof HEALTH_STATUS_THEMES;
export type AppointmentStatusType = keyof typeof APPOINTMENT_STATUS_THEMES;
export type ThemeMode = 'light' | 'dark';

// Theme utilities
export class ThemeManager {
  static getMedicalRecordTheme(type: MedicalRecordType, mode: ThemeMode = 'light') {
    return MEDICAL_RECORD_THEMES[type]?.[mode] || MEDICAL_RECORD_THEMES.other[mode];
  }

  static getHealthStatusTheme(status: HealthStatusType, mode: ThemeMode = 'light') {
    return HEALTH_STATUS_THEMES[status]?.[mode] || HEALTH_STATUS_THEMES.normal[mode];
  }

  static getAppointmentStatusTheme(status: AppointmentStatusType, mode: ThemeMode = 'light') {
    return APPOINTMENT_STATUS_THEMES[status]?.[mode] || APPOINTMENT_STATUS_THEMES.scheduled[mode];
  }

  // Legacy compatibility - converts old hardcoded classes to new theme classes
  static convertLegacyMedicalRecordColor(type: MedicalRecordType): string {
    const legacyMap: Record<MedicalRecordType, string> = {
      lab_result: 'bg-blue-100 text-blue-800 border-blue-200',
      imaging: 'bg-green-100 text-green-800 border-green-200', 
      prescription: 'bg-purple-100 text-purple-800 border-purple-200',
      consultation: 'bg-orange-100 text-orange-800 border-orange-200',
      vaccination: 'bg-pink-100 text-pink-800 border-pink-200',
      discharge_summary: 'bg-red-100 text-red-800 border-red-200',
      other: 'bg-gray-100 text-gray-800 border-gray-200',
    };
    return legacyMap[type] || legacyMap.other;
  }

  // Generate CSS custom properties for a medical record type
  static generateMedicalRecordCSS(type: MedicalRecordType, lightColors: Record<string, string>, darkColors: Record<string, string>) {
    return `
      --medical-${type.replace('_', '-')}-bg: ${lightColors.background};
      --medical-${type.replace('_', '-')}-fg: ${lightColors.foreground};
      --medical-${type.replace('_', '-')}-border: ${lightColors.border};
      --medical-${type.replace('_', '-')}-hover: ${lightColors.hover};
      --medical-${type.replace('_', '-')}-bg-dark: ${darkColors.background};
      --medical-${type.replace('_', '-')}-fg-dark: ${darkColors.foreground};
      --medical-${type.replace('_', '-')}-border-dark: ${darkColors.border};
      --medical-${type.replace('_', '-')}-hover-dark: ${darkColors.hover};
    `;
  }
}

// Default theme configuration that can be overridden
export const DEFAULT_THEME_CONFIG = {
  // Medical Record Colors (HSL values)
  medical: {
    lab_result: {
      light: { background: '214 100% 97%', foreground: '214 84% 56%', border: '214 100% 90%', hover: '214 100% 92%' },
      dark: { background: '214 50% 15%', foreground: '214 100% 80%', border: '214 50% 25%', hover: '214 50% 20%' }
    },
    imaging: {
      light: { background: '142 76% 96%', foreground: '142 69% 58%', border: '142 76% 88%', hover: '142 76% 91%' },
      dark: { background: '142 50% 15%', foreground: '142 76% 80%', border: '142 50% 25%', hover: '142 50% 20%' }
    },
    prescription: {
      light: { background: '270 95% 97%', foreground: '270 91% 65%', border: '270 95% 90%', hover: '270 95% 92%' },
      dark: { background: '270 50% 15%', foreground: '270 95% 80%', border: '270 50% 25%', hover: '270 50% 20%' }
    },
    consultation: {
      light: { background: '25 95% 97%', foreground: '25 95% 53%', border: '25 95% 90%', hover: '25 95% 92%' },
      dark: { background: '25 50% 15%', foreground: '25 95% 80%', border: '25 50% 25%', hover: '25 50% 20%' }
    },
    vaccination: {
      light: { background: '330 81% 96%', foreground: '330 81% 60%', border: '330 81% 88%', hover: '330 81% 91%' },
      dark: { background: '330 50% 15%', foreground: '330 81% 80%', border: '330 50% 25%', hover: '330 50% 20%' }
    },
    discharge_summary: {
      light: { background: '0 84% 97%', foreground: '0 84% 60%', border: '0 84% 90%', hover: '0 84% 92%' },
      dark: { background: '0 50% 15%', foreground: '0 84% 80%', border: '0 50% 25%', hover: '0 50% 20%' }
    },
    other: {
      light: { background: '0 0% 96%', foreground: '0 0% 45%', border: '0 0% 89%', hover: '0 0% 91%' },
      dark: { background: '0 0% 15%', foreground: '0 0% 80%', border: '0 0% 25%', hover: '0 0% 20%' }
    }
  },
  
  // Health Status Colors
  health: {
    normal: {
      light: { background: '142 76% 96%', foreground: '142 69% 58%', border: '142 76% 88%' },
      dark: { background: '142 50% 15%', foreground: '142 76% 80%', border: '142 50% 25%' }
    },
    warning: {
      light: { background: '48 96% 95%', foreground: '48 96% 53%', border: '48 96% 85%' },
      dark: { background: '48 50% 15%', foreground: '48 96% 80%', border: '48 50% 25%' }
    },
    critical: {
      light: { background: '0 84% 97%', foreground: '0 84% 60%', border: '0 84% 90%' },
      dark: { background: '0 50% 15%', foreground: '0 84% 80%', border: '0 50% 25%' }
    }
  },
  
  // Appointment Status Colors
  appointment: {
    scheduled: {
      light: { background: '214 100% 97%', foreground: '214 84% 56%', border: '214 100% 90%' },
      dark: { background: '214 50% 15%', foreground: '214 100% 80%', border: '214 50% 25%' }
    },
    completed: {
      light: { background: '142 76% 96%', foreground: '142 69% 58%', border: '142 76% 88%' },
      dark: { background: '142 50% 15%', foreground: '142 76% 80%', border: '142 50% 25%' }
    },
    cancelled: {
      light: { background: '0 0% 96%', foreground: '0 0% 45%', border: '0 0% 89%' },
      dark: { background: '0 0% 15%', foreground: '0 0% 80%', border: '0 0% 25%' }
    },
    missed: {
      light: { background: '0 84% 97%', foreground: '0 84% 60%', border: '0 84% 90%' },
      dark: { background: '0 50% 15%', foreground: '0 84% 80%', border: '0 50% 25%' }
    }
  }
} as const;
