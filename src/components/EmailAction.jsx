import { useEffect, useState } from 'react';
import { authClient } from '@/lib/auth.js';
import { readEmailAction, processEmailAction, emailActionError } from '@/lib/emailActions.js';
export default function EmailAction() {
  const [action] = useState(() => readEmailAction(window.location.search));
  const [status, setStatus] = useState(action ? 'loading' : 'error'), [result, setResult] = useState(null), [message, setMessage] = useState(action ? '' : 'This email link is incomplete. Sign in to request a new verification or password-reset email.'), [busy, setBusy] = useState(false);
  useEffect(() => {
    let active = true;
    // Remove the one-time token from the address bar and history after capturing it.
    window.history.replaceState(null, '', '/auth/action');
    if (action) authClient().then(({ auth, sdk }) => processEmailAction(auth, sdk, action)).then(value => { if (active) { setResult(value); setStatus(value.mode === 'resetPassword' ? 'reset' : 'success'); } }).catch(error => { if (active) { setMessage(emailActionError(error)); setStatus('error'); } });
    return () => { active = false; };
  }, [action]);
  const reset = async event => {
    event.preventDefault(); const form = new FormData(event.currentTarget), password = form.get('password');
    if (password !== form.get('confirm')) { setMessage('The passwords do not match.'); return; }
    setBusy(true); setMessage('');
    try { const { auth, sdk } = await authClient(); await sdk.confirmPasswordReset(auth, action.code, password); setStatus('reset-success'); }
    catch (error) { setMessage(error.code === 'auth/weak-password' ? 'Use a stronger password with at least 10 characters.' : emailActionError(error)); }
    finally { setBusy(false); }
  };
  const verified = status === 'success' && action?.mode === 'verifyEmail';
  return <main className="auth-shell"><section className="auth-story"><a href="/" className="wordmark">Q <span>FASHION</span></a><p className="eyebrow">YOUR ACCOUNT, TAKEN CARE OF</p><h1>A little closer.<br /><em>All yours.</em></h1><p>Secure account updates, with a personal touch.</p><div className="auth-orbit" aria-hidden="true">Q</div></section><section className="auth-card"><p className="eyebrow">Q FASHION ACCOUNT</p><h2>{status === 'loading' ? 'Checking your link…' : verified ? 'Your email is verified.' : status === 'success' ? 'Your account is updated.' : status === 'reset' ? 'A fresh start.' : status === 'reset-success' ? 'Your new password is ready.' : 'Let’s get you a fresh link.'}</h2><p role="status" aria-live="polite" className="text-sm leading-7 my-5">{message || (verified ? 'You can now sign in to Q Fashion. If your account is open in another tab, it will refresh when you return.' : status === 'reset' ? 'Choose a new password for your Q Fashion account.' : status === 'reset-success' ? 'Sign in with your new password to continue.' : status === 'loading' ? 'Please keep this page open while we confirm your email action.' : 'Continue to sign in to your account.')}</p>{status === 'reset' && <form className="space-y-4" onSubmit={reset}><label className="block text-sm">New password<input required type="password" name="password" autoComplete="new-password" minLength={10} className="field mt-2" /></label><label className="block text-sm">Confirm new password<input required type="password" name="confirm" autoComplete="new-password" minLength={10} className="field mt-2" /></label><button disabled={busy} className="btn-primary w-full">{busy ? 'Saving…' : 'Save new password'}</button></form>}{status !== 'loading' && <a href="/?account=1" className="btn-primary mt-5">{status === 'error' ? 'Sign in & request a fresh link →' : 'Continue to Q Fashion →'}</a>}<a href="mailto:qfashion.shop1@gmail.com" className="text-link mt-5">Need help? Contact Q Fashion ↗</a></section></main>;
}
