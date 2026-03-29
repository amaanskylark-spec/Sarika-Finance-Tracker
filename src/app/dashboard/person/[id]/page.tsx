'use client';

import { PersonClient } from "@/components/person/person-client";
import { notFound } from "next/navigation";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { useApp } from "@/hooks/use-app";
import type { Person, Transaction } from "@/lib/types";

function PersonDetailFallback() {
    return (
      <div className="container py-6">
        <Skeleton className="h-8 w-48 mb-4" />
        <Skeleton className="h-36 mb-6" />
        <Skeleton className="h-80" />
      </div>
    );
}

export default function PersonDetailPage({ params }: { params: { id: string } }) {
    const { store, isDataReady } = useApp();
    const [person, setPerson] = useState<Person | null | undefined>(undefined);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    
    useEffect(() => {
        const loadData = async () => {
            if (store) {
                const personData = await store.getPersonById(params.id);
                if (personData) {
                    const transactionData = await store.getTransactionsByPersonId(params.id);
                    setPerson(personData);
                    setTransactions(transactionData);
                } else {
                    setPerson(null); // Not found
                }
            }
        };

        if (isDataReady) {
            loadData();
        }
    }, [isDataReady, store, params.id]);

    if (person === undefined) {
        return <PersonDetailFallback />;
    }

    if (person === null) {
        notFound();
    }

    // person is defined and not null here, so it is a Person object.
    // The explicit cast is to satisfy TypeScript.
    return (
        <PersonClient person={person as Person} transactions={transactions} />
    );
}
