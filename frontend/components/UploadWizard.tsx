import React, { useEffect, useState } from 'react';
import { uploadFile, listSessions, UploadSession, OperationType } from '../lib/api/uploads';
import { isAuthenticated } from '../lib/auth';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';

interface Props {
  onUploaded?: (tableName: string) => void;
}

export default function UploadWizard({ onUploaded }: Props) {
  const [file, setFile] = useState<File | null>(null);
  const [tableName, setTableName] = useState<string>('');
  const [operationType, setOperationType] = useState<OperationType>('insert');
  const [conflictColumns, setConflictColumns] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [progress, setProgress] = useState<number>(0);
  const [status, setStatus] = useState<UploadSession['status'] | null>(null);
  const [isUploading, setIsUploading] = useState<boolean>(false);

  const fileHint = 'CSV (.csv) or Excel (.xlsx/.xls), up to 50MB';

  useEffect(() => {
    if (!sessionId) return;

    let timer: any;
    const poll = async () => {
      try {
        const sessions = await listSessions();
        const s = sessions.find((x) => x.sessionId === sessionId);
        if (s) {
          setProgress(s.progressPct);
          setStatus(s.status);
          if (s.status === 'completed') {
            setSuccess('Upload completed successfully');
            setIsUploading(false);
            if (onUploaded) onUploaded(tableName);
            return; // stop polling
          }
          if (s.status === 'failed') {
            setError(
              s.errorMessage ||
                'Your file upload needs attention. Please try again or contact support.'
            );
            setIsUploading(false);
            return; // stop polling
          }
        }
        timer = setTimeout(poll, 1500);
      } catch (err: any) {
        setError(
          err.message || 'Unable to check upload progress. Refresh the page to see your data.'
        );
        setIsUploading(false);
      }
    };
    poll();

    return () => clearTimeout(timer);
  }, [sessionId, onUploaded, tableName]);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (!e.target.files || e.target.files.length === 0) return;
    setFile(e.target.files[0]);
    setError(null);
    setSuccess(null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isAuthenticated()) {
      setError('Please sign in to upload files.');
      return;
    }

    if (!file) {
      setError('Please select a file to upload.');
      return;
    }

    setIsUploading(true);
    try {
      const confCols = conflictColumns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await uploadFile({
        file,
        tableName: tableName || undefined,
        operationType,
        conflictColumns: confCols.length > 0 ? confCols : undefined,
      });

      setSessionId(res.sessionId);
      setProgress(10);
      setStatus('uploading');
    } catch (err: any) {
      setError(err.message);
      setIsUploading(false);
    }
  }

  const showConflict = operationType === 'upsert';

  return (
    <Card
      title="Upload Your Data"
      subtitle="Create or update tables from CSV or Excel files."
      className="fade-in"
    >
      {error && (
        <div className="mb-4 p-3 rounded-md border border-red-200 bg-red-50 text-red-700 text-sm">
          {error}
        </div>
      )}
      {success && (
        <div className="mb-4 p-3 rounded-md border border-green-200 bg-green-50 text-green-700 text-sm">
          {success}
        </div>
      )}
      <form onSubmit={onSubmit} className="space-y-5">
        <div>
          <Input
            type="file"
            label="Data File"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={onFileChange}
            disabled={isUploading}
            hint={file ? file.name : fileHint}
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <Input
            label="Table Name (optional)"
            placeholder="Leave blank to use file name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            disabled={isUploading}
          />
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1">
              Data Operation
            </label>
            <select
              value={operationType}
              onChange={(e) => setOperationType(e.target.value as OperationType)}
              disabled={isUploading}
              className="ui-input"
            >
              <option value="insert">Add New Rows (Insert)</option>
              <option value="upsert">Update Existing (Upsert)</option>
            </select>
          </div>
          <div>
            <Input
              label={showConflict ? 'Key Columns for Matching' : 'Key Columns (Upsert Only)'}
              placeholder="e.g., id, email"
              value={conflictColumns}
              onChange={(e) => setConflictColumns(e.target.value)}
              disabled={isUploading || !showConflict}
              hint={showConflict ? 'Columns used to match existing rows (comma-separated)' : ''}
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <Button type="submit" loading={isUploading}>
            {isUploading ? 'Uploading' : 'Upload File'}
          </Button>
          {status && (
            <div className="text-xs font-medium text-gray-600">
              {status === 'uploading' && `Uploading… ${progress}%`}
              {status === 'processing' && `Processing… ${progress}%`}
              {status === 'completed' && '✓ Complete'}
            </div>
          )}
        </div>
      </form>
    </Card>
  );
}
