/**
 * ConnectionWizard component - step-by-step flow for adding data sources.
 */

import { useEffect, useState, type ReactNode } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';
import { useConnectionSchema } from '../lib/api/hooks';
import * as connectionsAPI from '../lib/api/connections';
import {
  uploadFile,
  listSessions,
  type OperationType,
  type UploadSession,
} from '../lib/api/uploads';
import SchemaPreview from './SchemaPreview';

interface ConnectionWizardProps {
  orgId: string;
  workspaceId?: string;
  onComplete?: (connectionId: string) => void;
  onCancel?: () => void;
}

type Step = 'select-type' | 'configure' | 'preview';

const CONNECTION_TYPES = [
  { id: 'csv', name: 'CSV File', icon: '📄', description: 'Upload or link to CSV files' },
  {
    id: 'google-sheets',
    name: 'Google Sheets',
    icon: '📊',
    description: 'Connect to Google Sheets',
  },
  {
    id: 'snowflake',
    name: 'Snowflake',
    icon: '❄️',
    description: 'Connect to Snowflake warehouse',
  },
  {
    id: 'bigquery',
    name: 'BigQuery',
    icon: '🔷',
    description: 'Connect to Google BigQuery',
  },
];

export default function ConnectionWizard({
  orgId,
  workspaceId,
  onComplete,
  onCancel,
}: ConnectionWizardProps) {
  const [step, setStep] = useState<Step>('select-type');
  const [selectedType, setSelectedType] = useState<string | null>(null);
  const [label, setLabel] = useState('');
  const [credentialRef, setCredentialRef] = useState('');
  const [connectionId, setConnectionId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // CSV-specific state
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvTableName, setCsvTableName] = useState('');
  const [csvOperation, setCsvOperation] = useState<OperationType>('insert');
  const [csvConflictColumns, setCsvConflictColumns] = useState('');
  const [uploadSessionId, setUploadSessionId] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<UploadSession['status'] | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [csvUploading, setCsvUploading] = useState(false);
  const [csvSuccessTable, setCsvSuccessTable] = useState<string | null>(null);

  const { data: schema, loading: loadingSchema } = useConnectionSchema(connectionId);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
    if (!label) {
      const found = CONNECTION_TYPES.find((t) => t.id === typeId);
      if (found) setLabel(found.name);
    }
    setStep('configure');
  };

  const handleCreateConnection = async () => {
    if (!selectedType || !label) {
      setError('Please fill in all required fields');
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const connection = await connectionsAPI.createConnection({
        org_id: orgId,
        workspace_id: workspaceId,
        type: selectedType,
        label,
        credential_ref: credentialRef || undefined,
      });

      setConnectionId(connection.id);
      setStep('preview');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCreating(false);
    }
  };

  const handleCsvUpload = async () => {
    if (!selectedType || selectedType !== 'csv') return;
    if (!label || !csvFile) {
      setError('Please add a connection name and select a file.');
      return;
    }

    setCreating(true);
    setCsvUploading(true);
    setError(null);
    setUploadStatus(null);
    setUploadProgress(10);

    try {
      const conflict = csvConflictColumns
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      const res = await uploadFile({
        file: csvFile,
        tableName: csvTableName || undefined,
        operationType: csvOperation,
        conflictColumns: conflict.length > 0 ? conflict : undefined,
      });

      setUploadSessionId(res.sessionId);
      setUploadStatus(res.status as UploadSession['status']);
      setCsvSuccessTable(res.tableName);
      setStep('preview');
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please try again.');
      setCsvUploading(false);
      setCreating(false);
    }
  };

  useEffect(() => {
    if (!uploadSessionId) return;

    let timer: number | undefined;
    const poll = async () => {
      try {
        const sessions = await listSessions();
        const session = sessions.find((s) => s.sessionId === uploadSessionId);
        if (session) {
          setUploadProgress(session.progressPct);
          setUploadStatus(session.status);
          if (session.status === 'completed') {
            setCsvUploading(false);
            setCreating(false);
            return;
          }
          if (session.status === 'failed') {
            setError(
              session.errorMessage ||
                'We could not finish this upload. Please retry with a fresh file.',
            );
            setCsvUploading(false);
            setCreating(false);
            return;
          }
        }
        timer = window.setTimeout(poll, 1500);
      } catch (err: any) {
        setError(
          err.message || 'We could not check progress right now. Please refresh and retry.',
        );
        setCsvUploading(false);
        setCreating(false);
      }
    };

    poll();
    return () => {
      if (timer) window.clearTimeout(timer);
    };
  }, [uploadSessionId]);

  const handleFinish = () => {
    if (connectionId && onComplete) {
      onComplete(connectionId);
    } else if (selectedType === 'csv' && uploadStatus === 'completed' && onComplete) {
      onComplete('csv-upload');
    }
  };

  const renderCsvConfigure = () => {
    const showConflict = csvOperation === 'upsert';

    return (
      <div className="space-y-6">
        <Input
          label="Connection Name *"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="Sales Data CSV"
          hint="Friendly name to identify this upload"
        />

        <div className="space-y-4">
          <label className="block text-sm font-medium text-gray-700">Data File *</label>
          <input
            type="file"
            accept=".csv,.xlsx,.xls,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            onChange={(e) => setCsvFile(e.target.files?.[0] || null)}
            disabled={csvUploading}
            className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 p-2"
          />
          <p className="text-xs text-gray-600">CSV or Excel up to 50MB.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Table Name (optional)"
            value={csvTableName}
            onChange={(e) => setCsvTableName(e.target.value)}
            placeholder="Defaults to file name"
            hint="We create this table in your Data Workspace"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Operation</label>
            <select
              value={csvOperation}
              onChange={(e) => setCsvOperation(e.target.value as OperationType)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              disabled={csvUploading}
            >
              <option value="insert">Create table (insert new records)</option>
              <option value="upsert">Upsert (match on key)</option>
            </select>
            <p className="mt-2 text-xs text-gray-600">
              {csvOperation === 'insert'
                ? 'Add all records as a new table.'
                : 'Keep tables up to date by matching on key columns.'}
            </p>
          </div>
        </div>

        <div>
          <label
            className={`block text-sm font-medium mb-2 ${showConflict ? 'text-gray-700' : 'text-gray-400'}`}
          >
            Key Columns for Upsert
          </label>
          <input
            type="text"
            placeholder="e.g., id, email"
            value={csvConflictColumns}
            onChange={(e) => setCsvConflictColumns(e.target.value)}
            disabled={csvUploading || !showConflict}
            className={`block w-full px-3 py-2 border rounded-lg text-sm focus:outline-none ${
              showConflict
                ? 'border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-blue-500'
                : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
            }`}
          />
          <p className="mt-2 text-xs text-gray-600">Separate multiple columns with commas.</p>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <StepIndicator active={step === 'select-type'} completed={step !== 'select-type'}>
            Select Type
          </StepIndicator>
          <div className="flex-1 h-px bg-gray-300 mx-3" />
          <StepIndicator active={step === 'configure'} completed={step === 'preview'}>
            Configure
          </StepIndicator>
          <div className="flex-1 h-px bg-gray-300 mx-3" />
          <StepIndicator active={step === 'preview'} completed={false}>
            Preview Schema
          </StepIndicator>
        </div>
      </div>
        {step === 'select-type' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Select Connection Type</h2>
            <p className="text-gray-600 mb-6">
              Choose the data source you want to connect to your workspace.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {CONNECTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="p-6 border border-gray-200 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 hover:shadow-md transition-all group"
                >
                  <div className="text-3xl mb-3">{type.icon}</div>
                  <div className="font-semibold text-base text-gray-900 group-hover:text-blue-700 mb-1">
                    {type.name}
                  </div>
                  <div className="text-sm text-gray-600">{type.description}</div>
                </button>
              ))}
            </div>
            {onCancel && (
              <div className="mt-6 text-right">
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
        {step === 'configure' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Configure Connection</h2>
            <p className="text-gray-600 mb-6">Provide connection details to establish the link.</p>
            {error && (
              <div className="mb-4 p-4 rounded-lg border border-red-200 bg-red-50 text-red-700 text-sm">
                {error}
              </div>
            )}

            {selectedType === 'csv' ? (
              renderCsvConfigure()
            ) : (
              <div className="space-y-5">
                <Input
                  label="Connection Name *"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                  placeholder="Snowflake Analytics"
                  hint="Friendly name to identify this connection"
                />
                <Input
                  label="Credential Reference"
                  value={credentialRef}
                  onChange={(e) => setCredentialRef(e.target.value)}
                  placeholder="Optional credential ID"
                  hint="Use your stored credential reference if available"
                />
              </div>
            )}

            <div className="mt-8 flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-type')}>
                Back
              </Button>
              {selectedType === 'csv' ? (
                <Button
                  variant="primary"
                  disabled={csvUploading || !label || !csvFile}
                  onClick={handleCsvUpload}
                >
                  {csvUploading ? 'Uploading…' : 'Upload & Preview'}
                </Button>
              ) : (
                <Button
                  variant="primary"
                  disabled={creating || !label}
                  onClick={handleCreateConnection}
                >
                  {creating ? 'Creating…' : 'Create & Preview'}
                </Button>
              )}
            </div>
          </div>
        )}
        {step === 'preview' && (
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">Preview</h2>
            <p className="text-gray-600 mb-6">
              {selectedType === 'csv'
                ? 'We are preparing your table. Once it finishes, you can start exploring.'
                : 'Review detected fields before finalizing the connection.'}
            </p>

            {selectedType === 'csv' ? (
              <Card
                title="Upload Progress"
                subtitle={csvSuccessTable ? `Creating table ${csvSuccessTable}` : 'We are setting up your table'}
              >
                <div className="space-y-3">
                  <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        uploadStatus === 'failed'
                          ? 'bg-red-500'
                          : uploadStatus === 'completed'
                          ? 'bg-green-500'
                          : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.max(uploadProgress, uploadStatus === 'completed' ? 100 : uploadProgress)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-700">
                    <span className="font-medium">
                      {uploadStatus === 'completed'
                        ? 'Data is ready in your workspace.'
                        : uploadStatus === 'failed'
                        ? 'Upload needs attention.'
                        : 'Uploading and preparing your data…'}
                    </span>
                    <span className="text-gray-500">{Math.round(uploadProgress)}%</span>
                  </div>
                  {uploadStatus === 'failed' && error && (
                    <div className="p-3 rounded border border-red-200 bg-red-50 text-red-700 text-sm">
                      {error}
                    </div>
                  )}
                </div>
              </Card>
            ) : (
              <SchemaPreview schema={schema} loading={loadingSchema} />
            )}

            <div className="mt-8 flex justify-end gap-3">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Close
                </Button>
              )}
              <Button
                variant="primary"
                onClick={handleFinish}
                disabled={selectedType === 'csv' ? uploadStatus !== 'completed' : false}
              >
                Finish & Create Products
              </Button>
            </div>
          </div>
        )}
    </div>
  );
}

function StepIndicator({
  active,
  completed,
  children,
}: {
  active: boolean;
  completed: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${completed ? 'bg-green-500 text-white shadow-sm' : active ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30' : 'bg-gray-200 text-gray-500'}`}
      >
        {completed ? '✓' : active ? '•' : ''}
      </div>
      <span className={`text-sm font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>
        {children}
      </span>
    </div>
  );
}
