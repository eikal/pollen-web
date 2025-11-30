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
    const token = localStorage.getItem('pollen_token');
    if (!token) {
      setCreds(null);
      return;
    }
    fetch('http://localhost:4000/api/settings/data-access', {
      headers: { Authorization: `Bearer ${token}` },
    })
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
    return (
      <div className="bg-white rounded-lg shadow-sm border p-6 text-center">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mx-auto"></div>
        </div>
      </div>
    );
  }

  const psql = `psql -h ${creds.host} -p ${creds.port} -U ${creds.username} -d ${creds.database}`;
  const sql = `SET search_path TO ${creds.schema};\nSELECT * FROM sales_data LIMIT 5;`;

  return (
    <div className="bg-white rounded-lg shadow-sm border">
      <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Database Access</h2>
        <p className="text-sm text-gray-600">Connect to your data using any PostgreSQL client like DBeaver, pgAdmin, or psql</p>
      </div>

      <div className="p-6 space-y-6">
        <div>
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3">Connection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {([
              ['Host', creds.host, '🌐'],
              ['Port', String(creds.port), '🔌'],
              ['Database', creds.database, '💾'],
              ['Schema', creds.schema, '📁'],
              ['Username', creds.username, '👤'],
            ] as [string, string, string][]).map(([label, value, icon]) => (
              <div key={label} className="bg-gray-50 rounded-lg p-3 border border-gray-200 hover:border-blue-300 transition-colors">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm">{icon}</span>
                    <span className="text-xs font-medium text-gray-500">{label}</span>
                  </div>
                  <button
                    className="text-xs px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 transition-colors"
                    onClick={() => copy(label, value)}
                  >
                    {copied === label ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900 break-all">{value}</div>
              </div>
            ))}
            <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm">🔑</span>
                  <span className="text-xs font-medium text-gray-500">Password</span>
                </div>
                <button
                  className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors font-medium"
                  onClick={async () => {
                    const token = localStorage.getItem('pollen_token');
                    if (!token) return;
                    const res = await fetch('http://localhost:4000/api/settings/data-access/reset-password', {
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
                  Generate New
                </button>
              </div>
              <div className="font-mono text-sm text-gray-500">••••••••••••</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-100">Quick Connect</h3>
            <button
              className="text-xs px-2 py-1 bg-gray-700 text-gray-100 rounded hover:bg-gray-600 transition-colors"
              onClick={() => copy('Command', psql)}
            >
              {copied === 'Command' ? '✓ Copied' : 'Copy Command'}
            </button>
          </div>
          <pre className="text-xs text-green-400 overflow-auto"><code>{psql}</code></pre>
          <div className="mt-2 text-xs text-gray-400">
            Then run: <code className="text-green-400">{sql}</code>
          </div>
        </div>
      </div>
      {oneTimePassword && (
        <div className="mx-6 mb-6 border-2 border-green-400 bg-green-50 rounded-lg p-4 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎉</span>
              <div>
                <div className="text-base font-bold text-green-900">New Password Generated!</div>
                <div className="text-xs text-green-700">Your database password has been reset</div>
              </div>
            </div>
            <button
              className="text-xs px-3 py-1.5 border-2 border-green-600 rounded-lg bg-white hover:bg-green-50 transition-colors font-medium"
              onClick={() => setOneTimePassword(null)}
            >
              ✓ Got it
            </button>
          </div>
          <div className="bg-white border-2 border-green-200 rounded-lg p-3 mb-2">
            <div className="flex items-center gap-3">
              <code className="flex-1 font-mono text-base text-gray-900 select-all">
                {oneTimePassword}
              </code>
              <button
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium text-sm"
                onClick={() => {
                  navigator.clipboard.writeText(oneTimePassword);
                  setCopied('OneTimePassword');
                  setTimeout(() => setCopied(''), 1500);
                }}
              >
                {copied === 'OneTimePassword' ? '✓ Copied!' : '📋 Copy'}
              </button>
            </div>
          </div>
          <div className="flex items-start gap-2 text-xs text-green-800">
            <span className="text-base">⚠️</span>
            <p><strong>Important:</strong> Save this password now. For security, it won't be shown again. You'll need to generate a new one if lost.</p>
          </div>
        </div>
      )}
    </div>
  );
}
