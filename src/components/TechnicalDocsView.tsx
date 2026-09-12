import React from 'react';
import { 
  BookOpen, 
  Cpu, 
  Server, 
  ShieldCheck, 
  Scale, 
  Layers, 
  Database, 
  Terminal,
  CheckCircle2
} from 'lucide-react';
import { LEGAL_METROLOGY_RULES } from '../data/metrologyRules';
import { useLanguage } from '../i18n/LanguageContext';

export const TechnicalDocsView: React.FC = () => {
  const { t } = useLanguage();

  return (
    <div className="space-y-8">
      {/* Top Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-amber-600" />
          {t('rules.title', 'Technical Documentation & Statutory Legal Architecture')}
        </h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {t('rules.subtitle', 'Software architecture, multi-modal vision pipeline, rule-based verification engine, and container deployment framework')}
        </p>
      </div>

      {/* Software Architecture Diagram / Specification */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-6">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Layers className="w-4 h-4 text-amber-600" />
          {t('rules.sec1_title', '1. System Architecture & Data Pipeline')}
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono">
              01
            </div>
            <h3 className="font-bold text-slate-900">{t('rules.step1_title', 'Ingestion & Acquisition')}</h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {t('rules.step1_desc', 'High-resolution packaging label capture via mobile camera API or drag-and-drop file upload. Pre-processing for Principal Display Panel (PDP) reticle alignment.')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono">
              02
            </div>
            <h3 className="font-bold text-slate-900">{t('rules.step2_title', 'Vision & OCR Pipeline')}</h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {t('rules.step2_desc', 'Server-side Gemini 3.8 Flash multi-modal reasoning engine extracts inscriptions, detects Principal Display Panel placement, and measures numeral height in millimeters.')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono">
              03
            </div>
            <h3 className="font-bold text-slate-900">{t('rules.step3_title', 'Statutory Rule Engine')}</h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {t('rules.step3_desc', 'Deterministic rule validator cross-references extracted declarations against Rule 6(1)(a)-(f), font height tables under Rule 7, prohibited qualifying terms (Rule 13), and Section 36 dual MRP integrity.')}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
            <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold font-mono">
              04
            </div>
            <h3 className="font-bold text-slate-900">{t('rules.step4_title', 'Report & Enforcement')}</h3>
            <p className="text-slate-600 leading-relaxed text-[11px]">
              {t('rules.step4_desc', 'Generates official statutory Inspection Notice (PDF/Print format) under Section 18/36, logs historical audits in searchable repository, and enables editable JSON/CSV export.')}
            </p>
          </div>
        </div>


      </div>

      {/* Statutory Rules Matrix under Legal Metrology Rules, 2011 */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div>
            <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Scale className="w-4 h-4 text-amber-600" />
              {t('rules.sec2_title', '2. Statutory Legal Metrology Rules (Packaged Commodities) 2011 Matrix')}
            </h2>
            <p className="text-xs text-slate-500">
              {t('rules.sec2_desc', 'The automated compliance checking engine strictly maps infractions to these statutory provisions:')}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {LEGAL_METROLOGY_RULES.map((rule) => (
            <div 
              key={rule.rule_id} 
              className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-mono text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded">
                  {rule.rule_id}
                </span>
                <span className="text-[10px] font-mono text-slate-500">
                  {rule.act_section}
                </span>
              </div>
              <h4 className="text-xs font-bold text-slate-900">
                {t(`rule.${rule.rule_id}.name`, rule.rule_name)}
              </h4>
              <p className="text-slate-600 text-[11px] leading-relaxed">
                {t(`rule.${rule.rule_id}.desc`, rule.description)}
              </p>
              <div className="pt-2 border-t border-slate-200/80 space-y-1 text-[10px]">
                <div>
                  <span className="font-bold text-slate-700">{t('rules.std_format', 'Standard Format:')} </span>
                  <code className="text-slate-800 bg-white px-1 py-0.5 rounded border border-slate-200">
                    {rule.standard_format_example}
                  </code>
                </div>
                <div>
                  <span className="font-bold text-rose-700">{t('rules.statutory_penalty', 'Statutory Penalty:')} </span>
                  <span className="text-slate-600">{rule.statutory_penalty}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Font Size & Principal Display Panel (PDP) Reference Table */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
        <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2 border-b border-slate-100 pb-3">
          <Cpu className="w-4 h-4 text-amber-600" />
          {t('rules.sec3_title', '3. Statutory Table I - Minimum Height of Numerals (Rule 7)')}
        </h2>
        <div className="overflow-x-auto text-xs">
          <table className="w-full text-left border border-slate-200 rounded-lg">
            <thead className="bg-slate-100 text-slate-800 font-bold text-[11px]">
              <tr>
                <th className="p-3">{t('rules.th_net_qty', 'Net Quantity Range')}</th>
                <th className="p-3">{t('rules.th_normal_height', 'Normal Inscription Height')}</th>
                <th className="p-3">{t('rules.th_embossed_height', 'Blown / Moulded / Embossed Inscription')}</th>
                <th className="p-3">{t('rules.th_citation', 'Statutory Citation')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 text-slate-700 text-[11px]">
              <tr>
                <td className="p-3 font-medium">{t('rules.row1_qty', 'Up to 50 g / 50 ml')}</td>
                <td className="p-3 font-mono">1.0 mm</td>
                <td className="p-3 font-mono">1.5 mm</td>
                <td className="p-3 font-mono text-slate-500">Table I, Row 1</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">{t('rules.row2_qty', '50 g to 200 g / ml')}</td>
                <td className="p-3 font-mono">2.0 mm</td>
                <td className="p-3 font-mono">3.0 mm</td>
                <td className="p-3 font-mono text-slate-500">Table I, Row 2</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">{t('rules.row3_qty', '200 g to 1 kg / litre')}</td>
                <td className="p-3 font-mono">4.0 mm</td>
                <td className="p-3 font-mono">6.0 mm</td>
                <td className="p-3 font-mono text-slate-500">Table I, Row 3</td>
              </tr>
              <tr>
                <td className="p-3 font-medium">{t('rules.row4_qty', 'Above 1 kg / litre')}</td>
                <td className="p-3 font-mono">6.0 mm</td>
                <td className="p-3 font-mono">9.0 mm</td>
                <td className="p-3 font-mono text-slate-500">Table I, Row 4</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
