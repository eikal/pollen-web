import { Layers, Table2, BarChart, ShieldCheck, Workflow, Sparkles } from 'lucide-react';

export function Products() {
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

const assetCards = [
  {
    title: 'Manual file upload',
    plan: 'Free',
    desc: 'Upload CSV/Excel once and preview instantly in your Data Workspace.',
  },
  {
    title: 'Scheduled file refresh',
    plan: 'Starter',
    desc: 'Keep spreadsheets current with recurring uploads and smart reminders.',
  },
  {
    title: 'Query materialization',
    plan: 'Starter',
    desc: 'Snapshot your SQL queries on a schedule for dashboard speed.',
  },
  {
    title: 'Cloud storage import',
    plan: 'Starter+',
    desc: 'Sync Google Sheets/Drive CSV now; add Dropbox/S3 as you scale.',
  },
  {
    title: 'External databases',
    plan: 'Professional',
    desc: 'Connect Postgres/MySQL/SQL Server with governed credentials.',
  },
  {
    title: 'API & webhook sources',
    plan: 'Enterprise',
    desc: 'Bring Shopify/Stripe/HubSpot-style APIs with SLAs and isolation.',
  },
];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
        <div className="space-y-2">
          <p className="text-blue-600 font-semibold">Products</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">Data Hub, Flows, and Insights</h1>
          <p className="text-gray-600">Modular capabilities that scale from a single team to the whole company.</p>
        </div>
        <a href="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Start free trial</a>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <div key={product.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">{product.icon}<p className="text-gray-900 font-semibold">{product.title}</p></div>
            <p className="text-gray-600 text-sm leading-relaxed">{product.desc}</p>
          </div>
        ))}
      </div>

      <div className="mt-14">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
          <div className="space-y-2">
            <p className="text-blue-600 font-semibold">Data Assets</p>
            <h2 className="text-2xl font-semibold text-gray-900 leading-tight">Add the right sources for each plan</h2>
            <p className="text-gray-600">Business-friendly language, clear plan fit, upgrade only when you need automation.</p>
          </div>
          <a href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Compare plans</a>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {assetCards.map((asset) => (
            <div key={asset.title} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-2">
                <p className="text-gray-900 font-semibold">{asset.title}</p>
                <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-medium">{asset.plan}</span>
              </div>
              <p className="text-gray-600 text-sm leading-relaxed">{asset.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
