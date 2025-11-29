import Link from 'next/link';

export default function Pricing() {
  return (
    <div style={{ maxWidth: '600px', margin: '4rem auto', padding: '2rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>Pricing</h1>

      <div
        style={{
          border: '1px solid #e5e7eb',
          borderRadius: '8px',
          padding: '2rem',
          background: 'white',
          marginBottom: '2rem',
        }}
      >
        <h3
          style={{
            fontSize: '1.5rem',
            fontWeight: '600',
            marginBottom: '0.5rem',
            color: '#059669',
          }}
        >
          Free Plan (MVP)
        </h3>
        <div style={{ fontSize: '2.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>$0</div>
        <p style={{ color: '#6b7280', marginBottom: '1.5rem' }}>
          Get started with your Data Workspace
        </p>

        <ul style={{ listStyle: 'none', padding: 0, marginBottom: '2rem', textAlign: 'left' }}>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
            Up to 20 tables
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
            1 GB total storage
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
            CSV/Excel file uploads (up to 50MB)
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #f3f4f6' }}>
            Table preview in browser
          </li>
          <li style={{ padding: '0.5rem 0' }}>Basic ETL operations (insert, upsert, delete)</li>
        </ul>

        <Link
          href="/uploads"
          style={{
            display: 'inline-block',
            padding: '0.75rem 2rem',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '600',
          }}
        >
          Get Started
        </Link>
      </div>

      <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>
        Paid plans coming soon with more storage, scheduled refreshes, and API access.
      </p>
    </div>
  );
}
