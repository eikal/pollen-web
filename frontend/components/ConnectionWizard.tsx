/**
 * ConnectionWizard component - step-by-step flow for adding data sources.
 */

import { useState } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';
import { useConnectionSchema } from '../lib/api/hooks';
import * as connectionsAPI from '../lib/api/connections';
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

  const { data: schema, loading: loadingSchema } = useConnectionSchema(connectionId);

  const handleTypeSelect = (typeId: string) => {
    setSelectedType(typeId);
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

  const handleFinish = () => {
    if (connectionId && onComplete) {
      onComplete(connectionId);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <Card
        title="Add Data Source"
        subtitle="Step-by-step to connect a data source and review its schema"
        className="mb-6"
      >
        <div className="flex items-center justify-between mb-4">
          <StepIndicator active={step === 'select-type'} completed={step !== 'select-type'}>
            Type
          </StepIndicator>
          <div className="flex-1 h-px bg-gray-200 mx-2" />
          <StepIndicator active={step === 'configure'} completed={step === 'preview'}>
            Configure
          </StepIndicator>
          <div className="flex-1 h-px bg-gray-200 mx-2" />
          <StepIndicator active={step === 'preview'} completed={false}>
            Preview
          </StepIndicator>
        </div>
        {step === 'select-type' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Select Connection Type</h2>
            <p className="text-xs text-gray-600 mb-4">
              Choose the data source you want to connect.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {CONNECTION_TYPES.map((type) => (
                <button
                  key={type.id}
                  onClick={() => handleTypeSelect(type.id)}
                  className="p-4 border border-gray-200 rounded-md text-left hover:border-blue-500 hover:bg-blue-50 transition group"
                >
                  <div className="text-2xl mb-2">{type.icon}</div>
                  <div className="font-medium text-sm text-gray-900 group-hover:text-blue-700">
                    {type.name}
                  </div>
                  <div className="text-[11px] text-gray-600 mt-1">{type.description}</div>
                </button>
              ))}
            </div>
            {onCancel && (
              <div className="mt-4 text-right">
                <Button variant="outline" size="sm" onClick={onCancel}>
                  Cancel
                </Button>
              </div>
            )}
          </div>
        )}
        {step === 'configure' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Configure Connection</h2>
            <p className="text-xs text-gray-600 mb-4">Provide connection details.</p>
            {error && (
              <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
                {error}
              </div>
            )}
            <div className="space-y-4">
              <Input
                label="Connection Name *"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder="Sales Data CSV"
                hint="Friendly name to identify this connection"
              />
              <Input
                label="Credential Reference"
                value={credentialRef}
                onChange={(e) => setCredentialRef(e.target.value)}
                placeholder="Optional credential ID"
                hint="Leave empty for now if not using stored credentials"
              />
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={() => setStep('select-type')}>
                Back
              </Button>
              <Button
                variant="primary"
                disabled={creating || !label}
                onClick={handleCreateConnection}
              >
                {creating ? 'Creating…' : 'Create & Preview'}
              </Button>
            </div>
          </div>
        )}
        {step === 'preview' && (
          <div>
            <h2 className="text-lg font-semibold mb-2">Schema Preview</h2>
            <p className="text-xs text-gray-600 mb-4">Review detected fields before proceeding.</p>
            <SchemaPreview schema={schema} loading={loadingSchema} />
            <div className="mt-5 flex justify-end gap-2">
              {onCancel && (
                <Button variant="outline" onClick={onCancel}>
                  Close
                </Button>
              )}
              <Button variant="primary" onClick={handleFinish}>
                Finish & Create Products
              </Button>
            </div>
          </div>
        )}
      </Card>
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
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1">
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-[11px] font-semibold transition-colors ${completed ? 'bg-green-500 text-white' : active ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        {completed ? '✓' : active ? '•' : ''}
      </div>
      <span className={`text-[11px] font-medium ${active ? 'text-gray-900' : 'text-gray-500'}`}>
        {children}
      </span>
    </div>
  );
}
