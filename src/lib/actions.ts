'use client';

import * as dataStore from '@/lib/data';
import type { Person, Transaction } from './types';
import { aiPoweredTransactionCategorization } from '@/ai/flows/ai-powered-transaction-categorization-flow';

export async function addPersonAction(formData: Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>) {
  await dataStore.addPerson(formData);
}

export async function updatePersonAction(id: string, formData: Partial<Person>) {
  await dataStore.updatePerson(id, formData);
}

export async function deletePersonAction(id: string, deletedBy: string) {
  await dataStore.deletePerson(id, deletedBy);
}

export async function addTransactionAction(formData: Omit<Transaction, 'id' | 'createdAt' | 'srNo' | 'deleted'>) {
  await dataStore.addTransaction(formData);
}

export async function updateTransactionAction(id: string, formData: Partial<Transaction>) {
  const trx = await dataStore.getTransactionById(id);
  if (!trx) throw new Error('Transaction not found');
  await dataStore.updateTransaction(id, formData);
}

export async function deleteTransactionAction(id: string, deletedBy: string) {
  const trx = await dataStore.getTransactionById(id);
  if (!trx) throw new Error('Transaction not found');
  await dataStore.deleteTransaction(id, deletedBy);
}

export async function restorePersonAction(id: string) {
  await dataStore.restorePerson(id);
}

export async function restoreTransactionAction(id: string) {
    const trx = await dataStore.getTransactionById(id, true);
    if (!trx) throw new Error("Transaction not found in trash");
    await dataStore.restoreTransaction(id);
}

export async function getAiCategories(description: string) {
  if (!description.trim()) {
    return [];
  }
  try {
    const result = await aiPoweredTransactionCategorization({ transactionDescription: description });
    return result.suggestedCategories;
  } catch (error) {
    console.error('AI categorization failed:', error);
    return [];
  }
}
