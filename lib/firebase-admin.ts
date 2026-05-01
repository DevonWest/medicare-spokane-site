import "server-only";

import { cert, getApps, initializeApp, applicationDefault, type App } from "firebase-admin/app";
import { getFirestore, initializeFirestore, type Firestore } from "firebase-admin/firestore";

/**
 * Lazy, server-only Firebase Admin initializer.
 *
 * Credentials resolution (in order):
 *   1. `FIREBASE_PROJECT_ID` + `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY`
 *      (recommended for portable deployments — store the private key in a
 *      secret manager and inject as an env var at runtime).
 *   2. Application Default Credentials — automatically used on Google Cloud
 *      Run / Cloud Functions when the service account has Firestore access.
 *
 * The admin SDK is intentionally only imported via this module, which is
 * marked `server-only` so a client component pulling it in fails the build.
 */

const APP_NAME = "medicareinspokane-admin";

let cachedDb: Firestore | null = null;

function env(name: string): string | undefined {
  const value = process.env[name]?.trim();
  return value ? value : undefined;
}

function resolveProjectId(): string | undefined {
  return env("FIREBASE_PROJECT_ID") ?? env("GOOGLE_CLOUD_PROJECT") ?? env("GCLOUD_PROJECT") ?? env("GCP_PROJECT");
}

export interface FirebaseAdminEnvSummary {
  configured: boolean;
  hasFirebaseProjectId: boolean;
  hasGoogleApplicationCredentials: boolean;
  hasExplicitServiceAccount: boolean;
  isCloudRun: boolean;
}

export function getFirebaseAdminEnvSummary(): FirebaseAdminEnvSummary {
  const hasFirebaseProjectId = Boolean(env("FIREBASE_PROJECT_ID"));
  const hasClientEmail = Boolean(env("FIREBASE_CLIENT_EMAIL"));
  const hasPrivateKey = Boolean(process.env.FIREBASE_PRIVATE_KEY?.trim());
  const hasExplicitServiceAccount = hasFirebaseProjectId && hasClientEmail && hasPrivateKey;
  const hasGoogleApplicationCredentials = Boolean(env("GOOGLE_APPLICATION_CREDENTIALS"));
  const isCloudRun = Boolean(env("K_SERVICE") || env("K_REVISION") || env("K_CONFIGURATION"));

  return {
    configured:
      hasExplicitServiceAccount ||
      hasGoogleApplicationCredentials ||
      Boolean(resolveProjectId()) ||
      isCloudRun,
    hasFirebaseProjectId,
    hasGoogleApplicationCredentials,
    hasExplicitServiceAccount,
    isCloudRun,
  };
}

function buildApp(): App {
  // Reuse the named app across hot reloads / route invocations.
  const existing = getApps().find((a) => a.name === APP_NAME);
  if (existing) return existing;

  const projectId = resolveProjectId();
  const clientEmail = env("FIREBASE_CLIENT_EMAIL");
  // Private keys in env vars often have escaped newlines — undo that.
  const privateKey = env("FIREBASE_PRIVATE_KEY")?.replace(/\\n/g, "\n");

  if (projectId && clientEmail && privateKey) {
    return initializeApp(
      {
        credential: cert({ projectId, clientEmail, privateKey }),
        projectId,
      },
      APP_NAME,
    );
  }

  // Fall back to ADC (Cloud Run service account, gcloud auth, etc.).
  return initializeApp(
    {
      credential: applicationDefault(),
      ...(projectId ? { projectId } : {}),
    },
    APP_NAME,
  );
}

/**
 * Returns a Firestore client, lazily creating the admin app on first use.
 * Throws if credentials cannot be resolved — callers should treat this as
 * a hard server error and surface a generic message to users.
 */
export function getFirestoreAdmin(): Firestore {
  if (cachedDb) return cachedDb;
  // Will throw a clear message from the SDK if creds are missing.
  const app = buildApp();
  cachedDb = initializeFirestore(app, { ignoreUndefinedProperties: true });
  return cachedDb;
}

/**
 * Best-effort check used by health endpoints / startup. Returns true if
 * we *think* admin credentials are wired up. Does not perform a live call.
 */
export function isFirebaseAdminConfigured(): boolean {
  return getFirebaseAdminEnvSummary().configured;
}
