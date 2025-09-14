import pool from './db';

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

export interface GetRecordsParams {
  userId: number;
  record_type?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
}

export interface GetRecordsResult {
  items: MedicalRecord[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export async function getRecords(params: GetRecordsParams): Promise<GetRecordsResult> {
  const {
    userId,
    record_type,
    from,
    to,
    q,
    page = 1,
    pageSize = 10
  } = params;

  const offset = (page - 1) * pageSize;
  const conditions: string[] = ['user_id = $1'];
  const values: any[] = [userId];
  let paramIndex = 2;

  // Build WHERE conditions
  if (record_type) {
    conditions.push(`record_type = $${paramIndex}`);
    values.push(record_type);
    paramIndex++;
  }

  if (from) {
    conditions.push(`record_date >= $${paramIndex}`);
    values.push(from);
    paramIndex++;
  }

  if (to) {
    conditions.push(`record_date <= $${paramIndex}`);
    values.push(to);
    paramIndex++;
  }

  if (q) {
    conditions.push(`(description ILIKE $${paramIndex} OR record_type ILIKE $${paramIndex})`);
    values.push(`%${q}%`);
    paramIndex++;
  }

  const whereClause = conditions.join(' AND ');

  try {
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM medical_records
      WHERE ${whereClause}
    `;
    const countResult = await pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get paginated records
    const recordsQuery = `
      SELECT 
        id, user_id, record_type, storage_uri, record_date, 
        description, created_at, updated_at
      FROM medical_records
      WHERE ${whereClause}
      ORDER BY record_date DESC, created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;
    
    const recordsResult = await pool.query(recordsQuery, [...values, pageSize, offset]);
    
    return {
      items: recordsResult.rows,
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    console.error('Error fetching medical records:', error);
    throw new Error('Failed to fetch medical records');
  }
}

export async function getRecordById(recordId: number, userId: number): Promise<MedicalRecord | null> {
  try {
    const query = `
      SELECT 
        id, user_id, record_type, storage_uri, record_date, 
        description, created_at, updated_at
      FROM medical_records
      WHERE id = $1 AND user_id = $2
    `;
    
    const result = await pool.query(query, [recordId, userId]);
    return result.rows[0] || null;
  } catch (error) {
    console.error('Error fetching medical record by ID:', error);
    throw new Error('Failed to fetch medical record');
  }
}
