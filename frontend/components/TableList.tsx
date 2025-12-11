import React, { useEffect, useState } from 'react';
import { listTables } from '../lib/api/uploads';
import ConfirmDialog from './ConfirmDialog';
import DeleteRowsModal from './DeleteRowsModal';
import Card from './ui/Card';
import { Button } from './ui/Button';

interface Props {
  onSelect?: (table: string) => void;
  onTableDeleted?: () => void;
}

export default function TableList({ onSelect, onTableDeleted }: Props) {
  const [tables, setTables] = useState<string[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedTable, setExpandedTable] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    type: 'drop' | 'truncate';
    table: string;
  }>({ isOpen: false, type: 'drop', table: '' });
  const [deleteRowsModal, setDeleteRowsModal] = useState<{
    isOpen: boolean;
    table: string;
  }>({ isOpen: false, table: '' });

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const t = await listTables();
      setTables(t);
    } catch (err: any) {
      setError(err.message || 'Unable to load your tables. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  const handleDrop = async () => {
    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch(
        `http://localhost:4000/api/uploads/tables/${encodeURIComponent(confirmDialog.table)}?confirm=${encodeURIComponent(confirmDialog.table)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to drop table');
      }

      await refresh();
      onTableDeleted?.();
    } catch (err: any) {
      setError(err.message || 'Unable to delete this table. Please try again or contact support.');
    }
  };

  const handleTruncate = async () => {
    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch(
        `http://localhost:4000/api/uploads/tables/${encodeURIComponent(confirmDialog.table)}/data?confirm=${encodeURIComponent(confirmDialog.table)}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to truncate table');
      }

      await refresh();
      onTableDeleted?.();
    } catch (err: any) {
      setError(err.message || 'Unable to clear table data. Please try again.');
    }
  };

  return (
    <>
      <Card
        title="Your Tables"
        subtitle="Manage and inspect tables created from your uploaded files."
        actions={
          <Button variant="outline" size="sm" onClick={refresh}>
            Refresh
          </Button>
        }
        className="fade-in"
      >
        {loading && <p className="text-gray-600">Loading…</p>}
        {error && (
          <div className="mb-3 p-3 rounded border border-red-200 bg-red-50 text-red-800">
            {error}
          </div>
        )}

        {tables.length === 0 && !loading ? (
          <p className="text-sm text-gray-600">
            You haven&apos;t uploaded any data yet. Upload a CSV or Excel file above to get started.
          </p>
        ) : (
          <div className="space-y-2">
            {tables.map((t) => (
              <div
                key={t}
                className="border border-gray-200 rounded-md bg-white shadow-sm hover:shadow-md transition-shadow interactive-row"
              >
                <div className="flex items-center justify-between px-3 py-2">
                  <span className="font-mono text-xs tracking-tight text-gray-700">{t}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpandedTable(expandedTable === t ? null : t)}
                  >
                    {expandedTable === t ? 'Hide' : 'Actions'}
                  </Button>
                </div>
                {expandedTable === t && (
                  <div className="px-3 pb-3 pt-1 flex flex-wrap gap-2">
                    {onSelect && (
                      <Button size="sm" variant="primary" onClick={() => onSelect(t)}>
                        Preview
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="warning"
                      onClick={() => setDeleteRowsModal({ isOpen: true, table: t })}
                    >
                      Delete Rows
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setConfirmDialog({ isOpen: true, type: 'truncate', table: t })}
                    >
                      Clear Data
                    </Button>
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => setConfirmDialog({ isOpen: true, type: 'drop', table: t })}
                    >
                      Delete Table
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </Card>

      <ConfirmDialog
        isOpen={confirmDialog.isOpen}
        onClose={() => setConfirmDialog({ ...confirmDialog, isOpen: false })}
        onConfirm={confirmDialog.type === 'drop' ? handleDrop : handleTruncate}
        title={confirmDialog.type === 'drop' ? 'Delete Table Permanently?' : 'Clear All Data?'}
        message={
          confirmDialog.type === 'drop'
            ? `This will permanently delete the table "${confirmDialog.table}" and all its data. This action cannot be undone.`
            : `This will remove all data from "${confirmDialog.table}" but keep the table structure. This action cannot be undone.`
        }
        confirmText={confirmDialog.table}
        actionLabel={confirmDialog.type === 'drop' ? 'Delete Forever' : 'Clear All Data'}
        isDangerous={true}
      />

      <DeleteRowsModal
        isOpen={deleteRowsModal.isOpen}
        tableName={deleteRowsModal.table}
        onClose={() => setDeleteRowsModal({ ...deleteRowsModal, isOpen: false })}
        onDeleted={() => {
          refresh();
          onTableDeleted?.();
        }}
      />
    </>
  );
}
