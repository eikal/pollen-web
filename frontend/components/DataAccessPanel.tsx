import React, { useEffect, useState } from 'react';

type Creds = {
  host: string;
  port: number;
  database: string;
  schema: string;
  username: string;
  passwordMasked: boolean;
};

export default function DataAccessPanel() {
  const [creds, setCreds] = useState<Creds | null>(null);
  const [copied, setCopied] = useState<string>('');
  const [oneTimePassword, setOneTimePassword] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/settings/data-access')
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then(setCreds)
      .catch(() => setCreds(null));
  }, []);

  const copy = async (label: string, value: string) => {
    await navigator.clipboard.writeText(value);
    setCopied(label);
    setTimeout(() => setCopied(''), 1500);
  };

  if (!creds) {
    return <div className="text-sm text-gray-600">Loading data access…</div>;
  }

  const psql = `psql -h ${creds.host} -p ${creds.port} -U ${creds.username} -d ${creds.database}`;
  const sql = `SET search_path TO ${creds.schema};\nSELECT * FROM sales_data LIMIT 5;`;

  return (
    <div className="border rounded p-4 space-y-3">
      <h2 className="text-lg font-medium">Data Access</h2>
      <p className="text-sm text-gray-600">Use these credentials in DBeaver or psql. Your data lives in your personal schema.</p>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {([
          ['Host', creds.host],
          ['Port', String(creds.port)],
          ['Database', creds.database],
          ['Schema', creds.schema],
          ['Username', creds.username],
        ] as [string, string][]).map(([label, value]) => (
          <div key={label} className="flex items-center justify-between border rounded px-3 py-2">
            <div>
              <div className="text-xs text-gray-500">{label}</div>
              <div className="font-mono text-sm">{value}</div>
            </div>
            <button
              className="text-xs px-2 py-1 border rounded"
              onClick={() => copy(label, value)}
            >{copied === label ? 'Copied' : 'Copy'}</button>
          </div>
        ))}
        <div className="flex items-center justify-between border rounded px-3 py-2">
          <div>
            <div className="text-xs text-gray-500">Password</div>
            <div className="font-mono text-sm">{creds.passwordMasked ? '••••••••' : '(hidden)'}</div>
          </div>
          <button
            className="text-xs px-2 py-1 border rounded"
            onClick={async () => {
              const token = localStorage.getItem('pollen_token');
              if (!token) return;
              const res = await fetch('/api/settings/data-access/reset-password', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
              });
              if (res.ok) {
                const data = await res.json();
                if (data.credentials && data.credentials.password) {
                  setOneTimePassword(data.credentials.password);
                }
              }
            }}
          >
            Reset Password
          </button>
        </div>
      </div>
      <div className="text-xs bg-gray-50 rounded p-3">
        <div className="font-semibold mb-1">Examples</div>
        <pre className="overflow-auto"><code>{psql}\n{sql}</code></pre>
      </div>
      {oneTimePassword && (
        <div className="border-2 border-yellow-400 bg-yellow-50 rounded p-4 space-y-2">
          <div className="flex items-center justify-between">
            <div className="text-sm font-semibold text-yellow-900">⚠️ New Password Generated</div>
            <button
              className="text-xs px-2 py-1 border border-yellow-600 rounded bg-white"
              onClick={() => setOneTimePassword(null)}
            >
              Dismiss
            </button>
          </div>
          <p className="text-xs text-yellow-800">Copy this password now. It won't be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-white border border-yellow-300 rounded px-2 py-1 font-mono text-sm">
              {oneTimePassword}
            </code>
            <button
              className="text-xs px-2 py-1 border rounded"
              onClick={() => {
                navigator.clipboard.writeText(oneTimePassword);
                setCopied('OneTimePassword');
                setTimeout(() => setCopied(''), 1500);
              }}
            >
              {copied === 'OneTimePassword' ? 'Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
