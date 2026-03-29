'use client';

import type { User, Person, Transaction } from './types';

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

export class DataStore {
  private users: User[];
  private persons: Person[];
  private transactions: Transaction[];

  constructor() {
    this.users = this.readFromStorage(USERS_KEY, defaultUsers);
    this.persons = this.readFromStorage(PERSONS_KEY, defaultPersons);
    this.transactions = this.readFromStorage(TRANSACTIONS_KEY, defaultTransactions);
  }

  private isServer(): boolean {
    return typeof window === 'undefined';
  }

  private readFromStorage<T>(key: string, defaultValue: T): T {
    if (this.isServer()) {
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

  private writeToStorage<T>(key: string, value: T) {
    if (this.isServer()) {
        return;
    }
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to localStorage key “${key}”:`, error);
    }
  }
  
  private readFromSession<T>(key: string, defaultValue: T): T {
    if (this.isServer()) {
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

  private writeToSession<T>(key: string, value: T) {
    if (this.isServer()) {
      return;
    }
    try {
      sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Error writing to sessionStorage key “${key}”:`, error);
    }
  }

  // --- Auth ---
  login(username: string, password: string): User | null {
    const user = this.users.find(u => u.username === username);
    if (user) {
      this.writeToSession(LOGGED_IN_USER_KEY, user);
      return user;
    }
    return null;
  }

  logout() {
    if (!this.isServer()) {
        sessionStorage.removeItem(LOGGED_IN_USER_KEY);
    }
  }

  getLoggedInUser(): User | null {
    return this.readFromSession(LOGGED_IN_USER_KEY, null);
  }

  // --- Persons ---
  async getPersons(): Promise<Person[]> {
    this.persons = this.readFromStorage(PERSONS_KEY, this.persons);
    return this.persons.filter(p => !p.deleted);
  }

  async getPersonById(id: string): Promise<Person | undefined> {
    this.persons = this.readFromStorage(PERSONS_KEY, this.persons);
    return this.persons.find(p => p.id === id && !p.deleted);
  }

  async addPerson(data: Omit<Person, 'id' | 'createdAt' | 'updatedAt' | 'deleted'>): Promise<Person> {
    const now = Date.now();
    const newPerson: Person = {
      id: `person-${now}`,
      ...data,
      createdAt: now,
      updatedAt: now,
      deleted: false
    };
    this.persons.push(newPerson);
    this.writeToStorage(PERSONS_KEY, this.persons);
    return newPerson;
  }
  
  async updatePerson(id: string, data: Partial<Person>): Promise<Person | undefined> {
    const personIndex = this.persons.findIndex(p => p.id === id);
    if(personIndex > -1) {
      this.persons[personIndex] = { ...this.persons[personIndex], ...data, updatedAt: Date.now() };
      this.writeToStorage(PERSONS_KEY, this.persons);
      return this.persons[personIndex];
    }
    return undefined;
  }

  async deletePerson(id: string, deletedBy: string): Promise<void> {
    const personIndex = this.persons.findIndex(p => p.id === id);
    if(personIndex > -1) {
      this.persons[personIndex].deleted = true;
      this.persons[personIndex].deletedAt = Date.now();
      this.persons[personIndex].deletedBy = deletedBy;
      this.writeToStorage(PERSONS_KEY, this.persons);
    }
  }

  async getDeletedPersons(): Promise<Person[]> {
      this.persons = this.readFromStorage(PERSONS_KEY, this.persons);
      return this.persons.filter(p => p.deleted);
  }

  async restorePerson(id: string): Promise<void> {
    const personIndex = this.persons.findIndex(p => p.id === id);
    if(personIndex > -1) {
      this.persons[personIndex].deleted = false;
      delete this.persons[personIndex].deletedAt;
      delete this.persons[personIndex].deletedBy;
      this.writeToStorage(PERSONS_KEY, this.persons);
    }
  }

  // --- Transactions ---
  async getAllTransactions(): Promise<Transaction[]> {
    this.transactions = this.readFromStorage(TRANSACTIONS_KEY, this.transactions);
    return this.transactions.filter(t => !t.deleted);
  }

  async getTransactionsByPersonId(personId: string): Promise<Transaction[]> {
    this.transactions = this.readFromStorage(TRANSACTIONS_KEY, this.transactions);
    return this.transactions.filter(t => t.personId === personId && !t.deleted);
  }

  async getTransactionById(id: string, includeDeleted = false): Promise<Transaction | undefined> {
    this.transactions = this.readFromStorage(TRANSACTIONS_KEY, this.transactions);
    return this.transactions.find(t => t.id === id && (includeDeleted || !t.deleted));
  }
  
  private async getNextSrNo(personId: string): Promise<number> {
      const personTransactions = await this.getTransactionsByPersonId(personId);
      return personTransactions.length + 1;
  }

  async addTransaction(data: Omit<Transaction, 'id' | 'createdAt' | 'srNo' | 'deleted'>): Promise<Transaction> {
    const now = Date.now();
    const srNo = await this.getNextSrNo(data.personId);
    const newTransaction: Transaction = {
      id: `trx-${now}`,
      ...data,
      srNo,
      createdAt: now,
      deleted: false
    };
    this.transactions.push(newTransaction);
    this.writeToStorage(TRANSACTIONS_KEY, this.transactions);
    
    // also update person's updatedAt
    await this.updatePerson(data.personId, {});

    return newTransaction;
  }

  async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction | undefined> {
    const trxIndex = this.transactions.findIndex(t => t.id === id);
    if (trxIndex > -1) {
        this.transactions[trxIndex] = { ...this.transactions[trxIndex], ...data };
        this.writeToStorage(TRANSACTIONS_KEY, this.transactions);
        await this.updatePerson(this.transactions[trxIndex].personId, {});
        return this.transactions[trxIndex];
    }
    return undefined;
  }

  async deleteTransaction(id: string, deletedBy: string): Promise<void> {
    const trxIndex = this.transactions.findIndex(t => t.id === id);
    if (trxIndex > -1) {
        this.transactions[trxIndex].deleted = true;
        this.transactions[trxIndex].deletedAt = Date.now();
        this.transactions[trxIndex].deletedBy = deletedBy;
        this.writeToStorage(TRANSACTIONS_KEY, this.transactions);
        await this.updatePerson(this.transactions[trxIndex].personId, {});
    }
  }

  async getDeletedTransactions(): Promise<Transaction[]> {
      this.transactions = this.readFromStorage(TRANSACTIONS_KEY, this.transactions);
      return this.transactions.filter(t => t.deleted);
  }

  async restoreTransaction(id: string): Promise<void> {
    const trxIndex = this.transactions.findIndex(t => t.id === id);
    if (trxIndex > -1) {
        this.transactions[trxIndex].deleted = false;
        delete this.transactions[trxIndex].deletedAt;
        delete this.transactions[trxIndex].deletedBy;
        this.writeToStorage(TRANSACTIONS_KEY, this.transactions);
        await this.updatePerson(this.transactions[trxIndex].personId, {});
    }
  }
}
