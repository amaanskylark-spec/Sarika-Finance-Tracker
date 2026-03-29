import { DataStore } from "@/lib/data";
import { PersonClient } from "@/components/person/person-client";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const dynamic = 'force-dynamic';

function PersonDetailFallback() {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-36 mb-6" />
        <Skeleton className="h-80" />
      </div>
    );
}

export default async function PersonDetailPage({ params }: { params: { id: string } }) {
  const store = new DataStore();
  const person = await store.getPersonById(params.id);
  
  if (!person) {
    notFound();
  }
  
  const transactions = await store.getTransactionsByPersonId(params.id);

  return (
    <Suspense fallback={<PersonDetailFallback />}>
      <PersonClient person={person} transactions={transactions} />
    </Suspense>
  );
}
