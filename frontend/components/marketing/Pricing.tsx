import { Check } from 'lucide-react';
import { MarketingRoute } from './Layout';

interface PricingProps {
  onNavigate: (route: MarketingRoute) => void;
}

const plans = [
  {
    name: 'Starter',
    price: '$49/mo',
    desc: 'For small teams validating data workflows.',
    features: ['2 Data Workspaces', 'Up to 50GB storage', '3 Data Flows', 'Email support'],
  },
  {
    name: 'Growth',
    price: '$149/mo',
    desc: 'For teams shipping governed data experiences.',
    features: ['5 Data Workspaces', 'Up to 250GB storage', '10 Data Flows', 'Role-based access', 'Priority support'],
    highlighted: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    desc: 'For orgs needing SSO, audit, and isolation.',
    features: ['Unlimited Workspaces', 'Isolated schemas', 'SSO + SCIM', 'Audit logs', 'Dedicated success'],
  },
];

export function Pricing({ onNavigate }: PricingProps) {
  return (
    <div className="max-w-6xl mx-auto px-6 py-16">
      <div className="text-center mb-12 space-y-3">
        <p className="text-blue-600 font-semibold">Pricing</p>
        <h1 className="text-3xl font-semibold text-gray-900">Transparent plans for business users</h1>
        <p className="text-gray-600">Choose a plan that fits your Data Workspace needs. Upgrade anytime.</p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
            <button
              onClick={() => onNavigate('login')}
              className={`w-full py-3 rounded-lg font-medium transition-colors ${plan.highlighted ? 'bg-blue-600 text-white hover:bg-blue-700' : 'bg-gray-900 text-white hover:bg-gray-800'}`}
            >
              Get started
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
