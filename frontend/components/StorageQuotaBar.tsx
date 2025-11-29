/**
 * Storage quota bar component.
 * Displays storage usage with warnings at 80% and block at 100%.
 */

import { useEffect, useState } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Button';
import ProgressBar from './ui/ProgressBar';

interface QuotaData {
  totalTables: number;
  totalSizeMb: number;
  limitMb: number;
  availableMb: number;
  usagePercent: number;
  lastCalculatedAt: string;
}

interface QuotaWarnings {
  hasWarnings: boolean;
  messages: string[];
}

interface StorageQuotaBarProps {
  compact?: boolean; // If true, show compact header version
  showDetails?: boolean; // If true, show detailed breakdown
}

export default function StorageQuotaBar({
  compact = false,
  showDetails = false,
}: StorageQuotaBarProps) {
  const [quota, setQuota] = useState<QuotaData | null>(null);
  const [warnings, setWarnings] = useState<QuotaWarnings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuota();
    // Refresh every 30 seconds
    const interval = setInterval(fetchQuota, 30000);
    return () => clearInterval(interval);
  }, []);

  const fetchQuota = async () => {
    try {
      const token = localStorage.getItem('pollen_token');
      if (!token) {
        setLoading(false);
        return;
      }

      const res = await fetch('http://localhost:4000/api/quota', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        throw new Error('Failed to fetch quota');
      }

      const data = await res.json();
      if (data.success) {
        setQuota(data.quota);
        setWarnings(data.warnings);
        setError(null);
      }
    } catch (err) {
      setError('Storage information temporarily unavailable');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return compact ? <div className="text-[10px] text-gray-500">Loading…</div> : null;
  }

  if (error || !quota) {
    return compact ? (
      <div className="text-[10px] text-red-500">{error || 'No quota data'}</div>
    ) : null;
  }

  const isWarning = quota.usagePercent >= 80;
  const isFull = quota.usagePercent >= 100;

  // Compact version for header
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className="text-[10px] text-gray-600 font-medium">
          {quota.totalSizeMb.toFixed(0)}MB / {quota.limitMb}MB
        </div>
        {isWarning && (
          <span
            className={`text-[10px] font-semibold ${isFull ? 'text-red-600' : 'text-yellow-600'}`}
          >
            {isFull ? 'Full' : 'Near'}
          </span>
        )}
      </div>
    );
  }

  // Full version for uploads/my-data pages
  return (
    <Card
      title="Storage Usage"
      subtitle={`${quota.totalTables} of 20 tables • ${quota.totalSizeMb.toFixed(1)}MB / ${quota.limitMb}MB`}
      className={isFull ? 'border-red-300' : isWarning ? 'border-yellow-300' : ''}
      actions={
        <Button variant="outline" size="sm" onClick={fetchQuota}>
          Refresh
        </Button>
      }
      padding="md"
    >
      <div className="mb-3">
        <ProgressBar
          value={quota.usagePercent}
          state={isFull ? 'danger' : isWarning ? 'warning' : 'normal'}
          showLabel
        />
      </div>
      <div className="flex items-center justify-between text-[11px] text-gray-600 mb-3">
        <span>{quota.totalSizeMb.toFixed(2)}MB used</span>
        <span className="font-semibold">{quota.usagePercent.toFixed(1)}%</span>
        <span>{quota.availableMb.toFixed(2)}MB free</span>
      </div>
      {warnings && warnings.hasWarnings && (
        <div
          className={`text-[11px] p-2 rounded ${isFull ? 'bg-red-50 border border-red-200 text-red-700' : 'bg-yellow-50 border border-yellow-200 text-yellow-700'}`}
        >
          <ul className="list-disc list-inside space-y-1">
            {warnings.messages.map((msg, idx) => (
              <li key={idx}>{msg}</li>
            ))}
          </ul>
          {isFull && (
            <p className="mt-2 font-medium">
              Delete tables or data to free space before uploading more files.
            </p>
          )}
        </div>
      )}
      {showDetails && (
        <div className="mt-3 pt-3 border-t border-gray-200 grid grid-cols-2 gap-2 text-[11px] text-gray-600">
          <div>
            <span className="font-medium">Tables:</span> {quota.totalTables} / 20
          </div>
          <div>
            <span className="font-medium">Limit:</span> {quota.limitMb}MB
          </div>
        </div>
      )}
    </Card>
  );
}
