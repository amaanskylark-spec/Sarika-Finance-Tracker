'use client';

import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { restorePersonAction, restoreTransactionAction } from '@/lib/actions';
import type { Person, Transaction } from '@/lib/types';
import { History } from 'lucide-react';

type Item = Person | Transaction;

interface DeletedListProps<T extends Item> {
  items: T[];
  type: 'person' | 'transaction';
}

export function DeletedList<T extends Item>({ items, type }: DeletedListProps<T>) {
  const { toast } = useToast();
  const router = useRouter();

  const handleRestore = async (id: string) => {
    try {
      if (type === 'person') {
        await restorePersonAction(id);
      } else {
        await restoreTransactionAction(id);
      }
      toast({
        title: 'Item Restored',
        description: `The ${type} has been successfully restored.`,
      });
      router.refresh();
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: `Failed to restore ${type}.`,
      });
    }
  };

  const renderPersonRow = (item: Person) => (
    <TableRow key={item.id}>
      <TableCell className="font-medium">{item.name}</TableCell>
      <TableCell>{item.notes || '-'}</TableCell>
      <TableCell>{new Date(item.createdAt).toLocaleString()}</TableCell>
      <TableCell>{item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '-'}</TableCell>
      <TableCell>{item.deletedBy || '-'}</TableCell>
      <TableCell>
        <Button size="sm" onClick={() => handleRestore(item.id)}>
          <History className="mr-2 h-4 w-4" /> Restore
        </Button>
      </TableCell>
    </TableRow>
  );

  const renderTransactionRow = (item: Transaction) => (
    <TableRow key={item.id}>
      <TableCell>{item.srNo}</TableCell>
      <TableCell>{new Date(item.date).toLocaleDateString()}</TableCell>
      <TableCell>{item.description}</TableCell>
      <TableCell>{new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(item.amount)}</TableCell>
      <TableCell>{item.deletedAt ? new Date(item.deletedAt).toLocaleString() : '-'}</TableCell>
      <TableCell>{item.deletedBy || '-'}</TableCell>
      <TableCell>
        <Button size="sm" onClick={() => handleRestore(item.id)}>
          <History className="mr-2 h-4 w-4" /> Restore
        </Button>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="overflow-x-auto">
        <Table>
            <TableHeader>
                {type === 'person' ? (
                <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Notes</TableHead>
                    <TableHead>Added At</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
                ) : (
                <TableRow>
                    <TableHead>Sr. No.</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Deleted At</TableHead>
                    <TableHead>Deleted By</TableHead>
                    <TableHead>Action</TableHead>
                </TableRow>
                )}
            </TableHeader>
            <TableBody>
                {items.length > 0 ? (
                items.map(item => type === 'person' ? renderPersonRow(item as Person) : renderTransactionRow(item as Transaction))
                ) : (
                <TableRow>
                    <TableCell colSpan={6} className="h-24 text-center">
                    No deleted {type}s.
                    </TableCell>
                </TableRow>
                )}
            </TableBody>
        </Table>
    </div>
  );
}
