import { useState, FormEvent, ChangeEvent } from 'react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    try {
      const res = await fetch('http://localhost:4000/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, displayName }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      localStorage.setItem('pollen_token', data.token);
      localStorage.setItem('pollen_user', JSON.stringify(data.user));
      window.location.href = '/';
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <div>
      <h1>Sign up</h1>
      <form onSubmit={submit}>
        <div>
          <label>Display name</label>
          <br />
          <input
            value={displayName}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setDisplayName(e.target.value)}
          />
        </div>
        <div>
          <label>Email</label>
          <br />
          <input
            value={email}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setEmail(e.target.value)}
          />
        </div>
        <div>
          <label>Password</label>
          <br />
          <input
            type="password"
            value={password}
            onChange={(e: ChangeEvent<HTMLInputElement>) => setPassword(e.target.value)}
          />
        </div>
        <div>
          <button type="submit">Sign up</button>
        </div>
        {error && <div style={{ color: 'red' }}>{error}</div>}
      </form>
    </div>
  );
}
