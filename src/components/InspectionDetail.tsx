import React, { useState, useRef } from 'react';
import { 
  CheckCircle2, 
  CheckCircle,
  XCircle, 
  AlertTriangle, 
  FileText, 
  Download, 
  Share2, 
  ArrowLeft, 
  Scale, 
  Eye, 
  Type, 
  Ban, 
  Building2, 
  ShieldAlert, 
  Calendar, 
  User, 
  Bookmark,
  Camera,
  Edit3,
  Check,
  FileSpreadsheet,
  Gavel,
  BadgeCheck,
  Loader2,
  Send,
  Lock,
  X,
  Upload,
  Trash2,
  Maximize2,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { InspectionRecord, DeclarationItem, OfficerAction } from '../types/metrology';
import { downloadInspectionPDF } from '../utils/pdfGenerator';
import { useLanguage } from '../i18n/LanguageContext';
import { compressImage } from '../utils/imageOptimizer';

interface InspectionDetailProps {
  inspection: InspectionRecord;
  onBack: () => void;
  onSaveToRepository: (inspection: InspectionRecord) => void;
  onOpenPrintModal: (inspection: InspectionRecord) => void;
  userRole: 'inspector' | 'user';
}

interface PartEvaluationTarget {
  key: string;
  name: string;
  ruleReference: string;
  currentStatus: string;
  detectedText?: string;
  remarks?: string;
}

export const InspectionDetail: React.FC<InspectionDetailProps> = ({
  inspection,
  onBack,
  onSaveToRepository,
  onOpenPrintModal,
  userRole
}) => {
  const { t } = useLanguage();
  const [currentRecord, setCurrentRecord] = useState<InspectionRecord>(inspection);
  const [activeTab, setActiveTab] = useState<'declarations' | 'typography' | 'violations' | 'evidence'>('declarations');
  // Good score check: Score >= 80 or status COMPLIANT or no violations
  const isGoodScore = currentRecord.compliance_score >= 80 || currentRecord.overall_status === 'COMPLIANT' || (currentRecord.violations || []).length === 0;

  const [officerNotes, setOfficerNotes] = useState<string>(currentRecord.officer_notes || '');
  const [selectedAction, setSelectedAction] = useState<OfficerAction>(
    isGoodScore ? 'NO_ACTION' : currentRecord.officer_action_recommended
  );
  const [isSaved, setIsSaved] = useState<boolean>(false);
  const [showSaveRecordModal, setShowSaveRecordModal] = useState<boolean>(false);
  const [supportingPhotoInput, setSupportingPhotoInput] = useState<string>('');
  const [supportingPhotos, setSupportingPhotos] = useState<string[]>(currentRecord.supporting_photos || []);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState<boolean>(false);
  const [pdfDownloadSuccess, setPdfDownloadSuccess] = useState<boolean>(false);

  // Part-specific photo upload and re-evaluation state
  const [partModalTarget, setPartModalTarget] = useState<PartEvaluationTarget | null>(null);
  const [partImage, setPartImage] = useState<string | null>(null);
  const [isPartCameraActive, setIsPartCameraActive] = useState<boolean>(false);
  const [partReEvaluating, setPartReEvaluating] = useState<boolean>(false);
  const [partSuccessMessage, setPartSuccessMessage] = useState<string | null>(null);
  const [partErrorMessage, setPartErrorMessage] = useState<string | null>(null);
  const [partNote, setPartNote] = useState<string>('');
  const [lightboxImage, setLightboxImage] = useState<string | null>(null);

  const partVideoRef = useRef<HTMLVideoElement | null>(null);
  const partFileInputRef = useRef<HTMLInputElement | null>(null);
  const partStreamRef = useRef<MediaStream | null>(null);
  const evidenceFileInputRef = useRef<HTMLInputElement | null>(null);

  // Controller role state
  const [compoundingFee, setCompoundingFee] = useState<number>(25000);
  const [controllerDecisionOrder, setControllerDecisionOrder] = useState<string>(
    currentRecord.violations?.length > 0 
      ? 'Under Section 48 of the Legal Metrology Act, 2009, compounding of the recorded offences is sanctioned upon deposit of statutory compounding fee into the Government Treasury within 15 days.'
      : 'Proceedings closed upon verification of complete packaging statutory compliance.'
  );
  const [isControllerOrderSigned, setIsControllerOrderSigned] = useState<boolean>(false);

  // Industry self-audit state
  const [artworkSignoffStatus, setArtworkSignoffStatus] = useState<string>(
    currentRecord.overall_status === 'COMPLIANT' ? 'APPROVED_FOR_PRINTING' : 'REVISION_REQUIRED'
  );
  const [designerActionNotes, setDesignerActionNotes] = useState<string>('');

  const startPartCamera = async () => {
    try {
      setPartErrorMessage(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      partStreamRef.current = stream;
      if (partVideoRef.current) {
        partVideoRef.current.srcObject = stream;
      }
      setIsPartCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setPartErrorMessage('Could not open camera device. Please grant camera permission or upload a file.');
    }
  };

  const stopPartCamera = () => {
    if (partStreamRef.current) {
      partStreamRef.current.getTracks().forEach((t) => t.stop());
      partStreamRef.current = null;
    }
    setIsPartCameraActive(false);
  };

  const capturePartPhoto = async () => {
    if (!partVideoRef.current) return;
    const canvas = document.createElement('canvas');
    canvas.width = partVideoRef.current.videoWidth || 640;
    canvas.height = partVideoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(partVideoRef.current, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const dataUrl = await compressImage(rawDataUrl, 1600, 0.82);
      setPartImage(dataUrl);
      stopPartCamera();
    }
  };

  const handlePartFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setPartErrorMessage('Please upload a valid image file (JPG, PNG, WebP).');
      return;
    }
    try {
      const compressed = await compressImage(file, 1600, 0.82);
      setPartImage(compressed);
      setPartErrorMessage(null);
    } catch (err) {
      console.warn('Error compressing part photo:', err);
      const reader = new FileReader();
      reader.onload = (event) => {
        setPartImage(event.target?.result as string);
        setPartErrorMessage(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const openPartReEvaluation = (key: string, item: DeclarationItem) => {
    setPartModalTarget({
      key,
      name: item.name,
      ruleReference: item.rule_reference,
      currentStatus: item.status,
      detectedText: item.detected_text,
      remarks: item.remarks
    });
    setPartImage(null);
    setPartSuccessMessage(null);
    setPartErrorMessage(null);
    setIsPartCameraActive(false);
  };

  const closePartModal = () => {
    stopPartCamera();
    setPartModalTarget(null);
    setPartImage(null);
    setPartReEvaluating(false);
    setPartSuccessMessage(null);
    setPartErrorMessage(null);
    setPartNote('');
    if (partFileInputRef.current) {
      partFileInputRef.current.value = '';
    }
  };

  const handleExecutePartReEvaluation = async () => {
    if (!partModalTarget || !partImage) {
      setPartErrorMessage('Please take a photo or upload an image of the packaging part first.');
      return;
    }

    setPartReEvaluating(true);
    setPartErrorMessage(null);
    setPartSuccessMessage(null);

    try {
      const response = await fetch('/api/re-evaluate-part', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentRecord,
          targetKey: partModalTarget.key,
          declarationName: partModalTarget.name,
          ruleReference: partModalTarget.ruleReference,
          newImageBase64: partImage,
          mimeType: 'image/jpeg'
        })
      });

      if (!response.ok) {
        throw new Error(`Server returned status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to re-evaluate part.');
      }

      const updatedRecord: InspectionRecord = data.updatedRecord;
      setCurrentRecord(updatedRecord);
      setSupportingPhotos(updatedRecord.supporting_photos || []);
      onSaveToRepository(updatedRecord);

      const evalInfo = data.evaluation;
      if (evalInfo.status === 'PRESENT_AND_COMPLIANT') {
        setPartSuccessMessage(`Success! Verified statutory declaration: "${evalInfo.detected_text}". Statutory score improved to ${updatedRecord.compliance_score}%.`);
      } else {
        setPartSuccessMessage(`Photo attached to record. Statutory status updated: ${evalInfo.status}.`);
      }

      setTimeout(() => {
        closePartModal();
      }, 2500);

    } catch (err: any) {
      console.error('Part re-evaluation error:', err);
      setPartErrorMessage(err.message || 'Failed to analyze part image.');
    } finally {
      setPartReEvaluating(false);
    }
  };

  const handleAttachPartPhotoOnly = () => {
    if (!partImage) return;
    const updatedPhotos = [...supportingPhotos, partImage];
    setSupportingPhotos(updatedPhotos);
    const updated = {
      ...currentRecord,
      supporting_photos: updatedPhotos
    };
    setCurrentRecord(updated);
    onSaveToRepository(updated);
    setPartSuccessMessage('Photo successfully attached as supporting statutory evidence.');
    setTimeout(() => {
      closePartModal();
    }, 1500);
  };

  const handleEvidenceFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    const promises = files.map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = (ev) => resolve(ev.target?.result as string);
        reader.readAsDataURL(file);
      });
    });

    Promise.all(promises).then((newImgs) => {
      const updated = [...supportingPhotos, ...newImgs];
      setSupportingPhotos(updated);
      const updatedRec = {
        ...currentRecord,
        supporting_photos: updated
      };
      setCurrentRecord(updatedRec);
      onSaveToRepository(updatedRec);
    });
  };

  const removeEvidencePhoto = (index: number) => {
    const updated = supportingPhotos.filter((_, i) => i !== index);
    setSupportingPhotos(updated);
    const updatedRec = {
      ...currentRecord,
      supporting_photos: updated
    };
    setCurrentRecord(updatedRec);
    onSaveToRepository(updatedRec);
  };

  const handleActionChange = (action: OfficerAction) => {
    if (isGoodScore) return; // Locked when product packaging has compliant score
    setSelectedAction(action);
    const updated = {
      ...currentRecord,
      officer_action_recommended: action,
      officer_notes: officerNotes,
      supporting_photos: supportingPhotos
    };
    setCurrentRecord(updated);
  };

  const handleDirectDownloadPdf = async () => {
    try {
      setIsDownloadingPdf(true);
      await downloadInspectionPDF(currentRecord, userRole);
      setPdfDownloadSuccess(true);
      setTimeout(() => setPdfDownloadSuccess(false), 3500);
    } catch (err) {
      console.error('Direct PDF export error:', err);
      // Fallback
      onOpenPrintModal(currentRecord);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSignControllerOrder = () => {
    const updated: InspectionRecord = {
      ...currentRecord,
      officer_notes: `[CONTROLLER ORDER - DR. A.K. SUNDARAM, IAS]: ${controllerDecisionOrder} (Fee: ₹${compoundingFee.toLocaleString('en-IN')})`,
      officer_action_recommended: isGoodScore ? 'NO_ACTION' : selectedAction
    };
    setCurrentRecord(updated);
    onSaveToRepository(updated);
    setIsControllerOrderSigned(true);
    setTimeout(() => setIsControllerOrderSigned(false), 4000);
  };

  const handleSave = (showModal: boolean = false) => {
    const actionToSave = isGoodScore ? 'NO_ACTION' : selectedAction;
    const updated: InspectionRecord = {
      ...currentRecord,
      officer_notes: officerNotes,
      officer_action_recommended: actionToSave,
      supporting_photos: supportingPhotos
    };
    setCurrentRecord(updated);
    onSaveToRepository(updated);
    setIsSaved(true);
    if (showModal) {
      setShowSaveRecordModal(true);
    } else {
      setTimeout(() => setIsSaved(false), 3000);
    }
  };

  const handleAddEvidencePhoto = () => {
    if (!supportingPhotoInput.trim()) return;
    const updatedList = [...supportingPhotos, supportingPhotoInput.trim()];
    setSupportingPhotos(updatedList);
    setSupportingPhotoInput('');
  };

  const exportCSV = () => {
    const rows = [
      ['Legal Metrology Inspection Report', 'LM(PC) Rules 2011'],
      ['Reference No', currentRecord.inspection_reference_no],
      ['Date', currentRecord.timestamp],
      ['Product Name', currentRecord.product_name],
      ['Brand', currentRecord.brand_name],
      ['Category', currentRecord.category],
      ['Overall Status', currentRecord.overall_status],
      ['Compliance Score', currentRecord.compliance_score.toString()],
      ['Violations Count', currentRecord.violations_count.toString()],
      ['Officer Action', currentRecord.officer_action_recommended],
      [],
      ['Rule ID', 'Declaration Name', 'Status', 'Detected Text', 'Remarks']
    ];

    (Object.values(currentRecord.declarations) as DeclarationItem[]).forEach((d) => {
      rows.push([d.rule_reference, d.name, d.status, `"${d.detected_text.replace(/"/g, '""')}"`, `"${d.remarks.replace(/"/g, '""')}"`]);
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map(e => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `${currentRecord.inspection_reference_no.replace(/\//g, '_')}_summary.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLIANT':
      case 'PRESENT_AND_COMPLIANT':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            {t('detail.compliant_badge', 'Statutory Compliant')}
          </span>
        );
      case 'NON_COMPLIANT':
      case 'DEFECTIVE':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-300">
            <XCircle className="w-3.5 h-3.5 text-rose-600" />
            {t('detail.violation_badge', 'Non-Compliant Violation')}
          </span>
        );
      case 'MISSING':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5 text-rose-500" />
            {t('detail.missing_badge', 'Declaration Missing')}
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {t('detail.review_badge', 'Needs Officer Review')}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation & Header Actions */}
      <div className="flex flex-wrap items-center justify-between gap-2.5 sm:gap-4 pb-2 border-b border-slate-200">
        <button
          onClick={onBack}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>{t('detail.back_to_scanner', 'Back to Scanner')}</span>
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            id="btn-direct-download-pdf"
            onClick={handleDirectDownloadPdf}
            disabled={isDownloadingPdf}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer disabled:opacity-75 shadow-xs ${
              pdfDownloadSuccess
                ? 'bg-emerald-600 text-white hover:bg-emerald-500'
                : 'bg-amber-500 hover:bg-amber-400 text-slate-950'
            }`}
            title="Download formatted Official Inspection Report in PDF format"
          >
            {isDownloadingPdf ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>{t('detail.downloading_pdf', 'Downloading PDF...')}</span>
              </>
            ) : pdfDownloadSuccess ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('detail.pdf_downloaded', 'PDF Downloaded!')}</span>
              </>
            ) : (
              <>
                <Download className="w-3.5 h-3.5" />
                <span>{t('detail.download_pdf', 'Download PDF')}</span>
              </>
            )}
          </button>

          <button
            onClick={exportCSV}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
            title="Download CSV inspection data"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-700" />
            <span>{t('detail.export_csv', 'CSV')}</span>
          </button>

          <button
            onClick={() => handleSave(true)}
            className={`inline-flex items-center gap-1.5 px-3 sm:px-3.5 py-1.5 rounded-lg text-xs font-bold transition shadow-xs cursor-pointer ${
              isSaved
                ? 'bg-emerald-600 text-white'
                : 'bg-slate-800 hover:bg-slate-700 text-amber-300'
            }`}
          >
            {isSaved ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>{t('detail.saved', 'Saved')}</span>
              </>
            ) : (
              <>
                <Bookmark className="w-3.5 h-3.5" />
                <span>{t('detail.save_record', 'Save Record')}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Primary Inspection Verdict Card */}
      <div className={`p-4 sm:p-6 rounded-2xl border shadow-sm transition w-full max-w-full overflow-hidden ${
        currentRecord.overall_status === 'COMPLIANT'
          ? 'bg-emerald-50/50 border-emerald-200'
          : 'bg-rose-50/50 border-rose-200'
      }`}>
        <div className="flex flex-col lg:flex-row lg:items-start xl:items-center justify-between gap-4 sm:gap-6">
          {/* Full-width Product Information */}
          <div className="space-y-2.5 w-full flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-[11px] sm:text-xs font-bold text-slate-700 bg-white/90 px-2.5 py-0.5 rounded-md border border-slate-200 shrink-0">
                REF: {currentRecord.inspection_reference_no}
              </span>
              {getStatusBadge(currentRecord.overall_status)}
              <span className="text-[11px] sm:text-xs font-medium text-slate-500 flex items-center gap-1 shrink-0">
                <Calendar className="w-3.5 h-3.5 text-slate-400" />
                {new Date(currentRecord.timestamp).toLocaleDateString()} {new Date(currentRecord.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            <h1 className="text-lg sm:text-2xl font-black text-slate-900 tracking-tight break-words leading-snug">
              {currentRecord.product_name}
            </h1>

            {/* Responsive Metadata list - wraps naturally on all screens without clipping */}
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-slate-600 bg-white/60 sm:bg-transparent p-2.5 sm:p-0 rounded-lg sm:rounded-none border border-slate-200/60 sm:border-0">
              <div className="truncate max-w-full sm:max-w-none">
                <strong className="text-slate-800">{t('detail.brand_label', 'Brand:')}</strong> {currentRecord.brand_name || t('detail.unbranded', 'Generic / Unbranded')}
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div>
                <strong className="text-slate-800">{t('detail.category_label', 'Category:')}</strong> {currentRecord.category}
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div className="break-words max-w-full sm:max-w-none">
                <strong className="text-slate-800">{t('detail.premises_label', 'Premises:')}</strong> {currentRecord.retailer_premise}
              </div>
              <span className="hidden sm:inline text-slate-300">•</span>
              <div>
                <strong className="text-slate-800">{t('detail.inspector_label', 'Inspector:')}</strong> {currentRecord.officer_name} ({currentRecord.officer_badge})
              </div>
            </div>
          </div>

          {/* Compliance Score Gauge & Action Recommendation - Separate full-width cards on mobile */}
          <div className="w-full lg:w-auto flex flex-col sm:flex-row lg:flex-row items-stretch gap-3 shrink-0">
            {/* Compliance Score Card */}
            <div className="w-full sm:w-1/2 lg:w-auto bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-row lg:flex-col items-center justify-between lg:justify-center text-left lg:text-center gap-2">
              <div>
                <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider">{t('dashboard.compliance_score', 'Compliance Score')}</div>
                <div className="text-[10px] text-slate-500 mt-0.5">
                  {currentRecord.violations_count} {t('detail.violations_flagged', 'Violation(s) Flagged')}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className={`text-2xl sm:text-3xl font-black ${
                  currentRecord.compliance_score >= 80 
                    ? 'text-emerald-600' 
                    : currentRecord.compliance_score >= 50 
                    ? 'text-amber-600' 
                    : 'text-rose-600'
                }`}>
                  {currentRecord.compliance_score}
                </span>
                <span className="text-xs text-slate-400 font-bold">/100</span>
              </div>
            </div>

            {/* Officer Action Card */}
            {userRole !== 'user' && (
              <div className="w-full sm:w-1/2 lg:w-auto lg:min-w-[210px] bg-white p-3.5 sm:p-4 rounded-xl border border-slate-200 shadow-2xs flex flex-col justify-center">
                <div className="flex items-center justify-between gap-1.5 mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-600 uppercase">
                    {t('detail.rec_officer_action', 'Recommended Officer Action')}
                  </label>
                  {isGoodScore && (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
                      <Lock className="w-2.5 h-2.5" /> Locked
                    </span>
                  )}
                </div>

                {isGoodScore ? (
                  <div className="space-y-1">
                    <div className="text-xs font-bold bg-emerald-50 border border-emerald-200 rounded-lg px-2.5 py-1.5 text-emerald-900 flex items-center gap-1.5 cursor-not-allowed">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>{t('action.NO_ACTION', 'No Action (Clear for Retail)')}</span>
                    </div>
                    <p className="text-[10px] text-slate-500 font-medium leading-tight">
                      High compliance score ({currentRecord.compliance_score}/100) — cleared.
                    </p>
                  </div>
                ) : (
                  <select
                    id="officer-action-select"
                    value={selectedAction}
                    onChange={(e) => handleActionChange(e.target.value as OfficerAction)}
                    className="w-full text-xs font-bold bg-slate-50 border border-slate-300 rounded-lg px-2.5 py-2 text-slate-900 focus:ring-1 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="NO_ACTION">{t('action.NO_ACTION', 'No Action (Clear for Retail)')}</option>
                    <option value="ISSUE_NOTICE">{t('action.ISSUE_NOTICE', 'Issue Notice under Section 18')}</option>
                    <option value="SEIZE_COMMODITY">{t('action.SEIZE_COMMODITY', 'Seize Non-Compliant Stock')}</option>
                    <option value="COMPOUNDING_OFFENCE">{t('action.COMPOUNDING_OFFENCE', 'Recommend Compounding (Sec 48)')}</option>
                    <option value="WARNING">{t('action.WARNING', 'Issue Caution / Warning')}</option>
                  </select>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Summary Banner */}
        <div className="mt-4 pt-3 border-t border-slate-200/60 text-xs text-slate-700 leading-relaxed font-medium">
          <span className="font-bold text-slate-900">Statutory Assessment: </span>
          {currentRecord.summary}
        </div>
      </div>

      {/* Industry Self-Audit Role Action Desk (For User Role) */}
      {userRole === 'user' && (
        <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-slate-900 text-white rounded-2xl p-5 border border-emerald-700/50 shadow-md space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-emerald-800/40 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                <BadgeCheck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-emerald-100 flex items-center gap-2">
                  Industry Packaging Self-Audit &amp; Pre-Market Artwork Clearance Hub
                </h3>
                <p className="text-[11px] text-emerald-300/80">
                  Pre-flight verification for brand packaging designers before cylinder engraving, printing, and distribution
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleDirectDownloadPdf}
                disabled={isDownloadingPdf}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-emerald-500 hover:bg-emerald-400 text-slate-950 transition cursor-pointer"
                title="Download Pre-Market Packaging Compliance Certificate"
              >
                <Download className="w-3.5 h-3.5" />
                <span>{t('detail.cert_btn', 'Download Compliance Certificate (.pdf)')}</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Pre-Market Artwork Clearance Status:
              </span>
              <div className="text-sm font-black">
                {currentRecord.overall_status === 'COMPLIANT' ? (
                  <span className="text-emerald-400 flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    APPROVED FOR MASS PRINTING
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-1">
                    <XCircle className="w-4 h-4" />
                    ARTWORK REVISION MANDATORY
                  </span>
                )}
              </div>
              <p className="text-[10px] text-slate-300">
                {currentRecord.overall_status === 'COMPLIANT'
                  ? 'All mandatory inscriptions and font heights meet LM(PC) Rules, 2011.'
                  : 'Critical packaging artwork defects must be rectified before offset printing.'}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Statutory Liability Averted:
              </span>
              <div className="text-sm font-black text-amber-300 font-mono">
                {currentRecord.violations?.length > 0 ? '₹25,000 - ₹50,000 per SKU' : '₹0 (Clean Packaging)'}
              </div>
              <p className="text-[10px] text-slate-300">
                Pre-market self-audit prevents Section 36(1) prosecution and potential retail inventory seizure.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-800/80 border border-slate-700 space-y-1">
              <span className="text-[10px] font-bold text-slate-400 uppercase block">
                Packaging Design Team Action:
              </span>
              <div className="text-xs text-slate-200">
                {currentRecord.violations?.length > 0 ? (
                  <span className="font-semibold text-amber-300">
                    {currentRecord.violations[0].remedial_action}
                  </span>
                ) : (
                  <span className="text-emerald-300">
                    Artwork certified compliant. Quality seal released to packaging plant.
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Inspection Tabs */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-xs overflow-hidden w-full max-w-full">
        {/* Tab Headers - Horizontally scrollable on mobile without page overflow */}
        <div className="w-full max-w-full overflow-hidden border-b border-slate-200 bg-slate-50/80">
          <div className="flex overflow-x-auto no-scrollbar touch-scroll w-full px-1.5 sm:px-3 py-1 gap-1">
            <button
              onClick={() => setActiveTab('declarations')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shrink-0 rounded-t-md ${
                activeTab === 'declarations'
                  ? 'border-amber-500 text-amber-900 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <CheckCircle2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('detail.tab_declarations', 'Declarations (Rule 6)')}</span>
              <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                {Object.keys(currentRecord.declarations).length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('typography')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shrink-0 rounded-t-md ${
                activeTab === 'typography'
                  ? 'border-amber-500 text-amber-900 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Type className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('detail.tab_typography', 'Font & Height (Rule 7)')}</span>
              <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                currentRecord.font_analysis?.font_status === 'compliant'
                  ? 'bg-emerald-100 text-emerald-800'
                  : 'bg-rose-100 text-rose-800'
              }`}>
                {currentRecord.font_analysis?.estimated_min_height_mm || 2.0} mm
              </span>
            </button>

            <button
              onClick={() => setActiveTab('violations')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shrink-0 rounded-t-md ${
                activeTab === 'violations'
                  ? 'border-amber-500 text-amber-900 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('detail.tab_violations', 'Violations & Penalties')}</span>
              {currentRecord.violations?.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-rose-100 text-rose-800 font-mono font-bold">
                  {currentRecord.violations.length}
                </span>
              )}
            </button>

            <button
              onClick={() => setActiveTab('evidence')}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 text-xs font-bold border-b-2 transition flex items-center gap-1.5 sm:gap-2 whitespace-nowrap cursor-pointer shrink-0 rounded-t-md ${
                activeTab === 'evidence'
                  ? 'border-amber-500 text-amber-900 bg-white shadow-2xs'
                  : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100/60'
              }`}
            >
              <Camera className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('detail.tab_evidence', 'Evidence & Notes')}</span>
              {supportingPhotos.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-200 text-slate-700 font-mono">
                  {supportingPhotos.length}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Content 1: Mandatory Declarations Checklist */}
        {activeTab === 'declarations' && (
          <div className="p-5 space-y-4">
            <div className="flex items-center justify-between text-xs text-slate-500">
              <span>{t('detail.statutory_requirements_mandated', 'Statutory requirements mandated under Rule 6(1) of Legal Metrology (Packaged Commodities) Rules, 2011')}</span>
              <span>{t('detail.all_fields_checked', 'All 8 statutory fields checked')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(currentRecord.declarations).map(([key, item]: [string, DeclarationItem]) => {
                const isCompliant = item.status === 'PRESENT_AND_COMPLIANT';
                return (
                  <div 
                    key={key}
                    className={`p-4 rounded-xl border transition ${
                      isCompliant
                        ? 'bg-slate-50/50 border-slate-200'
                        : 'bg-rose-50/30 border-rose-200'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div>
                        <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
                          {item.rule_reference}
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 mt-1">
                          {item.name}
                        </h4>
                      </div>
                      {getStatusBadge(item.status)}
                    </div>

                    <div className="space-y-2 mt-3 text-xs">
                      <div className="bg-white p-2.5 rounded-lg border border-slate-200 font-mono text-[11px] text-slate-800 break-words">
                        <span className="text-slate-400 font-sans block text-[10px] font-medium mb-0.5">
                          DETECTED INSCRIPTION:
                        </span>
                        {item.detected_text || <span className="text-slate-400 italic">{t('detail.no_inscription', 'No corresponding inscription found on package')}</span>}
                      </div>

                      <div className="text-slate-600 text-[11px] flex items-start gap-1.5">
                        <span className="font-semibold text-slate-700 shrink-0">{t('detail.analysis', 'Analysis:')}</span>
                        <span>{item.remarks}</span>
                      </div>

                      {/* Part Photo Upload / Re-evaluate action */}
                      <div className="pt-2.5 flex flex-wrap items-center justify-between gap-2 border-t border-slate-200/70 mt-2">
                        <span className="text-[10px] text-slate-500">
                          {isCompliant ? 'Verified statutory declaration' : 'Part obscured, missing, or on another panel?'}
                        </span>
                        <button
                          type="button"
                          onClick={() => openPartReEvaluation(key, item)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-bold transition cursor-pointer ${
                            isCompliant
                              ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                              : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs'
                          }`}
                        >
                          <Camera className="w-3.5 h-3.5" />
                          <span>{isCompliant ? 'Add Photo of this Part' : 'Upload Photo for this Part'}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Tab Content 2: Typography & Readability (Rule 7) */}
        {activeTab === 'typography' && (
          <div className="p-4 sm:p-5 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-4">
              <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{t('detail.estimated_font_height', 'Estimated Font Height')}</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {currentRecord.font_analysis?.estimated_min_height_mm || 3.0} mm
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Measured on Net Quantity &amp; MRP numerals
                </div>
              </div>

              <div className="w-full p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{t('detail.statutory_minimum_height', 'Statutory Minimum Height')}</span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {currentRecord.font_analysis?.required_min_height_mm || 4.0} mm
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Mandated by Table I / II of Rule 7
                </div>
              </div>

              <div className="w-full sm:col-span-2 lg:col-span-1 p-4 rounded-xl bg-slate-50 border border-slate-200">
                <span className="text-[11px] font-bold text-slate-500 uppercase">{t('detail.contrast_legibility', 'Contrast & Legibility')}</span>
                <div className="text-2xl font-black text-emerald-600 capitalize mt-1">
                  {currentRecord.font_analysis?.contrast_rating || 'High'}
                </div>
                <div className="text-[11px] text-slate-500 mt-1">
                  Background to ink color differential
                </div>
              </div>
            </div>

            {/* Readability Evaluation */}
            <div className="p-4 rounded-xl bg-white border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                Statutory Table I (Minimum Height of Numerals) Reference Check
              </h4>
              <p className="text-xs text-slate-600 leading-relaxed">
                {currentRecord.font_analysis?.readability_notes || 'All numerals and mandatory letters comply with standard height and breadth ratios.'}
              </p>

              <div className="overflow-x-auto text-xs border border-slate-200 rounded-lg">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold text-[11px]">
                    <tr>
                      <th className="p-2.5">{t('detail.net_quantity_range', 'Net Quantity Range')}</th>
                      <th className="p-2.5">{t('detail.min_height_normal', 'Min Height (Normal Packaging)')}</th>
                      <th className="p-2.5">{t('detail.min_height_embossed', 'Min Height (Blown/Embossed)')}</th>
                      <th className="p-2.5">{t('detail.current_package_status', 'Current Package Status')}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-600 text-[11px]">
                    <tr>
                      <td className="p-2.5">{t('detail.up_to_50g', 'Up to 50 g / ml')}</td>
                      <td className="p-2.5 font-mono">1.0 mm</td>
                      <td className="p-2.5 font-mono">1.5 mm</td>
                      <td className="p-2.5">-</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">{t('detail.50g_to_200g', '50 g to 200 g / ml')}</td>
                      <td className="p-2.5 font-mono">2.0 mm</td>
                      <td className="p-2.5 font-mono">3.0 mm</td>
                      <td className="p-2.5">-</td>
                    </tr>
                    <tr className="bg-amber-50 font-medium text-slate-900">
                      <td className="p-2.5">{t('detail.200g_to_1kg', '200 g to 1 kg / litre')}</td>
                      <td className="p-2.5 font-mono">4.0 mm</td>
                      <td className="p-2.5 font-mono">6.0 mm</td>
                      <td className="p-2.5 text-amber-800 font-bold">Audited Range</td>
                    </tr>
                    <tr>
                      <td className="p-2.5">Above 1 kg / litre</td>
                      <td className="p-2.5 font-mono">6.0 mm</td>
                      <td className="p-2.5 font-mono">9.0 mm</td>
                      <td className="p-2.5">-</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Prohibited Words & Dual MRP check */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-800 flex items-center gap-2">
                <Ban className="w-4 h-4 text-rose-600" />
                Prohibited Qualifying Terms &amp; Dual MRP Integrity (Rule 13 &amp; Sec 36)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Prohibited Words (Rule 13):</span>
                  <div className="font-bold text-slate-800 mt-1">
                    {currentRecord.prohibited_practices?.has_prohibited_terms ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Detected: {currentRecord.prohibited_practices.detected_prohibited_terms.join(', ')}
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        None detected (Rule 13 Compliant)
                      </span>
                    )}
                  </div>
                </div>

                <div className="bg-white p-3 rounded-lg border border-slate-200">
                  <span className="text-slate-500 block text-[11px]">Dual MRP / Sticker Alteration (Sec 36(2)):</span>
                  <div className="font-bold text-slate-800 mt-1">
                    {currentRecord.prohibited_practices?.has_dual_mrp ? (
                      <span className="text-rose-600 flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" />
                        Price Tampering / Dual MRP Detected!
                      </span>
                    ) : (
                      <span className="text-emerald-600 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Single Manufacturer Price Verified
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab Content 3: Violations & Statutory Penalties */}
        {activeTab === 'violations' && (
          <div className="p-5 space-y-4">
            {currentRecord.violations?.length === 0 ? (
              <div className="text-center py-10 bg-emerald-50/50 rounded-xl border border-emerald-200">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto mb-2" />
                <h4 className="text-base font-bold text-emerald-900">Zero Statutory Violations Detected</h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto mt-1">
                  The packaged commodity complies with all mandatory statutory declarations under the Legal Metrology Act, 2009 and Packaged Commodities Rules, 2011.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Enforcement charges under Legal Metrology Act, 2009</span>
                  <span className="font-bold text-rose-600">{currentRecord.violations.length} Violation(s) recorded</span>
                </div>

                {currentRecord.violations.map((vio, index) => (
                  <div 
                    key={vio.id || index}
                    className="p-4 rounded-xl border border-rose-200 bg-rose-50/40 space-y-3"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            vio.severity === 'CRITICAL'
                              ? 'bg-rose-600 text-white'
                              : 'bg-amber-600 text-white'
                          }`}>
                            {vio.severity}
                          </span>
                          <span className="text-xs font-mono font-bold text-slate-800">
                            {vio.rule} | {vio.act_section}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-slate-900 mt-1.5">
                          {vio.title}
                        </h4>
                      </div>
                    </div>

                    <p className="text-xs text-slate-700 leading-relaxed">
                      {vio.description}
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2 border-t border-rose-200/80 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Mandatory Remedial Action:
                        </span>
                        <span className="text-slate-800 font-medium">
                          {vio.remedial_action}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-500 uppercase block">
                          Statutory Penalty Under Act:
                        </span>
                        <span className="text-rose-800 font-medium">
                          {vio.statutory_penalty_summary}
                        </span>
                      </div>
                    </div>

                    {/* Quick action to upload missing / obscure part photo */}
                    <div className="pt-2 flex items-center justify-between border-t border-rose-200/60">
                      <span className="text-[11px] text-slate-500">
                        Is this declaration printed on another panel or side?
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          const matchingKey = Object.keys(currentRecord.declarations).find(k => 
                            vio.title.toLowerCase().includes(k.replace(/_/g, ' ')) || 
                            k.toLowerCase().includes(vio.rule.toLowerCase().replace(/[^a-z0-9]/g, ''))
                          ) || 'mrp';
                          const targetItem = currentRecord.declarations[matchingKey as keyof typeof currentRecord.declarations] || Object.values(currentRecord.declarations)[0];
                          if (targetItem) {
                            openPartReEvaluation(matchingKey, targetItem);
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Upload Photo for this Part</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab Content 4: Evidence & Officer Notes */}
        {activeTab === 'evidence' && (
          <div className="p-5 space-y-5">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                {userRole === 'user' ? 'Packaging QA Audit Notes / Proof Revisions Summary' : 'Enforcement Officer Notes / Panchnama Summary'}
              </label>
              <textarea
                value={officerNotes}
                onChange={(e) => setOfficerNotes(e.target.value)}
                rows={4}
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg p-3 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
                placeholder={userRole === 'user' ? "Record pre-press observations, font adjustments needed, or cylinder engraving signoffs..." : "Record seizure details, batch numbers, retailer statements, or panchnama witnesses..."}
              />
            </div>

            {/* Supporting Photos / Evidence Gallery */}
            <div className="space-y-3 pt-2 border-t border-slate-200">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-700 block">
                    Statutory Evidence Photographs ({supportingPhotos.length + (currentRecord.image_url ? 1 : 0)})
                  </label>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Upload multiple images of packaging faces, side gussets, base batch seals, or MRP stamps.
                  </p>
                </div>

                {/* Multiple image upload & Camera trigger buttons */}
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    ref={evidenceFileInputRef}
                    onChange={handleEvidenceFileUpload}
                    multiple
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    onClick={() => evidenceFileInputRef.current?.click()}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-2xs transition cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload Images</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      // Open part re-evaluation modal with first declaration
                      const firstKey = Object.keys(currentRecord.declarations)[0];
                      const firstItem = currentRecord.declarations[firstKey as keyof typeof currentRecord.declarations];
                      openPartReEvaluation(firstKey, firstItem);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 shadow-2xs transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5 text-slate-600" />
                    <span>Take Photo</span>
                  </button>
                </div>
              </div>

              {/* URL input fallback */}
              <div className="flex gap-2 pt-1">
                <input
                  type="text"
                  value={supportingPhotoInput}
                  onChange={(e) => setSupportingPhotoInput(e.target.value)}
                  placeholder="Or paste external image URL..."
                  className="flex-1 text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:ring-1 focus:ring-amber-500"
                />
                <button
                  type="button"
                  onClick={handleAddEvidencePhoto}
                  className="px-3.5 py-2 rounded-lg text-xs font-bold bg-slate-900 text-white hover:bg-slate-800 transition cursor-pointer"
                >
                  Add URL
                </button>
              </div>

              {/* Photo Gallery Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3 pt-2">
                {/* Primary scanned photo */}
                {currentRecord.image_url && (
                  <div className="relative group rounded-xl overflow-hidden border border-slate-300 aspect-square bg-slate-100 shadow-2xs">
                    <img
                      src={currentRecord.image_url}
                      alt="Primary Scan"
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightboxImage(currentRecord.image_url || null)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLightboxImage(currentRecord.image_url || null)}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 transition"
                        title="View Full Size"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                      Primary Scan
                    </span>
                  </div>
                )}

                {/* Additional evidence photos */}
                {supportingPhotos.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-300 aspect-square bg-slate-100 shadow-2xs">
                    <img
                      src={url}
                      alt={`Evidence ${idx + 1}`}
                      className="w-full h-full object-cover cursor-pointer"
                      onClick={() => setLightboxImage(url)}
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => setLightboxImage(url)}
                        className="p-1.5 rounded-full bg-white/90 hover:bg-white text-slate-800 transition"
                        title="View Full Size"
                      >
                        <Maximize2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeEvidencePhoto(idx)}
                        className="p-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white transition"
                        title="Delete photo"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <span className="absolute bottom-1.5 left-1.5 bg-black/75 text-white text-[10px] px-2 py-0.5 rounded font-bold backdrop-blur-xs">
                      Evidence #{idx + 1}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Officer Signature & Badge Stamp */}
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <div className="text-xs font-bold text-slate-800">
                  {userRole === 'user' ? 'Auditor' : 'Inspecting Officer'}: {currentRecord.officer_name}
                </div>
                <div className="text-[11px] text-slate-500 font-mono">
                  {userRole === 'user' ? 'Packaging Compliance Division' : `Badge: ${currentRecord.officer_badge} | Directorate of Legal Metrology`}
                </div>
              </div>
              <button
                onClick={() => handleSave(true)}
                className="px-4 py-2 rounded-lg text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-xs transition flex items-center gap-1.5 cursor-pointer"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>{userRole === 'user' ? 'Sign & Save Audit Record' : 'Sign & Save Inspection Record'}</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Save to Record Modal / Popup */}
      {showSaveRecordModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-100 border border-emerald-300 flex items-center justify-center text-emerald-700 shrink-0">
                  <CheckCircle2 className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Inspection Record Saved
                  </h3>
                  <p className="text-xs text-slate-500 font-mono">
                    Ref: {currentRecord.inspection_reference_no}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowSaveRecordModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs space-y-2.5">
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Product / Commodity</span>
                <span className="font-bold text-slate-900 text-right">{currentRecord.product_name}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Brand</span>
                <span className="font-medium text-slate-800">{currentRecord.brand_name || 'Generic / Unbranded'}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Compliance Status</span>
                <span className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                  currentRecord.overall_status === 'COMPLIANT'
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-rose-100 text-rose-800'
                }`}>
                  {currentRecord.overall_status} ({currentRecord.compliance_score}/100)
                </span>
              </div>
              {userRole !== 'user' && (
                <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                  <span className="text-slate-500 font-medium">Enforcement Action</span>
                  <span className="font-bold text-slate-900">
                    {(isGoodScore ? 'NO_ACTION' : selectedAction).replace(/_/g, ' ')}
                  </span>
                </div>
              )}
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">{userRole === 'user' ? 'Auditor' : 'Officer Signatory'}</span>
                <span className="font-medium text-slate-800">
                  {currentRecord.officer_name} ({currentRecord.officer_badge})
                </span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-slate-200/70">
                <span className="text-slate-500 font-medium">Evidence Photos Attached</span>
                <span className="font-mono font-medium text-slate-800">
                  {supportingPhotos.length + (currentRecord.image_url ? 1 : 0)} photo(s)
                </span>
              </div>
              {officerNotes && (
                <div className="pt-1">
                  <span className="text-slate-500 font-medium block mb-1">Panchnama / Notes:</span>
                  <p className="text-slate-700 bg-white p-2 rounded border border-slate-200 italic line-clamp-3">
                    {officerNotes}
                  </p>
                </div>
              )}
            </div>

            <div className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg p-3 flex items-center gap-2.5">
              <BadgeCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Record has been officially signed and logged to the central compliance repository database.</span>
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-end gap-2.5 pt-2">
              <button
                onClick={() => setShowSaveRecordModal(false)}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-white border border-slate-300 text-slate-700 hover:bg-slate-50 transition cursor-pointer"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowSaveRecordModal(false);
                  onBack();
                }}
                className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold bg-slate-900 hover:bg-slate-800 text-white transition cursor-pointer"
              >
                Back to Repository
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Part-Specific Photo Upload & Re-Evaluation Modal */}
      {partModalTarget && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-xs z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 space-y-4 my-auto animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-200 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-mono font-bold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                    {partModalTarget.ruleReference}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">
                    Specific Part Inspection
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 mt-1">
                  Upload Photo: {partModalTarget.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={closePartModal}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Instruction Callout */}
            <div className="p-3 bg-amber-50/70 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-1">
              <p className="font-semibold flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                <span>Declaration obscured, missing, or printed on another panel?</span>
              </p>
              <p className="text-[11px] text-amber-800 leading-relaxed">
                Take or upload a clear, focused photograph showing the <strong>{partModalTarget.name}</strong> on the side panel, cap, back, or bottom gusset. Our Legal Metrology AI will re-evaluate this specific part and instantly update statutory compliance.
              </p>
            </div>

            {/* Live Camera Viewfinder */}
            {isPartCameraActive ? (
              <div className="space-y-3">
                <div className="relative rounded-xl overflow-hidden bg-black aspect-4/3 flex items-center justify-center">
                  <video
                    ref={partVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  {/* Framing Reticle */}
                  <div className="absolute inset-4 sm:inset-8 border-2 border-dashed border-amber-400/90 rounded-lg pointer-events-none flex items-center justify-center">
                    <span className="bg-black/70 text-amber-300 font-mono text-[10px] font-bold px-2 py-1 rounded backdrop-blur-xs">
                      Align {partModalTarget.name} in view
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-center gap-3">
                  <button
                    type="button"
                    onClick={capturePartPhoto}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Capture Part Photo</span>
                  </button>
                  <button
                    type="button"
                    onClick={stopPartCamera}
                    className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    Cancel Camera
                  </button>
                </div>
              </div>
            ) : partImage ? (
              /* Photo Preview & Re-evaluation action */
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden border border-slate-300 bg-slate-900 aspect-16/10 max-h-56">
                  <img
                    src={partImage}
                    alt="Packaging part preview"
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => setPartImage(null)}
                    className="absolute top-2 right-2 bg-black/70 hover:bg-black text-white p-1.5 rounded-lg text-xs font-bold flex items-center gap-1 backdrop-blur-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Retake / Change</span>
                  </button>
                </div>

                {/* Status Banners */}
                {partSuccessMessage && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-300 text-xs text-emerald-900 flex items-start gap-2 animate-in fade-in">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Re-evaluation Complete</div>
                      <div className="text-[11px] text-emerald-800 mt-0.5">{partSuccessMessage}</div>
                    </div>
                  </div>
                )}

                {partErrorMessage && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-300 text-xs text-rose-900 flex items-start gap-2 animate-in fade-in">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="font-bold">Evaluation Notice</div>
                      <div className="text-[11px] text-rose-800 mt-0.5">{partErrorMessage}</div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={handleAttachPartPhotoOnly}
                    disabled={partReEvaluating}
                    className="px-3.5 py-2.5 rounded-xl text-xs font-bold bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 transition cursor-pointer disabled:opacity-50"
                  >
                    Attach as Evidence Only
                  </button>
                  <button
                    type="button"
                    onClick={handleExecutePartReEvaluation}
                    disabled={partReEvaluating}
                    className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-md transition cursor-pointer disabled:opacity-60"
                  >
                    {partReEvaluating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>AI Re-evaluating Part...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="w-4 h-4" />
                        <span>⚡ AI Re-evaluate &amp; Update Declaration</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            ) : (
              /* Selection options: Device Camera or File Upload */
              <div className="space-y-4">
                <input
                  type="file"
                  ref={partFileInputRef}
                  onChange={handlePartFileUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={startPartCamera}
                    className="p-5 rounded-xl border-2 border-dashed border-amber-300 hover:border-amber-500 bg-amber-50/50 hover:bg-amber-50 flex flex-col items-center justify-center text-center gap-2.5 transition cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Camera className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Use Live Camera</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Snap close-up of this packaging section</div>
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => partFileInputRef.current?.click()}
                    className="p-5 rounded-xl border-2 border-dashed border-slate-300 hover:border-slate-500 bg-slate-50/50 hover:bg-slate-50 flex flex-col items-center justify-center text-center gap-2.5 transition cursor-pointer group"
                  >
                    <div className="w-11 h-11 rounded-full bg-slate-900 text-white flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Upload className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-900">Upload Image File</div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Select photo from device or gallery</div>
                    </div>
                  </button>
                </div>

                <div className="text-center">
                  <button
                    type="button"
                    onClick={closePartModal}
                    className="text-xs text-slate-500 hover:text-slate-700 underline cursor-pointer"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Full-Size Image Lightbox Modal */}
      {lightboxImage && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4 backdrop-blur-xs cursor-pointer"
          onClick={() => setLightboxImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh] w-full flex items-center justify-center" onClick={(e) => e.stopPropagation()}>
            <img
              src={lightboxImage}
              alt="Statutory packaging evidence"
              className="max-w-full max-h-[85vh] object-contain rounded-lg shadow-2xl border border-white/20"
            />
            <button
              type="button"
              onClick={() => setLightboxImage(null)}
              className="absolute -top-10 right-0 text-white hover:text-amber-400 transition p-1 cursor-pointer flex items-center gap-1 text-xs font-bold"
            >
              <X className="w-5 h-5" />
              <span>Close</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
