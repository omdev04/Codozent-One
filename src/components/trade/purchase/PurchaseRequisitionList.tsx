import React, { useState } from 'react';
import { 
  FileCheck2, 
  Search, 
  Plus, 
  CheckCircle2, 
  XCircle, 
  ArrowRight, 
  AlertCircle,
  Clock,
  Check
} from 'lucide-react';
import { useERP } from '../../../context/ERPContext';
import { PurchaseRequisition, PurchaseRequisitionStatus } from '../../../types/erp';
import { formatIndianCurrency } from '../../../utils/indianCurrency';

interface PurchaseRequisitionListProps {
  onNewPR: () => void;
  onConvertToPO: (pr: PurchaseRequisition) => void;
}

export const PurchaseRequisitionList: React.FC<PurchaseRequisitionListProps> = ({
  onNewPR,
  onConvertToPO
}) => {
  const { purchaseRequisitions, updatePurchaseRequisitionStatus } = useERP();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [remarkModalPR, setRemarkModalPR] = useState<{ pr: PurchaseRequisition; action: 'approve' | 'reject' } | null>(null);
  const [remarks, setRemarks] = useState('');

  const filteredPRs = purchaseRequisitions.filter(pr => {
    const matchesSearch = 
      pr.prNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.department.toLowerCase().includes(searchTerm.toLowerCase()) ||
      pr.items.some(i => i.itemName.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === 'all' || pr.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusBadge = (status: PurchaseRequisitionStatus) => {
    switch (status) {
      case 'approved':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'rejected':
        return 'bg-rose-50 text-rose-700 border-rose-200';
      case 'converted_to_po':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      default:
        return 'bg-amber-50 text-amber-700 border-amber-200';
    }
  };

  const handleConfirmApprovalAction = async () => {
    if (!remarkModalPR) return;
    const newStatus: PurchaseRequisitionStatus = remarkModalPR.action === 'approve' ? 'approved' : 'rejected';
    await updatePurchaseRequisitionStatus(remarkModalPR.pr.id, newStatus, remarks);
    setRemarkModalPR(null);
    setRemarks('');
  };

  return (
    <div className="space-y-4">
      {/* Controls Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search PR number, department, material..."
            className="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all"
          />
        </div>

        <button
          onClick={onNewPR}
          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Requisition
        </button>
      </div>

      {/* PR Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        {filteredPRs.length === 0 ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            No purchase requisitions recorded. Create an internal PR to begin procurement workflow.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 uppercase font-medium border-b border-slate-200">
                <tr>
                  <th className="px-4 py-3">PR Number</th>
                  <th className="px-4 py-3">Department</th>
                  <th className="px-4 py-3">Required By</th>
                  <th className="px-4 py-3">Items Summary</th>
                  <th className="px-4 py-3 text-right">Est. Value</th>
                  <th className="px-4 py-3 text-center">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPRs.map((pr) => (
                  <tr key={pr.id} className="hover:bg-slate-50/75 transition-colors">
                    <td className="px-4 py-3 font-semibold text-slate-900 font-mono">
                      {pr.prNumber}
                      <span className="block text-[11px] font-normal text-slate-400 font-sans">{pr.requisitionDate}</span>
                    </td>
                    <td className="px-4 py-3 font-medium text-slate-800">
                      {pr.department}
                      <span className="block text-[11px] font-normal text-slate-400">By {pr.requestedBy}</span>
                    </td>
                    <td className="px-4 py-3 text-slate-600 font-medium">
                      {pr.requiredByDate}
                    </td>
                    <td className="px-4 py-3 text-slate-700">
                      {pr.items.map(i => `${i.itemName} (${i.quantity} ${i.uom})`).join(', ')}
                    </td>
                    <td className="px-4 py-3 text-right font-bold text-slate-900">
                      {formatIndianCurrency(pr.totalEstimatedAmount)}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 text-[11px] font-semibold rounded-full border capitalize ${getStatusBadge(pr.status)}`}>
                        {pr.status.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {['pending_approval', 'submitted', 'draft'].includes(pr.status) && (
                          <>
                            <button
                              onClick={() => setRemarkModalPR({ pr, action: 'approve' })}
                              className="px-2 py-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => setRemarkModalPR({ pr, action: 'reject' })}
                              className="px-2 py-1 text-[11px] font-semibold text-rose-600 hover:bg-rose-50 rounded transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {pr.status === 'approved' && (
                          <button
                            onClick={() => onConvertToPO(pr)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded transition-colors"
                          >
                            Create PO <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Approve / Reject Remark Modal */}
      {remarkModalPR && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl max-w-sm w-full p-5 shadow-2xl border border-slate-200 text-xs space-y-3">
            <h4 className="font-bold text-slate-900 text-sm">
              {remarkModalPR.action === 'approve' ? 'Approve Requisition' : 'Reject Requisition'}
            </h4>
            <p className="text-slate-500">
              PR: {remarkModalPR.pr.prNumber} • {remarkModalPR.pr.department}
            </p>
            <textarea
              rows={3}
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              placeholder="Add approval comments or rejection reason..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg resize-none"
            />
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setRemarkModalPR(null)}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmApprovalAction}
                className={`px-3 py-1.5 font-semibold text-white rounded-lg ${
                  remarkModalPR.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-rose-600 hover:bg-rose-700'
                }`}
              >
                Confirm {remarkModalPR.action === 'approve' ? 'Approval' : 'Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
