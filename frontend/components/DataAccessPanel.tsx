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
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-6 bg-gradient-to-r from-gray-200 to-gray-100 rounded-lg w-64"></div>
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i}>
                <div className="h-3 bg-gray-200 rounded w-20 mb-2"></div>
                <div className="h-11 bg-gray-100 rounded-lg"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const psql = `psql -h ${creds.host} -p ${creds.port} -U ${creds.username} -d ${creds.database}`;
  const sql = `SET search_path TO ${creds.schema};\nSELECT * FROM sales_data LIMIT 5;`;

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden">
      <div className="p-8 space-y-8">
        <div>
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Connection Details</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {([
              ['Host', creds.host, '🌐'],
              ['Port', String(creds.port), '🔌'],
              ['Database', creds.database, '💾'],
              ['Schema', creds.schema, '📁'],
              ['Username', creds.username, '👤'],
            ] as [string, string, string][]).map(([label, value, icon]) => (
              <div key={label} className="group bg-gray-50 rounded-lg p-4 border border-gray-200 hover:border-blue-400 hover:shadow-sm transition-all duration-200">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{icon}</span>
                    <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">{label}</span>
                  </div>
                  <button
                    className="text-xs px-3 py-1.5 bg-white border border-gray-300 rounded-md hover:bg-blue-50 hover:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 font-medium"
                    onClick={() => copy(label, value)}
                  >
                    {copied === label ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
                <div className="font-mono text-sm text-gray-900 break-all leading-relaxed">{value}</div>
              </div>
            ))}
            <div className="group bg-yellow-50 rounded-lg p-4 border border-yellow-200 hover:border-yellow-400 hover:shadow-sm transition-all duration-200">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-base">🔑</span>
                  <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">Password</span>
                </div>
                <button
                  className="text-xs px-3 py-1.5 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1 transition-all duration-150 font-semibold shadow-sm hover:shadow"
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
              <div className="font-mono text-sm text-gray-500 leading-relaxed">••••••••••••</div>
            </div>
          </div>
        </div>

        <div className="bg-gray-900 rounded-lg p-5 shadow-inner">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-gray-100 uppercase tracking-wide">Quick Connect with psql</h3>
            <button
              className="text-xs px-3 py-1.5 bg-gray-700 text-gray-100 rounded-md hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-150 font-medium"
              onClick={() => copy('Command', psql)}
            >
              {copied === 'Command' ? '✓ Copied' : 'Copy Command'}
            </button>
          </div>
          <pre className="text-sm text-green-400 overflow-auto leading-relaxed"><code>{psql}</code></pre>
          <div className="mt-3 text-xs text-gray-400 leading-relaxed">
            Then run: <code className="text-green-400 bg-gray-800 px-1.5 py-0.5 rounded">{sql}</code>
          </div>
        </div>

        <div className="bg-blue-50 border-l-4 border-blue-500 rounded-lg p-6">
          <h3 className="text-sm font-bold text-blue-900 uppercase tracking-wide mb-3">📘 Connect with DBeaver</h3>
          <ol className="text-sm text-blue-800 space-y-2 list-decimal list-inside">
            <li>Open DBeaver and create a new PostgreSQL connection</li>
            <li>Copy and paste the Host, Port, Database, Username values above</li>
            <li>Enter your Password (or use "Generate New" to create one)</li>
            <li>Click "Test Connection" to verify</li>
            <li>After connecting, run: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">SET search_path TO {creds.schema};</code></li>
            <li>Now you can query your tables: <code className="bg-blue-100 px-1.5 py-0.5 rounded font-mono text-xs">SELECT * FROM your_table_name LIMIT 10;</code></li>
          </ol>
        </div>

        <div className="bg-red-50 border-l-4 border-red-500 rounded-lg p-6">
          <div className="flex items-start gap-2">
            <span className="text-xl">🔒</span>
            <div className="flex-1">
              <h3 className="text-sm font-bold text-red-900 uppercase tracking-wide mb-2">Security Reminder</h3>
              <ul className="text-sm text-red-800 space-y-1.5 list-disc list-inside">
                <li><strong className="font-semibold">Do not share your credentials</strong> with anyone</li>
                <li>If credentials are compromised, use "Generate New Password" immediately</li>
                <li>You can only access tables in your schema (<code className="bg-red-100 px-1 py-0.5 rounded font-mono text-xs">{creds.schema}</code>)</li>
                <li>Changes made via SQL client are permanent - use caution with UPDATE and DELETE</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
      {oneTimePassword && (
        <div className="mx-8 mb-8 border-2 border-green-400 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <span className="text-3xl">🎉</span>
              <div>
                <div className="text-lg font-bold text-green-900">New Password Generated!</div>
                <div className="text-sm text-green-700">Your database password has been reset</div>
              </div>
            </div>
            <button
              className="text-sm px-4 py-2 border-2 border-green-600 rounded-lg bg-white hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 font-semibold"
              onClick={() => setOneTimePassword(null)}
            >
              ✓ Got it
            </button>
          </div>
          <div className="bg-white border-2 border-green-300 rounded-lg p-4 mb-3 shadow-sm">
            <div className="flex items-center gap-4">
              <code className="flex-1 font-mono text-lg text-gray-900 select-all font-semibold tracking-wide">
                {oneTimePassword}
              </code>
              <button
                className="px-5 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-all duration-150 font-semibold text-sm shadow-sm hover:shadow"
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
          <div className="flex items-start gap-2 text-xs leading-relaxed bg-yellow-50 border border-yellow-300 rounded-lg p-3">
            <span className="text-base">⚠️</span>
            <p className="text-yellow-800"><strong className="font-semibold">Important:</strong> Save this password now. For security, it won't be shown again. You'll need to generate a new one if lost.</p>
          </div>
        </div>
      )}
    </div>
  );
}
