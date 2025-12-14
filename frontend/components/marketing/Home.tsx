import { ArrowRight, ShieldCheck, Zap, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Home() {
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
            Upload CSV/Excel, automate refreshes, connect databases—all with business-friendly terms and transparent quotas.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/login"
              className="px-5 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center gap-2"
            >
              Start free trial <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/pricing"
              className="px-5 py-3 bg-white text-gray-800 rounded-lg border border-gray-200 hover:border-blue-200 hover:text-blue-600 transition-colors"
            >
              View pricing
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <FeatureStat icon={<ShieldCheck className="w-5 h-5 text-green-600" />} title="Governed" desc="SSO, RBAC, audit" />
            <FeatureStat icon={<Zap className="w-5 h-5 text-orange-600" />} title="Fast" desc="Live in minutes" />
            <FeatureStat icon={<BarChart3 className="w-5 h-5 text-blue-600" />} title="Smart" desc="Auto schemas" />
          </div>
        </div>
        <div className="bg-blue-50 rounded-2xl border border-blue-100 p-8">
          <p className="text-gray-900 font-semibold mb-4">Perfect for teams that need data without the engineering overhead</p>
          <ul className="space-y-3 text-gray-700 text-sm">
            <li className="flex items-start gap-3"><span className="text-blue-600 font-bold">✓</span> CSV/Excel to queryable tables in seconds</li>
            <li className="flex items-start gap-3"><span className="text-blue-600 font-bold">✓</span> Business-friendly interface, no SQL required</li>
            <li className="flex items-start gap-3"><span className="text-blue-600 font-bold">✓</span> Schedule refreshes and connect databases</li>
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
