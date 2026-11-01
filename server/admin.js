import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore } from 'firebase-admin/firestore';
import { Firestore } from '@google-cloud/firestore';
import { ExternalAccountClient } from 'google-auth-library';
import { getVercelOidcToken } from '@vercel/oidc';
import { requireValue } from './domain.js';
let cached;
export function services() {
  const projectId = process.env.FIREBASE_PROJECT_ID;
  const allowed = process.env.QF_ALLOWED_PROJECT_ID || process.env.QF_STAGING_PROJECT_ID;
  requireValue(projectId && projectId === allowed, 'Account service is not configured', 503);
  const production = process.env.VERCEL_ENV === 'production';
  requireValue(!production || process.env.QF_DEPLOYMENT_ENV === 'production', 'Live account service is not configured', 503);
  requireValue(!production || projectId === 'qfashion-live-20261101', 'Invalid live project configuration', 503);
  if (cached) return cached;
  if (process.env.GCP_WORKLOAD_IDENTITY_PROVIDER) {
    const provider = process.env.GCP_WORKLOAD_IDENTITY_PROVIDER;
    const email = process.env.GCP_SERVICE_ACCOUNT_EMAIL;
    requireValue(/^projects\/[0-9]+\/locations\/global\/workloadIdentityPools\/qfashion-vercel\/providers\/vercel$/.test(provider) && email === `qfashion-web@${projectId}.iam.gserviceaccount.com`, 'Invalid backend identity configuration', 503);
    const client = ExternalAccountClient.fromJSON({ type: 'external_account', audience: `//iam.googleapis.com/${provider}`, subject_token_type: 'urn:ietf:params:oauth:token-type:jwt', token_url: 'https://sts.googleapis.com/v1/token', service_account_impersonation_url: `https://iamcredentials.googleapis.com/v1/projects/-/serviceAccounts/${email}:generateAccessToken`, subject_token_supplier: { getSubjectToken: getVercelOidcToken } });
    client.scopes = ['https://www.googleapis.com/auth/cloud-platform'];
    const credential = { async getAccessToken() { const result = await client.getAccessToken(); requireValue(result.token, 'Backend authentication unavailable', 503); return { access_token: result.token, expires_in: Math.max(60, Math.floor(((client.credentials.expiry_date || Date.now() + 300000) - Date.now()) / 1000)) }; } };
    const app = getApps().find(app => app.name === projectId) || initializeApp({ projectId, credential }, projectId);
    cached = { db: new Firestore({ projectId, authClient: client, preferRest: true }), auth: getAuth(app), cloudCredential: credential };
  } else {
    requireValue(!production && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY, 'Backend identity is not configured', 503);
    const app = getApps().find(app => app.name === projectId) || initializeApp({ projectId, credential: cert({ projectId, clientEmail: process.env.FIREBASE_CLIENT_EMAIL, privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') }) }, projectId);
    cached = { db: getFirestore(app), auth: getAuth(app) };
  }
  return cached;
}
export async function authenticate(req, auth) {
  const match = /^Bearer (.+)$/.exec(req.headers.authorization || '');
  requireValue(match, 'Please sign in', 401);
  let user;
  try { user = await auth.verifyIdToken(match[1], true); } catch { requireValue(false, 'Your session has expired. Sign in again', 401); }
  requireValue(user.email_verified === true, 'Verify your email before continuing', 403);
  const owner = process.env.QF_ADMIN_EMAIL && user.email?.toLowerCase() === process.env.QF_ADMIN_EMAIL.toLowerCase();
  return { uid: user.uid, email: user.email || null, name: user.name || '', role: owner ? 'admin' : user.role || 'customer', vendorId: user.vendorId || null };
}
export async function routeAuthentication() {
  if (process.env.GOOGLE_MAPS_SERVER_KEY) return { 'X-Goog-Api-Key': process.env.GOOGLE_MAPS_SERVER_KEY };
  requireValue(process.env.GOOGLE_ROUTES_ENABLED === 'true', 'Google Routes awaits billing activation', 503);
  const { cloudCredential } = services();
  requireValue(cloudCredential, 'Google Routes identity is not configured', 503);
  const token = await cloudCredential.getAccessToken();
  return { Authorization: `Bearer ${token.access_token}`, 'X-Goog-User-Project': process.env.FIREBASE_PROJECT_ID };
}
