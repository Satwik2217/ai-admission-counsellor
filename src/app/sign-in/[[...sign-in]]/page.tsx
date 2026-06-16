"use client";

import { SignIn, ClerkLoaded, ClerkLoading, ClerkFailed } from "@clerk/nextjs";

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

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold tracking-tight">
            AI Admission Counselor
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Sign in to your account
          </p>
        </div>
        <ClerkLoading>
          <Fallback />
        </ClerkLoading>
        <ClerkFailed>
          <ErrorFallback />
        </ClerkFailed>
        <ClerkLoaded>
          <SignIn
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
      </div>
    </div>
  );
}
