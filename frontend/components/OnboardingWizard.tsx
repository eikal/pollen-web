import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import AuthModal from './AuthModal';
import Card from './ui/Card';
import { Button } from './ui/Button';
import Input from './ui/Input';

type Organization = {
  id: string;
  name: string;
  domain: string;
  createdAt: string;
  isActive: boolean;
};

type OnboardingData = {
  orgId?: string; // for existing users
  orgName: string;
  domain: string;
  plan: 'basic' | 'premium';
  template: string;
};

const defaultData: OnboardingData = {
  orgName: '',
  domain: '',
  plan: 'basic',
  template: 'csv_to_table',
};

export default function OnboardingWizard() {
  const [step, setStep] = useState(0);
  const [data, setData] = useState<OnboardingData>(defaultData);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [userOrgs, setUserOrgs] = useState<Organization[]>([]);
  const [hasExistingOrg, setHasExistingOrg] = useState(false);
  const [loadingOrgs, setLoadingOrgs] = useState(false);
  const router = useRouter();

  useEffect(() => {
    // Check if user is authenticated and load their organizations
    const token = typeof window !== 'undefined' ? localStorage.getItem('pollen_token') : null;
    if (token) {
      loadUserOrganizations(token);
    }
  }, []);

  async function loadUserOrganizations(token: string) {
    setLoadingOrgs(true);
    try {
      const res = await fetch('http://localhost:4000/user/organizations', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const json = await res.json();
        const orgs = json.organizations || [];
        setUserOrgs(orgs);

        if (orgs.length > 0) {
          setHasExistingOrg(true);
          // Pre-select the active org
          const activeOrg = orgs.find((o: Organization) => o.isActive) || orgs[0];
          setData((prev) => ({
            ...prev,
            orgId: activeOrg.id,
            orgName: activeOrg.name,
            domain: activeOrg.domain,
          }));
        }
      }
    } catch (err) {
      console.error('Failed to load organizations:', err);
    } finally {
      setLoadingOrgs(false);
    }
  }

  function next() {
    // If we're skipping the org step (existing single-org user), jump from 0 to 2
    if (step === 0 && !shouldShowOrgStep) {
      setStep(2);
    } else if (step < 4) {
      setStep(step + 1);
    }
  }

  function back() {
    // If we're on step 2 and should skip org step, jump back to 0
    if (step === 2 && !shouldShowOrgStep) {
      setStep(0);
    } else if (step > 0) {
      setStep(step - 1);
    }
  }

  function update<K extends keyof OnboardingData>(key: K, value: OnboardingData[K]) {
    setData((prev) => ({ ...prev, [key]: value }));
  }

  function finish() {
    // persist to localStorage as a lightweight dev flow
    if (typeof window !== 'undefined') {
      localStorage.setItem('pollen_onboarding', JSON.stringify(data));
    }

    // Check if user is authenticated
    const token = typeof window !== 'undefined' ? localStorage.getItem('pollen_token') : null;

    if (!token) {
      // User not authenticated - show auth modal
      setShowAuthModal(true);
      return;
    }

    // User is authenticated - proceed with provisioning
    provisionNow(token);
  }

  function provisionNow(token: string) {
    setLoading(true);
    setError(null);

    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    fetch('http://localhost:4000/provisioning', {
      method: 'POST',
      headers,
      body: JSON.stringify({
        orgName: data.orgName,
        domain: data.domain,
        plan: data.plan,
        template: data.template,
      }),
    })
      .then(async (res) => {
        setLoading(false);
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || `status=${res.status}`);
        }
        return res.json();
      })
      .then((j) => {
        // store job id for later inspection
        if (typeof window !== 'undefined' && j && j.job) {
          localStorage.setItem('pollen_provision_job', JSON.stringify(j.job));
        }
        router.push('/products');
      })
      .catch((err) => {
        setLoading(false);
        setError(err.message || 'Provisioning failed');
      });
  }

  function handleAuthSuccess(token: string, user: any) {
    setShowAuthModal(false);
    // Load organizations for newly authenticated user
    loadUserOrganizations(token);
  }

  // Determine if we should show the org step
  const shouldShowOrgStep = !hasExistingOrg || userOrgs.length > 1;

  return (
    <div className="max-w-2xl mx-auto p-4">
      <Card
        title="Onboarding Wizard"
        subtitle="Provision a workspace and create your first template"
        className="mb-6"
      >
        <div className="mb-4">
          <ProgressDots step={step} skipOrgStep={!shouldShowOrgStep} />
        </div>
        {step === 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Welcome</h3>
            <p className="text-xs text-gray-600 mb-3">
              This wizard provisions a workspace and a starter ETL template.
            </p>
            {loadingOrgs && (
              <p className="text-[11px] text-gray-500">Loading your organizations…</p>
            )}
            <Button variant="primary" onClick={next} disabled={loadingOrgs} size="sm">
              Get Started
            </Button>
          </div>
        )}
        {step === 1 && shouldShowOrgStep && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Organization</h3>
            {userOrgs.length > 1 ? (
              <div className="space-y-3">
                <div className="text-[11px] text-gray-600">
                  Select organization to use for provisioning:
                </div>
                <select
                  value={data.orgId || ''}
                  onChange={(e) => {
                    const selectedOrg = userOrgs.find((o) => o.id === e.target.value);
                    if (selectedOrg) {
                      update('orgId', selectedOrg.id);
                      update('orgName', selectedOrg.name);
                      update('domain', selectedOrg.domain);
                    }
                  }}
                  className="border rounded px-3 py-2 w-full text-sm"
                >
                  {userOrgs.map((org) => (
                    <option key={org.id} value={org.id}>
                      {org.name} ({org.domain})
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="space-y-3">
                <Input
                  label="Organization Name"
                  value={data.orgName}
                  onChange={(e) => update('orgName', e.target.value)}
                  placeholder="Acme Corp"
                />
                <Input
                  label="Primary Email Domain"
                  value={data.domain}
                  onChange={(e) => update('domain', e.target.value)}
                  placeholder="example.com"
                />
              </div>
            )}
            <div className="mt-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={back}>
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={next} disabled={!data.orgName}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 1 && !shouldShowOrgStep && (
          <div className="text-center py-6">
            <p className="text-xs text-gray-600">
              Using organization: <strong>{data.orgName}</strong>
            </p>
            <Button variant="primary" size="sm" onClick={next} className="mt-3">
              Continue
            </Button>
          </div>
        )}
        {step === 2 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Choose a Plan</h3>
            <div className="space-y-2 text-[11px]">
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="plan"
                  checked={data.plan === 'basic'}
                  onChange={() => update('plan', 'basic')}
                />{' '}
                Basic — free / dev
              </label>
              <label className="flex items-center gap-2">
                <input
                  type="radio"
                  name="plan"
                  checked={data.plan === 'premium'}
                  onChange={() => update('plan', 'premium')}
                />{' '}
                Premium — managed features
              </label>
            </div>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={back}>
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Pick an ETL Template</h3>
            <select
              value={data.template}
              onChange={(e) => update('template', e.target.value)}
              className="border rounded px-3 py-2 w-full text-sm"
            >
              <option value="csv_to_table">CSV → Table (upload)</option>
              <option value="db_to_table">Database → Table (connect)</option>
              <option value="api_to_table">API → Table (poll)</option>
            </select>
            <div className="mt-4 flex justify-between">
              <Button variant="outline" size="sm" onClick={back}>
                Back
              </Button>
              <Button variant="primary" size="sm" onClick={next}>
                Next
              </Button>
            </div>
          </div>
        )}
        {step === 4 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Review & Finish</h3>
            <div className="border border-gray-200 bg-gray-50 rounded p-3 text-[11px] space-y-1">
              <div>
                <strong>Organization:</strong> {data.orgName} {data.domain && `(${data.domain})`}
              </div>
              <div>
                <strong>Plan:</strong> {data.plan}
              </div>
              <div>
                <strong>Template:</strong> {data.template}
              </div>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <Button variant="outline" size="sm" onClick={back}>
                Back
              </Button>
              <div className="flex items-center gap-2">
                <Button variant="primary" size="sm" onClick={finish} disabled={loading}>
                  {loading ? 'Provisioning…' : 'Finish & Provision'}
                </Button>
              </div>
            </div>
            {error && (
              <div className="mt-3 text-xs rounded border border-red-200 bg-red-50 text-red-700 p-2">
                {error}
              </div>
            )}
          </div>
        )}
      </Card>
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={handleAuthSuccess}
        initialMode="signup"
      />
    </div>
  );
}

function ProgressDots({ step, skipOrgStep }: { step: number; skipOrgStep?: boolean }) {
  const labels = skipOrgStep
    ? ['Welcome', 'Plan', 'Template', 'Review']
    : ['Welcome', 'Org', 'Plan', 'Template', 'Review'];

  // Map actual step to display step when skipping org
  const displayStep = skipOrgStep && step > 0 ? step - 1 : step;

  return (
    <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
      {labels.map((l, i) => (
        <div key={i} style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              background: i <= displayStep ? '#1070ca' : '#ddd',
              color: '#fff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {i + 1}
          </div>
          <div style={{ fontSize: 12 }}>{l}</div>
        </div>
      ))}
    </div>
  );
}
