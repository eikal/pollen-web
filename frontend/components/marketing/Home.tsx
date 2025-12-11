import { ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { MarketingRoute } from './Layout';

interface HomeProps {
  onNavigate: (route: MarketingRoute) => void;
}

export function Home({ onNavigate }: HomeProps) {
  return (
    <div className="bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="max-w-6xl mx-auto px-6 py-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-6">
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium">
            Data Engineering Hub
          </span>
          <h1 className="text-4xl font-semibold text-gray-900 leading-tight">
            Launch governed Data Workspaces without engineering tickets
          </h1>
          <p className="text-gray-700 text-lg leading-relaxed">
            Onboard CSV/Excel, automate ETL pipelines, and explore insights in minutes with clear quotas, alerts, and guardrails.
          </p>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => onNavigate('login')}
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => onNavigate('pricing')}
              className="px-5 py-3 bg-white text-gray-800 rounded-lg border border-gray-200 hover:border-blue-200 hover:text-blue-600 transition-colors"
            >
              View pricing
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureStat icon={<ShieldCheck className="w-5 h-5 text-green-600" />} title="Governed" desc="Role-based access + audit" />
            <FeatureStat icon={<Zap className="w-5 h-5 text-orange-600" />} title="Fast" desc="Pipelines live in minutes" />
            <FeatureStat icon={<BarChart3 className="w-5 h-5 text-blue-600" />} title="Insights" desc="Auto schema + previews" />
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-gray-200 shadow-xl p-6 space-y-4">
          <p className="text-gray-900 font-semibold">What you get</p>
          <ul className="space-y-3 text-gray-700 text-sm leading-relaxed">
            <li className="flex items-start gap-3"><span className="text-blue-600 mt-1">•</span> Upload CSV/Excel and get queryable tables instantly.</li>
            <li className="flex items-start gap-3"><span className="text-blue-600 mt-1">•</span> Visualize pipelines, monitor runs, and spot failures fast.</li>
            <li className="flex items-start gap-3"><span className="text-blue-600 mt-1">•</span> Business-friendly terms: Data Workspace, Data Flows, Insights.</li>
            <li className="flex items-start gap-3"><span className="text-blue-600 mt-1">•</span> Transparent quotas: storage and run limits shown upfront.</li>
            <li className="flex items-start gap-3"><span className="text-blue-600 mt-1">•</span> Enterprise controls: SSO, audit logs, per-workspace isolation.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}

function FeatureStat({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-gray-900 font-semibold">{title}</p></div>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
