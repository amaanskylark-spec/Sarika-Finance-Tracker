'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddTransactionDialog } from '@/components/add-transaction-dialog';
import { Download, Edit, Trash2, ArrowLeft, IndianRupee, Phone, FileText } from 'lucide-react';
import type { Person, Transaction } from '@/lib/types';
import Link from 'next/link';
import { generatePersonPdf } from '@/lib/pdf';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { deleteTransactionAction } from '@/lib/actions';
import { useApp } from '@/hooks/use-app';

interface PersonClientProps {
  person: Person;
  transactions: Transaction[];
}

export function PersonClient({ person: initialPerson, transactions: initialTransactions }: PersonClientProps) {
  const { toast } = useToast();
  const { user } = useApp();

  const { person, transactions, balance } = useMemo(() => {
    const sortedTransactions = [...initialTransactions].sort((a, b) => a.srNo - b.srNo);
    const given = sortedTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const received = sortedTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const currentBalance = initialPerson.initialBalance + given - received;
    return { person: initialPerson, transactions: sortedTransactions, balance: currentBalance };
  }, [initialPerson, initialTransactions]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };
  
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600';
    if (balance === 0) return 'text-green-600';
    return 'text-blue-600';
  }

  const handleDownloadPdf = () => {
    generatePersonPdf(person, transactions, balance);
    toast({
      title: "PDF Generated",
      description: "Your PDF has been downloaded."
    });
  }

  const handleDeleteTransaction = async (id: string) => {
    if (!user) return;
    try {
      await deleteTransactionAction(id, user.username);
      toast({
        title: "Transaction Deleted",
        description: "The transaction has been moved to the trash."
      });
    } catch(e) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete transaction."
      });
    }
  }

  return (
    <div className="container py-6">
      <Link href="/dashboard" className="inline-flex items-center gap-2 mb-4 text-sm text-muted-foreground hover:text-primary">
        <ArrowLeft className="h-4 w-4" />
        Back to Dashboard
      </Link>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="font-headline text-3xl">{person.name}</CardTitle>
              <CardDescription className="mt-2 flex flex-col sm:flex-row sm:items-center gap-x-4 gap-y-1">
                {person.phone && (
                  <span className="flex items-center gap-2"><Phone className="h-4 w-4" /> {person.phone}</span>
                )}
                {person.notes && (
                  <span className="flex items-center gap-2"><FileText className="h-4 w-4" /> {person.notes}</span>
                )}
              </CardDescription>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Current Balance</p>
              <p className={`text-3xl font-bold ${getBalanceColor(balance)}`}>{formatCurrency(balance)}</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="font-headline">Transaction History</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleDownloadPdf}>
                <Download className="mr-2 h-4 w-4" /> Download PDF
              </Button>
              <AddTransactionDialog personId={person.id}>
                <Button>Add Transaction</Button>
              </AddTransactionDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Sr. No.</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Added By</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell className="font-medium">{t.srNo}</TableCell>
                    <TableCell>{new Date(t.date).toLocaleDateString()}</TableCell>
                    <TableCell>{t.description}</TableCell>
                    <TableCell>{t.category || '-'}</TableCell>
                    <TableCell className={`text-right font-semibold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>
                      {formatCurrency(t.amount)}
                    </TableCell>
                    <TableCell>
                      {t.type === 'income' ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Received</Badge>
                      ) : (
                        <Badge variant="destructive">Given</Badge>
                      )}
                    </TableCell>
                    <TableCell>{t.addedBy}</TableCell>
                    <TableCell className="flex gap-2">
                       <AddTransactionDialog personId={person.id} transaction={t}>
                         <Button variant="ghost" size="icon"><Edit className="h-4 w-4" /></Button>
                       </AddTransactionDialog>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This will move the transaction to the trash. You can restore it from the admin panel.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDeleteTransaction(t.id)} className="bg-destructive hover:bg-destructive/90">Delete</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          {transactions.length === 0 && (
            <div className="text-center py-10 text-muted-foreground">
              No transactions found for {person.name}.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
