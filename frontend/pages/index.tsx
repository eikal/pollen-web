import { useState } from 'react';
import Head from 'next/head';
import { Dashboard, DataAssets, ETLManagement, Login, Sidebar } from '../components/figma';

type View = 'dashboard' | 'assets' | 'etl';

interface User {
  email: string;
  name: string;
}

export default function Home() {
  const [activeView, setActiveView] = useState<View>('dashboard');
  const [user, setUser] = useState<User | null>(null);

  const handleLogin = (userData: User) => {
    setUser(userData);
  };

  const handleLogout = () => {
    setUser(null);
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <>
      <Head>
        <title>Pollen Data Workspace</title>
      </Head>
      <div className="flex min-h-screen bg-gray-50">
        <Sidebar activeView={activeView} onViewChange={setActiveView} user={user} onLogout={handleLogout} />
        <main className="flex-1 overflow-auto">
          {activeView === 'dashboard' && <Dashboard />}
          {activeView === 'assets' && <DataAssets />}
          {activeView === 'etl' && <ETLManagement />}
        </main>
      </div>
    </>
  );
}
