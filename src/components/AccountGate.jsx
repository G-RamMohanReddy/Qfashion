import { useCallback, useEffect, useState } from 'react';
import { authClient, api, emailContinueSettings } from '@/lib/auth.js';
import { isFirebaseConfigured } from '@/lib/firebase.js';
import App from '../App.jsx';

export default function AccountGate() {
  const [user, setUser] = useState(null), [role, setRole] = useState('customer');
  const [verified, setVerified] = useState(false);
  const [loading, setLoading] = useState(true), [browse, setBrowse] = useState(() => new URLSearchParams(window.location.search).get('account') !== '1');
  const [mode, setMode] = useState('login'), [busy, setBusy] = useState(false), [message, setMessage] = useState('');
  const [resendAt, setResendAt] = useState(0), [clock, setClock] = useState(Date.now());
  const cooldown = Math.max(0, Math.ceil((resendAt - clock) / 1000));
  useEffect(() => { if (!cooldown) return; const timer = setTimeout(() => setClock(Date.now()), 1000); return () => clearTimeout(timer); }, [cooldown]);
  const refreshVerification = useCallback(async () => {
    const { auth, sdk } = await authClient(), current = auth.currentUser;
    if (!current) return false;
    await sdk.reload(current);
    const token = await current.getIdTokenResult(true);
    if (auth.currentUser?.uid !== current.uid) return false;
    if (token.claims.email_verified === true) { setUser(current); setVerified(true); setMessage('Email verified.'); }
    return token.claims.email_verified === true;
  }, []);
  useEffect(() => {
    if (!user || verified) return;
    const check = () => { if (document.visibilityState === 'visible') refreshVerification().catch(() => {}); };
    window.addEventListener('focus', check); document.addEventListener('visibilitychange', check);
    const timer = setInterval(check, 12000);
    return () => { window.removeEventListener('focus', check); document.removeEventListener('visibilitychange', check); clearInterval(timer); };
  }, [user?.uid, verified, refreshVerification]);
  useEffect(() => {
    let active = true, unsubscribe;
    authClient().then(({ auth, sdk }) => {
      if (!active) return;
      unsubscribe = sdk.onIdTokenChanged(auth, async current => {
        try {
          const claims = current ? (await current.getIdTokenResult()).claims : {};
          if (active && auth.currentUser === current) {
            setUser(current); setVerified(claims.email_verified === true); setRole(claims.role || 'customer'); setLoading(false);
            if (claims.email_verified === true) {
              try { const profile = await api('profile'); if (active && auth.currentUser === current) setRole(profile.role); }
              catch { if (active) setMessage('Signed in. Your account service is taking longer to connect. Refresh your account if needed.'); }
            }
          }
        } catch { if (active) { setMessage('Please sign in again.'); setLoading(false); } }
      });
    }).catch(() => { if (active) setLoading(false); });
    return () => { active = false; unsubscribe?.(); };
  }, []);
  const perform = async fn => {
    setBusy(true); setMessage('');
    try { await fn(); } catch (error) {
      const messages = { 'auth/invalid-credential': 'Check your email and password.', 'auth/email-already-in-use': 'An account already uses this email.', 'auth/unauthorized-domain': 'Sign-in is not enabled for this preview address.', 'auth/too-many-requests': 'Please wait before trying again.', 'auth/popup-blocked': 'Allow the Google sign-in popup, then try again.', 'auth/popup-closed-by-user': 'Google sign-in was closed. Try again when ready.', 'auth/network-request-failed': 'Check your internet connection and try again.', 'auth/weak-password': 'Use a password with at least 10 characters.', 'auth/user-token-expired': 'Please sign out and sign in again to refresh your account.', 'auth/invalid-action-code': 'That link expired or was already used. Request a fresh verification email.', 'auth/expired-action-code': 'That link expired. Request a fresh verification email.' };
      setMessage(messages[error.code] || 'Could not complete sign-in. Please try again.');
    } finally { setBusy(false); }
  };
  const logout = () => perform(async () => { const { auth, sdk } = await authClient(); await sdk.signOut(auth); setMode('login'); setMessage(''); setBrowse(true); });
  const submit = event => {
    event.preventDefault(); const data = new FormData(event.currentTarget);
    perform(async () => {
      const { auth, sdk } = await authClient();
      if (mode === 'reset') { await sdk.sendPasswordResetEmail(auth, data.get('email'), emailContinueSettings()); setMessage('If an account exists, a reset link has been sent.'); return; }
      if (mode === 'signup') {
        const credential = await sdk.createUserWithEmailAndPassword(auth, data.get('email'), data.get('password'));
        await sdk.updateProfile(credential.user, { displayName: data.get('name').trim() });
        await sdk.sendEmailVerification(credential.user, emailContinueSettings()); setClock(Date.now()); setResendAt(Date.now() + 60000); setMessage('A new verification email was sent. Open the newest email from Q Fashion.');
      } else await sdk.signInWithEmailAndPassword(auth, data.get('email'), data.get('password'));
    });
  };
  if (loading && !browse) return <main className="auth-shell"><p role="status">Opening your wardrobe…</p></main>;
  if (user && !verified) return <main className="auth-shell"><section className="auth-story"><a href="/" className="wordmark">Q <span>FASHION</span></a><p className="eyebrow">ONE LAST STEP</p><h1>Your style.<br /><em>Your account.</em></h1><p>A secure start to your Q Fashion story.</p></section><section className="auth-card"><p className="eyebrow">Q FASHION ACCOUNT</p><h1>Check your inbox.</h1><p className="leading-7">Open the newest verification email sent to <strong className="break-all">{user.email}</strong> and tap its verification link. This page checks automatically when you return.</p><p className="notice mt-4">Link expired or invalid? Request a new email below. Also check your spam folder. Only open links you requested for this account.</p><p role="status" aria-live="polite" className="text-sm mt-4">{message}</p><button disabled={busy} className="btn-primary mt-4" onClick={() => perform(async () => { if (!await refreshVerification()) setMessage('Your email is still unverified. Open the newest Q Fashion email, or request a fresh link below.'); })}>{busy ? 'Checking…' : 'Check verification status'}</button><button disabled={busy || cooldown > 0} className="btn-ghost block mt-3" onClick={() => perform(async () => { const { auth, sdk } = await authClient(); await sdk.sendEmailVerification(auth.currentUser, emailContinueSettings()); setClock(Date.now()); setResendAt(Date.now() + 60000); setMessage('A fresh verification email was sent. Use the newest email from Q Fashion.'); })}>{cooldown ? 'Resend available in ' + cooldown + 's' : 'Send a fresh verification email'}</button><button className="btn-quiet mt-3" disabled={busy} onClick={logout}>Use another account / Sign out</button><a href="mailto:qfashion.shop1@gmail.com" className="text-link">Contact Q Fashion support ↗</a></section></main>;
  if (user || browse) return <App key={user?.uid || 'guest'} user={user} role={role} onAccount={() => { setMode('login'); setMessage(''); setBrowse(false); window.scrollTo(0, 0); }} onLogout={logout} />;
  return <main className="auth-shell">
    <section className="auth-story"><a href="/" className="wordmark">Q <span>FASHION</span></a><p className="eyebrow">THE NEIGHBOURHOOD EDIT</p><h1>Your city.<br />Your style.<br /><em>Your moment.</em></h1><p>Discover a new way to dress, from the shops around you.</p><div className="auth-orbit" aria-hidden="true">Q</div><span className="auth-caption">A LITTLE LOCAL. A LOT YOU.</span></section>
    <section className="auth-card"><p className="eyebrow">YOUR NEXT CHAPTER</p><h2>{mode === 'signup' ? 'A beautiful beginning.' : mode === 'reset' ? 'Find your way back.' : 'Welcome to your edit.'}</h2><p className="text-muted mb-6">{mode === 'signup' ? 'Create your Q Fashion account.' : mode === 'reset' ? 'We’ll send a password reset link.' : 'Sign in. Find something that feels like you.'}</p>
      {!isFirebaseConfigured && <p className="notice">Account setup is in progress. Sign-in and ordering are not open on this address yet. Explore Q Fashion or contact the founder for updates.</p>}
      {mode !== 'reset' && <button disabled={busy || !isFirebaseConfigured} className="btn-primary w-full py-3.5" onClick={() => perform(async () => { const { auth, sdk } = await authClient(); await sdk.signInWithPopup(auth, new sdk.GoogleAuthProvider()); })}>Continue with Google</button>}
      {mode !== 'reset' && <p className="text-sm text-muted mt-3 mb-6">Use your verified Google account to skip the email link.</p>}
      {mode !== 'reset' && <p className="eyebrow mb-3">Or continue with email</p>}
      <form onSubmit={submit} className="space-y-4">
        {mode === 'signup' && <label className="block">Your name<input required name="name" maxLength={80} autoComplete="name" className="field mt-2" /></label>}
        <label className="block">Email address<input required name="email" type="email" autoComplete="email" className="field mt-2" /></label>
        {mode !== 'reset' && <label className="block">Password<input required name="password" type="password" minLength={10} autoComplete={mode === 'signup' ? 'new-password' : 'current-password'} className="field mt-2" /></label>}
        <p role="status" className="text-sm">{message}</p><button disabled={busy || !isFirebaseConfigured} className="btn-primary w-full py-3.5">{busy ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'reset' ? 'Send reset link' : 'Sign in →'}</button>
      </form>
      <div className="flex flex-wrap justify-between mt-5"><button className="btn-quiet" onClick={() => { setMode(mode === 'signup' ? 'login' : 'signup'); setMessage(''); }}>{mode === 'signup' ? 'Already a member? Sign in' : 'Create an account'}</button><button className="btn-quiet" onClick={() => { setMode(mode === 'reset' ? 'login' : 'reset'); setMessage(''); }}>{mode === 'reset' ? 'Back to sign in' : 'Forgot password?'}</button></div>
      <button className="btn-quiet mt-5 w-full" onClick={() => setBrowse(true)}>Back to Q Fashion →</button>
    </section>
  </main>;
}

