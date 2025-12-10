import { useState } from 'react';
import { Search, Database, FileJson, Cloud, HardDrive, Plus, Filter, MoreVertical, ExternalLink } from 'lucide-react';

interface Asset {
  id: string;
  name: string;
  type: 'database' | 'datalake' | 'api' | 'file';
  status: 'active' | 'inactive' | 'maintenance';
  size: string;
  lastUpdated: string;
  owner: string;
  description: string;
}

const mockAssets: Asset[] = [
  {
    id: '1',
    name: 'Customer Database',
    type: 'database',
    status: 'active',
    size: '245 GB',
    lastUpdated: '2 hours ago',
    owner: 'Sarah Chen',
    description: 'Primary customer data warehouse with demographic and transaction history',
  },
  {
    id: '2',
    name: 'Sales Data Lake',
    type: 'datalake',
    status: 'active',
    size: '1.2 TB',
    lastUpdated: '30 min ago',
    owner: 'Mike Johnson',
    description: 'Centralized sales data repository for analytics and reporting',
  },
  {
    id: '3',
    name: 'Payment Gateway API',
    type: 'api',
    status: 'active',
    size: '—',
    lastUpdated: '5 min ago',
    owner: 'Alex Rivera',
    description: 'RESTful API for payment processing and transaction validation',
  },
  {
    id: '4',
    name: 'Product Catalog CSV',
    type: 'file',
    status: 'active',
    size: '156 MB',
    lastUpdated: '1 day ago',
    owner: 'Sarah Chen',
    description: 'Daily export of product catalog with pricing and inventory data',
  },
  {
    id: '5',
    name: 'Legacy CRM System',
    type: 'database',
    status: 'maintenance',
    size: '89 GB',
    lastUpdated: '3 days ago',
    owner: 'Mike Johnson',
    description: 'Legacy customer relationship management database - migration in progress',
  },
  {
    id: '6',
    name: 'Marketing Analytics Lake',
    type: 'datalake',
    status: 'active',
    size: '567 GB',
    lastUpdated: '1 hour ago',
    owner: 'Emma Davis',
    description: 'Marketing campaign data and customer engagement metrics',
  },
  {
    id: '7',
    name: 'Inventory Management API',
    type: 'api',
    status: 'active',
    size: '—',
    lastUpdated: '10 min ago',
    owner: 'Alex Rivera',
    description: 'Real-time inventory tracking and warehouse management system',
  },
  {
    id: '8',
    name: 'HR Records Archive',
    type: 'file',
    status: 'inactive',
    size: '42 GB',
    lastUpdated: '2 weeks ago',
    owner: 'Emma Davis',
    description: 'Historical HR records and employee data archive',
  },
];

export function DataAssets() {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');

  const filteredAssets = mockAssets.filter((asset) => {
    const matchesSearch = asset.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         asset.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterType === 'all' || asset.type === filterType;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'database':
        return <Database className="w-5 h-5" />;
      case 'datalake':
        return <Cloud className="w-5 h-5" />;
      case 'api':
        return <ExternalLink className="w-5 h-5" />;
      case 'file':
        return <FileJson className="w-5 h-5" />;
      default:
        return <HardDrive className="w-5 h-5" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700';
      case 'inactive':
        return 'bg-gray-100 text-gray-700';
      case 'maintenance':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-gray-900 mb-2">Data Assets</h1>
            <p className="text-gray-600">Manage and monitor your data infrastructure</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
            <Plus className="w-5 h-5" />
            Add Asset
          </button>
        </div>

        {/* Search and Filter */}
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search assets..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="database">Databases</option>
              <option value="datalake">Data Lakes</option>
              <option value="api">APIs</option>
              <option value="file">Files</option>
            </select>
          </div>
        </div>
      </div>

      {/* Asset Cards Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredAssets.map((asset) => (
          <div key={asset.id} className="bg-white p-6 rounded-lg border border-gray-200 hover:shadow-lg transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  asset.type === 'database' ? 'bg-blue-50 text-blue-600' :
                  asset.type === 'datalake' ? 'bg-purple-50 text-purple-600' :
                  asset.type === 'api' ? 'bg-green-50 text-green-600' :
                  'bg-orange-50 text-orange-600'
                }`}>
                  {getTypeIcon(asset.type)}
                </div>
                <div>
                  <h3 className="text-gray-900">{asset.name}</h3>
                  <span className={`inline-block px-2 py-1 rounded text-xs mt-1 ${getStatusColor(asset.status)}`}>
                    {asset.status}
                  </span>
                </div>
              </div>
              <button className="p-2 hover:bg-gray-100 rounded-lg transition-colors">
                <MoreVertical className="w-5 h-5 text-gray-400" />
              </button>
            </div>

            <p className="text-gray-600 mb-4">{asset.description}</p>

            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-200">
              <div>
                <div className="text-gray-500 text-sm mb-1">Size</div>
                <div className="text-gray-900">{asset.size}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Owner</div>
                <div className="text-gray-900">{asset.owner}</div>
              </div>
              <div>
                <div className="text-gray-500 text-sm mb-1">Last Updated</div>
                <div className="text-gray-900">{asset.lastUpdated}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredAssets.length === 0 && (
        <div className="text-center py-12">
          <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-gray-900 mb-2">No assets found</h3>
          <p className="text-gray-600">Try adjusting your search or filters</p>
        </div>
      )}
    </div>
  );
}
