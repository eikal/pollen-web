import { Check } from 'lucide-react';
import { Link } from 'react-router-dom';

type PlanName = 'Free' | 'Starter' | 'Professional' | 'Enterprise';

const plans: Array<{ name: PlanName; price: string; desc: string; features: string[]; highlighted?: boolean }> = [
  {
    name: 'Free',
    price: '$0',
    desc: 'Upload a few files and explore your Data Workspace.',
    features: ['1 Data Workspace', '1GB data volume', 'Manual CSV/Excel uploads', 'Table preview (100 rows)'],
  },
  {
    name: 'Starter',
    price: '$49/mo',
    desc: 'Automate refreshes and share clean tables.',
    features: ['2 Data Workspaces', '50GB data volume', 'Scheduled file refresh (1)', 'Query materialization (daily)', 'Email support'],
    highlighted: true,
  },
  {
    name: 'Professional',
    price: '$199/mo',
    desc: 'Ship governed data flows with database connectors.',
    features: ['5 Data Workspaces', '250GB data volume', 'Cloud storage imports', 'Database connectors', 'Role-based access', 'Priority support'],
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For orgs needing SSO, audit, and private deployments.',
    features: ['Unlimited Workspaces', 'Private cloud/SOC2 options', 'API & webhook sources', 'SSO + SCIM', 'Audit logs', 'Dedicated success'],
  },
];

export function Pricing() {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12 space-y-3">
        <p className="text-blue-600 font-semibold">Pricing</p>
        <h1 className="text-3xl font-semibold text-gray-900">Transparent plans for business users</h1>
        <p className="text-gray-600">Choose a plan that fits your Data Workspace needs. Upgrade anytime.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white rounded-2xl border p-6 ${plan.highlighted ? 'border-blue-200 shadow-md bg-blue-50' : 'border-gray-200 shadow-sm'}`}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="space-y-1">
                <p className="text-gray-900 font-semibold">{plan.name}</p>
                <p className="text-gray-600 text-sm leading-relaxed">{plan.desc}</p>
              </div>
              {plan.highlighted && <span className="text-xs text-blue-700 bg-white px-2 py-1 rounded border border-blue-200">Popular</span>}
            </div>
            <p className="text-3xl font-semibold text-gray-900 mb-4">{plan.price}</p>
            <ul className="space-y-2 text-sm text-gray-700 mb-6">
              {plan.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2">
                  <Check className="w-4 h-4 text-blue-600 mt-0.5" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>
            <Link
              to="/login"
              className={`w-full py-3 rounded-lg font-medium transition-colors text-center block ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
              Get started
            </Link>
          </div>
        ))}
      </div>

      <div className="mt-12 bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-4">
          <div>
            <p className="text-blue-600 font-semibold">Data asset coverage</p>
            <h2 className="text-xl font-semibold text-gray-900">Pick the plan that matches your sources</h2>
            <p className="text-gray-600 text-sm">Business language, clear limits. Upgrade only when you need automation.</p>
          </div>
          <Link to="/login" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">Start free</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm text-gray-800">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 pr-4">Asset type</th>
                {plans.map((p) => (
                  <th key={p.name} className="text-left py-3 px-3">{p.name}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y">
              {assetRows.map((row) => (
                <tr key={row.label}>
                  <td className="py-3 pr-4 font-medium text-gray-900">{row.label}</td>
                  {plans.map((plan) => (
                    <td key={plan.name} className="py-3 px-3 text-gray-700">
                      {row.availability[plan.name] || <span className="text-gray-400">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

const assetRows: Array<{ label: string; availability: Record<PlanName, string> }> = [
  {
    label: 'Manual file upload',
    availability: {
      Free: 'Included',
      Starter: 'Included',
      Professional: 'Included',
      Enterprise: 'Included',
    },
  },
  {
    label: 'Scheduled file refresh',
    availability: {
      Free: '—',
      Starter: '1 schedule',
      Professional: 'Multiple schedules',
      Enterprise: 'Unlimited + SLAs',
    },
  },
  {
    label: 'Query materialization',
    availability: {
      Free: '—',
      Starter: 'Daily snapshots',
      Professional: 'Hourly or daily',
      Enterprise: 'Custom cadence',
    },
  },
  {
    label: 'Cloud storage import',
    availability: {
      Free: '—',
      Starter: 'Google Sheets/Drive CSV',
      Professional: 'Drive/Dropbox/S3',
      Enterprise: 'All + private buckets',
    },
  },
  {
    label: 'External databases',
    availability: {
      Free: '—',
      Starter: '—',
      Professional: 'Postgres/MySQL/SQL Server',
      Enterprise: 'Private connectors + VPC',
    },
  },
  {
    label: 'API & webhook sources',
    availability: {
      Free: '—',
      Starter: '—',
      Professional: '—',
      Enterprise: 'Shopify/Stripe/HubSpot and custom',
    },
  },
];
