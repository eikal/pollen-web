import Link from 'next/link';

export default function Home() {
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      <h1 style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
        Pollen Data Hub — Upload CSV/Excel to Tables
      </h1>
      <p style={{ fontSize: '1.1rem', color: '#6b7280', marginBottom: '2rem' }}>
        Start with the essentials: upload a file, we infer the schema, and you can preview your
        table.
      </p>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '1.5rem',
          marginBottom: '2rem',
        }}
      >
        <h3 style={{ fontSize: '1.25rem', fontWeight: '600', marginBottom: '0.75rem' }}>
          � My Data
        </h3>
        <p style={{ color: '#6b7280', marginBottom: '1rem' }}>
          Upload a CSV or Excel file. We turn it into a table in your Data Workspace.
        </p>
        <Link
          href="/uploads"
          style={{ color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}
        >
          Go to My Data →
        </Link>
      </div>

      <div
        style={{
          background: '#f9fafb',
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '2rem',
        }}
      >
        <h2 style={{ fontSize: '1.5rem', fontWeight: '600', marginBottom: '1rem' }}>MVP Flow</h2>
        <ol style={{ paddingLeft: '1.5rem', color: '#374151', lineHeight: '1.75' }}>
          <li>
            <strong>Sign up</strong> and log in
          </li>
          <li>
            <strong>Upload</strong> a CSV/Excel file
          </li>
          <li>
            <strong>We infer</strong> types and create the table
          </li>
          <li>
            <strong>Preview</strong> your table in the browser
          </li>
        </ol>
      </div>
    </div>
  );
}
