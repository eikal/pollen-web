import React, { useEffect, useMemo, useState } from 'react';
import { getPreview } from '../lib/api/uploads';
import Card from './ui/Card';

interface Props {
  tableName?: string;
}

export default function TablePreview({ tableName }: Props) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancel = false;
    async function load() {
      if (!tableName) return;
      setLoading(true);
      setError(null);
      try {
        const data = await getPreview(tableName, 100);
        if (!cancel) setRows(data);
      } catch (err: any) {
        if (!cancel)
          setError(err.message || 'Unable to preview this table. The data may still be loading.');
      } finally {
        if (!cancel) setLoading(false);
      }
    }
    load();
    return () => {
      cancel = true;
    };
  }, [tableName]);

  const columns = useMemo(() => {
    if (rows.length === 0) return [] as string[];
    return Object.keys(rows[0]);
  }, [rows]);

  if (!tableName) {
    return (
      <Card title="Preview" subtitle="Select a table to preview its data." className="fade-in">
        <div />
      </Card>
    );
  }

  return (
    <Card
      title="Preview"
      subtitle={
        loading
          ? 'Loading…'
          : rows.length === 0
            ? `Table: ${tableName}`
            : `Table: ${tableName} • ${rows.length} rows`
      }
      className="overflow-auto fade-in"
    >
      {error && (
        <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
          {error}
        </div>
      )}
      {rows.length === 0 ? (
        <p className="text-xs text-gray-600">No data available.</p>
      ) : (
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              {columns.map((c) => (
                <th
                  key={c}
                  className="px-3 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider"
                >
                  {c}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {rows.map((row, idx) => (
              <tr key={idx} className="hover:bg-gray-50 transition-colors">
                {columns.map((c) => (
                  <td key={c} className="px-3 py-2 text-xs text-gray-900">
                    {formatCell(row[c])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </Card>
  );
}

function formatCell(value: any) {
  if (value === null || typeof value === 'undefined')
    return <span className="text-gray-400">—</span>;
  if (typeof value === 'object') return <code className="text-xs">{JSON.stringify(value)}</code>;
  return String(value);
}
