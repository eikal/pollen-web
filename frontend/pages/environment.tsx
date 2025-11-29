/**
 * Environment Inventory page - shows all data source connections with freshness indicators.
 */

import Link from 'next/link';

export default function EnvironmentPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-3">Environment Inventory</h1>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 mb-6">
        This feature is not part of the MVP. For now, focus on uploading files and previewing tables
        in My Data.
      </div>
      <Link
        href="/uploads"
        className="inline-block bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Go to My Data
      </Link>
    </div>
  );
}
