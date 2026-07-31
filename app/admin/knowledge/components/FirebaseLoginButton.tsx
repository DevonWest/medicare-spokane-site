"use client";

import { useState } from "react";
import {
  getApps,
  initializeApp,
  type FirebaseOptions,
} from "firebase/app";
import {
  getAuth,
  GoogleAuthProvider,
  inMemoryPersistence,
  setPersistence,
  signInWithPopup,
  signOut,
} from "firebase/auth";

const firebaseOptions: FirebaseOptions = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
};

function hasFirebaseBrowserConfig(): boolean {
  return Boolean(
    firebaseOptions.apiKey &&
      firebaseOptions.authDomain &&
      firebaseOptions.projectId,
  );
}

export default function FirebaseLoginButton() {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const configured = hasFirebaseBrowserConfig();

  async function signIn() {
    if (!configured || pending) {
      return;
    }

    setPending(true);
    setError("");
    try {
      const app =
        getApps().find((candidate) => candidate.name === "knowledge-cms-auth") ??
        initializeApp(firebaseOptions, "knowledge-cms-auth");
      const auth = getAuth(app);
      await setPersistence(auth, inMemoryPersistence);
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      const credential = await signInWithPopup(auth, provider);
      const idToken = await credential.user.getIdToken();
      const response = await fetch("/admin/knowledge/auth/session", {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ idToken }),
      });
      await signOut(auth);

      if (!response.ok) {
        throw new Error("unauthorized");
      }
      window.location.assign("/admin/knowledge");
    } catch {
      setError(
        "Sign-in did not complete. Use a verified account with Knowledge CMS access and try again.",
      );
      setPending(false);
    }
  }

  return (
    <div>
      <button
        className="inline-flex min-h-12 items-center justify-center rounded-lg bg-slate-950 px-6 py-3 font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        disabled={!configured || pending}
        onClick={signIn}
        type="button"
      >
        {pending ? "Signing in…" : "Sign in with Google"}
      </button>
      {!configured ? (
        <p className="mt-4 max-w-xl text-sm leading-6 text-amber-800">
          Firebase browser authentication is not configured for this
          deployment.
        </p>
      ) : null}
      {error ? (
        <p aria-live="polite" className="mt-4 max-w-xl text-sm leading-6 text-red-700">
          {error}
        </p>
      ) : null}
    </div>
  );
}
