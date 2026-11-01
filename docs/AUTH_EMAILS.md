# Authentication email configuration

Firebase projects: qfashion-live-20261101 (production), qfashion-staging-20261101 (Preview). Verification remains mandatory on authenticated APIs.

Sender settings for verification and password reset: senderDisplayName = Q Fashion; senderLocalPart = qfashion; replyTo = qfashion.shop1@gmail.com. Preserve the existing Firebase email body when updating a template. A partial nested-field patch was rejected with EMAIL_TEMPLATE_UPDATE_NOT_ALLOWED; reading and updating the complete template succeeded. Do not publish SMTP credentials or authentication action codes.

Read back authorizedDomains from Identity Platform admin v2 after configuration. Production must include qfashion.shop and www.qfashion.shop as well as the existing Firebase defaults. Staging includes localhost and the stable feature-preview hostname. A prior CLI auth deployment had enabled providers but had not persisted the intended custom-domain allowlist; the API was used to correct and verify it.

After the handler is deployed, set notification.sendEmail.callbackUri to https://www.qfashion.shop/auth/action for production. The route handles verifyEmail, resetPassword, recoverEmail and verifyAndChangeEmail. Verify the actual action type before applying a code, deduplicate React effect retries, and never accept an arbitrary continue URL as a redirect target. Invalid/expired/used links must direct the user to sign in and request a fresh email. Old expired codes cannot be revived.

The app checks verification on focus/visibility return and periodically while unverified. Resends have a 60-second UI cooldown in addition to Firebase rate limiting. The backend still validates a signed, unrevoked Firebase token with email_verified=true. No administrator override marks real users verified.

Numeric email OTP is requested but is not active. Resend was discovered through Vercel Marketplace messaging discovery; no email provider or email-sending secret was already connected. Automatic approval review blocked installing Resend because it creates a new API key and stores it in Vercel. Do not bypass that block or scaffold a pretend email OTP. Obtain the user's specific approval for the Resend connection, provision it, verify a sender domain, then implement and test short-lived hashed OTPs with per-user and global sending limits, bounded attempts and one-time consumption. Never return or log the code. Keep the built-in Firebase link fallback available until real delivery is tested.
