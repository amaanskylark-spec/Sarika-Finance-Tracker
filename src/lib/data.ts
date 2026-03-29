'use client';

import type { User, Person, Transaction } from './types';

// Keys for localStorage
const USERS_KEY = 'sarkia_users';
const PERSONS_KEY = 'sarkia_persons';
const TRANSACTIONS_KEY = 'sarkia_transactions';
const LOGGED_IN_USER_KEY = 'sarkia_loggedInUser';

// Default data
const defaultUsers: User[] = [
  { id: 'user-1', username: 'WasimShaikh' },
];
const defaultPersons: Person[] = [];
const defaultTransactions: Transaction[] = [];

// In-memory cache
let users: User[] = [];
let persons: Person[] = [];
let transactions: Transaction[] = [];
let isInitialized = false;

// Helper functions for storage
function isServer(): boolean {
  return typeof window === 'undefined';
}

function readFromStorage<T>(key: string, defaultValue: T): T {
  if (isServer()) {
    return defaultValue;
  }
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading localStorage key “${key}”:`, error);
    return defaultValue;
  }
}

function writeToStorage<T>(key: string, value: T) {
  if (isServer()) {
    return;
  }
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing to localStorage key “${key}”:`, error);
  }
}
  
function readFromSession<T>(key: string, defaultValue: T): T {
  if (isServer()) {
    return defaultValue;
  }
  try {
    const item = sessionStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.warn(`Error reading sessionStorage key “${key}”:`, error);
    return defaultValue;
  }
}

function writeToSession<T>(key: string, value: T) {
  if (isServer()) {
    return;
  }
  try {
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.warn(`Error writing to sessionStorage key “${key}”:`, error);
  }
}

// Initialization function
export function initDataStore() {
    if (isInitialized || isServer()) return;
    users = readFromStorage(USERS_KEY, defaultUsers);
    persons = readFromStorage(PERSONS_KEY, defaultPersons);
    transactions = readFromStorage(TRANSACTIONS_KEY, defaultTransactions);
    isInitialized = true;
}

// --- Auth ---
export function login(username: string, password: string): User | null {
  initDataStore(); // Ensure data is loaded
  const user = users.find(u => u.username === username);
  // Bypassing password check for demo purposes
  if (user) {
    writeToSession(LOGGED_IN_USER_KEY, user);
    return user;
  }
  return null;
}

export function logout() {
  if (!isServer()) {
    sessionStorage.removeItem(LOGGED_IN_USER_KEY);
  }
}

export function getLoggedInUser(): User | null {
  return readFromSession(LOGGED_IN_USER_KEY, null);
}

// --- Persons ---
export async function getPersons(): Promise<Person[]> {
  return persons.filter(p => !p.deleted);
}

export async function getPersonById(id: string): Promise<Person | undefined> {
  return persons.find(p => p.id === id && !p.deleted);
}

export async function addPerson(data: Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): Promise<Person> {
  const now = Date.now();
  const initialBalanceValue = data.initialBalance;

  const newPerson: Person = {
    id: `person-${now}`,
    ...data,
    initialBalance: 0, // Set to 0 to prevent double counting
    createdAt: now,
    updatedAt: now,
    deleted: false,
  };
  persons.push(newPerson);
  writeToStorage(PERSONS_KEY, persons);

  if (initialBalanceValue !== 0) {
    const initialTransaction: Omit<Transaction, 'id' | 'createdAt' | 'srNo' | 'deleted'> = {
      personId: newPerson.id,
      amount: Math.abs(initialBalanceValue),
      type: initialBalanceValue > 0 ? 'expense' : 'income',
      date: now - 1, // Ensure initial balance is the very first transaction
      description: 'Initial Balance',
      category: 'Opening Balance',
      addedBy: newPerson.addedBy,
    };
    await addTransaction(initialTransaction);
  }
  
  return newPerson;
}
  
export async function updatePerson(id: string, data: Partial<Person>): Promise<Person | undefined> {
  const personIndex = persons.findIndex(p => p.id === id);
  if(personIndex > -1) {
    persons[personIndex] = { ...persons[personIndex], ...data, updatedAt: Date.now() };
    writeToStorage(PERSONS_KEY, persons);
    return persons[personIndex];
  }
  return undefined;
}

