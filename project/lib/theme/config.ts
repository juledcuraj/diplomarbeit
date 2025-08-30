/**
 * Theme Configuration Manager
 * Handles dynamic CSS custom properties and theme switching
 */

import { DEFAULT_THEME_CONFIG } from './index';

// Configuration interface for environment-based theming
export interface ThemeConfig {
  // Enable theme customization
  enableCustomThemes: boolean;
  
  // Default theme mode
  defaultTheme: 'light' | 'dark' | 'system';
  
  // Allow users to override colors
  allowUserThemeCustomization: boolean;
  
  // Medical record color overrides
  medicalRecordColors?: {
    [key: string]: {
      light?: { background?: string; foreground?: string; border?: string; hover?: string };
      dark?: { background?: string; foreground?: string; border?: string; hover?: string };
    };
  };
  
  // Health status color overrides  
  healthStatusColors?: {
    [key: string]: {
      light?: { background?: string; foreground?: string; border?: string };
      dark?: { background?: string; foreground?: string; border?: string };
    };
  };
  
  // Appointment status color overrides
  appointmentStatusColors?: {
    [key: string]: {
      light?: { background?: string; foreground?: string; border?: string };
      dark?: { background?: string; foreground?: string; border?: string };
    };
  };
}

// Environment-based theme configuration
export const THEME_CONFIG: ThemeConfig = {
  enableCustomThemes: process.env.NEXT_PUBLIC_ENABLE_CUSTOM_THEMES === 'true' || true,
  defaultTheme: (process.env.NEXT_PUBLIC_DEFAULT_THEME as 'light' | 'dark' | 'system') || 'light',
  allowUserThemeCustomization: process.env.NEXT_PUBLIC_ALLOW_USER_THEME_CUSTOMIZATION === 'true' || false,
  
  // Override colors via environment variables
  medicalRecordColors: {
    lab_result: {
      light: {
        background: process.env.NEXT_PUBLIC_LAB_RESULT_BG_LIGHT,
        foreground: process.env.NEXT_PUBLIC_LAB_RESULT_FG_LIGHT,
        border: process.env.NEXT_PUBLIC_LAB_RESULT_BORDER_LIGHT,
        hover: process.env.NEXT_PUBLIC_LAB_RESULT_HOVER_LIGHT,
      },
      dark: {
        background: process.env.NEXT_PUBLIC_LAB_RESULT_BG_DARK,
        foreground: process.env.NEXT_PUBLIC_LAB_RESULT_FG_DARK,
        border: process.env.NEXT_PUBLIC_LAB_RESULT_BORDER_DARK,
        hover: process.env.NEXT_PUBLIC_LAB_RESULT_HOVER_DARK,
      }
    },
    // Additional medical record types can be configured similarly...
  }
};

export class ThemeConfigManager {
  private static config: ThemeConfig = THEME_CONFIG;
  
  /**
   * Update theme configuration
   */
  static updateConfig(newConfig: Partial<ThemeConfig>) {
    this.config = { ...this.config, ...newConfig };
  }
  
  /**
   * Get current theme configuration
   */
  static getConfig(): ThemeConfig {
    return this.config;
  }
  
  /**
   * Generate CSS custom properties for medical record types
   */
  static generateMedicalRecordCSS(): string {
    const medicalRecords = Object.keys(DEFAULT_THEME_CONFIG.medical);
    let css = '';
    
    medicalRecords.forEach(recordType => {
      const defaultColors = DEFAULT_THEME_CONFIG.medical[recordType as keyof typeof DEFAULT_THEME_CONFIG.medical];
      const overrideColors = this.config.medicalRecordColors?.[recordType];
      
      // Merge default with overrides
      const lightColors = {
        ...defaultColors.light,
        ...overrideColors?.light
      };
      const darkColors = {
        ...defaultColors.dark,
        ...overrideColors?.dark
      };
      
      const cssVarName = recordType.replace('_', '-');
      
      css += `
    --medical-${cssVarName}-bg: ${lightColors.background};
    --medical-${cssVarName}-fg: ${lightColors.foreground};
    --medical-${cssVarName}-border: ${lightColors.border};
    --medical-${cssVarName}-hover: ${lightColors.hover};
    --medical-${cssVarName}-bg-dark: ${darkColors.background};
    --medical-${cssVarName}-fg-dark: ${darkColors.foreground};
    --medical-${cssVarName}-border-dark: ${darkColors.border};
    --medical-${cssVarName}-hover-dark: ${darkColors.hover};`;
    });
    
    return css;
  }
  
