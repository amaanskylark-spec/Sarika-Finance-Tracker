import { MainHeader } from '@/components/main-header';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen flex-col">
      <MainHeader />
      <main className="flex-1">{children}</main>
    </div>
  );
}
