'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { AddPersonDialog } from '@/components/add-person-dialog';
import { ArrowDownUp, ArrowUp, ArrowDown, UserPlus, TrendingUp, TrendingDown, IndianRupee } from 'lucide-react';
import type { Person, Transaction, SortKey, SortDirection } from '@/lib/types';

interface DashboardClientProps {
  persons: Person[];
  transactions: Transaction[];
  username: string;
  onDataChange: () => void;
}

export function DashboardClient({ persons, transactions, username, onDataChange }: DashboardClientProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState<SortKey>('updatedAt');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const router = useRouter();

  const summary = useMemo(() => {
    const totalGiven = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
    const totalReceived = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
    const totalPending = persons.reduce((acc, p) => acc + (p.initialBalance + transactions.filter(t => t.personId === p.id && t.type === 'expense').reduce((a, t) => a + t.amount, 0) - transactions.filter(t => t.personId === p.id && t.type === 'income').reduce((a, t) => a + t.amount, 0)), 0);
    
    const today = new Date().setHours(0, 0, 0, 0);
    const todaysTransactions = transactions.filter(t => new Date(t.date).setHours(0, 0, 0, 0) === today).length;

    return { totalGiven, totalReceived, totalPending, todaysTransactions };
  }, [transactions, persons]);

  const personBalances = useMemo(() => {
    return persons.map(person => {
      const personTransactions = transactions.filter(t => t.personId === person.id);
      const given = personTransactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
      const received = personTransactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
      const balance = person.initialBalance + given - received;
      
      const lastTransaction = personTransactions.sort((a, b) => b.date - a.date)[0];

      return { ...person, balance, lastTransaction };
    });
  }, [persons, transactions]);

  const filteredAndSortedPersons = useMemo(() => {
    return personBalances
      .filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()))
      .sort((a, b) => {
        let compareA, compareB;
        switch(sortKey) {
            case 'name':
                compareA = a.name.toLowerCase();
                compareB = b.name.toLowerCase();
                break;
            case 'balance':
                compareA = a.balance;
                compareB = b.balance;
                break;
            case 'updatedAt':
            default:
                compareA = a.updatedAt;
                compareB = b.updatedAt;
                break;
        }

        if (compareA < compareB) return sortDirection === 'asc' ? -1 : 1;
        if (compareA > compareB) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      });
  }, [personBalances, searchTerm, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(prev => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDirection('desc');
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };
  
  const getBalanceColor = (balance: number) => {
    if (balance > 0) return 'text-red-600';
    if (balance === 0) return 'text-green-600';
    return 'text-primary';
  }

  const getSortIcon = (key: SortKey) => {
    if (sortKey !== key) return <ArrowDownUp className="h-4 w-4" />;
    if (sortDirection === 'desc') return <ArrowDown className="h-4 w-4" />;
    return <ArrowUp className="h-4 w-4" />;
  };

  return (
    <div className="container py-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Pending</CardTitle>
            <IndianRupee className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalPending)}</div>
            <p className="text-xs text-muted-foreground">Total amount owed</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Given</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalGiven)}</div>
            <p className="text-xs text-muted-foreground">Lifetime expenses</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Received</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(summary.totalReceived)}</div>
            <p className="text-xs text-muted-foreground">Lifetime income</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Today's Transactions</CardTitle>
            <ArrowDownUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+{summary.todaysTransactions}</div>
            <p className="text-xs text-muted-foreground">Transactions made today</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <CardTitle className="font-headline">People</CardTitle>
            <div className="flex gap-2 w-full sm:w-auto">
              <Input
                placeholder="Search by name..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full sm:w-[250px]"
              />
              <AddPersonDialog username={username} onComplete={onDataChange}>
                <Button>
                  <UserPlus className="mr-2 h-4 w-4" /> Add Person
                </Button>
              </AddPersonDialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="cursor-pointer" onClick={() => handleSort('name')}>
                  <div className="flex items-center gap-2">Name {getSortIcon('name')}</div>
                </TableHead>
                <TableHead className="text-right cursor-pointer" onClick={() => handleSort('balance')}>
                   <div className="flex items-center justify-end gap-2">Balance {getSortIcon('balance')}</div>
                </TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell cursor-pointer" onClick={() => handleSort('updatedAt')}>
                  <div className="flex items-center gap-2">Last Activity {getSortIcon('updatedAt')}</div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredAndSortedPersons.map((person) => (
                <TableRow 
                  key={person.id} 
                  className="cursor-pointer"
                  onClick={() => router.push(`/dashboard/person/${person.id}`)}
                >
                    <TableCell className="font-medium">{person.name}</TableCell>
                    <TableCell className={`text-right font-semibold ${getBalanceColor(person.balance)}`}>{formatCurrency(person.balance)}</TableCell>
                    <TableCell>
                      {person.balance === 0 ? (
                        <Badge variant="outline" className="text-green-600 border-green-600">Settled</Badge>
                      ) : (
                        <Badge variant="destructive" className="bg-red-100 text-red-700 border-red-200 hover:bg-red-200">Pending</Badge>
                      )}
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {person.lastTransaction ? `${new Date(person.lastTransaction.date).toLocaleDateString()}: ${formatCurrency(person.lastTransaction.amount)} (${person.lastTransaction.type})` : 'No transactions'}
                    </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
            {filteredAndSortedPersons.length === 0 && (
                <div className="text-center py-10 text-muted-foreground">
                    No people found.
                </div>
            )}
        </CardContent>
      </Card>
    </div>
  );
}
