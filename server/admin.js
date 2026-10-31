import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { requireValue } from './domain.js';
export function services() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  requireValue(projectId && projectId === process.env.QF_STAGING_PROJECT_ID, 'Staging backend is not configured', 503);
  requireValue(process.env.VERCEL_ENV !== 'production', 'Production checkout is not enabled', 503);
  if (!getApps().length) {
    requireValue(process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY, 'Staging credentials are missing', 503);
    initializeApp({ credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) });
  }
  return { db: getFirestore(), auth: getAuth() };
}
export async function authenticate(req, auth) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  requireValue(match, 'Please sign in', 401);
  let user;
  try { user = await auth.verifyIdToken(match[1], true); } catch { requireValue(false, 'Your session has expired. Sign in again', 401); }
  requireValue(user.email_verified === true, 'Verify your email before continuing', 403);
  return { uid: user.uid, email: user.email || null, role: user.role || 'customer', vendorId: user.vendorId || null };
}
