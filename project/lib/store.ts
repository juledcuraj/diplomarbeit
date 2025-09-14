// Simple in-memory store for rate limiting only
// All verification data is now stored directly in the users table

interface ResendData {
  count: number;
  resetAt: number;
}

// In-memory rate limiting store
const resendStore = new Map<string, ResendData>();

// Resend rate limiting functions
export async function canResend(email: string): Promise<boolean> {
  const key = `resend_limit:${email}`;
  const now = Date.now();
  const hourMs = 60 * 60 * 1000; // 1 hour

  const resendData = resendStore.get(key);
  if (resendData) {
    // Reset counter if hour has passed
    if (now > resendData.resetAt) {
      resendStore.delete(key);
      return true;
    }
    
    return resendData.count < 3;
  }
  return true;
}

export async function markResent(email: string): Promise<void> {
  const key = `resend_limit:${email}`;
  const now = Date.now();
  const hourMs = 60 * 60 * 1000; // 1 hour

  let resendData = resendStore.get(key);
  
  if (resendData) {
    // Reset if hour has passed
    if (now > resendData.resetAt) {
      resendData = { count: 1, resetAt: now + hourMs };
    } else {
      resendData.count += 1;
    }
  } else {
    resendData = { count: 1, resetAt: now + hourMs };
  }
  
  resendStore.set(key, resendData);
}
