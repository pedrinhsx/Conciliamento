import React, { useState, useRef } from 'react';
import { UtilityBill, UtilityType } from '../types/reconciliation';
import { parseExcelReport, ParsedSheetResult } from '../utils/xlsxParser';
import { 
  X, 
  Upload, 
  FileSpreadsheet, 
  CheckCircle2, 
  AlertCircle, 
  Zap, 
  Droplets, 
  Wifi, 
  Layers,
  Sparkles
} from 'lucide-react';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirmImport: (bills: UtilityBill[], fileName: string) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onConfirmImport
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [parseResult, setParseResult] = useState<ParsedSheetResult | null>(null);
  const [selectedType, setSelectedType] = useState<UtilityType | 'misto'>('luz');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const processFile = async (file: File) => {
    setSelectedFile(file);
    setIsLoading(true);
    setErrorMsg(null);
    setParseResult(null);

    try {
      const buffer = await file.arrayBuffer();
      const result = await parseExcelReport(buffer, file.name);
      setParseResult(result);
      setSelectedType(result.detectedType);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Erro ao processar o arquivo .xlsx. Verifique se o formato está correto.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
        processFile(file);
      } else {
        setErrorMsg('Por favor, selecione um arquivo válido do Excel (.xlsx, .xls) ou .csv.');
      }
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Preset demo generator for instant testing without needing an external file
  const handleLoadSample = (sampleType: 'luz' | 'agua' | 'internet' | 'misto') => {
    setIsLoading(true);
    setErrorMsg(null);

    setTimeout(() => {
      let bills: UtilityBill[] = [];
      let fileName = '';

      if (sampleType === 'luz') {
        fileName = 'Relatorio_Sistema_Energia_Enel_2024.xlsx';
        bills = [
          {
            id: `bill-demo-luz-1`,
            utilityType: 'luz',
            provider: 'Enel Distribuição SP',
            installationCode: '004928104',
            unitName: 'Sede Matriz - Av. Paulista',
            competence: '2024-04',
            dueDate: '2024-05-15',
            billedAmount: 3620.40,
            consumptionValue: 5040,
            consumptionUnit: 'kWh',
            tariffFlag: 'amarela',
            invoiceNumber: 'NF-ENEL-0424',
            status: 'aberto',
            notes: 'Fatura de Abril importada via relatório do sistema da Enel'
          },
          {
            id: `bill-demo-luz-2`,
            utilityType: 'luz',
            provider: 'CPFL Paulista',
            installationCode: '008812903',
            unitName: 'Filial Campinas',
            competence: '2024-04',
            dueDate: '2024-05-20',
            billedAmount: 2150.00,
            consumptionValue: 2650,
            consumptionUnit: 'kWh',
            tariffFlag: 'verde',
            invoiceNumber: 'NF-CPFL-0424',
            status: 'aberto'
          },
          {
            id: `bill-demo-luz-3`,
            utilityType: 'luz',
            provider: 'Elektro Distribuição',
            installationCode: '007730192',
            unitName: 'Galpão Logística',
            competence: '2024-04',
            dueDate: '2024-05-10',
            billedAmount: 5410.80,
            consumptionValue: 7200,
            consumptionUnit: 'kWh',
            tariffFlag: 'amarela',
            invoiceNumber: 'NF-ELEK-0424',
            status: 'aberto'
          }
        ];
      } else if (sampleType === 'agua') {
        fileName = 'Relatorio_Sabesp_Saneamento_2024.xlsx';
        bills = [
          {
            id: `bill-demo-agua-1`,
            utilityType: 'agua',
            provider: 'Sabesp',
            installationCode: '049281-9',
            unitName: 'Sede Matriz - Av. Paulista',
            competence: '2024-04',
            dueDate: '2024-05-18',
            billedAmount: 710.20,
            consumptionValue: 54,
            consumptionUnit: 'm³',
            invoiceNumber: 'SAB-202404',
            status: 'aberto'
          },
          {
            id: `bill-demo-agua-2`,
            utilityType: 'agua',
            provider: 'Sanasa Campinas',
            installationCode: '19283-0',
            unitName: 'Filial Campinas',
            competence: '2024-04',
            dueDate: '2024-05-22',
            billedAmount: 420.00,
            consumptionValue: 32,
            consumptionUnit: 'm³',
            invoiceNumber: 'SAN-202404',
            status: 'aberto'
          }
        ];
      } else if (sampleType === 'internet') {
        fileName = 'Relatorio_Faturamento_Vivo_Fibra.xlsx';
        bills = [
          {
            id: `bill-demo-int-1`,
            utilityType: 'internet',
            provider: 'Vivo Fibra Empresas',
            installationCode: 'CTR-99210',
            unitName: 'Sede Matriz - Av. Paulista',
            competence: '2024-04',
            dueDate: '2024-05-25',
            billedAmount: 549.90,
            consumptionValue: 600,
            consumptionUnit: 'Mbps',
            invoiceNumber: 'VIV-202404',
            status: 'aberto'
          },
          {
            id: `bill-demo-int-2`,
            utilityType: 'internet',
            provider: 'Claro Telecom B2B',
            installationCode: 'CTR-55102',
            unitName: 'Filial Campinas',
            competence: '2024-04',
            dueDate: '2024-05-28',
            billedAmount: 320.00,
            consumptionValue: 500,
            consumptionUnit: 'Mbps',
            invoiceNumber: 'CLA-202404',
            status: 'aberto'
          }
        ];
      } else {
        fileName = 'Relatorio_Geral_Contas_Consumo_Abril.xlsx';
        bills = [
          {
            id: `bill-demo-misto-1`,
            utilityType: 'luz',
            provider: 'Enel SP',
            installationCode: '004928104',
            unitName: 'Sede Matriz - Av. Paulista',
            competence: '2024-04',
            dueDate: '2024-05-15',
            billedAmount: 3620.40,
            consumptionValue: 5040,
            consumptionUnit: 'kWh',
            status: 'aberto'
          },
          {
            id: `bill-demo-misto-2`,
            utilityType: 'agua',
            provider: 'Sabesp',
            installationCode: '049281-9',
            unitName: 'Sede Matriz - Av. Paulista',
            competence: '2024-04',
            dueDate: '2024-05-18',
            billedAmount: 710.20,
            consumptionValue: 54,
            consumptionUnit: 'm³',
            status: 'aberto'
          },
          {
            id: `bill-demo-misto-3`,
            utilityType: 'internet',
            provider: 'Vivo Fibra',
            installationCode: 'CTR-99210',
            unitName: 'Sede Matriz - Av. Paulista',
            competence: '2024-04',
            dueDate: '2024-05-25',
            billedAmount: 549.90,
            consumptionValue: 600,
            consumptionUnit: 'Mbps',
            status: 'aberto'
          }
        ];
      }

      setParseResult({
        fileName,
        sheetName: 'Planilha1',
        totalRows: bills.length,
        detectedType: sampleType,
        bills,
        rawHeaders: ['Competência', 'Vencimento', 'Fornecedor', 'Código', 'Unidade', 'Consumo', 'Valor Faturado'],
        sampleRows: bills.map(b => ({
          Competência: b.competence,
          Vencimento: b.dueDate,
          Fornecedor: b.provider,
          Código: b.installationCode,
          Unidade: b.unitName,
          Consumo: `${b.consumptionValue} ${b.consumptionUnit || ''}`,
          'Valor Faturado': `R$ ${b.billedAmount.toFixed(2)}`
        })),
        warnings: []
      });
      setSelectedType(sampleType);
      setIsLoading(false);
    }, 400);
  };

  const handleConfirm = () => {
    if (!parseResult || parseResult.bills.length === 0) return;
    
    // If user changed the type selector, update bills type
    const updatedBills = parseResult.bills.map(b => {
      if (selectedType !== 'misto') {
        return { ...b, utilityType: selectedType };
      }
      return b;
    });

    onConfirmImport(updatedBills, parseResult.fileName);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-700">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Anexar Relatório do Sistema (.xlsx)
              </h2>
              <p className="text-xs text-slate-500">
                Importação e conciliação automática de faturas de Luz, Água e Internet
              </p>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-5">
          
          {/* Drag & Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
              dragActive 
                ? 'border-slate-900 bg-slate-50' 
                : 'border-slate-300 hover:border-slate-400 bg-slate-50/50'
            }`}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <div className="flex flex-col items-center justify-center gap-2.5">
              <div className="w-12 h-12 rounded-full bg-white shadow-2xs border border-slate-200 flex items-center justify-center text-slate-700">
                <Upload className="w-6 h-6 text-slate-700" />
              </div>
              <div>
                <p className="text-xs sm:text-sm font-semibold text-slate-800">
                  Arraste e solte o arquivo <strong className="text-slate-900">.xlsx</strong> aqui, ou clique para selecionar
                </p>
                <p className="text-2xs sm:text-xs text-slate-500 mt-1">
                  Compatível com relatórios de concessionárias (Enel, CPFL, Sabesp, Vivo, Claro, etc.) e ERPs
                </p>
              </div>
            </div>
          </div>

          {/* Quick Preload Demo Buttons */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-2xs font-bold uppercase tracking-wider text-slate-500">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Ou teste com relatórios de exemplo:</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => handleLoadSample('luz')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-amber-200 bg-amber-50/60 hover:bg-amber-100 text-amber-900 text-xs font-semibold transition-colors"
              >
                <Zap className="w-3.5 h-3.5 text-amber-600" />
                <span>Relatório Luz</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('agua')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-cyan-200 bg-cyan-50/60 hover:bg-cyan-100 text-cyan-900 text-xs font-semibold transition-colors"
              >
                <Droplets className="w-3.5 h-3.5 text-cyan-600" />
                <span>Relatório Água</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('internet')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-100 text-indigo-900 text-xs font-semibold transition-colors"
              >
                <Wifi className="w-3.5 h-3.5 text-indigo-600" />
                <span>Relatório Internet</span>
              </button>
              <button
                type="button"
                onClick={() => handleLoadSample('misto')}
                className="flex items-center justify-center gap-1.5 p-2 rounded-lg border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-semibold transition-colors"
              >
                <Layers className="w-3.5 h-3.5 text-slate-600" />
                <span>Consolidado</span>
              </button>
            </div>
          </div>

          {/* Loading Indicator */}
          {isLoading && (
            <div className="p-4 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
              <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin" />
              <span>Processando e mapeando colunas da planilha...</span>
            </div>
          )}

          {/* Error Message */}
          {errorMsg && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-rose-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Parsed Result Preview */}
          {parseResult && (
            <div className="space-y-3.5 border border-slate-200 rounded-xl p-4 bg-slate-50/50">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-200">
                <div className="flex items-center gap-2 text-xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="font-semibold text-slate-900">
                    Arquivo: <strong className="font-mono">{parseResult.fileName}</strong>
                  </span>
                  <span className="text-slate-500">({parseResult.bills.length} faturas detectadas)</span>
                </div>

                {/* Force type selector if needed */}
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-slate-500 font-medium">Classificar como:</span>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value as any)}
                    className="px-2 py-1 text-xs rounded border border-slate-300 bg-white font-medium text-slate-800"
                  >
                    <option value="luz">⚡ Energia Elétrica (Luz)</option>
                    <option value="agua">💧 Água e Esgoto</option>
                    <option value="internet">🌐 Internet & Telecom</option>
                    <option value="misto">📑 Misto / Consolidado</option>
                  </select>
                </div>
              </div>

              {/* Sample Rows Preview Table */}
              <div>
                <p className="text-2xs uppercase tracking-wider font-bold text-slate-500 mb-1.5">
                  Pré-visualização dos Dados Mapeados:
                </p>
                <div className="overflow-x-auto max-h-40 border border-slate-200 rounded-lg bg-white">
                  <table className="w-full text-2xs text-left">
                    <thead className="bg-slate-100 text-slate-600 font-semibold sticky top-0">
                      <tr>
                        <th className="py-1.5 px-2">Competência</th>
                        <th className="py-1.5 px-2">Vencimento</th>
                        <th className="py-1.5 px-2">Fornecedor</th>
                        <th className="py-1.5 px-2">Código/Instalação</th>
                        <th className="py-1.5 px-2">Consumo</th>
                        <th className="py-1.5 px-2 text-right">Valor (R$)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {parseResult.bills.slice(0, 5).map((b, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-1.5 px-2 font-mono">{b.competence}</td>
                          <td className="py-1.5 px-2">{b.dueDate}</td>
                          <td className="py-1.5 px-2 font-medium text-slate-900">{b.provider}</td>
                          <td className="py-1.5 px-2 font-mono">{b.installationCode}</td>
                          <td className="py-1.5 px-2">{b.consumptionValue ? `${b.consumptionValue} ${b.consumptionUnit || ''}` : '-'}</td>
                          <td className="py-1.5 px-2 text-right font-mono font-bold text-slate-900">
                            R$ {b.billedAmount.toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 hover:bg-slate-100 rounded-lg transition-colors"
          >
            Cancelar
          </button>

          <button
            type="button"
            disabled={!parseResult || parseResult.bills.length === 0}
            onClick={handleConfirm}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-sm"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>Processar e Conciliar com o Financeiro</span>
          </button>
        </div>

      </div>
    </div>
  );
};
