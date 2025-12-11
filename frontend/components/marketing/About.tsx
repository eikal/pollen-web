import { Users, ShieldCheck, Rocket } from 'lucide-react';
import { MarketingRoute } from './Layout';

interface AboutProps {
  onNavigate: (route: MarketingRoute) => void;
}

export function About({ onNavigate }: AboutProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
        <div className="space-y-4">
          <p className="text-blue-600 font-semibold">About</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">We make data work for business users</h1>
          <p className="text-gray-700 leading-relaxed">Our mission is to help teams launch governed Data Workspaces without heavy engineering lifts. Upload files, connect sources, and run ETL pipelines with business-friendly controls.</p>
          <p className="text-gray-700 leading-relaxed">We focus on transparency: clear quotas, predictable pricing, and safeguards before anything breaks.</p>
          <div className="flex flex-wrap gap-3 pt-2">
            <button onClick={() => onNavigate('services')} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Explore services</button>
            <button onClick={() => onNavigate('pricing')} className="px-4 py-2 bg-white text-gray-800 border border-gray-200 rounded-lg hover:border-blue-200 hover:text-blue-600 transition-colors">View pricing</button>
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <AboutCard icon={<Users className="w-5 h-5 text-blue-600" />} title="Business-first" desc="Terminology and flows built for analysts and operators." />
          <AboutCard icon={<ShieldCheck className="w-5 h-5 text-green-600" />} title="Governed" desc="Isolation per workspace, audit-ready logging, role-based access." />
          <AboutCard icon={<Rocket className="w-5 h-5 text-orange-600" />} title="Fast delivery" desc="CSV to queryable tables in minutes with visual Data Flows." />
        </div>
      </div>
    </div>
  );
}

function AboutCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">{icon}<p className="text-gray-900 font-semibold">{title}</p></div>
      <p className="text-gray-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}
