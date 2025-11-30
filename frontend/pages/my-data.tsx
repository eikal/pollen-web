import React, { useEffect, useState } from 'react';
import Head from 'next/head';
import Nav from '../components/Nav';
import TableList from '../components/TableList';
import GuidancePanel from '../components/GuidancePanel';
import StorageQuotaBar from '../components/StorageQuotaBar';

interface QuotaData {
  totalTables: number;
  totalSizeMb: number;
  limitMb: number;
  availableMb: number;
  usagePercent: number;
  lastCalculatedAt: string;
}

export default function MyDataPage() {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchQuota();
  }, []);

  const fetchQuota = async () => {
    try {
      const token = localStorage.getItem('pollen_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:4000/api/quota', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch quota');
      }

      const data = await res.json();
      if (data.success) {
        setQuota(data.quota);
      }
    } catch (err) {
      console.error('Failed to fetch quota:', err);
    } finally {
      setLoading(false);
    }
  };

  const showPremiumCTA = quota && (quota.totalTables >= 18 || quota.usagePercent >= 90);

  return (
    <>
      <Head>
        <title>My Data</title>
      </Head>
      <Nav />
      <main className="container mx-auto px-4 py-6">
        {/* Page Header with Table Count */}
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Your Tables</h1>
          {!loading && quota && (
            <div className="text-sm text-gray-600">
              <span className="font-semibold text-gray-900">{quota.totalTables}</span> / 20 tables
            </div>
          )}
        </div>

        {/* Storage Quota Bar */}
        <div className="mb-6">
          <StorageQuotaBar showDetails />
        </div>

        {/* Premium CTA (shown when approaching limits) */}
        {showPremiumCTA && (
          <div className="mb-6 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg p-6 text-white">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2">Approaching Your Free Plan Limits</h3>
                <p className="text-blue-100 mb-4">
                  Upgrade to Premium for unlimited tables, 100GB storage, priority support, and advanced features.
                </p>
                <a
                  href="mailto:sales@pollendata.com?subject=Premium%20Plan%20Inquiry&body=Hi%2C%20I'm%20interested%20in%20upgrading%20to%20the%20Premium%20plan.%20Please%20send%20me%20more%20information."
                  className="inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-600 text-sm font-semibold rounded-lg hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 transition-colors"
                >
                  Contact Sales
                  <span aria-hidden="true">→</span>
                </a>
              </div>
              <button
                onClick={() => setQuota(prev => prev ? { ...prev, totalTables: 0 } : null)}
                className="text-blue-100 hover:text-white focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-blue-600 rounded p-2"
                aria-label="Dismiss premium offer"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                  <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableList />
          </div>
          <div>
            <GuidancePanel />
          </div>
        </div>
      </main>
    </>
  );
}
