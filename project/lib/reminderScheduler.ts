import { sendPendingReminders } from './emailReminders';

class ReminderScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private isRunning = false;

  start(intervalMinutes: number = 15) {
    if (this.isRunning) {
      console.log('📧 Reminder scheduler is already running');
      return;
    }

    this.isRunning = true;
    const intervalMs = intervalMinutes * 60 * 1000;
    
    console.log(`📧 Starting reminder scheduler - checking every ${intervalMinutes} minutes`);
    
    // Run immediately
    this.runReminderCheck();
    
    // Set up recurring interval
    this.intervalId = setInterval(() => {
      this.runReminderCheck();
    }, intervalMs);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.isRunning = false;
    console.log('📧 Reminder scheduler stopped');
  }

  private async runReminderCheck() {
    try {
      console.log('🔔 Checking for pending email reminders...');
      await sendPendingReminders();
    } catch (error) {
      console.error('❌ Error in reminder check:', error);
    }
  }

  isActive(): boolean {
    return this.isRunning;
  }
}

// Create singleton instance
export const reminderScheduler = new ReminderScheduler();

// Auto-start in production (not in development to avoid conflicts)
if (process.env.NODE_ENV === 'production') {
  reminderScheduler.start(15); // Check every 15 minutes
}
