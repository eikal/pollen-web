import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';

interface Member {
  id: string;
  email: string;
  displayName: string;
  role: 'admin' | 'member' | 'viewer';
  createdAt: string;
}

interface Organization {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
}

export default function OrganizationSettings() {
  const router = useRouter();
  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit org state
  const [editMode, setEditMode] = useState(false);
  const [orgName, setOrgName] = useState('');
  const [orgDomain, setOrgDomain] = useState('');
  const [saving, setSaving] = useState(false);

  // Invite user state
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'admin' | 'member' | 'viewer'>('member');
  const [inviting, setInviting] = useState(false);
  const [inviteSuccess, setInviteSuccess] = useState('');

  useEffect(() => {
    fetchOrg();
  }, []);

  const fetchOrg = async () => {
    try {
      const token = localStorage.getItem('pollen_token');
      if (!token) {
        router.push('/auth/login');
        return;
      }

      const res = await fetch('http://localhost:4000/org', {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        if (res.status === 401) {
          router.push('/auth/login');
          return;
        }
        throw new Error('Failed to fetch organization');
      }

      const data = await res.json();
      setOrg(data.org);
      setMembers(data.members || []);
      setOrgName(data.org.name);
      setOrgDomain(data.org.domain || '');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load organization');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveOrg = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch('http://localhost:4000/org', {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name: orgName, domain: orgDomain }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to update organization');
      }

      setOrg((prev) => (prev ? { ...prev, name: orgName, domain: orgDomain } : null));
      setEditMode(false);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleInviteUser = async () => {
    if (!inviteEmail) return;

    setInviting(true);
    setInviteSuccess('');
    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch('http://localhost:4000/org/invite', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: inviteEmail, role: inviteRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to invite user');
      }

      const data = await res.json();
      setInviteSuccess(`Invited ${inviteEmail} as ${inviteRole}. Invite link: ${data.inviteLink}`);
      setInviteEmail('');
      fetchOrg(); // Refresh members list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to invite user');
    } finally {
      setInviting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: string) => {
    if (!confirm(`Change user role to ${newRole}?`)) return;

    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch(`http://localhost:4000/org/members/${userId}/role`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: newRole }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to change role');
      }

      fetchOrg(); // Refresh members list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  const handleRemoveMember = async (userId: string, email: string) => {
    if (!confirm(`Remove ${email} from organization?`)) return;

    try {
      const token = localStorage.getItem('pollen_token');
      const res = await fetch(`http://localhost:4000/org/members/${userId}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to remove member');
      }

      fetchOrg(); // Refresh members list
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to remove member');
    }
  };

  const getRoleBadgeColor = (role: string) => {
    const colors = {
      admin: 'bg-purple-100 text-purple-800',
      member: 'bg-blue-100 text-blue-800',
      viewer: 'bg-gray-100 text-gray-800',
    };
    return colors[role as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>
        <div className="text-center py-12">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>
        <div className="bg-red-50 border border-red-200 rounded p-4 text-red-700">{error}</div>
      </div>
    );
  }

  if (!org) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>
        <div className="bg-yellow-50 border border-yellow-200 rounded p-4 text-yellow-700">
          You don&apos;t belong to an organization yet. Complete the onboarding to create one.
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Organization Settings</h1>

      {/* Organization Details */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Organization Details</h2>
          {!editMode && (
            <button
              onClick={() => setEditMode(true)}
              className="text-blue-600 hover:text-blue-700 text-sm font-medium"
            >
              Edit
            </button>
          )}
        </div>

        {editMode ? (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Organization Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Domain</label>
              <input
                type="text"
                value={orgDomain}
                onChange={(e) => setOrgDomain(e.target.value)}
                placeholder="example.com"
                className="w-full border border-gray-300 rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleSaveOrg}
                disabled={saving}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
              >
                {saving ? 'Saving...' : 'Save'}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setOrgName(org.name);
                  setOrgDomain(org.domain || '');
                }}
                className="bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between">
              <span className="font-medium">Name:</span>
              <span>{org.name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Domain:</span>
              <span>{org.domain || 'Not set'}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Created:</span>
              <span>{new Date(org.createdAt).toLocaleDateString()}</span>
            </div>
          </div>
        )}
      </div>

      {/* Members */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Members ({members.length})</h2>
          <button
            onClick={() => setShowInviteModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            + Invite User
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-3 px-2">Email</th>
                <th className="text-left py-3 px-2">Name</th>
                <th className="text-left py-3 px-2">Role</th>
                <th className="text-left py-3 px-2">Joined</th>
                <th className="text-right py-3 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {members.map((member) => (
                <tr key={member.id} className="border-b border-gray-100">
                  <td className="py-3 px-2">{member.email}</td>
                  <td className="py-3 px-2">{member.displayName}</td>
                  <td className="py-3 px-2">
                    <span
                      className={`px-2 py-1 text-xs font-semibold rounded ${getRoleBadgeColor(member.role)}`}
                    >
                      {member.role}
                    </span>
                  </td>
                  <td className="py-3 px-2 text-sm text-gray-600">
                    {new Date(member.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-2 text-right">
                    <select
                      value={member.role}
                      onChange={(e) => handleChangeRole(member.id, e.target.value)}
                      className="text-sm border border-gray-300 rounded px-2 py-1 mr-2"
                    >
                      <option value="admin">Admin</option>
                      <option value="member">Member</option>
                      <option value="viewer">Viewer</option>
                    </select>
                    <button
                      onClick={() => handleRemoveMember(member.id, member.email)}
                      className="text-red-600 hover:text-red-700 text-sm font-medium"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-semibold mb-4">Invite User</h3>

            {inviteSuccess && (
              <div className="bg-green-50 border border-green-200 rounded p-3 mb-4 text-green-700 text-sm">
                {inviteSuccess}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="user@example.com"
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as any)}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                >
                  <option value="viewer">Viewer (Read-only)</option>
                  <option value="member">Member (Can provision)</option>
                  <option value="admin">Admin (Full access)</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleInviteUser}
                  disabled={inviting || !inviteEmail}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-gray-400"
                >
                  {inviting ? 'Inviting...' : 'Send Invite'}
                </button>
                <button
                  onClick={() => {
                    setShowInviteModal(false);
                    setInviteEmail('');
                    setInviteSuccess('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
