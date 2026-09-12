import React, { useState } from 'react';
import { 
  AlertOctagon, 
  Scale, 
  Filter, 
  ArrowUpRight,
  Building2,
  BadgeCheck,
  CheckCircle,
  XCircle,
  CheckCircle2,
  BookOpen
} from 'lucide-react';
import { InspectionRecord } from '../types/metrology';
import { useLanguage } from '../i18n/LanguageContext';

interface DashboardViewProps {
  inspections: InspectionRecord[];
  onSelectInspection: (record: InspectionRecord) => void;
  onNewScan: () => void;
  userRole?: 'inspector' | 'user';
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  inspections,
  onSelectInspection,
  onNewScan,
  userRole = 'inspector'
}) => {
  const { t } = useLanguage();
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>('ALL');
  const [docketFilter, setDocketFilter] = useState<'ALL' | 'NOTICES' | 'COMPOUNDING' | 'SEIZURES'>('ALL');

  const totalInspected = inspections.length;
  const compliantCount = inspections.filter(i => i.overall_status === 'COMPLIANT').length;
  const nonCompliantCount = inspections.filter(i => i.overall_status === 'NON_COMPLIANT').length;
  const reviewCount = inspections.filter(i => i.overall_status === 'NEEDS_REVIEW').length;
  const noticesIssued = inspections.filter(i => i.officer_action_recommended === 'ISSUE_NOTICE').length;
  const seizuresExecuted = inspections.filter(i => i.officer_action_recommended === 'SEIZE_COMMODITY').length;
  const compoundingCases = inspections.filter(i => i.officer_action_recommended === 'COMPOUNDING_OFFENCE').length;

  const complianceRate = totalInspected > 0 ? Math.round((compliantCount / totalInspected) * 100) : 0;

  // Compute common violation counts
  const violationCounts: Record<string, { count: number; rule: string; act: string }> = {};
  inspections.forEach(insp => {
    insp.violations.forEach(v => {
      const key = v.title;
      if (!violationCounts[key]) {
        violationCounts[key] = { count: 0, rule: v.rule, act: v.act_section };
      }
      violationCounts[key].count++;
    });
  });

  const sortedViolations = Object.entries(violationCounts)
    .map(([title, data]) => ({ title, ...data }))
    .sort((a, b) => b.count - a.count);

  const filteredInspections = selectedCategoryFilter === 'ALL'
    ? inspections
    : inspections.filter(i => i.category === selectedCategoryFilter);

  const uniqueCategories = Array.from(new Set(inspections.map(i => i.category)));

  // Adjudication Docket for Senior Controller
  const adjudicationDocket = inspections.filter(item => {
    if (docketFilter === 'NOTICES') return item.officer_action_recommended === 'ISSUE_NOTICE';
    if (docketFilter === 'COMPOUNDING') return item.officer_action_recommended === 'COMPOUNDING_OFFENCE';
    if (docketFilter === 'SEIZURES') return item.officer_action_recommended === 'SEIZE_COMMODITY';
    return item.overall_status !== 'COMPLIANT' || item.officer_action_recommended !== 'NO_ACTION';
  });

  return (
    <div className="space-y-6">
      {/* Enforcement Dashboard Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Scale className="w-5 h-5 text-amber-600" />
            {userRole === 'user' ? t('dashboard.user_title', 'Packaging Quality & Pre-Market Compliance Dashboard') : t('dashboard.title', 'Enforcement Official Dashboard')}
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {userRole === 'user' ? t('dashboard.user_subtitle', 'Artwork verification monitoring, compliance scoring, and defect resolution center') : t('dashboard.subtitle', 'Field inspection monitoring under Legal Metrology Act, 2009 and Legal Metrology (Packaged Commodities) Rules, 2011')}
          </p>
        </div>
        <button
          onClick={onNewScan}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md shadow-amber-500/20 transition cursor-pointer"
        >
          <span>{t('dashboard.initiate_scan', 'Initiate New Product Scan')}</span>
          <ArrowUpRight className="w-4 h-4" />
        </button>
      </div>

      {/* Enforcement KPI Cards Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-slate-500 uppercase">{t('dashboard.total_inspections', 'Total Inspected')}</div>
          <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">{totalInspected}</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{t('dashboard.across_audits', 'Across retail audits')}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-emerald-700 uppercase">{t('dashboard.compliance_rate', 'Compliant Rate')}</div>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 mt-1">{complianceRate}%</div>
          <div className="text-[10px] text-emerald-700 mt-0.5">{compliantCount} of {totalInspected} {t('dashboard.passed', 'passed')}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-rose-700 uppercase">{t('dashboard.non_compliant_packs', 'Non-Compliant Packs')}</div>
          <div className="text-xl sm:text-2xl font-black text-rose-600 mt-1">{nonCompliantCount}</div>
          <div className="text-[10px] text-rose-700 mt-0.5">{t('dashboard.statutory_violations', 'Statutory violations')}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs">
          <div className="text-[10px] sm:text-[11px] font-bold text-amber-700 uppercase">{t('dashboard.notices_issued', 'Notices Issued')}</div>
          <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">{noticesIssued}</div>
          <div className="text-[10px] text-amber-700 mt-0.5">{t('dashboard.under_sec', 'Under Sec 18 / 36')}</div>
        </div>

        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs col-span-2 sm:col-span-1">
          <div className="text-[10px] sm:text-[11px] font-bold text-purple-700 uppercase">{t('dashboard.seizures_executed', 'Seizures Executed')}</div>
          <div className="text-xl sm:text-2xl font-black text-purple-600 mt-1">{seizuresExecuted}</div>
          <div className="text-[10px] text-purple-700 mt-0.5">{t('dashboard.dual_mrp_tampering', 'Dual MRP / Tampering')}</div>
        </div>
      </div>

      {/* Top Statutory Violations Detected */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <AlertOctagon className="w-4 h-4 text-rose-600" />
            {t('dashboard.top_violations', 'Most Frequent Statutory Violations')}
          </h2>
          <span className="text-xs text-slate-400">{t('dashboard.act_citation', 'Legal Metrology Act, 2009')}</span>
        </div>

        {sortedViolations.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-400">
            {t('dashboard.no_violations', 'No violations recorded yet.')}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {sortedViolations.map((item, idx) => {
              const percentage = Math.round((item.count / (nonCompliantCount || 1)) * 100);
              return (
                <div key={idx} className="p-3 rounded-lg bg-slate-50 border border-slate-200 space-y-1.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold text-amber-800 bg-amber-100/60 px-1.5 py-0.2 rounded mr-1.5">
                        {item.rule}
                      </span>
                      <span className="text-xs font-bold text-slate-800">{item.title}</span>
                    </div>
                    <span className="text-xs font-black text-rose-600 shrink-0 font-mono">
                      {item.count} {item.count > 1 ? t('dashboard.cases', 'cases') : t('dashboard.case', 'case')}
                    </span>
                  </div>

                  <div className="w-full h-1.5 bg-slate-200 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-rose-500 rounded-full"
                      style={{ width: `${Math.min(100, percentage)}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Inspections Table with Filter */}
      <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Building2 className="w-4 h-4 text-slate-600" />
            {userRole === 'user'
              ? t('dashboard.recent_user_audits', 'Recent Pre-Market Packaging Artwork Audits')
              : t('dashboard.recent_inspections', 'Recent Enforcement Field Inspections')}
          </h2>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={selectedCategoryFilter}
              onChange={(e) => setSelectedCategoryFilter(e.target.value)}
              className="text-xs bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-medium text-slate-700 focus:outline-none focus:ring-1 focus:ring-amber-500 cursor-pointer"
            >
              <option value="ALL">{t('dashboard.all_categories', 'All Categories')} ({inspections.length})</option>
              {uniqueCategories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Mobile Cards for screens < md */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredInspections.map(record => (
            <div 
              key={record.id}
              onClick={() => onSelectInspection(record)}
              className="p-3.5 space-y-2 hover:bg-slate-50/80 active:bg-slate-100 transition cursor-pointer"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <span className="font-mono text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">
                    {record.inspection_reference_no}
                  </span>
                  <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">{record.product_name}</h4>
                  <div className="text-[10px] text-slate-500">{record.brand_name} • {record.category}</div>
                </div>
                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                  record.overall_status === 'COMPLIANT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {record.overall_status === 'COMPLIANT' ? t('dashboard.passed', 'Passed') : t('dashboard.violation', 'Violation')}
                </span>
              </div>
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="font-mono font-bold text-slate-700">{t('dashboard.col_score', 'Score')}: {record.compliance_score}/100</span>
                <span className="text-amber-600 font-bold text-xs flex items-center gap-1">
                  {t('dashboard.view_dossier', 'View Dossier →')} <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Desktop / Tablet Table for screens >= md */}
        <div className="hidden md:block overflow-x-auto">
          <table className="min-w-[720px] w-full text-left text-xs">
            <thead className="bg-slate-50 border-y border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
              <tr>
                <th className="p-3">{t('dashboard.col_ref', 'Reference No.')}</th>
                <th className="p-3">{t('dashboard.col_product', 'Product & Brand')}</th>
                <th className="p-3">{t('dashboard.col_category', 'Category')}</th>
                <th className="p-3">{t('dashboard.col_verdict', 'Verdict')}</th>
                <th className="p-3">{t('dashboard.col_score', 'Score')}</th>
                <th className="p-3">{userRole === 'user' ? t('dashboard.col_user_action', 'QA Clearance') : t('dashboard.col_action', 'Officer Action')}</th>
                <th className="p-3 text-right">{t('dashboard.col_table_action', 'Action')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredInspections.map(record => (
                <tr 
                  key={record.id}
                  onClick={() => onSelectInspection(record)}
                  className="hover:bg-amber-50/40 transition cursor-pointer"
                >
                  <td className="p-3 font-mono font-bold text-slate-700 whitespace-nowrap">
                    {record.inspection_reference_no}
                  </td>
                  <td className="p-3">
                    <div className="font-bold text-slate-900">{record.product_name}</div>
                    <div className="text-[11px] text-slate-400">{record.brand_name}</div>
                  </td>
                  <td className="p-3 text-slate-600">{record.category}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      record.overall_status === 'COMPLIANT'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {record.overall_status === 'COMPLIANT' ? t('dashboard.passed', 'Passed') : t('dashboard.violation', 'Violation')}
                    </span>
                  </td>
                  <td className="p-3 font-mono font-bold text-slate-800 whitespace-nowrap">
                    {record.compliance_score}/100
                  </td>
                  <td className="p-3">
                    <span className="font-semibold text-slate-700">
                      {record.officer_action_recommended.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-3 text-right whitespace-nowrap">
                    <span className="text-amber-600 hover:text-amber-700 font-bold text-xs inline-flex items-center gap-0.5">
                      {t('dashboard.view_dossier', 'View Dossier →')}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

