import { Database, GitBranch, Shield, BarChart3, Upload, Clock } from 'lucide-react';
import { MarketingRoute } from './Layout';

interface ServicesProps {
  onNavigate: (route: MarketingRoute) => void;
}

const services = [
  {
    icon: <Upload className="w-5 h-5 text-blue-600" />,
    title: 'Data Workspace setup',
    desc: 'Upload CSV/Excel and get queryable tables with schema previews.',
  },
  {
    icon: <GitBranch className="w-5 h-5 text-purple-600" />,
    title: 'Data Flows (ETL)',
    desc: 'Visualize, schedule, and monitor pipelines with alerts and retries.',
  },
  {
    icon: <Database className="w-5 h-5 text-green-600" />,
    title: 'Connections',
    desc: 'Secure connectors for databases, files, and APIs with credentials vault.',
  },
  {
    icon: <Shield className="w-5 h-5 text-emerald-600" />,
    title: 'Governance',
    desc: 'Role-based access, audit logs, isolated schemas per workspace.',
  },
  {
    icon: <BarChart3 className="w-5 h-5 text-orange-600" />,
    title: 'Insights',
    desc: 'Business-friendly views and summaries for non-SQL users.',
  },
  {
    icon: <Clock className="w-5 h-5 text-gray-600" />,
    title: 'Reliability',
    desc: 'Health dashboards, run history, and proactive quota warnings.',
  },
];

export function Services({ onNavigate }: ServicesProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
        <div className="space-y-2">
          <p className="text-blue-600 font-semibold">Services</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">Everything you need to ship data faster</h1>
          <p className="text-gray-600">Built for business users with enterprise-grade controls.</p>
        </div>
        <button onClick={() => onNavigate('pricing')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">See pricing</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <div key={service.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">{service.icon}<p className="text-gray-900 font-semibold">{service.title}</p></div>
            <p className="text-gray-600 text-sm leading-relaxed">{service.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
