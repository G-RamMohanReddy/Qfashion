import { useEffect, useState } from 'react';
import { api, authClient } from '@/lib/auth.js';

export default function AccountSettings({ user }) {
  const [profile, setProfile] = useState(null);
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function load() {
    const { profile } = await api('profile');
    setProfile(profile);
  }

  useEffect(() => {
    let active = true;
    api('profile').then(result => {
      if (active) setProfile(result.profile);
    }).catch(error => {
      if (active) setMessage(error.message);
    });
    return () => { active = false; };
  }, []);

  async function run(action) {
    setBusy(true);
    setMessage('');
    try { await action(); }
    catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  }

  function saveProfile(event) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    run(async () => {
      const name = data.get('name').trim();
      await api('saveProfile', { name, phone: profile.phone || '' });
      const { sdk } = await authClient();
      await sdk.updateProfile(user, { displayName: name });
      await load();
      setMessage('Your profile has been saved.');
    });
  }

  return <div className="space-y-4">
    <p role="status" className="text-sm">{message}</p>
    {profile ? <form className="card max-w-lg space-y-4 p-6" onSubmit={saveProfile}>
      <h2 className="font-editorial text-3xl">Your profile</h2>
      <label className="block text-sm">Your name
        <input required name="name" defaultValue={profile.name} maxLength={80} autoComplete="name" className="field mt-2" />
      </label>
      <label className="block text-sm">Email
        <input readOnly value={user.email || ''} className="field mt-2" />
      </label>
      <button disabled={busy} className="btn-primary">Save profile</button>
      <button type="button" disabled={busy} className="btn-quiet block" onClick={() => run(async () => {
        const { auth, sdk } = await authClient();
        await sdk.sendPasswordResetEmail(auth, user.email);
        setMessage('Password reset email requested. Check your inbox and spam folder.');
      })}>Send me a password reset link</button>
    </form> : <button type="button" disabled={busy} className="btn-ghost" onClick={() => run(load)}>Load my profile</button>}
  </div>;
}
