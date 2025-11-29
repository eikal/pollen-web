import { getToken } from '../auth';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export type OperationType = 'insert' | 'upsert';

export interface UploadResponse {
  success: boolean;
  sessionId: string;
  tableName: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
}

export interface UploadSession {
  sessionId: string;
  userId: string;
  filename: string;
  fileSizeBytes: number;
  status: 'uploading' | 'processing' | 'completed' | 'failed';
  progressPct: number;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export async function uploadFile(params: {
  file: File;
  tableName?: string;
  operationType?: OperationType;
  conflictColumns?: string[];
}): Promise<UploadResponse> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const form = new FormData();
  form.append('file', params.file);
  if (params.tableName) form.append('tableName', params.tableName);
  if (params.operationType) form.append('operationType', params.operationType);
  if (params.conflictColumns && params.conflictColumns.length > 0) {
    form.append('conflictColumns', params.conflictColumns.join(','));
  }

  const res = await fetch(`${API_BASE}/api/uploads`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      // Do NOT set Content-Type when sending FormData; the browser sets it with boundary
    },
    body: form,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    const msg = err?.message || err?.error || `Upload failed (${res.status})`;
    throw new Error(msg);
  }

  return res.json();
}

export async function listSessions(): Promise<UploadSession[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/uploads/sessions`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to list sessions');
  const data = await res.json();
  return data.sessions || [];
}

export async function listTables(): Promise<string[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const res = await fetch(`${API_BASE}/api/uploads/tables`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!res.ok) throw new Error('Failed to list tables');
  const data = await res.json();
  return data.tables || [];
}

export async function getPreview(tableName: string, limit: number = 100): Promise<any[]> {
  const token = getToken();
  if (!token) throw new Error('Not authenticated');

  const params = new URLSearchParams({ limit: String(limit) });
  const res = await fetch(
    `${API_BASE}/api/uploads/tables/${encodeURIComponent(tableName)}/preview?${params}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!res.ok) throw new Error('Failed to fetch preview');
  const data = await res.json();
  return data.rows || [];
}

export default {
  uploadFile,
  listSessions,
  listTables,
  getPreview,
};
