import React from 'react';
import Link from 'next/link';

export default function GuidancePanel() {
  return (
    <aside className="bg-blue-50 border-l-4 border-blue-500 rounded-r-lg p-6 space-y-4">
      <div className="flex items-start gap-3">
        <span className="text-2xl" role="img" aria-label="Database">🗄️</span>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Connect to Your Database</h3>
          <p className="text-sm text-gray-700 mb-4">
            Use SQL clients like DBeaver or psql to query your tables directly. Your database credentials are available in Settings.
          </p>
          <Link href="/settings">
            <a className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors">
              View DB Credentials
              <span aria-hidden="true">→</span>
            </a>
          </Link>
        </div>
      </div>
    </aside>
  );
}
