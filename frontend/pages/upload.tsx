import React from 'react';
import Head from 'next/head';
import Nav from '../components/Nav';
import UploadWizard from '../components/UploadWizard';

export default function UploadPage() {
  return (
    <>
      <Head>
        <title>Upload Data</title>
      </Head>
      <Nav />
      <main className="container mx-auto px-4 py-6">
        <h1 className="text-2xl font-semibold mb-4">Upload Data</h1>
        <p className="text-sm text-gray-600 mb-4">Import CSV or Excel files. Excel supports selecting a specific sheet during preview.</p>
        <UploadWizard />
      </main>
    </>
  );
}
