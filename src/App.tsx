/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { 
  UtilityBill, 
  LedgerEntry, 
  UtilityInstallation, 
  ReconciledRecord 
} from './types/reconciliation';
import { 
  INITIAL_BILLS, 
  INITIAL_LEDGER, 
  INITIAL_INSTALLATIONS 
} from './utils/mockData';
import { 
  runReconciliation, 
  calculateFinancialSummary, 
  generateFinancialInsights 
} from './utils/reconciliationEngine';
import { 
  generateSampleExcelTemplate, 
  exportReconciliationToExcel 
} from './utils/xlsxParser';

import { Header } from './components/Header';
import { KPIStats } from './components/KPIStats';
import { FinancialCharts } from './components/FinancialCharts';
import { AnomalyBanner } from './components/AnomalyBanner';
import { ReconciliationTable } from './components/ReconciliationTable';
import { UploadModal } from './components/UploadModal';
import { ManualEntryModal } from './components/ManualEntryModal';
import { DiscrepancyResolutionModal } from './components/DiscrepancyResolutionModal';
import { RecordDetailsModal } from './components/RecordDetailsModal';
import { AuditReportModal } from './components/AuditReportModal';
import { InstallationsManagerModal } from './components/InstallationsManagerModal';

const STORAGE_KEY_BILLS = 'utilidades_bills_v1';
const STORAGE_KEY_LEDGER = 'utilidades_ledger_v1';
const STORAGE_KEY_INST = 'utilidades_installations_v1';

