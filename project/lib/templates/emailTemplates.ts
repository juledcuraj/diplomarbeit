/**
 * Email Templates Configuration
 * Centralized, configurable email templates for consistent messaging
 */

import { EMAIL_CONFIG } from '@/lib/config';

// Email template structure
export interface EmailTemplate {
  subject: string;
  html: string;
  text?: string;
}

// Template variables interface
export interface TemplateVariables {
  [key: string]: string | number | boolean;
}

// Base email styling
const BASE_STYLES = {
  container: 'font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;',
  header: 'background-color: #4CAF50; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;',
  content: 'background-color: #f8f9fa; padding: 30px; border-radius: 0 0 8px 8px; border: 1px solid #e9ecef;',
  button: 'display: inline-block; background-color: #4CAF50; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; margin: 20px 0;',
  footer: 'text-align: center; margin-top: 20px; padding: 20px; color: #666; font-size: 12px;',
  warning: 'background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; color: #856404;',
  info: 'background-color: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 6px; margin: 20px 0; color: #0c5460;'
};

// Template utility functions
class EmailTemplateEngine {
  /**
   * Replace template variables in a string
   */
  private replaceVariables(template: string, variables: TemplateVariables): string {
    return template.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key]?.toString() || match;
    });
  }

  /**
   * Generate email template with variables
   */
  generateTemplate(template: EmailTemplate, variables: TemplateVariables): EmailTemplate {
    return {
      subject: this.replaceVariables(template.subject, variables),
      html: this.replaceVariables(template.html, variables),
      text: template.text ? this.replaceVariables(template.text, variables) : undefined,
    };
  }
}

const templateEngine = new EmailTemplateEngine();

