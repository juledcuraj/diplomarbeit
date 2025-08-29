import pool from '@/lib/db';

/**
 * Clean up expired password reset tokens
 * This function should be called periodically (e.g., daily via a cron job)
 */
export async function cleanupExpiredTokens(): Promise<void> {
  try {
    console.log('🧹 Cleaning up expired password reset tokens...');
    
    const deleteQuery = `
      DELETE FROM password_reset_tokens 
      WHERE expires_at < NOW() OR used = TRUE
    `;
    
    const result = await pool.query(deleteQuery);
    
    console.log(`✅ Cleaned up ${result.rowCount} expired/used password reset tokens`);
  } catch (error) {
    console.error('❌ Error cleaning up expired tokens:', error);
    throw error;
  }
}

/**
 * Get password reset token statistics
 */
export async function getTokenStats(): Promise<{
  total: number;
  expired: number;
  used: number;
  active: number;
}> {
  try {
    const statsQuery = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN expires_at < NOW() THEN 1 END) as expired,
        COUNT(CASE WHEN used = TRUE THEN 1 END) as used,
        COUNT(CASE WHEN expires_at >= NOW() AND used = FALSE THEN 1 END) as active
      FROM password_reset_tokens
    `;
    
    const result = await pool.query(statsQuery);
    const stats = result.rows[0];
    
    return {
      total: parseInt(stats.total),
      expired: parseInt(stats.expired),
      used: parseInt(stats.used),
      active: parseInt(stats.active)
    };
  } catch (error) {
    console.error('❌ Error getting token stats:', error);
    throw error;
  }
}
