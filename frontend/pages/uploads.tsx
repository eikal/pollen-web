import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import UploadWizard from '../components/UploadWizard';
import TableList from '../components/TableList';
import TablePreview from '../components/TablePreview';
import StorageQuotaBar from '../components/StorageQuotaBar';
import { isAuthenticated, getUserOrgId } from '../lib/auth';

export default function UploadsPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [selectedTable, setSelectedTable] = useState<string | undefined>(undefined);
  const [noOrg, setNoOrg] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/auth/login');
      return;
    }
    // Org is optional in MVP: proceed regardless, show soft banner if absent
    getUserOrgId().then((id) => {
      if (!id) setNoOrg(true);
      setReady(true);
    });
  }, [router]);

  if (!ready) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-gray-600">Preparing your Data Workspace…</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Data</h1>
          <p className="mt-2 text-gray-600">
            Upload CSV or Excel files to bring your data into your workspace. View, update, and
            manage your tables.
          </p>
          {noOrg && (
            <div className="mt-4 bg-blue-50 border border-blue-200 text-blue-700 rounded p-3 text-sm">
              You can start working with your data now. Team workspace setup comes later.
            </div>
          )}
        </div>

        {/* Storage Quota Display */}
        <StorageQuotaBar showDetails />

        <UploadWizard onUploaded={(t) => setSelectedTable(t)} />

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <TableList
              onSelect={(t) => setSelectedTable(t)}
              onTableDeleted={() => setSelectedTable(undefined)}
            />
          </div>
          <div className="lg:col-span-2">
            <TablePreview tableName={selectedTable} />
          </div>
        </div>
      </div>
    </div>
  );
}