// Email Templates
export const EMAIL_TEMPLATES = {
  VERIFICATION: {
    subject: 'Verify Your Email - {{appName}}',
    html: `
      <div style="${BASE_STYLES.container}">
        <div style="${BASE_STYLES.header}">
          <h1 style="margin: 0; font-size: 24px;">📧 Email Verification</h1>
        </div>
        
        <div style="${BASE_STYLES.content}">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi {{fullName}},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            Welcome to {{appName}}! Please verify your email address to complete your registration.
          </p>
          
          <div style="background-color: white; padding: 25px; border-radius: 8px; border-left: 4px solid #4CAF50; margin: 25px 0; text-align: center;">
            <h2 style="color: #333; margin: 0 0 15px 0;">Your Verification Code</h2>
            <div style="font-size: 32px; font-weight: bold; color: #4CAF50; letter-spacing: 6px; margin: 20px 0;">{{verificationCode}}</div>
            <p style="margin: 15px 0 0 0; color: #666; font-size: 14px;">This code expires in {{expiryMinutes}} minutes</p>
          </div>
          
          <div style="${BASE_STYLES.warning}">
            <p style="margin: 0; font-size: 14px;">
              <strong>Security Note:</strong> If you didn't create an account, please ignore this email.
            </p>
          </div>
          
          <p style="text-align: center; margin-top: 30px;">
            <a href="{{appUrl}}/dashboard" style="${BASE_STYLES.button}">Go to Dashboard</a>
          </p>
        </div>
        
        <div style="${BASE_STYLES.footer}">
          <p>© {{currentYear}} {{appName}}. All rights reserved.</p>
          <p>If you have any questions, please contact our support team.</p>
        </div>
      </div>
    `,
    text: `
      Hi {{fullName}},
      
      Welcome to {{appName}}! Please verify your email address to complete your registration.
      
      Your verification code: {{verificationCode}}
      
      This code expires in {{expiryMinutes}} minutes.
      
      If you didn't create an account, please ignore this email.
      
      Visit: {{appUrl}}/dashboard
      
      © {{currentYear}} {{appName}}. All rights reserved.
    `
  },

  PASSWORD_RESET: {
    subject: 'Reset Your Password - {{appName}}',
    html: `
      <div style="${BASE_STYLES.container}">
        <div style="${BASE_STYLES.header}">
          <h1 style="margin: 0; font-size: 24px;">🔐 Password Reset</h1>
        </div>
        
        <div style="${BASE_STYLES.content}">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi {{fullName}},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            We received a request to reset your password for your {{appName}} account.
          </p>
          
          <div style="${BASE_STYLES.info}">
            <p style="margin: 0; font-size: 14px;">
              <strong>Request Details:</strong><br>
              • Time: {{requestTime}}<br>
              • IP Address: {{ipAddress}}<br>
              • User Agent: {{userAgent}}
            </p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{resetUrl}}" style="${BASE_STYLES.button}">Reset Password</a>
          </p>
          
          <p style="font-size: 14px; color: #666; margin-bottom: 20px;">
            This link will expire in {{expiryHours}} hours for security reasons.
          </p>
          
          <div style="${BASE_STYLES.warning}">
            <p style="margin: 0; font-size: 14px;">
              <strong>Security Note:</strong> If you didn't request this password reset, please ignore this email or contact support if you're concerned about your account security.
            </p>
          </div>
        </div>
        
        <div style="${BASE_STYLES.footer}">
          <p>© {{currentYear}} {{appName}}. All rights reserved.</p>
          <p>For security reasons, this link cannot be forwarded.</p>
        </div>
      </div>
    `,
    text: `
      Hi {{fullName}},
      
      We received a request to reset your password for your {{appName}} account.
      
      Reset your password: {{resetUrl}}
      
      This link will expire in {{expiryHours}} hours.
      
      Request details:
      - Time: {{requestTime}}
      - IP: {{ipAddress}}
      
      If you didn't request this reset, please ignore this email.
      
      © {{currentYear}} {{appName}}. All rights reserved.
    `
  },

  APPOINTMENT_REMINDER: {
    subject: 'Reminder: {{appointmentTitle}} - {{timeText}}',
    html: `
      <div style="${BASE_STYLES.container}">
        <div style="${BASE_STYLES.header}">
          <h1 style="margin: 0; font-size: 24px;">📅 Appointment Reminder</h1>
        </div>
        
        <div style="${BASE_STYLES.content}">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi {{fullName}},</p>
          
          <p style="font-size: 16px; margin-bottom: 25px;">
            This is a reminder about your upcoming appointment {{timeText}}:
          </p>
          
          <div style="background-color: white; padding: 25px; border-radius: 8px; border-left: 4px solid #4CAF50; margin-bottom: 25px;">
            <h2 style="color: #333; margin-top: 0; margin-bottom: 15px;">{{appointmentTitle}}</h2>
            <p style="margin: 8px 0; font-size: 16px;"><strong>📅 Date:</strong> {{formattedDate}}</p>
            <p style="margin: 8px 0; font-size: 16px;"><strong>🕐 Time:</strong> {{formattedTime}}</p>
            {{#doctorName}}<p style="margin: 8px 0; font-size: 16px;"><strong>👨‍⚕️ Doctor:</strong> {{doctorName}}</p>{{/doctorName}}
            {{#location}}<p style="margin: 8px 0; font-size: 16px;"><strong>📍 Location:</strong> {{location}}</p>{{/location}}
            {{#notes}}<p style="margin: 15px 0 8px 0; font-size: 16px;"><strong>📝 Notes:</strong></p><p style="margin: 0; font-size: 14px; color: #666;">{{notes}}</p>{{/notes}}
          </div>
          
          <div style="${BASE_STYLES.warning}">
            <p style="margin: 0; color: #856404; font-size: 14px;">
              <strong>Important:</strong> Please arrive 15 minutes early for check-in. If you need to reschedule or cancel, please contact us at least 24 hours in advance.
            </p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{appUrl}}/appointments" style="${BASE_STYLES.button}">View Appointments</a>
          </p>
        </div>
        
        <div style="${BASE_STYLES.footer}">
          <p>© {{currentYear}} {{appName}}. All rights reserved.</p>
          <p>Need to reschedule? Contact us or use the app.</p>
        </div>
      </div>
    `,
    text: `
      Hi {{fullName}},
      
      Appointment Reminder {{timeText}}:
      
      {{appointmentTitle}}
      Date: {{formattedDate}}
      Time: {{formattedTime}}
      {{#doctorName}}Doctor: {{doctorName}}{{/doctorName}}
      {{#location}}Location: {{location}}{{/location}}
      {{#notes}}Notes: {{notes}}{{/notes}}
      
      Please arrive 15 minutes early for check-in.
      
      View appointments: {{appUrl}}/appointments
      
      © {{currentYear}} {{appName}}. All rights reserved.
    `
  },

  HEALTH_ALERT: {
    subject: 'Health Alert: {{alertType}} - {{appName}}',
    html: `
      <div style="${BASE_STYLES.container}">
        <div style="background-color: #dc3545; color: white; padding: 20px; border-radius: 8px 8px 0 0; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">⚠️ Health Alert</h1>
        </div>
        
        <div style="${BASE_STYLES.content}">
          <p style="font-size: 18px; margin-bottom: 20px;">Hi {{fullName}},</p>
          
          <div style="background-color: #f8d7da; border: 1px solid #f5c6cb; padding: 20px; border-radius: 6px; margin: 25px 0;">
            <h3 style="color: #721c24; margin-top: 0;">{{alertType}}</h3>
            <p style="color: #721c24; margin: 10px 0; font-size: 16px;">{{alertMessage}}</p>
            {{#metricValue}}<p style="color: #721c24; margin: 5px 0;"><strong>Current Value:</strong> {{metricValue}}</p>{{/metricValue}}
            {{#recommendedAction}}<p style="color: #721c24; margin: 5px 0;"><strong>Recommended Action:</strong> {{recommendedAction}}</p>{{/recommendedAction}}
          </div>
          
          <div style="${BASE_STYLES.warning}">
            <p style="margin: 0; font-size: 14px;">
              <strong>Important:</strong> This is an automated health alert based on your recent data. Please consult with your healthcare provider for proper medical advice.
            </p>
          </div>
          
          <p style="text-align: center; margin: 30px 0;">
            <a href="{{appUrl}}/health-metrics" style="${BASE_STYLES.button}">View Health Metrics</a>
          </p>
        </div>
        
        <div style="${BASE_STYLES.footer}">
          <p>© {{currentYear}} {{appName}}. All rights reserved.</p>
          <p>This alert is for informational purposes only and does not replace professional medical advice.</p>
        </div>
      </div>
    `,
    text: `
      Health Alert: {{alertType}}
      
      Hi {{fullName}},
      
      {{alertMessage}}
      
      {{#metricValue}}Current Value: {{metricValue}}{{/metricValue}}
      {{#recommendedAction}}Recommended Action: {{recommendedAction}}{{/recommendedAction}}
      
      Please consult with your healthcare provider for proper medical advice.
      
      View health metrics: {{appUrl}}/health-metrics
      
      © {{currentYear}} {{appName}}. All rights reserved.
    `
  }
};

