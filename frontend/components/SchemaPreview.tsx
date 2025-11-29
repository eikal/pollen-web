/**
 * SchemaPreview component - displays inferred schema fields with types.
 */

import type { SchemaPreview as SchemaPreviewType } from '../lib/api/types';
import Card from './ui/Card';

interface SchemaPreviewProps {
  schema: SchemaPreviewType | null;
  loading?: boolean;
}

export default function SchemaPreview({ schema, loading }: SchemaPreviewProps) {
  if (loading) {
    return (
      <Card title="Schema Preview" subtitle="Loading inferred fields…" className="animate-pulse">
        <div className="space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-4 bg-gray-200 rounded" />
          ))}
        </div>
      </Card>
    );
  }

  if (!schema) {
    return (
      <Card
        title="Schema Preview"
        subtitle="Select a connection to preview its schema"
        className="text-center"
      >
        <div className="text-xs text-gray-500">No schema loaded.</div>
      </Card>
    );
  }

  return (
    <Card
      title="Schema Preview"
      subtitle={`${schema.total_fields} field${schema.total_fields !== 1 ? 's' : ''} detected${schema.truncated ? ` (showing first ${schema.fields.length})` : ''}`}
      className="overflow-hidden"
    >
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200 text-sm">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Field
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-4 py-2 text-left text-[11px] font-medium text-gray-500 uppercase tracking-wider">
                Nullable
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {schema.fields.map((field, index) => (
              <tr key={index} className="hover:bg-gray-50 transition-colors">
                <td className="px-4 py-2 whitespace-nowrap">
                  <code className="text-xs font-mono">{field.name}</code>
                </td>
                <td className="px-4 py-2 whitespace-nowrap">
                  <TypeBadge type={field.type} />
                </td>
                <td className="px-4 py-2 whitespace-nowrap text-[11px] text-gray-600">
                  {field.nullable ? (
                    <span className="text-gray-400">Yes</span>
                  ) : (
                    <span className="text-gray-700 font-medium">Required</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {schema.truncated && (
        <div className="mt-3 text-xs rounded border border-yellow-200 bg-yellow-50 px-3 py-2 text-yellow-800">
          ⚠ Limited preview: {schema.fields.length} shown of {schema.total_fields} total fields.
        </div>
      )}
    </Card>
  );
}

function TypeBadge({ type }: { type: string }) {
  const styles: Record<string, string> = {
    string: 'bg-purple-100 text-purple-800',
    number: 'bg-blue-100 text-blue-800',
    integer: 'bg-blue-100 text-blue-800',
    boolean: 'bg-green-100 text-green-800',
    date: 'bg-orange-100 text-orange-800',
    timestamp: 'bg-orange-100 text-orange-800',
    array: 'bg-pink-100 text-pink-800',
    object: 'bg-gray-100 text-gray-800',
  };

  const normalizedType = type.toLowerCase();
  const style = styles[normalizedType] || 'bg-gray-100 text-gray-800';

  return (
    <span className={`px-2 py-1 inline-flex text-xs leading-4 font-semibold rounded ${style}`}>
      {type}
    </span>
  );
}
