import Link from 'next/link';

export default function ETLPlaceholder() {
  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-3xl font-bold mb-3">ETL Pipelines</h1>
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded text-yellow-900 mb-6">
        This feature is not part of the MVP. Please use My Data to upload CSV/Excel files and
        preview your tables.
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
