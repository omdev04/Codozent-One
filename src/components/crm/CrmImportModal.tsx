import React, { useState, useRef } from 'react';
import { X, Upload, Download, CheckCircle, AlertCircle, FileText, Check } from 'lucide-react';

interface CrmImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (rows: any[], skipDuplicates: boolean) => Promise<any>;
}

export const CrmImportModal: React.FC<CrmImportModalProps> = ({
  isOpen,
  onClose,
  onImport
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [skipDuplicates, setSkipDuplicates] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any | null>(null);
  const [fileName, setFileName] = useState('');

  if (!isOpen) return null;

  const downloadTemplate = () => {
    const csvContent =
      'Company Name,Contact Person,Mobile,Email,Deal Value,Lead Source,City,Priority,Requirement,Product\n' +
      'Kalyani Forge Tier 2,Suresh Kulkarni,9822012345,suresh@kalyaniforge.co.in,250000,indiamart,Pune,high,5000 pcs CNC Machined Bushes,CNC Machining\n' +
      'Bharat Gear Works,Anil Jadhav,9890123456,anil@bharatgear.in,180000,direct,Chakan,medium,Sheet Metal Bracket Fabrication,Sheet Metal\n' +
      'Mahindra Vendor Unit,Ramesh Patil,9422345678,ramesh@autovendors.com,500000,referral,Bhosari,urgent,Automotive Transmission Spacers,Forging Components\n';

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'crm_leads_template.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCsvText = (text: string) => {
    const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length < 2) return [];

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: any[] = [];

    for (let i = 1; i < lines.length; i++) {
      // Basic CSV regex to respect quotes
      const values = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g) || lines[i].split(',');
      const rowObj: any = {};
      headers.forEach((header, index) => {
        let val = values[index] ? values[index].trim() : '';
        val = val.replace(/^["']|["']$/g, '');
        rowObj[header] = val;
      });
      rows.push(rowObj);
    }
    return rows;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      const rows = parseCsvText(text);
      setParsedRows(rows);
      setResult(null);
    };
    reader.readAsText(file);
  };

  const handleExecuteImport = async () => {
    if (parsedRows.length === 0) return;
    setIsProcessing(true);
    try {
      const res = await onImport(parsedRows, skipDuplicates);
      setResult(res?.data || { importedCount: parsedRows.length, skippedCount: 0 });
    } catch (err: any) {
      alert(err.message || 'Import failed');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-5 py-3.5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-blue-600" />
            <h3 className="text-sm font-bold text-slate-900">Bulk Import Leads via CSV</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Instructions and Template Download */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-3.5 bg-blue-50/50 border border-blue-200 rounded-lg text-xs">
            <div>
              <div className="font-semibold text-slate-800">CSV Template Guidelines</div>
              <div className="text-slate-600 mt-0.5">
                Download the sample CSV with pre-mapped columns for IndiaMART, JustDial, or custom CRM exports.
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-blue-300 text-blue-700 font-medium rounded-md hover:bg-blue-50 transition-colors shadow-2xs shrink-0"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Template</span>
            </button>
          </div>

          {/* File Picker */}
          {!result && (
            <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-500 transition-colors bg-slate-50/50">
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv"
                onChange={handleFileUpload}
                className="hidden"
              />
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <div className="text-xs font-semibold text-slate-800">
                {fileName ? fileName : 'Choose CSV file to upload'}
              </div>
              <div className="text-[11px] text-slate-500 mt-1">
                Drag and drop or click below to select
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 text-xs font-medium text-slate-700 rounded-md hover:bg-slate-50 shadow-2xs"
              >
                Browse File
              </button>
            </div>
          )}

          {/* Duplicate Settings */}
          {parsedRows.length > 0 && !result && (
            <div className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-md text-xs">
              <input
                type="checkbox"
                id="skipDupes"
                checked={skipDuplicates}
                onChange={(e) => setSkipDuplicates(e.target.checked)}
                className="accent-blue-600"
              />
              <label htmlFor="skipDupes" className="text-slate-700 cursor-pointer">
                <strong>Safeguard Duplicates:</strong> Skip rows matching an existing company, phone number, or email.
              </label>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedRows.length > 0 && !result && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold text-slate-800">
                  Ready to Import ({parsedRows.length} rows parsed)
                </span>
                <span>Showing first 5 sample rows</span>
              </div>
              <div className="border border-slate-200 rounded-md overflow-x-auto max-h-48">
                <table className="w-full text-[11px] text-left">
                  <thead className="bg-slate-100 text-slate-700 font-semibold sticky top-0">
                    <tr>
                      <th className="px-2.5 py-1.5 border-b border-slate-200">Company</th>
                      <th className="px-2.5 py-1.5 border-b border-slate-200">Contact</th>
                      <th className="px-2.5 py-1.5 border-b border-slate-200">Phone</th>
                      <th className="px-2.5 py-1.5 border-b border-slate-200">Deal Value</th>
                      <th className="px-2.5 py-1.5 border-b border-slate-200">Source</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedRows.slice(0, 5).map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50">
                        <td className="px-2.5 py-1.5 font-medium text-slate-800">
                          {row['Company Name'] || row.companyName || '—'}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-600">
                          {row['Contact Person'] || row.contactName || '—'}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-600">
                          {row['Mobile'] || row.phone || '—'}
                        </td>
                        <td className="px-2.5 py-1.5 font-mono text-slate-800">
                          ₹{Number(row['Deal Value'] || row.dealValue || 0).toLocaleString('en-IN')}
                        </td>
                        <td className="px-2.5 py-1.5 text-slate-500 capitalize">
                          {row['Lead Source'] || row.source || 'direct'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Success / Result View */}
          {result && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg space-y-3">
              <div className="flex items-center gap-2 text-emerald-800 font-semibold text-sm">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
                <span>Import Process Completed</span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 bg-white border border-emerald-100 rounded">
                  <div className="text-slate-500">Successfully Imported</div>
                  <div className="text-lg font-bold text-emerald-700 mt-0.5">{result.importedCount || 0} Leads</div>
                </div>
                <div className="p-2.5 bg-white border border-emerald-100 rounded">
                  <div className="text-slate-500">Skipped (Duplicates/Invalid)</div>
                  <div className="text-lg font-bold text-amber-700 mt-0.5">{result.skippedCount || 0} Leads</div>
                </div>
              </div>

              {result.skipped && result.skipped.length > 0 && (
                <div className="mt-2 text-[11px] text-slate-600 space-y-1 max-h-32 overflow-y-auto">
                  <div className="font-semibold text-slate-700">Skipped Rows Details:</div>
                  {result.skipped.map((s: any, idx: number) => (
                    <div key={idx} className="flex items-center gap-1.5 text-slate-600">
                      <AlertCircle className="w-3 h-3 text-amber-600 shrink-0" />
                      <span>Row {s.row}: {s.reason}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 bg-slate-50 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200 rounded-md border border-slate-300 transition-colors"
          >
            {result ? 'Close' : 'Cancel'}
          </button>
          {!result && parsedRows.length > 0 && (
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={isProcessing}
              className="px-4 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md shadow-sm transition-colors flex items-center gap-1.5"
            >
              {isProcessing ? 'Processing Import...' : `Import ${parsedRows.length} Leads`}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
