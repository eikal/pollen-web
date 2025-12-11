import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';

type ConfigField = {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  default?: any;
  placeholder?: string;
  options?: { value: string; label: string }[];
  dependsOn?: { field: string; value: string };
};

type Connector = {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  configSchema: ConfigField[];
};

type WizardData = {
  sourceType: string;
  sourceConfig: Record<string, any>;
  destinationType: string;
  destinationConfig: Record<string, any>;
  schedule: {
    type: 'manual' | 'interval' | 'cron';
    interval?: number;
    cron?: string;
  };
  name: string;
  description: string;
};

const defaultData: WizardData = {
  sourceType: '',
  sourceConfig: {},
  destinationType: '',
  destinationConfig: {},
  schedule: { type: 'manual' },
  name: '',
  description: '',
};

export default function ETLWizard({ onClose }: { onClose?: () => void }) {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<WizardData>(defaultData);
  const [sources, setSources] = useState<Connector[]>([]);
  const [destinations, setDestinations] = useState<Connector[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  useEffect(() => {
    loadConnectors();
  }, []);

  const authHeader = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('pollen_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  async function loadConnectors() {
    try {
      const res = await fetch('http://localhost:4000/etl/connectors');
      if (!res.ok) throw new Error('Failed to load connectors');
      const json = await res.json();
      setSources(json.connectors?.sources || []);
      setDestinations(json.connectors?.destinations || []);
    } catch (e: any) {
      setError(e.message);
    }
  }

  function next() {
    if (step < 5) setStep(step + 1);
  }

  function back() {
    if (step > 0) setStep(step - 1);
  }

  function updateData<K extends keyof WizardData>(key: K, value: WizardData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function updateConfig(target: 'sourceConfig' | 'destinationConfig', field: string, value: any) {
    setData((prev) => ({ ...prev, [target]: { ...prev[target], [field]: value } }));
  }

  async function finish() {
    setLoading(true);
    setError('');
    try {
      const spec = {
        kind: 'etl_pipeline',
        source: { type: data.sourceType, config: data.sourceConfig },
        destination: { type: data.destinationType, config: data.destinationConfig },
        schedule: data.schedule,
      };
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...(authHeader() as Record<string, string>),
      };
      const res = await fetch('http://localhost:4000/etl/templates', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          name: data.name,
          description: data.description,
          provider: 'etl_wizard',
          spec,
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Failed to create template');
      }
      router.push('/etl');
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  const selectedSource = sources.find((s) => s.id === data.sourceType);
  const selectedDestination = destinations.find((d) => d.id === data.destinationType);

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Card
        title="ETL Pipeline Wizard"
        subtitle="Design and deploy a data flow from source to destination"
        actions={
          onClose ? (
            <Button variant="outline" size="sm" onClick={onClose}>
              Close
            </Button>
          ) : undefined
        }
        className="mb-6"
      >
        <ProgressSteps step={step} />
        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-700 text-xs">
            {error}
          </div>
        )}
        {step === 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Select Data Source</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {sources.map((src) => (
                <button
                  key={src.id}
                  onClick={() => updateData('sourceType', src.id)}
                  className={`p-4 border rounded-md text-left transition ${data.sourceType === src.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                >
                  <div className="font-medium text-sm">{src.name}</div>
                  <div className="text-[11px] text-gray-600 mt-1">{src.description}</div>
                  <div className="text-[10px] text-gray-500 mt-1 uppercase tracking-wide">
                    {src.category}
                  </div>
                </button>
              ))}
            </div>
            <div className="mt-4 text-right">
              <Button variant="primary" disabled={!data.sourceType} onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 1 && selectedSource && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Configure {selectedSource.name}</h3>
            <DynamicForm
              schema={selectedSource.configSchema}
              values={data.sourceConfig}
              onChange={(f, v) => updateConfig('sourceConfig', f, v)}
            />
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button variant="primary" onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 2 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Field Mapping</h3>
            <div className="mb-3 p-3 rounded border border-blue-200 bg-blue-50 text-blue-700 text-xs">
              All fields will be mapped by name automatically.
            </div>
            <div className="flex justify-between mt-5">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button variant="primary" onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Select Destination</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {destinations.map((dest) => (
                <button
                  key={dest.id}
                  onClick={() => updateData('destinationType', dest.id)}
                  className={`p-4 border rounded-md text-left transition ${data.destinationType === dest.id ? 'border-blue-600 bg-blue-50' : 'border-gray-200 hover:border-blue-400'}`}
                >
                  <div className="font-medium text-sm">{dest.name}</div>
                  <div className="text-[11px] text-gray-600 mt-1">{dest.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button variant="primary" disabled={!data.destinationType} onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 4 && selectedDestination && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Configure Destination & Schedule</h3>
            <div className="mb-4">
              <DynamicForm
                schema={selectedDestination.configSchema}
                values={data.destinationConfig}
                onChange={(f, v) => updateConfig('destinationConfig', f, v)}
              />
            </div>
            <div className="space-y-2 mb-4">
              <div className="text-[11px] font-medium">Schedule</div>
              <label className="flex items-center gap-2 text-[11px]">
                <input
                  type="radio"
                  checked={data.schedule.type === 'manual'}
                  onChange={() => updateData('schedule', { type: 'manual' })}
                />{' '}
                Manual (run on demand)
              </label>
              <label className="flex items-center gap-2 text-[11px]">
                <input
                  type="radio"
                  checked={data.schedule.type === 'interval'}
                  onChange={() => updateData('schedule', { type: 'interval', interval: 60 })}
                />{' '}
                Interval
              </label>
              {data.schedule.type === 'interval' && (
                <div className="ml-6 flex items-center gap-2">
                  <Input
                    label="Interval (minutes)"
                    type="number"
                    value={String(data.schedule.interval || 60)}
                    onChange={(e) =>
                      updateData('schedule', {
                        ...data.schedule,
                        interval: parseInt(e.target.value),
                      })
                    }
                    wrapperClassName="w-28"
                  />
                </div>
              )}
            </div>
            <div className="mt-5 flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button variant="primary" onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 5 && (
          <div>
            <h3 className="text-sm font-semibold mb-3">Review & Create</h3>
            <div className="space-y-4 mb-4">
              <Input
                label="Pipeline Name"
                value={data.name}
                onChange={(e) => updateData('name', e.target.value)}
                placeholder="My ETL Pipeline"
              />
              <Input
                label="Description"
                value={data.description}
                onChange={(e) => updateData('description', e.target.value)}
                placeholder="Describe what this pipeline does"
              />
              <div className="bg-gray-50 border border-gray-200 rounded p-3 text-[11px] space-y-1">
                <div>
                  <strong>Source:</strong> {selectedSource?.name}
                </div>
                <div>
                  <strong>Destination:</strong> {selectedDestination?.name}
                </div>
                <div>
                  <strong>Schedule:</strong>{' '}
                  {data.schedule.type === 'manual'
                    ? 'Manual'
                    : `Every ${data.schedule.interval} min`}
                </div>
              </div>
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={back}>
                Back
              </Button>
              <Button variant="primary" disabled={loading || !data.name} onClick={finish}>
                {loading ? 'Creating…' : 'Create Pipeline'}
              </Button>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function ProgressSteps({ step }: { step: number }) {
  const steps = ['Source', 'Config', 'Mapping', 'Destination', 'Schedule', 'Review'];
  return (
    <div className="flex items-center justify-between mb-8">
      {steps.map((label, i) => (
        <div key={i} className="flex flex-col items-center flex-1">
          <div
            className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold ${
              i <= step ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}
          >
            {i + 1}
          </div>
          <div className="text-xs mt-1">{label}</div>
        </div>
      ))}
    </div>
  );
}

function DynamicForm({
  schema,
  values,
  onChange,
}: {
  schema: ConfigField[];
  values: Record<string, any>;
  onChange: (field: string, value: any) => void;
}) {
  return (
    <div className="space-y-3">
      {schema.map((field) => {
        if (field.dependsOn) {
          const depValue = values[field.dependsOn.field];
          if (depValue !== field.dependsOn.value) return null;
        }
        const value = values[field.name] ?? field.default ?? '';
        const common = {
          className: 'border rounded px-3 py-2 w-full text-sm',
          placeholder: field.placeholder,
        } as any;
        return (
          <div key={field.name} className="space-y-1">
            <div className="text-[11px] font-medium">
              {field.label}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </div>
            {field.type === 'text' && (
              <input
                type="text"
                value={value}
                onChange={(e) => onChange(field.name, e.target.value)}
                {...common}
              />
            )}
            {field.type === 'password' && (
              <input
                type="password"
                value={value}
                onChange={(e) => onChange(field.name, e.target.value)}
                {...common}
              />
            )}
            {field.type === 'number' && (
              <input
                type="number"
                value={value}
                onChange={(e) => onChange(field.name, parseInt(e.target.value))}
                {...common}
              />
            )}
            {field.type === 'select' && (
              <select
                value={value}
                onChange={(e) => onChange(field.name, e.target.value)}
                className="border rounded px-3 py-2 w-full text-sm"
              >
                {field.options?.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            )}
            {field.type === 'checkbox' && (
              <label className="inline-flex items-center gap-2 text-[11px]">
                <input
                  type="checkbox"
                  checked={!!value}
                  onChange={(e) => onChange(field.name, e.target.checked)}
                />{' '}
                Enable
              </label>
            )}
          </div>
        );
      })}
    </div>
  );
}
