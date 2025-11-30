import React from 'react';
import Link from 'next/link';

export default function GuidancePanel() {
  return (
    <aside className="border rounded p-4 space-y-2">
      <h3 className="text-base font-medium">Connect to your Database</h3>
      <p className="text-sm text-gray-600">Use a SQL client like DBeaver or psql to access your tables. Find your credentials in Settings.</p>
      <Link href="/settings">
        <span className="inline-block text-xs px-2 py-1 border rounded">Go to Settings → Data Access</span>
      </Link>
    </aside>
  );
}
