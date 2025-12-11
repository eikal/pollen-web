import { Activity, Database, GitBranch, AlertCircle, CheckCircle2, TrendingUp } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const pipelineData = [
  { date: 'Mon', successful: 45, failed: 2 },
  { date: 'Tue', successful: 52, failed: 1 },
  { date: 'Wed', successful: 49, failed: 3 },
  { date: 'Thu', successful: 58, failed: 2 },
  { date: 'Fri', successful: 55, failed: 1 },
  { date: 'Sat', successful: 42, failed: 0 },
  { date: 'Sun', successful: 38, failed: 1 },
];

const dataVolumeData = [
  { date: 'Mon', volume: 245 },
  { date: 'Tue', volume: 312 },
  { date: 'Wed', volume: 289 },
  { date: 'Thu', volume: 356 },
  { date: 'Fri', volume: 398 },
  { date: 'Sat', volume: 287 },
  { date: 'Sun', volume: 265 },
];

const assetTypeData = [
  { name: 'Databases', value: 24, color: '#3b82f6' },
  { name: 'Data Lakes', value: 12, color: '#8b5cf6' },
  { name: 'APIs', value: 18, color: '#10b981' },
  { name: 'Files', value: 32, color: '#f59e0b' },
];

export function Dashboard() {
  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 mb-2">Dashboard Overview</h1>
        <p className="text-gray-600">Monitor your data infrastructure and pipeline performance</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-blue-50 rounded-lg">
              <Database className="w-6 h-6 text-blue-600" />
            </div>
            <TrendingUp className="w-4 h-4 text-green-600" />
          </div>
          <div className="text-3xl text-gray-900 mb-1">86</div>
          <div className="text-gray-600 text-sm">Total Data Assets</div>
          <div className="text-green-600 text-sm mt-2">+12% from last month</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-purple-50 rounded-lg">
              <GitBranch className="w-6 h-6 text-purple-600" />
            </div>
            <Activity className="w-4 h-4 text-blue-600" />
          </div>
          <div className="text-3xl text-gray-900 mb-1">42</div>
          <div className="text-gray-600 text-sm">Active ETL Pipelines</div>
          <div className="text-blue-600 text-sm mt-2">38 running now</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-green-50 rounded-lg">
              <CheckCircle2 className="w-6 h-6 text-green-600" />
            </div>
          </div>
          <div className="text-3xl text-gray-900 mb-1">98.5%</div>
          <div className="text-gray-600 text-sm">Success Rate (7 days)</div>
          <div className="text-green-600 text-sm mt-2">Above target (95%)</div>
        </div>

        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="p-2 bg-orange-50 rounded-lg">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
          </div>
          <div className="text-3xl text-gray-900 mb-1">3</div>
          <div className="text-gray-600 text-sm">Active Alerts</div>
          <div className="text-orange-600 text-sm mt-2">2 require attention</div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Pipeline Execution Trends */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Pipeline Execution Trends</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pipelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Bar dataKey="successful" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="failed" fill="#ef4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <div className="flex items-center gap-6 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span className="text-gray-600 text-sm">Successful</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span className="text-gray-600 text-sm">Failed</span>
            </div>
          </div>
        </div>

        {/* Data Volume Processed */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Data Volume Processed (GB)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dataVolumeData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" stroke="#6b7280" />
              <YAxis stroke="#6b7280" />
              <Tooltip />
              <Line type="monotone" dataKey="volume" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Asset Distribution and Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Asset Type Distribution */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Asset Type Distribution</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={assetTypeData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {assetTypeData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-3 mt-4">
            {assetTypeData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded" style={{ backgroundColor: item.color }}></div>
                <span className="text-gray-600 text-sm">{item.name} ({item.value})</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Pipeline Activity */}
        <div className="bg-white p-6 rounded-lg border border-gray-200">
          <h3 className="text-gray-900 mb-4">Recent Pipeline Activity</h3>
          <div className="space-y-4">
            {[
              { name: 'Customer Data ETL', status: 'success', time: '2 min ago', duration: '4m 32s' },
              { name: 'Sales Analytics Pipeline', status: 'success', time: '15 min ago', duration: '8m 12s' },
              { name: 'Inventory Sync Job', status: 'running', time: 'Started 5 min ago', duration: '—' },
              { name: 'Marketing Data Transform', status: 'success', time: '1 hour ago', duration: '12m 45s' },
              { name: 'Product Catalog Update', status: 'failed', time: '2 hours ago', duration: 'Failed at 3m' },
            ].map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-0">
                <div className="flex items-center gap-3">
                  {activity.status === 'success' && <CheckCircle2 className="w-5 h-5 text-green-600" />}
                  {activity.status === 'failed' && <AlertCircle className="w-5 h-5 text-red-600" />}
                  {activity.status === 'running' && <Activity className="w-5 h-5 text-blue-600 animate-pulse" />}
                  <div>
                    <div className="text-gray-900">{activity.name}</div>
                    <div className="text-gray-500 text-sm">{activity.time}</div>
                  </div>
                </div>
                <div className="text-gray-600 text-sm">{activity.duration}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
