import { useState } from 'react';
import { Play, Pause, RefreshCw, Settings, Clock, CheckCircle2, XCircle, AlertCircle, Plus, Calendar } from 'lucide-react';

interface Pipeline {
  id: string;
  name: string;
  source: string;
  destination: string;
  status: 'running' | 'paused' | 'failed' | 'success';
  schedule: string;
  lastRun: string;
  duration: string;
  recordsProcessed: string;
  nextRun: string;
}

const mockPipelines: Pipeline[] = [
  {
    id: '1',
    name: 'Customer Data ETL',
    source: 'PostgreSQL',
    destination: 'Data Warehouse',
    status: 'running',
    schedule: 'Every 15 minutes',
    lastRun: '2 min ago',
    duration: '4m 32s',
    recordsProcessed: '12,458',
    nextRun: 'In 13 minutes',
  },
  {
    id: '2',
    name: 'Sales Analytics Pipeline',
    source: 'MySQL',
    destination: 'Sales Data Lake',
    status: 'success',
    schedule: 'Daily at 2:00 AM',
    lastRun: '6 hours ago',
    duration: '8m 12s',
    recordsProcessed: '45,892',
    nextRun: 'Tomorrow at 2:00 AM',
  },
  {
    id: '3',
    name: 'Inventory Sync Job',
    source: 'REST API',
    destination: 'MongoDB',
    status: 'running',
    schedule: 'Every 5 minutes',
    lastRun: '1 min ago',
    duration: '—',
    recordsProcessed: '—',
    nextRun: 'In 4 minutes',
  },
  {
    id: '4',
    name: 'Marketing Data Transform',
    source: 'S3 Bucket',
    destination: 'Redshift',
    status: 'success',
    schedule: 'Hourly',
    lastRun: '45 min ago',
    duration: '12m 45s',
    recordsProcessed: '89,234',
    nextRun: 'In 15 minutes',
  },
  {
    id: '5',
    name: 'Product Catalog Update',
    source: 'CSV Files',
    destination: 'Elasticsearch',
    status: 'failed',
    schedule: 'Every 30 minutes',
    lastRun: '2 hours ago',
    duration: 'Failed at 3m',
    recordsProcessed: '0',
    nextRun: 'Paused',
  },
  {
    id: '6',
    name: 'Log Aggregation Pipeline',
    source: 'Kafka',
    destination: 'BigQuery',
    status: 'success',
    schedule: 'Continuous',
    lastRun: '10 sec ago',
    duration: '2m 18s',
    recordsProcessed: '156,789',
    nextRun: 'Continuous',
  },
  {
    id: '7',
    name: 'User Events Streaming',
    source: 'Event Hub',
    destination: 'Data Lake',
    status: 'paused',
    schedule: 'Continuous',
    lastRun: '3 days ago',
    duration: '—',
    recordsProcessed: '0',
    nextRun: 'Paused',
  },
  {
    id: '8',
    name: 'Financial Reports ETL',
    source: 'Oracle DB',
    destination: 'Snowflake',
    status: 'success',
    schedule: 'Daily at 6:00 AM',
    lastRun: '2 hours ago',
    duration: '15m 34s',
    recordsProcessed: '67,432',
    nextRun: 'Tomorrow at 6:00 AM',
  },
];

export function ETLManagement() {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const filteredPipelines = mockPipelines.filter((pipeline) => {
    if (selectedStatus === 'all') return true;
    return pipeline.status === selectedStatus;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className="w-4 h-4 animate-spin" />;
      case 'success':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'failed':
        return <XCircle className="w-4 h-4" />;
      case 'paused':
        return <Pause className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'running':
        return 'bg-blue-100 text-blue-700';
      case 'success':
        return 'bg-green-100 text-green-700';
      case 'failed':
        return 'bg-red-100 text-red-700';
      case 'paused':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const statusCounts = {
    all: mockPipelines.length,
    running: mockPipelines.filter(p => p.status === 'running').length,
    success: mockPipelines.filter(p => p.status === 'success').length,
    failed: mockPipelines.filter(p => p.status === 'failed').length,
    paused: mockPipelines.filter(p => p.status === 'paused').length,
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-gray-900 mb-2">ETL Pipeline Management</h1>
            <p className="text-gray-600">Monitor and control your data transformation pipelines</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Create Pipeline
          </button>
        </div>

        {/* Status Filter Tabs */}
        <div className="flex gap-2 bg-white p-2 rounded-lg border border-gray-200 inline-flex">
          {[
            { key: 'all', label: 'All Pipelines' },
            { key: 'running', label: 'Running' },
            { key: 'success', label: 'Success' },
            { key: 'failed', label: 'Failed' },
            { key: 'paused', label: 'Paused' },
          ].map((tab) => (
            <button
              key={tab.key}
              onClick={() => setSelectedStatus(tab.key)}
              className={`px-4 py-2 rounded-lg transition-colors ${
                selectedStatus === tab.key
                  ? 'bg-blue-50 text-blue-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              {tab.label} ({statusCounts[tab.key as keyof typeof statusCounts]})
            </button>
          ))}
        </div>
      </div>

      {/* Pipeline List */}
      <div className="space-y-4">
        {filteredPipelines.map((pipeline) => (
          <div key={pipeline.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="text-gray-900">{pipeline.name}</h3>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${getStatusColor(pipeline.status)}`}>
                    {getStatusIcon(pipeline.status)}
                    {pipeline.status}
                  </span>
                </div>
                <div className="flex items-center gap-4 text-gray-600 text-sm">
                  <span>{pipeline.source} → {pipeline.destination}</span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {pipeline.schedule}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Run now">
                  <Play className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Pause">
                  <Pause className="w-5 h-5 text-gray-600" />
                </button>
                <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Settings">
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-4 border-t border-gray-200">
              <div>
                <div className="text-gray-500 text-sm mb-1">Last Run</div>
                <div className="text-gray-900">{pipeline.lastRun}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Duration</div>
                <div className="text-gray-900">{pipeline.duration}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Records Processed</div>
                <div className="text-gray-900">{pipeline.recordsProcessed}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Next Run
                </div>
                <div className="text-gray-900">{pipeline.nextRun}</div>
              </div>
            </div>

            {pipeline.status === 'failed' && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="text-red-900 text-sm">Pipeline Failed</div>
                    <div className="text-red-700 text-sm mt-1">
                      Error: Connection timeout to destination database. Last successful run processed 23,456 records.
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {filteredPipelines.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">No pipelines found</h3>
          <p className="text-gray-600">No pipelines match the selected status</p>
        </div>
      )}
    </div>
  );
}
