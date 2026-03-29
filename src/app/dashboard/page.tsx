import { DataStore } from "@/lib/data";
import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function DashboardFallback() {
  return (
    <div className="container py-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} className="h-[110px]" />
        ))}
      </div>
      <Skeleton className="h-[400px]" />
    </div>
  )
}

export default async function DashboardPage() {
  const store = new DataStore();
  const persons = await store.getPersons();
  const transactions = await store.getAllTransactions();
  const user = store.getLoggedInUser();
  
  if (!user) return <DashboardFallback />;

  return (
    <Suspense fallback={<DashboardFallback />}>
      <DashboardClient persons={persons} transactions={transactions} username={user.username} />
    </Suspense>
  );
}
