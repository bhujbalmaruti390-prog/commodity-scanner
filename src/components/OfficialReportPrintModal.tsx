import React, { useState } from 'react';
import { 
  X, 
  Download, 
  Scale, 
  CheckCircle2, 
  AlertTriangle, 
  FileCheck2, 
  Building2,
  Loader2
} from 'lucide-react';
import { InspectionRecord, DeclarationItem } from '../types/metrology';
import { downloadInspectionPDF, ReportRoleType } from '../utils/pdfGenerator';

interface OfficialReportPrintModalProps {
  inspection: InspectionRecord | null;
  onClose: () => void;
  userRole?: ReportRoleType;
}

export const OfficialReportPrintModal: React.FC<OfficialReportPrintModalProps> = ({
  inspection,
  onClose,
  userRole = 'inspector'
}) => {
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  if (!inspection) return null;

  const handleDownloadPdf = async () => {
    try {
      setIsGeneratingPdf(true);
      await downloadInspectionPDF(inspection, userRole);
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Failed to generate PDF:', err);
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const isCompliant = inspection.overall_status === 'COMPLIANT';
  const isValid = isCompliant || (inspection.violations || []).length === 0;

  // Role tailored titles
  let formTitle = '';
  let formSubtitle = '';
  let authorityTitle = 'Enforcement Wing, Dept. of Consumer Affairs';
  let signatoryDesignation = 'Inspector of Legal Metrology';
  let sealText = 'OFFICIAL SEAL / STAMP';

  if (userRole === 'user') {
    formTitle = isCompliant
      ? 'Pre-Market Packaging Compliance Certificate (Form PAC-2011)'
      : 'Packaging Artwork Proof Audit & Rectification Notice';
    formSubtitle = 'Industry Self-Audit Verification under Legal Metrology (Packaged Commodities) Rules, 2011';
    authorityTitle = 'Packaging Quality & Regulatory Compliance Division';
    signatoryDesignation = 'Packaging Quality Assurance Lead Auditor';
    sealText = 'PRE-MARKET AUDIT CLEARANCE SEAL';
  } else {
    formTitle = isCompliant
      ? 'Certificate of Packaging Compliance & Inspection Record'
      : 'Statutory Inspection Report & Notice of Violation (Form LM-PC)';
    formSubtitle = 'Under Section 18 & 36 of Legal Metrology Act, 2009 read with LM(PC) Rules, 2011';
    authorityTitle = 'Directorate of Legal Metrology • Enforcement Wing';
    signatoryDesignation = 'Inspector of Legal Metrology';
    sealText = 'DIRECTORATE OF LEGAL METROLOGY SEAL';
  }

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200">
        {/* Floating action bar */}
        <div className="no-print sticky top-0 bg-slate-900 text-white p-3 sm:px-6 rounded-t-2xl flex flex-wrap items-center justify-between gap-2.5 z-10 border-b border-slate-800">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-200 min-w-0">
            <Scale className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="truncate text-[11px] sm:text-xs">
              {userRole === 'user'
                ? 'Packaging Proof Certificate Preview'
                : 'Inspection Notice Preview'}
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-download-pdf-modal"
              onClick={handleDownloadPdf}
              disabled={isGeneratingPdf}
              className={`inline-flex items-center gap-1.5 px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-75 shadow-xs ${
                downloadSuccess
                  ? 'bg-emerald-500 text-white hover:bg-emerald-400'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
              }`}
              title="Generate and download actual .pdf file"
            >
              {isGeneratingPdf ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Generating PDF...</span>
                </>
              ) : downloadSuccess ? (
                <>
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>PDF Downloaded!</span>
                </>
              ) : (
                <>
                  <Download className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* The Printable Official Document */}
        <div className="p-4 sm:p-8 md:p-12 text-slate-900 font-sans space-y-6 bg-white">
          {/* Official Letterhead Header */}
          <div className="text-center border-b-2 border-slate-900 pb-5 space-y-1">
            <div className="w-12 h-12 mx-auto mb-2 text-slate-900 flex items-center justify-center">
              <Scale className="w-10 h-10 stroke-[2]" />
            </div>
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-slate-700">
              Government of India
            </h2>
            <h1 className="text-sm font-black uppercase tracking-wider text-slate-900">
              Ministry of Consumer Affairs, Food &amp; Public Distribution
            </h1>
            <h3 className="text-xs font-semibold text-slate-600">
              {authorityTitle}
            </h3>
            <p className="text-[10px] font-mono text-slate-500">
              {formSubtitle}
            </p>
          </div>

          {/* Title Banner */}
          <div className={`text-center py-2 border rounded font-bold text-xs uppercase tracking-wide ${
            isCompliant
              ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
              : 'bg-rose-50 text-rose-900 border-rose-300'
          }`}>
            {formTitle}
          </div>

          {/* Metadata Block */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 text-xs border border-slate-300 rounded-lg p-3 sm:p-4 bg-slate-50/50">
            <div className="space-y-1">
              <div>
                <span className="font-bold text-slate-600">Inspection Reference No: </span>
                <span className="font-mono font-bold text-slate-900">{inspection.inspection_reference_no}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Date &amp; Time of Audit: </span>
                <span>{new Date(inspection.timestamp).toLocaleString()}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Premises of Inspection: </span>
                <span>{inspection.retailer_premise || 'Retail Outlet Premise'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Product / Commodity: </span>
                <span className="font-bold">{inspection.product_name}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div>
                <span className="font-bold text-slate-600">Brand / Trademark: </span>
                <span>{inspection.brand_name || 'N/A'}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Manufacturer / Packer: </span>
                <span>{inspection.manufacturer_name}</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Inspecting Officer: </span>
                <span>{inspection.officer_name} (Badge: {inspection.officer_badge})</span>
              </div>
              <div>
                <span className="font-bold text-slate-600">Statutory Score: </span>
                <span className="font-bold font-mono">{inspection.compliance_score} / 100</span>
              </div>
            </div>
          </div>

          {/* Declarations Findings Table */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              1. Verification of Mandatory Declarations (Rule 6)
            </h4>
            <table className="w-full text-left text-xs border border-slate-300">
              <thead className="bg-slate-100 font-bold text-[11px] border-b border-slate-300">
                <tr>
                  <th className="p-2 border-r border-slate-300">Statutory Rule</th>
                  <th className="p-2 border-r border-slate-300">Prescribed Declaration</th>
                  <th className="p-2 border-r border-slate-300">Observed Inscription on Package</th>
                  <th className="p-2">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-300 text-[11px]">
                {(Object.entries(inspection.declarations) as [string, DeclarationItem][]).map(([key, item]) => (
                  <tr key={key}>
                    <td className="p-2 font-mono font-bold border-r border-slate-300">{item.rule_reference}</td>
                    <td className="p-2 font-semibold border-r border-slate-300">{item.name}</td>
                    <td className="p-2 border-r border-slate-300 font-mono text-[10px] text-slate-700">{item.detected_text || 'NOT DETECTED'}</td>
                    <td className="p-2 font-bold">
                      {item.status === 'PRESENT_AND_COMPLIANT' ? (
                        <span className="text-emerald-700">COMPLIANT</span>
                      ) : (
                        <span className="text-rose-700">VIOLATION</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Typography & Readability & Prohibited terms */}
          <div className="grid grid-cols-2 gap-4 text-xs border border-slate-300 p-3 rounded-lg">
            <div>
              <span className="font-bold text-slate-700 block mb-1">Font Height Verification (Rule 7):</span>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>Observed Min Height: <strong className="font-mono">{inspection.font_analysis?.estimated_min_height_mm || 2.0} mm</strong></div>
                <div>Statutory Required: <strong className="font-mono">{inspection.font_analysis?.required_min_height_mm || 3.0} mm</strong></div>
                <div>Contrast: <strong>{inspection.font_analysis?.contrast_rating || 'High'}</strong></div>
              </div>
            </div>
            <div>
              <span className="font-bold text-slate-700 block mb-1">Rule 13 &amp; Sec 36(2) Integrity:</span>
              <div className="text-[11px] text-slate-600 space-y-0.5">
                <div>Prohibited Terms: <strong>{inspection.prohibited_practices?.has_prohibited_terms ? `YES (${inspection.prohibited_practices.detected_prohibited_terms.join(', ')})` : 'NONE'}</strong></div>
                <div>Dual MRP / Overwriting: <strong>{inspection.prohibited_practices?.has_dual_mrp ? 'VIOLATION DETECTED' : 'CLEAN'}</strong></div>
                <div>Tax Inclusive Clause: <strong>{inspection.prohibited_practices?.is_tax_inclusive_omitted ? 'OMITTED (DEFECT)' : 'PRESENT'}</strong></div>
              </div>
            </div>
          </div>

          {/* Violations List if any */}
          {inspection.violations?.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                2. Summary of Statutory Infractions &amp; Legal Liabilities
              </h4>
              <div className="space-y-2 text-xs">
                {inspection.violations.map((vio, index) => (
                  <div key={index} className="p-3 bg-rose-50 border border-rose-200 rounded space-y-1">
                    <div className="flex items-center justify-between font-bold">
                      <span className="text-rose-900">{vio.title}</span>
                      <span className="font-mono text-[11px] text-rose-800">{vio.rule} • {vio.act_section}</span>
                    </div>
                    <p className="text-[11px] text-slate-700">{vio.description}</p>
                    <div className="text-[10px] text-rose-900 pt-1 border-t border-rose-200/60 flex justify-between">
                      <span><strong>Required Action:</strong> {vio.remedial_action}</span>
                      <span><strong>Liability:</strong> {vio.statutory_penalty_summary}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Officer Direction / Panchnama notes */}
          <div className="border border-slate-300 rounded p-3 text-xs space-y-1 bg-slate-50/50">
            <span className="font-bold text-slate-800">Officer Enforcement Directive:</span>
            <p className="text-slate-700 text-[11px] leading-relaxed">
              {inspection.officer_notes || inspection.summary}
            </p>
            <div className="pt-1 text-[10px] font-mono text-slate-500">
              Recommended Action: {inspection.officer_action_recommended.replace(/_/g, ' ')}
            </div>
          </div>

          {/* Dedicated Full-Width Executive Sign-Off & Panchnama Block */}
          <div className="pt-6 border-t border-slate-300 space-y-4">
            {/* Dedicated 2-Line Heading */}
            <div className="text-left font-bold text-slate-900 leading-tight space-y-0.5">
              {userRole === 'user' ? (
                <>
                  <div className="text-xs uppercase tracking-wide text-slate-900 font-extrabold">INDUSTRY PRE-MARKET AUDIT SIGN-OFF &amp; CERTIFICATION</div>
                  <div className="text-xs uppercase tracking-wide text-slate-600 font-bold">CORPORATE PACKAGING QA SIGNATURE</div>
                </>
              ) : (
                <>
                  <div className="text-xs uppercase tracking-wide text-slate-900 font-extrabold">ENFORCEMENT OFFICER SIGN-OFF &amp; PANCHNAMA WITNESS</div>
                  <div className="text-xs uppercase tracking-wide text-slate-600 font-bold">INSPECTING OFFICER SIGNATURE</div>
                </>
              )}
            </div>

            {/* Officer Details below heading */}
            <div className="text-xs text-slate-700 space-y-1 bg-slate-50/60 p-3 rounded-lg border border-slate-200">
              {userRole === 'user' ? (
                <>
                  <div><span className="font-semibold text-slate-900">Auditor Name:</span> Certified Packaging QA Lead</div>
                  <div><span className="font-semibold text-slate-900">Official Division:</span> Packaging Compliance Division</div>
                  <div><span className="font-semibold text-slate-900">Audit Status:</span> Transmitted to Legal &amp; Regulatory Affairs</div>
                </>
              ) : (
                <>
                  <div><span className="font-semibold text-slate-900">Officer Name:</span> {inspection.officer_name}</div>
                  <div><span className="font-semibold text-slate-900">Official Badge No:</span> {inspection.officer_badge}</div>
                  <div><span className="font-semibold text-slate-900">Action Recommended:</span> {inspection.officer_action_recommended.replace(/_/g, ' ')}</div>
                </>
              )}
            </div>

            {/* Signature, Authority and Bottom-Right Validation Seal Block */}
            <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row sm:items-end justify-between gap-4 text-xs">
              {/* Dedicated Signature Area */}
              <div className="space-y-1">
                <div className="w-48 border-b border-slate-400 pb-1 font-mono font-bold text-sm text-slate-900">
                  {userRole === 'user'
                    ? 'Certified Packaging QA Lead'
                    : inspection.officer_name}
                </div>
                <div className="text-[11px] text-slate-600 font-semibold">
                  {signatoryDesignation}
                </div>
                <div className="text-[10px] text-slate-400 font-mono">
                  {userRole === 'user'
                    ? 'Internal Quality & Legal Metrology Cell'
                    : 'Directorate of Legal Metrology'}
                </div>
              </div>

              {/* Official Seal */}
              <div className="space-y-1">
                <div className="w-28 h-20 border border-dashed border-slate-400 rounded flex items-center justify-center text-[9px] text-slate-500 font-mono text-center p-2 uppercase font-semibold">
                  {sealText}
                </div>
                <div className="text-[10px] text-slate-500 text-center">{authorityTitle}</div>
              </div>

              {/* Bottom-Right Statutory Validation Stamp */}
              <div className="self-end">
                {isValid ? (
                  <div className="px-3.5 py-2.5 rounded-lg border-2 border-emerald-500 bg-emerald-50 text-emerald-950 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                      ✓
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs text-emerald-800 tracking-wider">VALID</div>
                      <div className="text-[10px] font-bold text-emerald-700">STATUTORILY COMPLIANT</div>
                      <div className="text-[9px] text-emerald-600 font-mono">Legal Metrology Rules, 2011</div>
                    </div>
                  </div>
                ) : (
                  <div className="px-3.5 py-2.5 rounded-lg border-2 border-rose-600 bg-rose-50 text-rose-950 flex items-center gap-3 shadow-xs">
                    <div className="w-8 h-8 rounded-full bg-rose-600 text-white flex items-center justify-center font-black text-base shadow-xs shrink-0">
                      ✕
                    </div>
                    <div className="text-left">
                      <div className="font-black text-xs text-rose-800 tracking-wider">INVALID</div>
                      <div className="text-[10px] font-bold text-rose-700">{inspection.violations?.length || 1} STATUTORY INFRACTIONS</div>
                      <div className="text-[9px] text-rose-600 font-mono">Action Req. under Sec 36</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
