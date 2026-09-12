import React, { useState } from 'react';
import { 
  Archive, 
  Search, 
  Filter, 
  Download, 
  FileSpreadsheet, 
  Trash2, 
  Eye, 
  Building2, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  FileText, 
  Loader2,
  ShieldCheck
} from 'lucide-react';
import { InspectionRecord } from '../types/metrology';
import { downloadInspectionPDF, ReportRoleType } from '../utils/pdfGenerator';
import { useLanguage } from '../i18n/LanguageContext';

interface RepositoryViewProps {
  inspections: InspectionRecord[];
  onSelectInspection: (record: InspectionRecord) => void;
  onDeleteInspection: (id: string) => void;
  onOpenPrintModal: (record: InspectionRecord) => void;
  userRole?: ReportRoleType;
}

export const RepositoryView: React.FC<RepositoryViewProps> = ({
  inspections,
  onSelectInspection,
  onDeleteInspection,
  onOpenPrintModal,
  userRole = 'inspector'
}) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [categoryFilter, setCategoryFilter] = useState<string>('ALL');
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const filteredRecords = inspections.filter(item => {
    const matchesSearch = 
      item.product_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.brand_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.inspection_reference_no.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.manufacturer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.barcode_or_sku && item.barcode_or_sku.includes(searchTerm));

    const matchesStatus = 
      statusFilter === 'ALL' || item.overall_status === statusFilter;

    const matchesCategory = 
      categoryFilter === 'ALL' || item.category === categoryFilter;

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const categories = Array.from(new Set(inspections.map(i => i.category)));

  const handleRowPdfDownload = async (record: InspectionRecord, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      setDownloadingId(record.id);
      await downloadInspectionPDF(record, userRole);
    } catch (err) {
      console.error('Failed row PDF generation:', err);
      onOpenPrintModal(record);
    } finally {
      setDownloadingId(null);
    }
  };

  const exportAllCSV = () => {
    const headers = [
      'Reference No',
      'Timestamp',
      'Product Name',
      'Brand',
      'Category',
      'Batch/Lot',
      'Barcode/SKU',
      'Premise',
      'Officer Name',
      'Overall Status',
      'Compliance Score',
      'Violations Count',
      'Officer Action'
    ];

    const rows = filteredRecords.map(r => [
      `"${r.inspection_reference_no}"`,
      `"${r.timestamp}"`,
      `"${r.product_name.replace(/"/g, '""')}"`,
      `"${r.brand_name.replace(/"/g, '""')}"`,
      `"${r.category}"`,
      `"${r.batch_or_lot || ''}"`,
      `"${r.barcode_or_sku || ''}"`,
      `"${(r.retailer_premise || '').replace(/"/g, '""')}"`,
      `"${r.officer_name}"`,
      `"${r.overall_status}"`,
      r.compliance_score,
      r.violations_count,
      `"${r.officer_action_recommended}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Legal_Metrology_Inspections_Log_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header & Batch Export */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
              userRole === 'user' 
                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                : 'bg-amber-100 text-amber-900 border border-amber-300'
            }`}>
              {userRole === 'user' ? t('repo.badge_user', 'Industry Pre-Market QA Dataset') : t('repo.badge_inspector', 'Official Enforcement Panchnama Records')}
            </span>
          </div>
          <h1 className="text-lg sm:text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Archive className={`w-5 h-5 ${userRole === 'user' ? 'text-emerald-600' : 'text-amber-600'}`} />
            {userRole === 'user' 
              ? t('repo.title_user', 'Packaging Artwork Proofs & Self-Audit Repository') 
              : t('repo.title_inspector', 'Enforcement Inspections & Panchnama Repository')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'user'
              ? t('repo.subtitle_user', 'Registry of pre-market packaging artwork scans, batch clearance audits, and SKU approval logs')
              : t('repo.subtitle_inspector', 'Historical registry of market field inspections, retail samples, and compounding notices')}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-semibold bg-slate-50 border-slate-200 text-slate-700 shadow-2xs">
            {userRole === 'user' ? (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>{t('repo.db_user_count', 'User Database')} ({inspections.length})</span>
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                <span>{t('repo.db_inspector_count', 'Inspector Panchnama DB')} ({inspections.length})</span>
              </>
            )}
          </div>

          <button
            onClick={exportAllCSV}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('repo.export_csv', 'Export Logs (CSV)')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-slate-200 rounded-xl p-3.5 sm:p-4 shadow-xs flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        <div className="relative w-full lg:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={userRole === 'user' ? t('repo.search_user', "Search by artwork, brand, SKU...") : t('repo.search_inspector', "Search by product, brand, barcode, or ref...")}
            className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 w-full lg:w-auto">
          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="font-semibold text-slate-500 text-[11px] shrink-0">{t('repo.status_filter', 'Status:')}</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full text-xs bg-transparent border-0 text-slate-800 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('repo.all_statuses', 'All Statuses')}</option>
              <option value="COMPLIANT">{userRole === 'user' ? t('repo.approved_user', 'Approved (Compliant)') : t('repo.compliant_only', 'Compliant Only')}</option>
              <option value="NON_COMPLIANT">{userRole === 'user' ? t('repo.revision_user', 'Revision Needed (Violations)') : t('repo.violations_only', 'Non-Compliant Violations')}</option>
              <option value="NEEDS_REVIEW">{t('repo.needs_review', 'Needs Review')}</option>
            </select>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5">
            <span className="font-semibold text-slate-500 text-[11px] shrink-0">{t('repo.category_filter', 'Category:')}</span>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full text-xs bg-transparent border-0 text-slate-800 focus:ring-0 focus:outline-none cursor-pointer"
            >
              <option value="ALL">{t('repo.all_categories', 'All Categories')}</option>
              {categories.map(c => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Repository Records Display */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden">
        {filteredRecords.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-400 text-xs">
            <Archive className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-600">{t('repo.no_records_title', 'No records found in this view.')}</p>
            <p className="text-[11px] text-slate-400 mt-1">
              {userRole === 'user' 
                ? t('repo.no_records_desc_user', 'No industry packaging proofs match your search. Scan a new label or reset filters.')
                : t('repo.no_records_desc_inspector', 'No enforcement inspection records match your search. Initiate a new scan or reset filters.')}
            </p>
          </div>
        ) : (
          <>
            {/* Mobile Card List (screens < md) */}
            <div className="md:hidden divide-y divide-slate-100">
              {filteredRecords.map((record) => (
                <div key={record.id} className="p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                        {record.inspection_reference_no}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5 truncate">
                        {record.product_name}
                      </h3>
                      <div className="text-[11px] text-slate-500 truncate">
                        {record.brand_name} • {record.category}
                      </div>
                    </div>
                    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 shadow-2xs ${
                      record.overall_status === 'COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {record.overall_status === 'COMPLIANT' ? (
                        <>
                          <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                          {userRole === 'user' ? t('repo.approved_user', 'Approved') : t('repo.compliant_only', 'Compliant')}
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3 text-rose-600" />
                          {userRole === 'user' ? t('repo.revision_user', 'Revision Needed') : t('dashboard.violation', 'Violation')}
                        </>
                      )}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-100">
                    <div>
                      <span className="text-slate-400 block text-[10px]">{t('detail.statutory_score', 'Compliance Score')}</span>
                      <span className="font-mono font-bold text-slate-900">{record.compliance_score}/100</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">{t('repo.table_date', 'Date')}</span>
                      <span className="font-medium text-slate-800">{new Date(record.timestamp).toLocaleDateString()}</span>
                    </div>
                    <div className="col-span-2">
                      <span className="text-slate-400 block text-[10px]">
                        {userRole === 'user' ? 'Facility / Line' : t('detail.premises', 'Premises')}
                      </span>
                      <span className="truncate block font-medium text-slate-800">
                        {record.retailer_premise || (userRole === 'user' ? 'Packaging Facility - Line 2' : 'Field Premise')}
                      </span>
                    </div>
                    <div className="col-span-2 pt-1 border-t border-slate-200/60">
                      <span className="text-slate-400 block text-[10px]">
                        {userRole === 'user' ? t('repo.table_user_verdict', 'QA Clearance Verdict') : t('repo.table_verdict', 'Enforcement Verdict')}
                      </span>
                      <span className="text-slate-700 font-semibold text-[11px]">
                        {record.officer_action_recommended.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Touch-friendly buttons */}
                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={(e) => handleRowPdfDownload(record, e)}
                      disabled={downloadingId === record.id}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 active:bg-amber-200 text-amber-900 text-xs font-bold transition border border-amber-200 cursor-pointer"
                    >
                      {downloadingId === record.id ? (
                        <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                      ) : (
                        <Download className="w-4 h-4" />
                      )}
                      <span>{t('repo.btn_pdf', 'PDF')}</span>
                    </button>
                    <button
                      onClick={() => onSelectInspection(record)}
                      className="inline-flex items-center justify-center gap-1.5 min-h-[38px] px-3.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 active:bg-slate-300 text-slate-800 text-xs font-bold transition border border-slate-200 cursor-pointer"
                    >
                      <Eye className="w-4 h-4" />
                      <span>{t('repo.btn_view', 'View')}</span>
                    </button>
                    <button
                      onClick={() => onDeleteInspection(record.id)}
                      className="inline-flex items-center justify-center min-h-[38px] min-w-[38px] p-2 rounded-lg hover:bg-rose-50 text-slate-400 hover:text-rose-600 transition border border-transparent hover:border-rose-200 cursor-pointer"
                      title={t('repo.btn_delete', 'Delete')}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Desktop / Tablet Table View (screens >= md) */}
            <div className="hidden md:block overflow-x-auto">
              <table className="min-w-[840px] w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                  <tr>
                    <th className="p-3.5">{userRole === 'user' ? 'Artwork / SKU Ref' : t('repo.table_ref', 'Reference No')}</th>
                    <th className="p-3.5">{userRole === 'user' ? 'Artwork & Commodity' : t('repo.table_product', 'Package / Commodity')}</th>
                    <th className="p-3.5">{userRole === 'user' ? 'Facility / Line' : t('repo.table_premise', 'Premise / Manufacturer')}</th>
                    <th className="p-3.5">{t('repo.table_date', 'Date')}</th>
                    <th className="p-3.5">{t('repo.table_status', 'Compliance Status')}</th>
                    <th className="p-3.5">{t('repo.table_score', 'Score')}</th>
                    <th className="p-3.5">{userRole === 'user' ? t('repo.table_user_verdict', 'Pre-Print Verdict') : t('repo.table_verdict', 'Enforcement Verdict')}</th>
                    <th className="p-3.5 text-right">{t('repo.table_actions', 'Actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredRecords.map((record) => (
                    <tr key={record.id} className="hover:bg-slate-50/80 transition">
                      <td className="p-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {record.inspection_reference_no}
                      </td>
                      <td className="p-3.5">
                        <div className="font-bold text-slate-900">{record.product_name}</div>
                        <div className="text-[11px] text-slate-400">
                          {record.brand_name} • {record.category}
                        </div>
                      </td>
                      <td className="p-3.5 text-slate-600 max-w-xs truncate">
                        <div className="font-medium text-slate-800">{record.retailer_premise || (userRole === 'user' ? 'Packaging Line 2' : 'Field Premise')}</div>
                        <div className="text-[10px] text-slate-400 truncate">{record.manufacturer_name}</div>
                      </td>
                      <td className="p-3.5 text-slate-500 whitespace-nowrap">
                        {new Date(record.timestamp).toLocaleDateString()}
                      </td>
                      <td className="p-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                          record.overall_status === 'COMPLIANT'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}>
                          {record.overall_status === 'COMPLIANT' ? (
                            <>
                              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                              {userRole === 'user' ? t('repo.approved_user', 'Approved') : t('repo.compliant_only', 'Compliant')}
                            </>
                          ) : (
                            <>
                              <XCircle className="w-3 h-3 text-rose-600" />
                              {userRole === 'user' ? t('repo.revision_user', 'Revision Needed') : t('dashboard.violation', 'Violation')}
                            </>
                          )}
                        </span>
                      </td>
                      <td className="p-3.5 font-mono font-bold text-slate-800 whitespace-nowrap">
                        {record.compliance_score}/100
                      </td>
                      <td className="p-3.5">
                        <span className="text-[11px] font-semibold text-slate-700">
                          {record.officer_action_recommended.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="p-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={(e) => handleRowPdfDownload(record, e)}
                            disabled={downloadingId === record.id}
                            className="p-1.5 rounded-lg hover:bg-amber-100 text-amber-700 hover:text-amber-900 transition disabled:opacity-50 cursor-pointer"
                            title={t('detail.download_pdf', 'Download Official PDF Report')}
                          >
                            {downloadingId === record.id ? (
                              <Loader2 className="w-4 h-4 animate-spin text-amber-600" />
                            ) : (
                              <Download className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => onSelectInspection(record)}
                            className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition cursor-pointer"
                            title={t('repo.btn_view', 'View Full Dossier')}
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onDeleteInspection(record.id)}
                            className="p-1.5 rounded-lg hover:bg-rose-100 text-slate-400 hover:text-rose-700 transition cursor-pointer"
                            title={t('repo.btn_delete', 'Delete Record')}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
