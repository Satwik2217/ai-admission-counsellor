import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function WidgetTestPage() {
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { organization: true },
  });
  if (!membership) redirect("/dashboard/onboarding");

  const slug = membership.organization.slug;

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 p-8">
      <div className="w-full max-w-2xl rounded-xl border bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold">Widget Test Page</h1>
        <p className="mt-2 text-muted-foreground">
          This page simulates a third-party website embedding the widget. The chat bubble should appear at the bottom-right.
        </p>

        <div className="mt-6 rounded-lg bg-muted p-4">
          <h2 className="text-sm font-medium mb-2">Embed Code</h2>
          <pre className="overflow-x-auto rounded border bg-card p-3 text-xs">
{`<script src="${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/widget.js" data-org="${slug}"></script>`}
          </pre>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Light Mode</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Widget appears with light theme by default. Toggle dark mode from the header.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Mobile Responsive</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Resize the browser to see the widget adapt to mobile screens.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">AI-Powered</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Chat connects to your institute&apos;s AI with RAG context.
            </p>
          </div>
          <div className="rounded-lg border p-4">
            <h3 className="font-medium">Cross-Domain</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Works on any website via script tag with CORS-enabled API.
            </p>
          </div>
        </div>
      </div>

      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              var s = document.createElement("script");
              s.src = "${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/widget.js";
              s.setAttribute("data-org", "${slug}");
              document.body.appendChild(s);
            })();
          `,
        }}
      />
    </div>
  );
}
