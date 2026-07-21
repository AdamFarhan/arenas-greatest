import { UserButton } from "@clerk/nextjs";
import { auth } from "@clerk/nextjs/server";

export default async function HomePage() {
  const { isAuthenticated, redirectToSignIn, userId } = await auth();

  if (!isAuthenticated) {
    return redirectToSignIn();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <section className="w-full max-w-lg rounded-lg border bg-card p-8 text-card-foreground shadow-sm">
        <div className="flex items-start justify-between gap-6">
          <div>
            <p className="text-sm font-medium text-muted-foreground">The Arena&apos;s Greatest</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal">Auth successful</h1>
          </div>
          <UserButton afterSignOutUrl="/login" />
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          You are signed in with Clerk and ready to continue.
        </p>
        <p className="mt-4 break-all rounded-md bg-muted px-3 py-2 font-mono text-xs text-muted-foreground">
          {userId}
        </p>
      </section>
    </main>
  );
}
