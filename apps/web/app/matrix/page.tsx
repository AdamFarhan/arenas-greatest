import { auth } from "@clerk/nextjs/server";
import { WinrateMatrixClient } from "@/components/winrate-matrix/winrate-matrix-client";

export default async function MatrixPage() {
  const { isAuthenticated, redirectToSignIn } = await auth();

  if (!isAuthenticated) return redirectToSignIn();

  return <WinrateMatrixClient />;
}
