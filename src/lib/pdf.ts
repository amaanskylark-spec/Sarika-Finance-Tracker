'use client';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import type { Person, Transaction } from './types';
import type { UserOptions } from 'jspdf-autotable';

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: UserOptions) => jsPDF;
}

export function generatePersonPdf(person: Person, transactions: Transaction[], balance: number) {
  const doc = new jsPDF() as jsPDFWithAutoTable;
  const today = new Date();
  
  // Header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('Sarkia', 14, 22);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Export Date: ${today.toLocaleDateString()}`, 14, 30);
  
  // Person Details
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Transaction History for: ${person.name}`, 14, 45);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if(person.notes) doc.text(`Notes: ${person.notes}`, 14, 52);

  // Transaction Table
  const tableColumn = ["Sr. No.", "Date", "Description", "Category", "Amount", "Type", "Added By"];
  const tableRows: (string | number)[][] = [];

  transactions.forEach(t => {
    const transactionData = [
      t.srNo === 0 ? 'Initial' : t.srNo,
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category || "-",
      new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(t.amount),
      t.type === 'income' ? 'Received' : 'Given',
      t.addedBy
    ];
    tableRows.push(transactionData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 60,
  });

  // Summary
  const finalY = doc.autoTable.previous.finalY;
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, finalY + 15);
  
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Total Given: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalExpense)}`, 14, finalY + 22);
  doc.text(`Total Received: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(totalIncome)}`, 14, finalY + 29);
  
  doc.setFont('helvetica', 'bold');
  doc.text(`Net Balance: ${new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(balance)}`, 14, finalY + 36);

  // File Name
  const dateStr = today.toISOString().split('T')[0];
  doc.save(`Sarkia_Transactions_${person.name}_${dateStr}.pdf`);
}
