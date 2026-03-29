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
  doc.setFillColor(40, 58, 112); // A shade of the app's primary color
  doc.rect(0, 0, doc.internal.pageSize.getWidth(), 40, 'F');
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('Sarkia', 14, 25);

  // Person Details
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text(`Export Date: ${today.toLocaleDateString()}`, doc.internal.pageSize.getWidth() - 14, 25, { align: 'right' });
  
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(`Transaction History for: ${person.name}`, 14, 55);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  if(person.notes) doc.text(`Notes: ${person.notes}`, 14, 62);

  // Transaction Table
  const tableColumn = ["Sr. No.", "Date", "Description", "Category", "Amount (INR)", "Type", "Added By"];
  const tableRows: (string | number)[][] = [];

  const formatCurrency = (amount: number) => new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);

  transactions.forEach(t => {
    const transactionData = [
      t.srNo === 0 ? 'Initial' : t.srNo,
      new Date(t.date).toLocaleDateString(),
      t.description,
      t.category || "-",
      formatCurrency(t.amount),
      t.type === 'income' ? 'Received' : 'Given',
      t.addedBy
    ];
    tableRows.push(transactionData);
  });

  doc.autoTable({
    head: [tableColumn],
    body: tableRows,
    startY: 70,
    headStyles: {
      fillColor: [40, 58, 112],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [245, 245, 245],
    },
    styles: {
      cellPadding: 2.5,
      fontSize: 9,
    },
    columnStyles: {
      4: { halign: 'right' },
    },
  });

  // Summary
  let finalY = (doc as any).lastAutoTable.finalY;
  if (!finalY) {
    finalY = 70;
  }
  
  const totalIncome = transactions.filter(t => t.type === 'income').reduce((acc, t) => acc + t.amount, 0);
  const totalExpense = transactions.filter(t => t.type === 'expense').reduce((acc, t) => acc + t.amount, 0);
  
  const summaryStartY = finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary', 14, summaryStartY);
  
  const summaryData = [
    ['Total Given:', formatCurrency(totalExpense)],
    ['Total Received:', formatCurrency(totalIncome)],
  ];
  const netBalanceData = [
    ['Net Balance:', formatCurrency(balance)],
  ];

  doc.autoTable({
      body: summaryData,
      startY: summaryStartY + 5,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1.5 },
      tableWidth: 80,
      columnStyles: {
          1: { halign: 'right' },
      },
  });
  
  finalY = (doc as any).lastAutoTable.finalY;

  doc.autoTable({
      body: netBalanceData,
      startY: finalY,
      theme: 'plain',
      styles: { fontSize: 10, cellPadding: 1.5, fontStyle: 'bold' },
      tableWidth: 80,
      columnStyles: {
          1: { halign: 'right' },
      },
  });


  // File Name
  const dateStr = today.toISOString().split('T')[0];
  doc.save(`Sarkia_Transactions_${person.name}_${dateStr}.pdf`);
}