  /**
   * Generate CSS custom properties for health status
   */
  static generateHealthStatusCSS(): string {
    const healthStatuses = Object.keys(DEFAULT_THEME_CONFIG.health);
    let css = '';
    
    healthStatuses.forEach(status => {
      const defaultColors = DEFAULT_THEME_CONFIG.health[status as keyof typeof DEFAULT_THEME_CONFIG.health];
      const overrideColors = this.config.healthStatusColors?.[status];
      
      const lightColors = {
        ...defaultColors.light,
        ...overrideColors?.light
      };
      const darkColors = {
        ...defaultColors.dark,
        ...overrideColors?.dark
      };
      
      css += `
    --health-${status}-bg: ${lightColors.background};
    --health-${status}-fg: ${lightColors.foreground};
    --health-${status}-border: ${lightColors.border};
    --health-${status}-bg-dark: ${darkColors.background};
    --health-${status}-fg-dark: ${darkColors.foreground};
    --health-${status}-border-dark: ${darkColors.border};`;
    });
    
    return css;
  }
  
  /**
   * Generate CSS custom properties for appointment status
   */
  static generateAppointmentStatusCSS(): string {
    const appointmentStatuses = Object.keys(DEFAULT_THEME_CONFIG.appointment);
    let css = '';
    
    appointmentStatuses.forEach(status => {
      const defaultColors = DEFAULT_THEME_CONFIG.appointment[status as keyof typeof DEFAULT_THEME_CONFIG.appointment];
      const overrideColors = this.config.appointmentStatusColors?.[status];
      
      const lightColors = {
        ...defaultColors.light,
        ...overrideColors?.light
      };
      const darkColors = {
        ...defaultColors.dark,
        ...overrideColors?.dark
      };
      
      css += `
    --appointment-${status}-bg: ${lightColors.background};
    --appointment-${status}-fg: ${lightColors.foreground};
    --appointment-${status}-border: ${lightColors.border};
    --appointment-${status}-bg-dark: ${darkColors.background};
    --appointment-${status}-fg-dark: ${darkColors.foreground};
    --appointment-${status}-border-dark: ${darkColors.border};`;
    });
    
    return css;
  }
  
  /**
   * Generate complete CSS custom properties
   */
  static generateCompleteCSS(): string {
    return `
  /* Medical Record Theme Variables */
  ${this.generateMedicalRecordCSS()}
  
  /* Health Status Theme Variables */
  ${this.generateHealthStatusCSS()}
  
  /* Appointment Status Theme Variables */
  ${this.generateAppointmentStatusCSS()}
    `.trim();
  }
  
  /**
   * Get theme-aware CSS classes for medical record types
   */
  static getMedicalRecordClasses(recordType: string, mode: 'light' | 'dark' = 'light'): string {
    const cssVarName = recordType.replace('_', '-');
    const suffix = mode === 'dark' ? '-dark' : '';
    
    return `
      bg-[hsl(var(--medical-${cssVarName}-bg${suffix}))]
      text-[hsl(var(--medical-${cssVarName}-fg${suffix}))]
      border-[hsl(var(--medical-${cssVarName}-border${suffix}))]
      hover:bg-[hsl(var(--medical-${cssVarName}-hover${suffix}))]
    `.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Get theme-aware CSS classes for health status
   */
  static getHealthStatusClasses(status: string, mode: 'light' | 'dark' = 'light'): string {
    const suffix = mode === 'dark' ? '-dark' : '';
    
    return `
      bg-[hsl(var(--health-${status}-bg${suffix}))]
      text-[hsl(var(--health-${status}-fg${suffix}))]
      border-[hsl(var(--health-${status}-border${suffix}))]
    `.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Get theme-aware CSS classes for appointment status
   */
  static getAppointmentStatusClasses(status: string, mode: 'light' | 'dark' = 'light'): string {
    const suffix = mode === 'dark' ? '-dark' : '';
    
    return `
      bg-[hsl(var(--appointment-${status}-bg${suffix}))]
      text-[hsl(var(--appointment-${status}-fg${suffix}))]
      border-[hsl(var(--appointment-${status}-border${suffix}))]
    `.replace(/\s+/g, ' ').trim();
  }
  
  /**
   * Inject CSS custom properties into document
   */
  static injectThemeCSS(): void {
    if (typeof document === 'undefined') return;
    
    const existingStyle = document.getElementById('medical-theme-styles');
    if (existingStyle) {
      existingStyle.remove();
    }
    
    const style = document.createElement('style');
    style.id = 'medical-theme-styles';
    style.textContent = `
      :root {
        ${this.generateCompleteCSS()}
      }
    `;
    
    document.head.appendChild(style);
  }
}