// Email template generator functions
export const generateVerificationEmail = (variables: {
  fullName: string;
  verificationCode: string;
  expiryMinutes: number;
}) => {
  const templateVars: TemplateVariables = {
    ...variables,
    appName: EMAIL_CONFIG.FROM_NAME,
    appUrl: EMAIL_CONFIG.APP_URL,
    currentYear: new Date().getFullYear(),
  };
  
  return templateEngine.generateTemplate(EMAIL_TEMPLATES.VERIFICATION, templateVars);
};

export const generatePasswordResetEmail = (variables: {
  fullName: string;
  resetUrl: string;
  requestTime: string;
  ipAddress: string;
  userAgent: string;
  expiryHours: number;
}) => {
  const templateVars: TemplateVariables = {
    ...variables,
    appName: EMAIL_CONFIG.FROM_NAME,
    appUrl: EMAIL_CONFIG.APP_URL,
    currentYear: new Date().getFullYear(),
  };
  
  return templateEngine.generateTemplate(EMAIL_TEMPLATES.PASSWORD_RESET, templateVars);
};

export const generateAppointmentReminderEmail = (variables: {
  fullName: string;
  appointmentTitle: string;
  timeText: string;
  formattedDate: string;
  formattedTime: string;
  doctorName?: string;
  location?: string;
  notes?: string;
}) => {
  const templateVars: TemplateVariables = {
    ...variables,
    appName: EMAIL_CONFIG.FROM_NAME,
    appUrl: EMAIL_CONFIG.APP_URL,
    currentYear: new Date().getFullYear(),
  };
  
  return templateEngine.generateTemplate(EMAIL_TEMPLATES.APPOINTMENT_REMINDER, templateVars);
};

export const generateHealthAlertEmail = (variables: {
  fullName: string;
  alertType: string;
  alertMessage: string;
  metricValue?: string;
  recommendedAction?: string;
}) => {
  const templateVars: TemplateVariables = {
    ...variables,
    appName: EMAIL_CONFIG.FROM_NAME,
    appUrl: EMAIL_CONFIG.APP_URL,
    currentYear: new Date().getFullYear(),
  };
  
  return templateEngine.generateTemplate(EMAIL_TEMPLATES.HEALTH_ALERT, templateVars);
};
