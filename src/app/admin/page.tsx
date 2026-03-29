'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeletedList } from '@/components/admin/deleted-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MainHeader } from '@/components/main-header';
import { useApp } from '@/hooks/use-app';
import type { Person, Transaction } from '@/lib/types';
import { Skeleton } from '@/components/ui/skeleton';

function AdminPageFallback() {
    return (
        <div className="relative flex min-h-screen flex-col">
            <MainHeader />
            <main className="flex-1 container py-6">
                <div className="flex items-center justify-between mb-4">
                    <Skeleton className="h-9 w-96" />
                    <Skeleton className="h-10 w-36" />
                </div>
                <Card>
                    <CardContent className="p-0">
                        <Skeleton className="h-12 w-full rounded-b-none border-b" />
                        <div className="p-4">
                            <Skeleton className="h-64 w-full" />
                        </div>
                    </CardContent>
                </Card>
            </main>
        </div>
    )
}

export default function AdminPage() {
  const { store, isDataReady } = useApp();
  const [deletedPersons, setDeletedPersons] = useState<Person[]>([]);
  const [deletedTransactions, setDeletedTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);

  const refreshData = () => setRefreshKey(prev => prev + 1);

  useEffect(() => {
    async function loadDeletedItems() {
      if (store) {
        setIsLoading(true);
        const [persons, transactions] = await Promise.all([
          store.getDeletedPersons(),
          store.getDeletedTransactions(),
        ]);
        setDeletedPersons(persons);
        setDeletedTransactions(transactions);
        setIsLoading(false);
      }
    }
    if (isDataReady) {
      loadDeletedItems();
    }
  }, [store, isDataReady, refreshKey]);

  if (!isDataReady || isLoading) {
    return <AdminPageFallback />;
  }

  return (
    <div className="relative flex min-h-screen flex-col">
        <MainHeader />
        <main className="flex-1 container py-6">
            <div className="flex items-center justify-between mb-4">
                <h1 className="text-3xl font-bold font-headline">Sarkia — Admin Panel</h1>
                <Button asChild variant="outline">
                    <Link href="/dashboard"><ArrowLeft className="mr-2 h-4 w-4" />Back to App</Link>
                </Button>
            </div>
            <Card>
                <CardContent className="p-0">
                    <Tabs defaultValue="persons">
                        <TabsList className="p-2 h-auto rounded-b-none border-b">
                            <TabsTrigger value="persons">Deleted Persons</TabsTrigger>
                            <TabsTrigger value="transactions">Deleted Transactions</TabsTrigger>
                        </TabsList>
                        <TabsContent value="persons" className="p-4">
                           <DeletedList items={deletedPersons} type="person" onRestore={refreshData} />
                        </TabsContent>
                        <TabsContent value="transactions" className="p-4">
                           <DeletedList items={deletedTransactions} type="transaction" onRestore={refreshData} />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
