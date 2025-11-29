import Link from 'next/link';

export default function About() {
  return (
    <div style={{ maxWidth: '700px', margin: '2rem auto', padding: '1rem' }}>
      <h1 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1rem' }}>About Pollen</h1>
      <p
        style={{
          fontSize: '1.125rem',
          color: '#374151',
          lineHeight: '1.75',
          marginBottom: '1.5rem',
        }}
      >
        Pollen is a self-service data platform that lets you upload CSV/Excel files and turn them
        into queryable tables - no SQL knowledge required.
      </p>

      <h2
        style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}
      >
        Our Mission
      </h2>
      <p style={{ color: '#4b5563', lineHeight: '1.75', marginBottom: '1.5rem' }}>
        We believe every business user should be able to work with their data without needing a data
        engineering team. Pollen makes it simple: upload a spreadsheet, and we handle the rest.
      </p>

      <h2
        style={{ fontSize: '1.5rem', fontWeight: '600', marginTop: '2rem', marginBottom: '1rem' }}
      >
        What You Can Do
      </h2>
      <ul
        style={{
          color: '#4b5563',
          lineHeight: '1.75',
          paddingLeft: '1.5rem',
          marginBottom: '1.5rem',
        }}
      >
        <li>
          <strong>Upload Files:</strong> CSV and Excel files up to 50MB
        </li>
        <li>
          <strong>Auto Schema:</strong> We infer column types automatically
        </li>
        <li>
          <strong>Preview Data:</strong> See your tables directly in the browser
        </li>
        <li>
          <strong>Update Data:</strong> Upsert rows by key column, delete by ID
        </li>
        <li>
          <strong>Manage Tables:</strong> Drop or truncate tables when needed
        </li>
        <li>
          <strong>Track Storage:</strong> Monitor your usage (1GB free plan)
        </li>
      </ul>

      <div style={{ marginTop: '2rem' }}>
        <Link
          href="/uploads"
          style={{
            display: 'inline-block',
            padding: '0.75rem 1.5rem',
            background: '#3b82f6',
            color: 'white',
            borderRadius: '6px',
            textDecoration: 'none',
            fontWeight: '500',
          }}
        >
          Go to My Data
        </Link>
      </div>
    </div>
  );
}
