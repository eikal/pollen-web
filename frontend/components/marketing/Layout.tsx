import { ReactNode } from 'react';

interface MarketingLayoutProps {
  current: MarketingRoute;
  onNavigate: (route: MarketingRoute) => void;
  children: ReactNode;
}

export type MarketingRoute = 'home' | 'pricing' | 'about' | 'services' | 'products' | 'login';

const navItems: Array<{ id: MarketingRoute; label: string }> = [
  { id: 'home', label: 'Home' },
  { id: 'pricing', label: 'Pricing' },
  { id: 'services', label: 'Services' },
  { id: 'products', label: 'Products' },
  { id: 'about', label: 'About' },
];

export function MarketingLayout({ current, onNavigate, children }: MarketingLayoutProps) {
  return (
    <div className="min-h-screen bg-white text-gray-900">
      <header className="border-b border-gray-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white text-lg font-semibold">
              DH
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Data Engineering Hub</p>
              <p className="text-gray-600 text-sm">Governed workspaces, ETL pipelines, and insights</p>
            </div>
          </div>
          <nav className="flex items-center gap-4">
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
                  current === item.id ? 'bg-blue-50 text-blue-600' : 'text-gray-700 hover:text-blue-600 hover:bg-gray-50'
                }`}
              >
                {item.label}
              </button>
            ))}
            <button
              onClick={() => onNavigate('login')}
              className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Sign in
            </button>
          </nav>
        </div>
      </header>
      <main>{children}</main>
      <footer className="border-t border-gray-200 mt-12">
        <div className="max-w-6xl mx-auto px-6 py-6 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white">
            <p className="text-sm text-blue-600 font-medium mb-2">Data Engineering Hub</p>
            <p className="text-gray-600 text-sm leading-relaxed">Secure, business-friendly data workspace with ETL pipelines and instant insights.</p>
          </div>
          <div className="bg-white">
            <p className="text-gray-900 font-semibold mb-2">Product</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><button onClick={() => onNavigate('products')} className="hover:text-blue-600">Data Hub</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-blue-600">ETL Pipelines</button></li>
              <li><button onClick={() => onNavigate('pricing')} className="hover:text-blue-600">Pricing</button></li>
            </ul>
          </div>
          <div className="bg-white">
            <p className="text-gray-900 font-semibold mb-2">Company</p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li><button onClick={() => onNavigate('about')} className="hover:text-blue-600">About</button></li>
              <li><button onClick={() => onNavigate('services')} className="hover:text-blue-600">Services</button></li>
              <li><button onClick={() => onNavigate('home')} className="hover:text-blue-600">Home</button></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