export async function deletePerson(id: string, deletedBy: string): Promise<void> {
  const personIndex = persons.findIndex(p => p.id === id);
  if(personIndex > -1) {
    persons[personIndex].deleted = true;
    persons[personIndex].deletedAt = Date.now();
    persons[personIndex].deletedBy = deletedBy;
    
    transactions = transactions.map(t => {
      if (t.personId === id && !t.deleted) {
        return {
          ...t,
          deleted: true,
          deletedAt: Date.now(),
          deletedBy: `CASCADE_DELETE_BY_${deletedBy}`,
        };
      }
      return t;
    });

    writeToStorage(PERSONS_KEY, persons);
    writeToStorage(TRANSACTIONS_KEY, transactions);
  }
}

export async function getDeletedPersons(): Promise<Person[]> {
    return persons.filter(p => p.deleted);
}

export async function restorePerson(id: string): Promise<void> {
  const personIndex = persons.findIndex(p => p.id === id);
  if(personIndex > -1) {
    persons[personIndex].deleted = false;
    delete persons[personIndex].deletedAt;
    delete persons[personIndex].deletedBy;
    this.writeToStorage(PERSONS_KEY, persons);

    // also restore transactions
    transactions = transactions.map(t => {
        if (t.personId === id && t.deletedBy === `CASCADE_DELETE_BY_${persons[personIndex].deletedBy}`) {
            const restoredT = { ...t };
            delete restoredT.deleted;
            delete restoredT.deletedAt;
            delete restoredT.deletedBy;
            return restoredT;
        }
        return t;
    });
    writeToStorage(TRANSACTIONS_KEY, transactions);
  }
}

// --- Transactions ---
export async function getAllTransactions(): Promise<Transaction[]> {
  return transactions.filter(t => !t.deleted);
}

export async function getTransactionsByPersonId(personId: string): Promise<Transaction[]> {
  return transactions.filter(t => t.personId === personId && !t.deleted);
}

export async function getTransactionById(id: string, includeDeleted = false): Promise<Transaction | undefined> {
  return transactions.find(t => t.id === id && (includeDeleted || !t.deleted));
}
  
function _getAllTransactionsByPersonId_includingDeleted(personId: string): Transaction[] {
  return transactions.filter(t => t.personId === personId);
}

function getNextSrNo(personId: string): number {
    const personTransactions = _getAllTransactionsByPersonId_includingDeleted(personId);
    return personTransactions.length + 1;
}

export async function addTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'srNo' | 'deleted'>): Promise<Transaction> {
  const now = Date.now();
  const srNo = getNextSrNo(data.personId);
  const newTransaction: Transaction = {
    id: `trx-${now}`,
    ...data,
    srNo,
    createdAt: now,
    deleted: false
  };
  transactions.push(newTransaction);
  writeToStorage(TRANSACTIONS_KEY, transactions);
    
  await updatePerson(data.personId, {});

  return newTransaction;
}

export async function updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
  const trxIndex = transactions.findIndex(t => t.id === id);
  if (trxIndex > -1) {
      transactions[trxIndex] = { ...transactions[trxIndex], ...data };
      writeToStorage(TRANSACTIONS_KEY, transactions);
      await updatePerson(transactions[trxIndex].personId, {});
      return transactions[trxIndex];
  }
  return undefined;
}

export async function deleteTransaction(id: string, deletedBy: string): Promise<void> {
  const trxIndex = transactions.findIndex(t => t.id === id);
  if (trxIndex > -1) {
      transactions[trxIndex].deleted = true;
      transactions[trxIndex].deletedAt = Date.now();
      transactions[trxIndex].deletedBy = deletedBy;
      writeToStorage(TRANSACTIONS_KEY, transactions);
      await updatePerson(transactions[trxIndex].personId, {});
  }
}

export async function getDeletedTransactions(): Promise<Transaction[]> {
    return transactions.filter(t => t.deleted);
}

export async function restoreTransaction(id: string): Promise<void> {
  const trxIndex = transactions.findIndex(t => t.id === id);
  if (trxIndex > -1) {
      transactions[trxIndex].deleted = false;
      delete transactions[trxIndex].deletedAt;
      delete transactions[trxIndex].deletedBy;
      writeToStorage(TRANSACTIONS_KEY, transactions);
      await updatePerson(transactions[trxIndex].personId, {});
  }
}
