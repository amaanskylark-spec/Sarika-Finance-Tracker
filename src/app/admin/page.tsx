import { DataStore } from '@/lib/data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DeletedList } from '@/components/admin/deleted-list';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { MainHeader } from '@/components/main-header';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const store = new DataStore();
  const deletedPersons = await store.getDeletedPersons();
  const deletedTransactions = await store.getDeletedTransactions();

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
                           <DeletedList items={deletedPersons} type="person" />
                        </TabsContent>
                        <TabsContent value="transactions" className="p-4">
                           <DeletedList items={deletedTransactions} type="transaction" />
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </main>
    </div>
  );
}
