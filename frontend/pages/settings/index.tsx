import React from 'react';
import Head from 'next/head';
import Nav from '../../components/Nav';
import DataAccessPanel from '../../components/DataAccessPanel';

export default function SettingsPage() {
  return (
    <>
      <Head>
        <title>Settings</title>
      </Head>
      <Nav />
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
