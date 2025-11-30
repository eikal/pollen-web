import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import DataAccessPanel from '../../components/DataAccessPanel';

export default function SettingsPage() {
  const router = useRouter();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('pollen_token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    setIsChecking(false);
  }, [router]);

  if (isChecking) {
    return (
      <>
        <Head>
          <title>Settings</title>
        </Head>
        <main className="min-h-screen bg-gray-50">
          <div className="container mx-auto px-4 py-8 max-w-5xl">
            <div className="animate-pulse space-y-6">
              <div className="h-8 bg-gray-200 rounded w-48"></div>
              <div className="h-64 bg-gray-100 rounded-xl"></div>
            </div>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Settings</title>
      </Head>
      <main className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8 max-w-5xl">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Settings</h1>
            <p className="text-gray-600 mt-1">Manage your database access and account preferences</p>
          </div>
          <DataAccessPanel />
        </div>
      </main>
    </>
  );
}
