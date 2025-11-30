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
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Settings</h1>
        <div className="grid grid-cols-1 gap-6">
          <DataAccessPanel />
        </div>
      </main>
    </>
  );
}
