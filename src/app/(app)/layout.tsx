import { AppNav } from "@/components/AppNav";
import { requireUser } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  return (
    <AppNav userName={user.username}>
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-5 sm:py-8">{children}</main>
    </AppNav>
  );
}
