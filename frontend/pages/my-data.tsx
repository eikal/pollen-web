import React from 'react';
import Head from 'next/head';
import Nav from '../components/Nav';
import TableList from '../components/TableList';
import GuidancePanel from '../components/GuidancePanel';

export default function MyDataPage() {
  return (
    <>
      <Head>
        <title>My Data</title>
      </Head>
      <Nav />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Your Tables</h1>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TableList />
          </div>
          <GuidancePanel />
        </div>
      </main>
    </>
  );
}