export default function App() {
  // State for utility bills (from .xlsx reports)
  const [bills, setBills] = useState<UtilityBill[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_BILLS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_BILLS;
  });

  // State for financial ledger / ERP
  const [ledger, setLedger] = useState<LedgerEntry[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LEDGER);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_LEDGER;
  });

  // State for utility installations / meters
  const [installations, setInstallations] = useState<UtilityInstallation[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_INST);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error(e);
    }
    return INITIAL_INSTALLATIONS;
  });

  // Modals state
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [isManualEntryOpen, setIsManualEntryOpen] = useState(false);
  const [isAuditReportOpen, setIsAuditReportOpen] = useState(false);
  const [isInstallationsOpen, setIsInstallationsOpen] = useState(false);
  const [discrepancyRecord, setDiscrepancyRecord] = useState<ReconciledRecord | null>(null);
  const [detailsRecord, setDetailsRecord] = useState<ReconciledRecord | null>(null);

  // Toast feedback
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Persist changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_BILLS, JSON.stringify(bills));
    } catch (e) {
      console.error(e);
    }
  }, [bills]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LEDGER, JSON.stringify(ledger));
    } catch (e) {
      console.error(e);
    }
  }, [ledger]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_INST, JSON.stringify(installations));
    } catch (e) {
      console.error(e);
    }
  }, [installations]);

  // Compute reconciled records
  const reconciledRecords = useMemo(() => {
    return runReconciliation(bills, ledger);
  }, [bills, ledger]);

  // Compute summary KPIs
  const summary = useMemo(() => {
    return calculateFinancialSummary(reconciledRecords);
  }, [reconciledRecords]);

  // Compute financial anomaly insights
  const insights = useMemo(() => {
    return generateFinancialInsights(reconciledRecords);
  }, [reconciledRecords]);

  // Handle uploading and parsing a new .xlsx report
  const handleConfirmImport = (newBills: UtilityBill[], fileName: string) => {
    // Merge new bills: replace or append
    setBills(prev => {
      const existingIds = new Set(prev.map(b => b.id));
      const filteredNew = newBills.filter(b => !existingIds.has(b.id));
      return [...filteredNew, ...prev];
    });

    showToast(`✅ ${newBills.length} faturas importadas do relatório "${fileName}". Conciliação atualizada!`);
    
    // Check if celebration
    setTimeout(() => {
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.8 } });
    }, 300);
  };

  // Quick 1-click batch reconcile for all pending or divergent items
  const handleAutoReconcileAll = () => {
    let resolvedCount = 0;

    // For every pending bill without a ledger, create the matching ledger record
    const newLedgerEntries: LedgerEntry[] = [];
    const updatedLedger = [...ledger];

    reconciledRecords.forEach((record) => {
      if (record.reconciliationStatus === 'pendente_pagamento' && record.bill) {
        newLedgerEntries.push({
          id: `led-auto-${record.bill.id}`,
          utilityType: record.bill.utilityType,
          provider: record.bill.provider,
          installationCode: record.bill.installationCode,
          unitName: record.bill.unitName,
          competence: record.bill.competence,
          expectedDate: record.bill.dueDate,
          actualPaymentDate: record.bill.dueDate,
          ledgerAmount: record.bill.billedAmount,
          paymentAccount: 'Banco Itaú Empresas (C/C 40291-3)',
          documentNumber: record.bill.invoiceNumber || `AUTO-${record.bill.competence}`,
          status: 'liquidado',
          notes: 'Baixa gerada automaticamente pela conciliação do relatório .xlsx'
        });
        resolvedCount++;
      } else if (record.reconciliationStatus === 'divergencia_valor' && record.ledger) {
        // Adjust ledger to match billed amount
        const idx = updatedLedger.findIndex(l => l.id === record.ledger!.id);
        if (idx !== -1) {
          updatedLedger[idx] = {
            ...updatedLedger[idx],
            ledgerAmount: record.billedAmount,
            notes: `Valor ajustado para R$ ${record.billedAmount.toFixed(2)} conforme fatura da concessionária`
          };
          resolvedCount++;
        }
      }
    });

    setLedger([...updatedLedger, ...newLedgerEntries]);
    showToast(`🎉 ${resolvedCount} lançamentos foram regularizados e 100% conciliados!`);
    confetti({ particleCount: 75, spread: 70, origin: { y: 0.7 } });
  };

  // Quick approve single pending record
  const handleQuickApprove = (record: ReconciledRecord) => {
    if (!record.bill) return;

    const newLedger: LedgerEntry = {
      id: `led-single-${record.bill.id}`,
      utilityType: record.bill.utilityType,
      provider: record.bill.provider,
      installationCode: record.bill.installationCode,
      unitName: record.bill.unitName,
      competence: record.bill.competence,
      expectedDate: record.bill.dueDate,
      actualPaymentDate: record.bill.dueDate,
      ledgerAmount: record.bill.billedAmount,
      paymentAccount: 'Banco Itaú Empresas (C/C 40291-3)',
      documentNumber: record.bill.invoiceNumber || `AUT-${record.bill.competence}`,
      status: 'liquidado',
      notes: 'Baixa aprovada diretamente no painel'
    };

    setLedger(prev => [newLedger, ...prev]);
    showToast(`Fatura ${record.bill.invoiceNumber || record.provider} lançada e conciliada no Contas a Pagar!`);
  };

  // Resolve discrepancy with specific action
  const handleResolveDiscrepancy = (
    recordId: string, 
    action: 'adjust_ledger' | 'contest' | 'accept_variance', 
    note: string
  ) => {
    const targetRecord = reconciledRecords.find(r => r.id === recordId);
    if (!targetRecord) return;

    if (action === 'adjust_ledger') {
      if (targetRecord.ledgerId) {
        setLedger(prev => prev.map(l => {
          if (l.id === targetRecord.ledgerId) {
            return {
              ...l,
              ledgerAmount: targetRecord.billedAmount,
              notes: note || `Equiparado à fatura da concessionária (R$ ${targetRecord.billedAmount.toFixed(2)})`
            };
          }
          return l;
        }));
      } else if (targetRecord.bill) {
        // If it didn't have ledger, create it
        handleQuickApprove(targetRecord);
      }
      showToast(`Valor no ERP atualizado para R$ ${targetRecord.billedAmount.toFixed(2)}. Conta conciliada!`);
    } else if (action === 'contest') {
      if (targetRecord.billId) {
        setBills(prev => prev.map(b => {
          if (b.id === targetRecord.billId) {
            return {
              ...b,
              notes: `CONTESTAÇÃO REGISTRADA: ${note || 'Protocolo aberto junto à distribuidora'}`
            };
          }
          return b;
        }));
      }
      showToast(`Protocolo de contestação registrado com a concessionária.`);
    } else {
      // Accept variance
      if (targetRecord.ledgerId) {
        setLedger(prev => prev.map(l => {
          if (l.id === targetRecord.ledgerId) {
            return {
              ...l,
              notes: `DIVERGÊNCIA APROVADA: ${note || 'Variação aceita pela controladoria'}`
            };
          }
          return l;
        }));
      }
      showToast(`Justificativa contábil salva com sucesso.`);
    }
  };

  // Delete a record
  const handleDeleteRecord = (recordId: string) => {
    const target = reconciledRecords.find(r => r.id === recordId);
    if (!target) return;

    if (target.billId) {
      setBills(prev => prev.filter(b => b.id !== target.billId));
    }
    if (target.ledgerId) {
      setLedger(prev => prev.filter(l => l.id !== target.ledgerId));
    }
    showToast('Lançamento removido da conciliação.');
  };

  // Manual entry additions
  const handleAddBill = (newBill: UtilityBill) => {
    setBills(prev => [newBill, ...prev]);
    showToast('Fatura adicionada com sucesso.');
  };

  const handleAddLedger = (newLedger: LedgerEntry) => {
    setLedger(prev => [newLedger, ...prev]);
  };

  // Installations manager actions
  const handleSaveInstallation = (newInst: UtilityInstallation) => {
    setInstallations(prev => [newInst, ...prev]);
    showToast(`Instalação ${newInst.provider} (${newInst.code}) cadastrada!`);
  };

  const handleDeleteInstallation = (id: string) => {
    setInstallations(prev => prev.filter(i => i.id !== id));
    showToast('Instalação removida.');
  };

  // Reset to rich demo state
  const handleResetToDemo = () => {
    if (window.confirm('Deseja recarregar os dados de demonstração com faturas de 2024 de Água, Luz e Internet?')) {
      setBills(INITIAL_BILLS);
      setLedger(INITIAL_LEDGER);
      setInstallations(INITIAL_INSTALLATIONS);
      localStorage.removeItem(STORAGE_KEY_BILLS);
      localStorage.removeItem(STORAGE_KEY_LEDGER);
      localStorage.removeItem(STORAGE_KEY_INST);
      showToast('Dados de demonstração recarregados com sucesso!');
    }
  };

  // Export to Excel
  const handleExportExcel = () => {
    exportReconciliationToExcel(reconciledRecords, `Conciliacao_Utilidades_${new Date().toISOString().slice(0, 10)}.xlsx`);
    showToast('Planilha de conciliação exportada em formato .xlsx!');
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white text-xs font-semibold px-4 py-3 rounded-xl shadow-xl border border-slate-700 animate-fade-in flex items-center gap-2">
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Executive Header */}
      <Header
        onOpenUpload={() => setIsUploadOpen(true)}
        onOpenManualEntry={() => setIsManualEntryOpen(true)}
        onOpenAuditReport={() => setIsAuditReportOpen(true)}
        onOpenInstallations={() => setIsInstallationsOpen(true)}
        onDownloadTemplate={generateSampleExcelTemplate}
        onExportExcel={handleExportExcel}
        onResetToDemo={handleResetToDemo}
        totalRecordsCount={reconciledRecords.length}
        reconciliationRate={summary.reconciliationRate}
      />

      {/* Main Content Dashboard */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* KPI Financial Overview Cards */}
        <KPIStats summary={summary} />

        {/* Anomaly & Risk Alerts Banner */}
        <AnomalyBanner insights={insights} />

        {/* Financial & Consumption Interactive Charts */}
        <FinancialCharts records={reconciledRecords} />

        {/* Reconciliation Data Table */}
        <ReconciliationTable
          records={reconciledRecords}
          onAutoReconcileAll={handleAutoReconcileAll}
          onOpenDiscrepancyModal={(r) => setDiscrepancyRecord(r)}
          onViewRecordDetails={(r) => setDetailsRecord(r)}
          onDeleteRecord={handleDeleteRecord}
          onQuickApprove={handleQuickApprove}
        />

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <p>
            Conciliador de Utilidades · Análise Financeira Automática de Água, Luz e Internet
          </p>
          <div className="flex items-center gap-4 text-2xs">
            <span>Suporte a arquivos <strong>.xlsx</strong>, <strong>.xls</strong> e <strong>.csv</strong></span>
            <span>·</span>
            <span>Conformidade ANEEL & Regulatório</span>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <UploadModal
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onConfirmImport={handleConfirmImport}
      />

      <ManualEntryModal
        isOpen={isManualEntryOpen}
        onClose={() => setIsManualEntryOpen(false)}
        installations={installations}
        onAddBill={handleAddBill}
        onAddLedger={handleAddLedger}
      />

      <DiscrepancyResolutionModal
        record={discrepancyRecord}
        onClose={() => setDiscrepancyRecord(null)}
        onResolve={handleResolveDiscrepancy}
      />

      <RecordDetailsModal
        record={detailsRecord}
        onClose={() => setDetailsRecord(null)}
      />

      <AuditReportModal
        isOpen={isAuditReportOpen}
        onClose={() => setIsAuditReportOpen(false)}
        summary={summary}
        records={reconciledRecords}
        insights={insights}
      />

      <InstallationsManagerModal
        isOpen={isInstallationsOpen}
        onClose={() => setIsInstallationsOpen(false)}
        installations={installations}
        onSaveInstallation={handleSaveInstallation}
        onDeleteInstallation={handleDeleteInstallation}
      />

    </div>
  );
}
