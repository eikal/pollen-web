import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Dashboard, DataAssets, DataAssetCreatePage, ETLManagement, Login, Sidebar } from '../components/figma';
import { MarketingLayout } from '../components/marketing/Layout';
import { Home } from '../components/marketing/Home';
import { Pricing } from '../components/marketing/Pricing';
import { About } from '../components/marketing/About';
import { Services } from '../components/marketing/Services';
import { Products } from '../components/marketing/Products';

interface User {
  email: string;
  name: string;
}

export default function App() {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('pollen_user');
      return stored ? (JSON.parse(stored) as User) : null;
    } catch {
      return null;
    }
  });

  // Initialize user from localStorage on first load/refresh
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('pollen_user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser) as User;
        setUser(parsed);
      }
    } catch {
      // ignore parse errors
    }
  }, []);

  const handleLogin = (userData: User) => {
    setUser(userData);
    try {
      localStorage.setItem('pollen_user', JSON.stringify(userData));
      // Optional: set demo token to keep consistent with other components
      if (!localStorage.getItem('pollen_token')) {
        localStorage.setItem('pollen_token', 'demo-token');
      }
    } catch {
      // storage may be unavailable; ignore
    }
  };

  const handleLogout = () => {
    setUser(null);
    try {
      localStorage.removeItem('pollen_user');
      localStorage.removeItem('pollen_token');
    } catch {
      // ignore
    }
  };

  return (
    <BrowserRouter>
      {user ? (
        <div className="flex h-screen bg-gray-50">
          <Sidebar user={user} onLogout={handleLogout} />
          <main className="flex-1 overflow-auto">
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/assets" element={<DataAssets />} />
              <Route path="/assets/new" element={<DataAssetCreatePage />} />
              <Route path="/etl" element={<ETLManagement />} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </main>
        </div>
      ) : (
        <MarketingLayout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/pricing" element={<Pricing />} />
            <Route path="/about" element={<About />} />
            <Route path="/services" element={<Services />} />
            <Route path="/products" element={<Products />} />
            <Route
              path="/login"
              element={
                <div className="max-w-5xl mx-auto px-6 py-12">
                  <Login onLogin={handleLogin} />
                </div>
              }
            />
            {/* Do not force redirect on unknown paths to avoid URL resets during initial load */}
            <Route path="*" element={<Home />} />
          </Routes>
        </MarketingLayout>
      )}
    </BrowserRouter>
  );
}
