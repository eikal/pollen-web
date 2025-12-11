import { Layers, Table2, BarChart, ShieldCheck, Workflow, Sparkles } from 'lucide-react';
import { MarketingRoute } from './Layout';

interface ProductsProps {
  onNavigate: (route: MarketingRoute) => void;
}

const products = [
  {
    icon: <Layers className="w-5 h-5 text-blue-600" />,
    title: 'Data Hub',
    desc: 'Single place for all uploads, connections, and schema previews.',
  },
  {
    icon: <Table2 className="w-5 h-5 text-indigo-600" />,
    title: 'Tables & Governance',
    desc: 'Workspace isolation, row-level filters, and audit-ready controls.',
  },
  {
    icon: <Workflow className="w-5 h-5 text-green-600" />,
    title: 'Data Flows',
    desc: 'Schedule transformations with run history, alerts, and retries.',
  },
  {
    icon: <BarChart className="w-5 h-5 text-orange-600" />,
    title: 'Insights',
    desc: 'Business-friendly views for KPIs without writing SQL.',
  },
  {
    icon: <ShieldCheck className="w-5 h-5 text-emerald-600" />,
    title: 'Security',
    desc: 'SOC2-ready practices, encrypted credentials, and least-privilege roles.',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-purple-600" />,
    title: 'AI Assistant',
    desc: 'Guided prompts to describe your data and generate queries safely.',
  },
];

export function Products({ onNavigate }: ProductsProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
        <div className="space-y-2">
          <p className="text-blue-600 font-semibold">Products</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">Data Hub, Flows, and Insights</h1>
          <p className="text-gray-600">Modular capabilities that scale from a single team to the whole company.</p>
        </div>
        <button onClick={() => onNavigate('login')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Start free trial</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">{product.icon}<p className="text-gray-900 font-semibold">{product.title}</p></div>
            <p className="text-gray-600 text-sm leading-relaxed">{product.desc}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
