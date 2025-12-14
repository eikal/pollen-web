import { Database, Upload, Clock, Cloud, ExternalLink, Sparkles } from 'lucide-react';

export function Services() {
  const services = [
  {
    icon: <Upload className="w-5 h-5 text-blue-600" />,
    title: 'Manual uploads (Free)',
    desc: 'We guide you through CSV/Excel setup, table previews, and safe deletes.',
  },
  {
    icon: <Clock className="w-5 h-5 text-indigo-600" />,
    title: 'Scheduled refresh (Starter)',
    desc: 'Set recurring uploads with reminders so your records stay fresh.',
  },
  {
    icon: <Sparkles className="w-5 h-5 text-purple-600" />,
    title: 'Query materialization (Starter)',
    desc: 'We help you schedule SQL snapshots for faster dashboards.',
  },
  {
    icon: <Cloud className="w-5 h-5 text-cyan-600" />,
    title: 'Cloud imports (Starter+)',
    desc: 'Guided setup for Google Sheets/Drive CSV; expand to Dropbox/S3 as you grow.',
  },
  {
    icon: <Database className="w-5 h-5 text-green-600" />,
    title: 'Database connectors (Professional)',
    desc: 'We configure Postgres/MySQL/SQL Server with governed credentials and previews.',
  },
  {
    icon: <ExternalLink className="w-5 h-5 text-amber-600" />,
    title: 'APIs & webhooks (Enterprise)',
    desc: 'Managed onboarding for Shopify/Stripe/HubSpot-style APIs with SLAs and isolation.',
  },
];

  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-10">
        <div className="space-y-2">
          <p className="text-blue-600 font-semibold">Services</p>
          <h1 className="text-3xl font-semibold text-gray-900 leading-tight">Everything you need to ship data faster</h1>
          <p className="text-gray-600">Built for business users with enterprise-grade controls.</p>
        </div>
        <a href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">See pricing</a>
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
