'use client';

import { DashboardClient } from "@/components/dashboard/dashboard-client";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/hooks/use-app";
import { useEffect, useState } from "react";
import type { Person, Transaction } from "@/lib/types";

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

export default function DashboardPage() {
  const { user, store, isDataReady } = useApp();
  const [persons, setPersons] = useState<Person[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isDataReady) {
      if (user && store) {
        Promise.all([
          store.getPersons(),
          store.getAllTransactions()
        ]).then(([p, t]) => {
          setPersons(p);
          setTransactions(t);
          setIsLoading(false);
        });
      } else {
        // No user, AppContext will redirect. Stop loading.
        setIsLoading(false);
      }
    }
  }, [isDataReady, user, store]);

  if (!isDataReady || isLoading) {
    return <DashboardFallback />;
  }

  if (!user) {
      // This path will be hit when `isDataReady` is true but there's no logged in user.
      // AppContext should handle redirect, but we show fallback in the meantime.
      return <DashboardFallback />
  }

  return (
    <DashboardClient persons={persons} transactions={transactions} username={user.username} />
  );
}
