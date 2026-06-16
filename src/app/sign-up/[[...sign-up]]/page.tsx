"use client";

import { SignUp, useClerk, ClerkLoaded, ClerkLoading, ClerkFailed } from "@clerk/nextjs";
import { useEffect, useState } from "react";

function DebugClerkStatus() {
  const clerk = useClerk();
  const [status, setStatus] = useState("initializing");
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    try {
      setLoaded(clerk.loaded);
      setStatus(clerk.status || "unknown");
      if (clerk.status === "error") {
        setError("Clerk status is 'error'");
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }, [clerk, clerk.loaded, clerk.status]);

  return (
    <div className="mt-4 rounded border border-yellow-300 bg-yellow-50 p-3 text-xs text-yellow-900">
      <p>Clerk loaded: {String(loaded)}</p>
      <p>Clerk status: {status}</p>
      {error && <p className="text-red-600">Error: {error}</p>}
    </div>
  );
}

function Fallback() {
  return (
    <div className="flex w-full items-center justify-center p-8">
      <p className="text-sm text-muted-foreground">Loading authentication...</p>
    </div>
  );
}

function ErrorFallback() {
  return (
    <div className="flex w-full items-center justify-center p-8">
      <div className="rounded border border-red-200 bg-red-50 p-4 text-center">
        <p className="text-sm font-medium text-red-800">Failed to load authentication</p>
        <p className="mt-1 text-xs text-red-600">Check the browser console for errors</p>
      </div>
    </div>
  );
}

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            AI Admission Counselor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Create your account
          </p>
        </div>
        <ClerkLoading>
          <Fallback />
        </ClerkLoading>
        <ClerkFailed>
          <ErrorFallback />
        </ClerkFailed>
        <ClerkLoaded>
          <SignUp
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border p-6",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                socialButtonsBlockButton: "text-sm",
                formButtonPrimary: "bg-primary text-primary-foreground hover:bg-primary/90",
              },
            }}
          />
        </ClerkLoaded>
        <DebugClerkStatus />
      </div>
    </div>
  );
}
