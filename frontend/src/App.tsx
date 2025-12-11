import { useState } from 'react';
import { Dashboard, DataAssets, ETLManagement, Login, Sidebar } from '../components/figma';
import { MarketingLayout, MarketingRoute } from '../components/marketing/Layout';
import { Home } from '../components/marketing/Home';
import { Pricing } from '../components/marketing/Pricing';
import { About } from '../components/marketing/About';
import { Services } from '../components/marketing/Services';
import { Products } from '../components/marketing/Products';

type View = 'dashboard' | 'assets' | 'etl';

interface User {
  email: string;
  name: string;
}

export default function App() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [user, setUser] = useState<User | null>(null);
  const [marketingRoute, setMarketingRoute] = useState<MarketingRoute>('home');

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return (
      <MarketingLayout current={marketingRoute} onNavigate={setMarketingRoute}>
        {marketingRoute === 'home' && <Home onNavigate={setMarketingRoute} />}
        {marketingRoute === 'pricing' && <Pricing onNavigate={setMarketingRoute} />}
        {marketingRoute === 'about' && <About onNavigate={setMarketingRoute} />}
        {marketingRoute === 'services' && <Services onNavigate={setMarketingRoute} />}
        {marketingRoute === 'products' && <Products onNavigate={setMarketingRoute} />}
        {marketingRoute === 'login' && (
          <div className="max-w-5xl mx-auto px-6 py-12">
            <Login onLogin={handleLogin} />
          </div>
        )}
      </MarketingLayout>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} user={user} onLogout={handleLogout} />
      <main className="flex-1 overflow-auto">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'assets' && <DataAssets />}
        {activeView === 'etl' && <ETLManagement />}
      </main>
    </div>
  );
}
