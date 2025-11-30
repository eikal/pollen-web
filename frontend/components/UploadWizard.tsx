import React, { useEffect, useState } from 'react';
import { uploadFile, listSessions, UploadSession, OperationType, enumerateExcelSheets } from '../lib/api/uploads';
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
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [showConfirmation, setShowConfirmation] = useState<boolean>(false);

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
    setSheets([]);
    setSelectedSheet('');

    const name = e.target.files[0].name.toLowerCase();
    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      // enumerate sheets for Excel
      enumerateExcelSheets(e.target.files[0])
        .then((list) => {
          setSheets(list);
          if (list.length > 0) setSelectedSheet(list[0]);
        })
        .catch(() => {
          // silently ignore; user can still upload
        });
    }
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

    // Show confirmation for upsert operations (data modification)
    if (operationType === 'upsert' && !showConfirmation) {
      setShowConfirmation(true);
      return;
    }

    setShowConfirmation(false);
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
        sheet: selectedSheet || undefined,
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
    <>
      <Card
        title="Upload Your Data"
        subtitle="Create or update tables from CSV or Excel files."
        className="fade-in"
      >
        {error && (
          <div className="mb-6 p-4 rounded-lg border-2 border-red-300 bg-red-50 text-red-800 text-sm leading-relaxed">
            <strong className="font-semibold">Error:</strong> {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded-lg border-2 border-green-300 bg-green-50 text-green-800 text-sm leading-relaxed">
            <strong className="font-semibold">Success:</strong> {success}
          </div>
        )}
        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Data File
            </label>
            <input
              type="file"
              accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
              onChange={onFileChange}
              disabled={isUploading}
              className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
            />
            <p className="mt-2 text-xs text-gray-600">{file ? `✓ ${file.name}` : fileHint}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {sheets.length > 0 && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Excel Sheet
                </label>
                <select
                  value={selectedSheet}
                  onChange={(e) => setSelectedSheet(e.target.value)}
                  disabled={isUploading}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                >
                  {sheets.map((s) => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
                <p className="mt-2 text-xs text-gray-600">Select which sheet to import</p>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Table Name (optional)
              </label>
              <input
                type="text"
                placeholder="Leave blank to use file name"
                value={tableName}
                onChange={(e) => setTableName(e.target.value)}
                disabled={isUploading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <p className="mt-2 text-xs text-gray-600">Custom name for the database table</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Operation Type
              </label>
              <select
                value={operationType}
                onChange={(e) => setOperationType(e.target.value as OperationType)}
                disabled={isUploading}
                className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              >
                <option value="insert">Create Table (Insert New Rows)</option>
                <option value="upsert">Upsert (Update or Insert by Key)</option>
              </select>
              <p className="mt-2 text-xs text-gray-600">
                {operationType === 'insert' ? 'Add all rows as new records' : 'Update existing rows or insert new ones'}
              </p>
            </div>

            <div>
              <label className={`block text-sm font-medium mb-2 ${showConflict ? 'text-gray-700' : 'text-gray-400'}`}>
                Key Columns for Upsert
              </label>
              <input
                type="text"
                placeholder="e.g., id, email"
                value={conflictColumns}
                onChange={(e) => setConflictColumns(e.target.value)}
                disabled={isUploading || !showConflict}
                className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
                  showConflict
                    ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                    : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                }`}
              />
              <p className="mt-2 text-xs text-gray-600">
                {showConflict ? 'Comma-separated column names to match existing rows' : 'Only used for upsert operations'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
            <button
              type="submit"
              disabled={isUploading || !file}
              className={`px-6 py-2.5 rounded-lg font-semibold shadow-sm transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 text-sm ${
                operationType === 'upsert'
                  ? 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500'
                  : 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
              } ${(isUploading || !file) ? 'opacity-50 cursor-not-allowed' : 'hover:shadow'}`}
            >
              {isUploading ? 'Processing...' : operationType === 'insert' ? 'Create Table' : 'Upsert (Update/Insert)'}
            </button>
            {status && (
              <div className="text-sm font-medium text-gray-700">
                {status === 'uploading' && `📤 Uploading… ${progress}%`}
                {status === 'processing' && `⚙️ Processing… ${progress}%`}
                {status === 'completed' && <span className="text-green-600">✓ Complete</span>}
              </div>
            )}
          </div>
        </form>
      </Card>

      {showConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-200">
            <div className="flex items-center gap-3 mb-4">
              <span className="text-3xl">⚠️</span>
              <h3 className="text-xl font-bold text-gray-900">Confirm Upsert Operation</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4 leading-relaxed">
              This will update existing rows in <code className="bg-gray-100 px-1.5 py-0.5 rounded font-mono text-xs">{tableName || 'your table'}</code> where 
              key columns match, and insert new rows for non-matches.
            </p>
            <p className="text-sm text-gray-700 mb-6 leading-relaxed">
              <strong className="font-semibold">Key columns:</strong> <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">{conflictColumns || '(not specified)'}</code>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmation(false)}
                className="flex-1 px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-400 focus:ring-offset-2 transition-all duration-150 font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmation(false);
                  onSubmit({ preventDefault: () => {} } as any);
                }}
                className="flex-1 px-4 py-2.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 transition-all duration-150 font-semibold text-sm shadow-sm hover:shadow"
              >
                Proceed with Upsert
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
