import { useState } from 'react';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';

type AuthModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (token: string, user: any) => void;
  initialMode?: 'signup' | 'login';
};

export default function AuthModal({
  isOpen,
  onClose,
  onSuccess,
  initialMode = 'signup',
}: AuthModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [viewMode, setViewMode] = useState<'signup' | 'login'>(initialMode);

  if (!isOpen) return null;

  // For MVP: email/password fallback (you can remove this if only social login)
  async function handleEmailAuth() {
    if (!email || !password) {
      setError('Email and password required');
      return;
    }
    setLoading(true);
    setError(null);

    const endpoint = viewMode === 'signup' ? '/auth/signup' : '/auth/login';
    const body =
      viewMode === 'signup'
        ? { email, password, displayName: displayName || email.split('@')[0] }
        : { email, password };

    try {
      const res = await fetch(`http://localhost:4000${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error(errBody.error || `HTTP ${res.status}`);
      }
      const data = await res.json();
      if (typeof window !== 'undefined') {
        localStorage.setItem('pollen_token', data.token);
        localStorage.setItem('pollen_user', JSON.stringify(data.user));
      }
      onSuccess(data.token, data.user);
    } catch (err: any) {
      setError(err.message || 'Authentication failed');
    } finally {
      setLoading(false);
    }
  }

  function handleSocialLogin(provider: string) {
    // TODO: Implement OAuth flow for Google/Microsoft
    // For now, show placeholder
    setError(`${provider} login not yet implemented (coming soon!)`);
  }

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <Card
        title={viewMode === 'signup' ? 'Create Your Data Workspace' : 'Sign In'}
        subtitle={
          viewMode === 'signup'
            ? 'Save your setup and start organizing data.'
            : 'Access your data workspace.'
        }
        className="w-full max-w-md"
        padding="lg"
      >
        <div className="space-y-3 mb-4">
          <div className="grid gap-2">
            <Button variant="outline" onClick={() => handleSocialLogin('Google')}>
              🔵 Continue with Google
            </Button>
            <Button variant="outline" onClick={() => handleSocialLogin('Microsoft')}>
              🔷 Continue with Microsoft
            </Button>
          </div>
          <div className="text-center text-[11px] text-gray-500">or use email</div>
          <div className="space-y-3">
            {viewMode === 'signup' && (
              <Input
                label="Display Name"
                placeholder="Acme Ops"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
              />
            )}
            <Input
              label="Email"
              type="email"
              placeholder="you@company.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          {error && (
            <div className="text-xs rounded border border-red-200 bg-red-50 text-red-700 px-3 py-2">
              {error}
            </div>
          )}
          <div className="flex gap-2 mt-2">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button variant="primary" onClick={handleEmailAuth} disabled={loading}>
              {loading ? 'Loading…' : viewMode === 'signup' ? 'Sign Up' : 'Sign In'}
            </Button>
          </div>
          <div className="text-center text-[11px] text-gray-600">
            {viewMode === 'signup' ? (
              <>
                Already have an account?{' '}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setViewMode('login');
                    setError(null);
                  }}
                >
                  Sign In
                </button>
              </>
            ) : (
              <>
                Need an account?{' '}
                <button
                  className="text-blue-600 hover:underline"
                  onClick={() => {
                    setViewMode('signup');
                    setError(null);
                  }}
                >
                  Sign Up
                </button>
              </>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}
