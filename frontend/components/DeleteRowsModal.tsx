import React, { useState } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';

interface Props {
  isOpen: boolean;
  tableName: string;
  onClose: () => void;
  onDeleted: () => void;
}

export default function DeleteRowsModal({ isOpen, tableName, onClose, onDeleted }: Props) {
  const [idList, setIdList] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleDelete = async () => {
    setError(null);

    const ids = idList
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean);

    if (ids.length === 0) {
      setError('Please enter at least one ID');
      return;
    }

    setIsDeleting(true);
    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch(
        `http://localhost:4000/api/uploads/tables/${encodeURIComponent(tableName)}/rows?ids=${encodeURIComponent(ids.join(','))}`,
        {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to delete rows');
      }

      onDeleted();
      setIdList('');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Unable to delete these rows. Please check the IDs and try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <Card
        title="Delete Specific Rows"
        subtitle={`Remove rows from ${tableName} by entering their IDs. Use commas for multiple IDs.`}
        className="max-w-md w-full"
      >
        {error && (
          <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-red-800 text-sm">
            {error}
          </div>
        )}
        <div className="mb-4">
          <Input
            label="Row IDs (comma-separated)"
            placeholder="1,5,12,23"
            value={idList}
            onChange={(e) => setIdList(e.target.value)}
            disabled={isDeleting}
            hint="Example: 1,2,3 or 10,20,30"
            error={error || undefined}
          />
        </div>
        <div className="flex gap-2 justify-end">
          <Button variant="outline" onClick={onClose} disabled={isDeleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={isDeleting || !idList.trim()}>
            {isDeleting ? 'Deleting…' : 'Delete Rows'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
