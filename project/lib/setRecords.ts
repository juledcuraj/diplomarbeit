import pool from './db';

export interface CreateRecordData {
  user_id: number;
  record_type: string;
  storage_uri: string;
  record_date: string;
  description?: string;
}

export interface MedicalRecord {
  id: number;
  user_id: number;
  record_type: string;
  storage_uri: string;
  record_date: string;
  description?: string;
  created_at: string;
  updated_at: string;
}

export async function setRecord(data: CreateRecordData): Promise<MedicalRecord> {
  const { user_id, record_type, storage_uri, record_date, description } = data;

  try {
    // Validate required fields
    if (!record_type || !storage_uri || !record_date) {
      throw new Error('Missing required fields: record_type, storage_uri, and record_date are required');
    }

    // Sanitize storage_uri to prevent directory traversal but preserve user directory structure
    const sanitizedUri = storage_uri.replace(/\.\./g, '').replace(/[<>:"|?*]/g, '');
    
    const query = `
      INSERT INTO medical_records (
        user_id, record_type, storage_uri, record_date, description, created_at, updated_at
      ) VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
      RETURNING id, user_id, record_type, storage_uri, record_date, description, created_at, updated_at
    `;

    const values = [user_id, record_type, sanitizedUri, record_date, description || null];
    const result = await pool.query(query, values);
    
    return result.rows[0];
  } catch (error) {
    console.error('Error creating medical record:', error);
    throw new Error('Failed to create medical record');
  }
}
