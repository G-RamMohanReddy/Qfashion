import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth.js';
import { isFirebaseConfigured } from '@/lib/firebase.js';
import App from '../App.jsx';

export default function AccountGate() {
  const [user, setUser] = useState(null), [role, setRole] = useState('customer');
  const [loading, setLoading] = useState(true), [browse, setBrowse] = useState(true);
  const [mode, setMode] = useState('login'), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  useEffect(() => {
    let active = true, unsubscribe;
    authClient().then(({ auth, sdk }) => {
      if (!active) return;
      unsubscribe = sdk.onIdTokenChanged(auth, async current => {
        try {
          const claims = current ? (await current.getIdTokenResult()).claims : {};
          if (active && auth.currentUser === current) { setUser(current); setRole(claims.role || 'customer'); setLoading(false); }
        } catch { if (active) { setMessage('Please sign in again.'); setLoading(false); } }
      });
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  const perform = async fn => {
    setBusy(true); setMessage('');
    try { await fn(); } catch (error) {
      const messages = { 'auth/invalid-credential': 'Check your email and password.', 'auth/email-already-in-use': 'An account already uses this email.', 'auth/unauthorized-domain': 'Sign-in is not enabled for this preview address.', 'auth/too-many-requests': 'Please wait before trying again.' };
      setMessage(messages[error.code] || 'Could not complete sign-in. Please try again.');
    } finally { setBusy(false); }
  };
  const logout = () => perform(async () => { const { auth, sdk } = await authClient(); await sdk.signOut(auth); setBrowse(true); });
  const submit = event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    perform(async () => {
      const { auth, sdk } = await authClient();
      if (mode === 'reset') { await sdk.sendPasswordResetEmail(auth, data.get('email')); setMessage('If an account exists, a reset link has been sent.'); return; }
      if (mode === 'signup') {
        const credential = await sdk.createUserWithEmailAndPassword(auth, data.get('email'), data.get('password'));
        await sdk.updateProfile(credential.user, { displayName: data.get('name').trim() });
        await sdk.sendEmailVerification(credential.user); setMessage('Check your email for a verification link.');
      } else await sdk.signInWithEmailAndPassword(auth, data.get('email'), data.get('password'));
    });
  };
  if (loading && !browse) return <main className="auth-shell"><p role="status">Opening your wardrobe…</p></main>;
  if (user && !user.emailVerified) return <main className="auth-shell"><section className="auth-card"><p className="eyebrow">One last step</p><h1>Make it yours.</h1><p>Verify your email to shop and manage orders.</p><p role="status">{message}</p><button disabled={busy} className="btn-primary mt-4" onClick={() => perform(async () => { const { auth, sdk } = await authClient(); await sdk.reload(auth.currentUser); await auth.currentUser.getIdToken(true); setUser(auth.currentUser); setMessage('Email status refreshed.'); })}>I have verified my email</button><button disabled={busy} className="btn-quiet" onClick={() => perform(async () => { const { auth, sdk } = await authClient(); await sdk.sendEmailVerification(auth.currentUser); setMessage('Verification email sent.'); })}>Resend email</button><button className="btn-quiet" onClick={logout}>Sign out</button></section></main>;
  if (user || browse) return <App key={user?.uid || 'guest'} user={user} role={role} onAccount={() => { setBrowse(false); window.scrollTo(0, 0); }} onLogout={logout} />;
  return <main className="auth-shell">
    <section className="auth-story"><a href="/" className="wordmark">Q <span>FASHION</span></a><p className="eyebrow">THE NEIGHBOURHOOD EDIT</p><h1>Your city.<br />Your style.<br /><em>Your moment.</em></h1><p>Discover a new way to dress, from the shops around you.</p><div className="auth-orbit" aria-hidden="true">Q</div><span className="auth-caption">A LITTLE LOCAL. A LOT YOU.</span></section>
    <section className="auth-card"><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>{mode === 'signup' ? 'A beautiful beginning.' : mode === 'reset' ? 'Find your way back.' : 'Welcome to your edit.'}</h2><p className="text-muted mb-6">{mode === 'signup' ? 'Create your Q Fashion account.' : mode === 'reset' ? 'We’ll send a password reset link.' : 'Sign in. Find something that feels like you.'}</p>
      {!isFirebaseConfigured && <p className="notice">This preview is being configured. Explore the design below; checkout is unavailable.</p>}
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <label className="block">Your name<input required name="name" maxLength={80} autoComplete="name" className="field mt-2" /></label>}
        <label className="block">Email address<input required name="email" type="email" autoComplete="email" className="field mt-2" /></label>
        {mode !== 'reset' && <label className="block">Password<input required name="password" type="password" minLength={10} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="field mt-2" /></label>}
        <p role="status" className="text-sm">{message}</p><button disabled={busy || !isFirebaseConfigured} className="btn-primary w-full py-3.5">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in →'}</button>
      </form>
      {mode !== 'reset' && <button disabled={busy || !isFirebaseConfigured} className="btn-ghost w-full mt-3 py-3" onClick={() => perform(async () => { const { auth, sdk } = await authClient(); await sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider()); })}>Continue with Google</button>}
      <div className="flex flex-wrap justify-between mt-5"><button className="btn-quiet" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Already a member? Sign in' : 'Create an account'}</button><button className="btn-quiet" onClick={() => { setMode(mode === 'reset' ? 'login' : 'reset'); setMessage(''); }}>{mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}</button></div>
      <button className="btn-quiet mt-5 w-full" onClick={() => setBrowse(true)}>Back to Q Fashion →</button>
    </section>
  </main>;
}
