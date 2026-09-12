import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  X, 
  Upload, 
  Sparkles, 
  AlertTriangle, 
  AlertCircle,
  CheckCircle2, 
  FileText, 
  RotateCcw, 
  Info, 
  Building2, 
  Tag, 
  ArrowRight,
  ShieldCheck,
  Search,
  Maximize2,
  Layers,
  Plus,
  Trash2,
  Image as ImageIcon
} from 'lucide-react';
import { InspectionRecord, ScanApiResponse } from '../types/metrology';
import { useLanguage } from '../i18n/LanguageContext';
import { compressImage } from '../utils/imageOptimizer';

interface ProductScannerProps {
  onInspectionComplete: (record: InspectionRecord) => void;
  onClearPreviousInspection?: () => void;
  userRole?: 'inspector' | 'user';
}

interface ValidationModalState {
  type: 'INVALID_INPUT' | 'LOW_QUALITY';
  title: string;
  message: string;
  subtext: string;
  buttonText: string;
  detectedObject?: string;
  instruction?: string;
}

export interface ScannedPanel {
  id: string;
  dataUrl: string;
  name: string;
  panelType: 'front' | 'back' | 'side' | 'stamp' | 'bottom' | 'custom';
  label: string;
}

const defaultPanelLabels: Record<string, string> = {
  front: 'Front Panel (PDP)',
  back: 'Back Panel (MRP & Dates)',
  side: 'Side Panel (Address & Care)',
  stamp: 'Price / Date Stamp',
  bottom: 'Bottom / Seal',
  custom: 'Additional Package Part'
};

// Standalone separate image validation function: returns structured data before compliance analysis
export async function validateProductImage(
  image: string,
  hint: string = '',
  text: string = ''
): Promise<{
  isPackagedCommodity: boolean;
  labelReadable?: boolean;
  detectedObject: string;
  confidence: number;
  reason: string;
}> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    const response = await fetch('/api/validate-image', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        imageBase64: image,
        productHint: hint,
        textContext: text,
        mimeType: 'image/jpeg'
      })
    });
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Validation API status ${response.status}`);
    }

    const data = await response.json();
    return {
      isPackagedCommodity: Boolean(data.isPackagedCommodity),
      labelReadable: data.labelReadable !== undefined ? Boolean(data.labelReadable) : Boolean(data.isPackagedCommodity),
      detectedObject: data.detectedObject || 'Unknown Object',
      confidence: typeof data.confidence === 'number' ? data.confidence : 0.95,
      reason: data.reason || ''
    };
  } catch (err: any) {
    console.warn('validateProductImage network/timeout issue, proceeding with fallback assumption:', err?.message || err);
    // If validation endpoint has network or timeout issue, do not block the user as compliance analysis will inspect
    return {
      isPackagedCommodity: true,
      labelReadable: true,
      detectedObject: hint || 'Packaged Product',
      confidence: 0.9,
      reason: 'Validation check proceeded to compliance engine'
    };
  }
}

export const ProductScanner: React.FC<ProductScannerProps> = ({
  onInspectionComplete,
  onClearPreviousInspection,
  userRole
}) => {
  const { t } = useLanguage();
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [scannedPanels, setScannedPanels] = useState<ScannedPanel[]>([]);
  const [activePanelIndex, setActivePanelIndex] = useState<number>(0);
  const [productHint, setProductHint] = useState<string>('');
  const [retailerPremise, setRetailerPremise] = useState<string>('Reliance Smart Point, MG Road');
  const [officerBadge, setOfficerBadge] = useState<string>('LM-DEL-402');
  const [isScanning, setIsScanning] = useState<boolean>(false);
  const [scanningStep, setScanningStep] = useState<string>('');
  const [scanningProgress, setScanningProgress] = useState<number>(0);
  const [isCameraActive, setIsCameraActive] = useState<boolean>(false);
  const [isDragOver, setIsDragOver] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [extractedTextPreview, setExtractedTextPreview] = useState<string>('');
  const [validationModal, setValidationModal] = useState<ValidationModalState | null>(null);
  const [captureFlash, setCaptureFlash] = useState<boolean>(false);
  const [flashMessage, setFlashMessage] = useState<string | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const additionalFileInputRef = useRef<HTMLInputElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  
  // Stop camera when unmounting
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Attach stream when video element mounts
  useEffect(() => {
    if (isCameraActive && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
      videoRef.current.play().catch(e => console.warn("Auto-play prevented", e));
    }
  }, [isCameraActive]);


  const startCamera = async () => {
    try {
      setErrorMsg(null);
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Your browser does not support camera access or it is blocked.');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play().catch(e => console.warn("Auto-play prevented", e));
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      // More detailed error checking
      if (err.name === 'NotAllowedError') {
         setErrorMsg('Camera access was denied. Please check your browser permissions.');
      } else if (err.name === 'NotFoundError') {
         setErrorMsg('No camera device found on this system.');
      } else if (err.name === 'OverconstrainedError') {
         setErrorMsg('Camera constraints could not be met by your device.');
      } else {
         setErrorMsg('Could not access camera device: ' + (err.message || 'Unknown error'));
      }
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsCameraActive(false);
  };

  const defaultPanelLabels: Record<string, string> = {
    front: 'Front (Principal Display Panel)',
    back: 'Back Panel (MRP & Dates)',
    side: 'Side Panel (Address & Care)',
    stamp: 'Price / Date Stamp',
    bottom: 'Bottom / Seal',
    custom: 'Additional Package Part'
  };

  const capturePhoto = async (keepCameraOpen: boolean = false) => {
    if (!videoRef.current) return;
    
    // Trigger visual flash
    setCaptureFlash(true);
    setFlashMessage(`Photo #${scannedPanels.length + 1} captured!`);
    setTimeout(() => {
      setCaptureFlash(false);
    }, 150);
    setTimeout(() => {
      setFlashMessage(null);
    }, 2000);
    const canvas = document.createElement('canvas');
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const rawDataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const dataUrl = await compressImage(rawDataUrl, 1600, 0.82);

      const panelOrder: Array<'front' | 'back' | 'side' | 'stamp' | 'bottom'> = ['front', 'back', 'side', 'stamp', 'bottom'];
      const assignedType = panelOrder[scannedPanels.length] || 'custom';

      const newPanel: ScannedPanel = {
        id: 'panel-' + Date.now() + '-' + Math.random().toString(36).slice(2, 6),
        dataUrl,
        name: `Photo #${scannedPanels.length + 1}`,
        panelType: assignedType,
        label: defaultPanelLabels[assignedType] || `Panel #${scannedPanels.length + 1}`
      };

      setScannedPanels((prev) => {
        const next = [...prev, newPanel];
        setActivePanelIndex(next.length - 1);
        return next;
      });
      setSelectedImage(dataUrl);

      if (!keepCameraOpen) {
        stopCamera();
      }
    }
  };

  const processFiles = async (files: FileList | File[]) => {
    const validFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      if (files[i].type.startsWith('image/')) {
        validFiles.push(files[i]);
      }
    }

    if (validFiles.length === 0) {
      setErrorMsg('Please select valid image files (JPG, PNG, WebP).');
      return;
    }

    const panelOrder: Array<'front' | 'back' | 'side' | 'stamp' | 'bottom'> = ['front', 'back', 'side', 'stamp', 'bottom'];

    try {
      const readPromises = validFiles.map(async (file, idx) => {
        const compressedDataUrl = await compressImage(file, 1600, 0.82);
        const assignedType = panelOrder[scannedPanels.length + idx] || 'custom';
        return {
          id: 'panel-' + Date.now() + '-' + idx + '-' + Math.random().toString(36).slice(2, 6),
          dataUrl: compressedDataUrl,
          name: file.name,
          panelType: assignedType,
          label: defaultPanelLabels[assignedType] || file.name
        } as ScannedPanel;
      });

      const newPanels = await Promise.all(readPromises);
      setScannedPanels((prev) => {
        const next = [...prev, ...newPanels];
        if (prev.length === 0 && next.length > 0) {
          setActivePanelIndex(0);
          setSelectedImage(next[0].dataUrl);
        }
        return next;
      });
      setErrorMsg(null);
    } catch (compressErr) {
      console.warn('Error during image processing:', compressErr);
      setErrorMsg('Could not process some image files. Please try again.');
    }
  };


  const removePanel = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setScannedPanels((prev) => {
      const next = prev.filter((p) => p.id !== id);
      if (next.length === 0) {
        setSelectedImage(null);
        setActivePanelIndex(0);
      } else {
        const newIndex = Math.min(activePanelIndex, next.length - 1);
        setActivePanelIndex(newIndex);
        setSelectedImage(next[newIndex]?.dataUrl || null);
      }
      return next;
    });
  };

  const updatePanelType = (id: string, newType: 'front' | 'back' | 'side' | 'stamp' | 'bottom' | 'custom') => {
    setScannedPanels((prev) => 
      prev.map(p => p.id === id ? { ...p, panelType: newType, label: defaultPanelLabels[newType] || p.name } : p)
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
    // Reset inputs to allow uploading the same file again if needed
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (additionalFileInputRef.current) additionalFileInputRef.current.value = '';
  };

  // Pipeline: handleImageUpload -> validateProductImage -> if invalid show modal -> if valid runComplianceAnalysis
  const handleImageUpload = (
    imageData: string, 
    allImages?: string[], 
    hint: string = productHint, 
    text: string = extractedTextPreview
  ) => {
    // 1. Clear previous compliance results immediately!
    onClearPreviousInspection?.();
    setSelectedImage(imageData);
    if (hint) setProductHint(hint);
    if (text) setExtractedTextPreview(text);

    const imagesToProcess = allImages && allImages.length > 0 
      ? allImages 
      : scannedPanels.length > 0 
        ? scannedPanels.map((p) => p.dataUrl) 
        : [imageData];

    executePipeline(imageData, imagesToProcess, hint, text);
  };

  const executePipeline = async (
    primaryImage: string,
    allImages: string[],
    hint: string = productHint,
    text: string = extractedTextPreview
  ) => {
    if (!primaryImage && !text) {
      setErrorMsg('Please upload a product label, capture a photo, or choose a preset test case.');
      return;
    }

    console.log('executePipeline called with allImages length:', allImages.length);
    // Clear previous compliance state & modal
    onClearPreviousInspection?.();
    setErrorMsg(null);
    setValidationModal(null);
    setIsScanning(true);
    setScanningStep(`Validating ${allImages.length > 1 ? `${allImages.length} packaging images` : 'product packaging image'} via AI Vision...`);
    setScanningProgress(20);

    try {
      // STEP 1: OBJECT / PRODUCT VALIDATION BEFORE COMPLIANCE ANALYSIS
      const validation = await validateProductImage(primaryImage, hint, text);

      // IF INVALID: Stop all compliance analysis, show Invalid Input modal, and return!
      if (!validation.isPackagedCommodity) {
        setIsScanning(false);
        setScanningProgress(0);
        setScanningStep('');

        const formattedDetected = validation.detectedObject
          ? validation.detectedObject.charAt(0).toUpperCase() + validation.detectedObject.slice(1)
          : 'Non-commodity object';

        setValidationModal({
          type: 'INVALID_INPUT',
          title: 'Invalid Input',
          message: 'The uploaded image is not a valid packaged commodity.',
          detectedObject: formattedDetected,
          instruction: 'Please scan or upload a clear image of a packaged consumer product or its label.',
          buttonText: 'Scan Another Product',
          subtext: 'The Legal Metrology scanner strictly analyzes packaged commodities (e.g. food, grocery, personal care, retail packages).'
        });
        return; // STOP! Never run compliance analysis!
      }

      // IF LOW QUALITY (label cannot be inspected): Stop compliance analysis, show Low Quality modal, and return!
      if (validation.labelReadable === false) {
        setIsScanning(false);
        setScanningProgress(0);
        setScanningStep('');

        setValidationModal({
          type: 'LOW_QUALITY',
          title: 'Image Quality Too Low',
          message: 'Please upload a clear image showing the product and its label.',
          detectedObject: validation.detectedObject,
          instruction: 'The package label is too blurry or unreadable for statutory metrology compliance verification.',
          buttonText: 'Upload Clear Image',
          subtext: 'Ensure mandatory declarations (MRP, Net Qty, Dates, Address) are sharp and legible.'
        });
        return; // STOP! Never run compliance analysis!
      }

      // STEP 2: VALID PACKAGED COMMODITY -> RUN EXISTING LEGAL METROLOGY ANALYSIS
      setScanningStep(
        allImages.length > 1 
          ? `Verified packaged commodity. Synthesizing ${allImages.length} panels across all statutory rules...` 
          : 'Valid packaged commodity verified. Running statutory Legal Metrology compliance analysis...'
      );
      setScanningProgress(45);

      await runComplianceAnalysis(primaryImage, allImages, hint, text);

    } catch (err: any) {
      setIsScanning(false);
      setScanningProgress(0);
      setScanningStep('');
      console.error('Validation or scan error:', err);
      setErrorMsg(err.message || 'Inspection failed. Please try again.');
    }
  };

  const runComplianceAnalysis = async (
    primaryImage: string = selectedImage || '',
    allImages: string[] = scannedPanels.map((p) => p.dataUrl),
    hintToScan: string = productHint,
    textToScan: string = extractedTextPreview
  ) => {
    const imagesToScan = allImages.length > 0 ? allImages : (primaryImage ? [primaryImage] : []);
    const isMulti = imagesToScan.length > 1;

    const steps = [
      { step: isMulti ? `Extracting declarations across ${imagesToScan.length} panels via AI Vision...` : 'Extracting statutory declarations via Multi-Modal Vision...', progress: 60 },
      { step: 'Verifying mandatory declarations under Rule 6(1)...', progress: 75 },
      { step: 'Analyzing font heights, contrast & Table I/II ratios...', progress: 90 },
      { step: 'Generating statutory compliance score & violation report...', progress: 98 }
    ];

    let stepIndex = 0;
    const stepInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setScanningStep(steps[stepIndex].step);
        setScanningProgress(steps[stepIndex].progress);
        stepIndex++;
      }
    }, 400);

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 28000);

      const response = await fetch('/api/scan-compliance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          imageBase64: primaryImage,
          images: imagesToScan,
          productHint: hintToScan,
          textContext: textToScan,
          mimeType: 'image/jpeg',
          preValidated: true
        })
      });

      clearTimeout(timeoutId);
      clearInterval(stepInterval);

      if (!response.ok) {
        let errDetail = `Server returned status ${response.status}`;
        try {
          const errJson = await response.json();
          if (errJson.error) errDetail = errJson.error;
        } catch (_) {}
        throw new Error(errDetail);
      }

      const result: ScanApiResponse = await response.json();

      // Backend safety check: If backend refused compliance analysis
      if (result.isValid === false || (result as any).validation_status === 'INVALID_INPUT' || (result as any).validation_status === 'LOW_QUALITY') {
        const failure = result as any;
        setIsScanning(false);
        setScanningProgress(0);
        setScanningStep('');

        setValidationModal({
          type: failure.validation_status || 'INVALID_INPUT',
          title: failure.title || (failure.validation_status === 'LOW_QUALITY' ? 'Image Quality Too Low' : 'Invalid Input'),
          message: failure.message || 'The uploaded image is not a valid packaged commodity.',
          detectedObject: failure.detected_object,
          instruction: failure.instruction || (failure.validation_status === 'LOW_QUALITY' ? 'Please upload a clear, well-lit image showing the complete product label.' : 'Please scan or upload a clear image of a packaged consumer product or its label.'),
          buttonText: failure.button_text || (failure.validation_status === 'LOW_QUALITY' ? 'Upload Clear Image' : 'Scan Another Product'),
          subtext: failure.subtext || ''
        });
        return;
      }

      // Valid Packaged Commodity: proceed to compliance dashboard
      const inspectionData = result as InspectionRecord;
      setScanningProgress(100);

      // Supplement with officer premise details
      inspectionData.retailer_premise = retailerPremise || 'Field Audit Premise';
      inspectionData.officer_badge = officerBadge || 'LM-DEL-402';

      setTimeout(() => {
        setIsScanning(false);
        onInspectionComplete(inspectionData);
      }, 350);

    } catch (err: any) {
      clearInterval(stepInterval);
      setIsScanning(false);
      console.error('Scan error:', err);
      if (err.name === 'AbortError') {
        setErrorMsg('The analysis request timed out. Please click "Retry Scan" to analyze again with rapid rule fallback.');
      } else if (err.message && (err.message.includes('Failed to fetch') || err.message.includes('NetworkError'))) {
        setErrorMsg('Network connectivity issue. Please check your connection or click "Retry Scan".');
      } else {
        setErrorMsg('Failed to complete compliance scan: ' + (err.message || 'Network error'));
      }
    }
  };

  const handleDismissValidationModal = () => {
    const isLowQuality = validationModal?.type === 'LOW_QUALITY';
    setValidationModal(null);
    setSelectedImage(null);
    setScannedPanels([]);
    setActivePanelIndex(0);
    setProductHint('');
    setExtractedTextPreview('');
    setErrorMsg(null);
    setIsScanning(false);
    setScanningProgress(0);
    setScanningStep('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (additionalFileInputRef.current) {
      additionalFileInputRef.current.value = '';
    }
    if (isLowQuality && fileInputRef.current) {
      setTimeout(() => {
        fileInputRef.current?.click();
      }, 150);
    }
  };

  const resetForm = () => {
    setSelectedImage(null);
    setScannedPanels([]);
    setActivePanelIndex(0);
    setProductHint('');
    setExtractedTextPreview('');
    setErrorMsg(null);
    setValidationModal(null);
    stopCamera();
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (additionalFileInputRef.current) additionalFileInputRef.current.value = '';
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const currentDisplayImage = scannedPanels[activePanelIndex]?.dataUrl || selectedImage;

  return (
    <div className="space-y-4 sm:space-y-6">
      {errorMsg && (
        <div className="p-3.5 sm:p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs sm:text-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-start gap-2.5 flex-1">
            <AlertTriangle className="w-4 h-4 sm:w-5 sm:h-5 text-rose-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">{t('scanner.notice_title', 'Scanner Notice: ')}</span>
              <span>{errorMsg}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
            {(selectedImage || scannedPanels.length > 0 || extractedTextPreview) && (
              <button
                id="btn-retry-scan"
                onClick={() => {
                  setErrorMsg(null);
                  handleImageUpload(selectedImage || (scannedPanels[0]?.dataUrl || ''), scannedPanels.map(p => p.dataUrl), productHint, extractedTextPreview);
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white transition cursor-pointer shadow-xs"
              >
                Retry Scan
              </button>
            )}
            <button 
              onClick={() => setErrorMsg(null)}
              className="text-xs font-medium text-rose-600 hover:text-rose-900 underline px-2 py-1 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main scan workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 sm:gap-6">
        {/* Left Column: Image / Camera capture & Preview */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs">
            <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
              <h2 className="text-xs sm:text-sm font-bold text-slate-900 flex items-center gap-2">
                <Camera className="w-4 h-4 text-amber-600 shrink-0" />
                <span>{t('scanner.panels_loaded_title', 'Packaging Photos & Panels')}</span>
              </h2>
              <div className="flex items-center gap-2">
                {!isCameraActive ? (
                  <button
                    id="btn-start-camera"
                    onClick={startCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 transition cursor-pointer"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{t('scanner.camera_btn', 'Live Camera')}</span>
                  </button>
                ) : (
                  <button
                    id="btn-stop-camera"
                    onClick={stopCamera}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-rose-100 hover:bg-rose-200 text-rose-700 transition cursor-pointer"
                  >
                    <span>{t('scanner.close_camera', 'Close Camera')}</span>
                  </button>
                )}
                {currentDisplayImage && (
                  <button
                    onClick={resetForm}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 transition cursor-pointer"
                    title={t('scanner.clear_images_title', 'Clear current images')}
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>{t('scanner.reset_btn', 'Reset')}</span>
                  </button>
                )}
              </div>
            </div>

            {/* Camera viewfinder or Dropzone */}
            {isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden bg-black aspect-video flex items-center justify-center border-2 border-amber-500 shadow-inner">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
                
                {/* Flash Overlay */}
                {captureFlash && (
                  <div className="absolute inset-0 bg-white/90 z-40 transition-opacity duration-150 pointer-events-none" />
                )}
                
                {/* Flash Message Toast */}
                {flashMessage && (
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-50 pointer-events-none animate-in fade-in zoom-in duration-200">
                     <div className="bg-slate-900/80 backdrop-blur-md text-white font-bold px-4 py-2 rounded-lg shadow-2xl flex items-center gap-2">
                       <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                       <span>{flashMessage}</span>
                     </div>
                  </div>
                )}
                
                {/* Principal Display Panel reticle overlay */}
                <div className="absolute inset-3 sm:inset-6 border-2 border-dashed border-amber-400/80 rounded-lg pointer-events-none flex flex-col justify-between p-2 sm:p-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] sm:text-[11px] font-mono text-amber-300 bg-black/70 px-2 py-0.5 rounded">
                      {t('scanner.align_statutory_panel', 'ALIGN STATUTORY PANEL / PART HERE')}
                    </span>
                  </div>
                  <span className="text-[9px] sm:text-[10px] text-amber-200 bg-black/60 px-2 py-0.5 rounded w-fit self-end">
                    {t('scanner.reticle_subtext', 'Front PDP, Back MRP/Date panel, or Side Manufacturer address')}
                  </span>
                </div>
                {/* Capture buttons: Multi-shot or single-shot */}
                <div className="absolute bottom-4 sm:bottom-6 inset-x-0 flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-3 px-4">
                  {scannedPanels.length > 0 && (
                    <button
                      type="button"
                      onClick={stopCamera}
                      className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-full bg-white hover:bg-slate-100 text-slate-900 font-bold text-xs flex items-center justify-center gap-2 shadow-lg transition cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      <span>{t('scanner.finish_scanning', 'Finish & Close')}</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => { stopCamera(); }}
                    className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white backdrop-blur-sm transition z-50 cursor-pointer hidden sm:flex"
                    title={t('scanner.close_camera', 'Close Camera')}
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => capturePhoto(true)}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-full bg-slate-950/80 hover:bg-slate-900 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg backdrop-blur-sm border border-slate-700 transition cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>{t('scanner.snap_add_next', 'Snap & Add Next Angle')}</span>
                  </button>
                  <button
                    id="btn-capture-photo"
                    type="button"
                    onClick={() => capturePhoto(false)}
                    className="w-full sm:w-auto px-4 sm:px-5 py-2 rounded-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-black/50 transition cursor-pointer"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{t('scanner.capture_done', 'Capture & Done')}</span>
                  </button>
                </div>
              </div>
            ) : currentDisplayImage ? (
              <div className="space-y-4">
                <div className="relative rounded-xl overflow-hidden bg-slate-900 aspect-video flex items-center justify-center border border-slate-200 group">
                  <img
                    src={currentDisplayImage}
                    alt="Scanned product package"
                    className="w-full h-full object-contain"
                  />
                  <div className="absolute bottom-2 left-2 right-2 bg-slate-950/80 backdrop-blur-sm text-slate-200 text-xs px-2.5 sm:px-3 py-1.5 rounded flex items-center justify-between gap-2">
                    <span className="truncate max-w-[75%] font-medium text-[11px] sm:text-xs">
                      {productHint || t('scanner.panel_hint', 'Packaging photo loaded and ready for statutory verification')}
                    </span>
                  </div>
                </div>

                {/* Multi-Panel Gallery Strip */}
                {(selectedImage || scannedPanels.length > 0) && (
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-slate-700">
                      <Layers className="w-3.5 h-3.5 text-amber-600" />
                      <span>{t('scanner.multi_panel_title', 'Loaded Packaging Panels')} ({scannedPanels.length})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => additionalFileInputRef.current?.click()}
                        className="text-[11px] font-bold text-amber-700 hover:text-amber-800 flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>{t('scanner.upload_btn', 'Upload Photo')}</span>
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={startCamera}
                        className="text-[11px] font-bold text-slate-700 hover:text-slate-900 flex items-center gap-1 cursor-pointer"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>{t('scanner.camera_btn', 'Live Camera')}</span>
                      </button>
                    </div>
                  </div>
                  <p className="text-[11px] text-slate-500 leading-tight">
                    {t('scanner.statutory_dist', 'Statutory declarations are often distributed across different package sides. Click any thumbnail to preview or add photos of other sides to ensure 100% compliance coverage.')}
                  </p>
                  <div className="flex items-center gap-2.5 overflow-x-auto pb-1.5 pt-0.5 scrollbar-thin">
                    {scannedPanels.map((panel, idx) => (
                      <div
                        key={panel.id}
                        onClick={() => {
                          setActivePanelIndex(idx);
                          setSelectedImage(panel.dataUrl);
                        }}
                        className={`group relative shrink-0 w-20 sm:w-24 h-16 sm:h-20 rounded-lg overflow-hidden border-2 cursor-pointer transition shadow-2xs ${
                          idx === activePanelIndex
                            ? 'border-amber-500 ring-2 ring-amber-500/20'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <img
                          src={panel.dataUrl}
                          alt={panel.name}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-x-0 bottom-0 bg-slate-950/80 px-1 py-0.5 text-[9px] font-medium text-white truncate text-center">
                          {panel.label.split(' ')[0]}
                        </div>
                        <button
                          type="button"
                          onClick={(e) => removePanel(panel.id, e)}
                          className="absolute top-1 right-1 w-4 h-4 rounded-full bg-rose-600 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer hover:bg-rose-700"
                          title="Remove this photo"
                        >
                          <Trash2 className="w-2.5 h-2.5" />
                        </button>
                      </div>
                    ))}
                    {/* Add another panel card */}
                    <button
                      type="button"
                      onClick={() => additionalFileInputRef.current?.click()}
                      className="shrink-0 w-20 sm:w-24 h-16 sm:h-20 rounded-lg border-2 border-dashed border-slate-300 hover:border-amber-500 bg-white hover:bg-amber-50/20 flex flex-col items-center justify-center gap-1 text-slate-500 hover:text-amber-700 transition cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="text-[10px] font-bold">{t('scanner.add_side', 'Add Side')}</span>
                    </button>
                  </div>
                </div>
                )}
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-6 sm:p-8 text-center cursor-pointer transition group ${
                  isDragOver 
                    ? 'border-amber-500 bg-amber-50/40' 
                    : 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/20'
                }`}
              >
                <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto mb-3 group-hover:scale-105 transition">
                  <Upload className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xs sm:text-sm font-semibold text-slate-800 mb-1">
                  {t('scanner.dropzone_title', 'Upload Product Packaging Photographs')}
                </h3>
                <p className="text-[11px] sm:text-xs text-slate-500 max-w-sm mx-auto mb-3 leading-relaxed">
                  {t('scanner.dropzone_desc', 'Drag and drop one or multiple packaging panels (Front, Back MRP/Date, Side Manufacturer address)')}
                </p>
                <div className="flex flex-wrap items-center justify-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-slate-300 text-slate-700 shadow-2xs group-hover:border-amber-500">
                    <FileText className="w-3.5 h-3.5 text-amber-600" />
                    {t('scanner.browse_btn', 'Browse Photos')}
                  </span>
                </div>
              </div>
            )}

            {/* Hidden multiple file inputs */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
            <input
              ref={additionalFileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileUpload}
            />
          </div>
        </div>

        {/* Right Column: Inspection Parameters & Run Scan */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white border border-slate-200 rounded-xl p-4 sm:p-5 shadow-xs space-y-4">
            <h2 className="text-xs sm:text-sm font-bold text-slate-900 border-b border-slate-100 pb-3 flex items-center gap-2">
              <Building2 className="w-4 h-4 text-amber-600 shrink-0" />
              <span>{t('report.inspection_details', 'Inspection Premises & Metadata')}</span>
            </h2>

            {/* Note: productHint removed as requested */}

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                {t('scanner.premise_label', 'Inspection Retailer / Premises Location')}
              </label>
              <input
                type="text"
                value={retailerPremise}
                onChange={(e) => setRetailerPremise(e.target.value)}
                placeholder="e.g. Modern Supermarket, MG Road, Store #4"
                className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('scanner.badge_label', 'Enforcement Officer ID / Badge')}
                </label>
                <input
                  type="text"
                  value={officerBadge}
                  onChange={(e) => setOfficerBadge(e.target.value)}
                  className="w-full text-xs bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-slate-800 focus:outline-none focus:ring-1 focus:ring-amber-500 font-mono"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  {t('dashboard.act_citation', 'Applicable Statutory Act')}
                </label>
                <div className="text-xs bg-slate-100 border border-slate-200 rounded-lg px-3 py-2 text-slate-600 font-mono">
                  {t('scanner.lmpc_rules', 'LM(PC) Rules, 2011')}
                </div>
              </div>
            </div>

            {/* Checklist items to be verified */}
            <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 text-xs space-y-2">
              <span className="font-bold text-slate-700 block text-[11px] uppercase tracking-wider">
                Automated Verification Rules Checklist:
              </span>
              <ul className="space-y-1.5 text-slate-600 text-[11px]">
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('scanner.rule_6_1', 'Rule 6(1)(a)-(f): Manufacturer, Generic Name, Qty, Date & MRP')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('scanner.rule_6_1_da', 'Rule 6(1)(da) & (10): Consumer Care & Country of Origin')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('scanner.rule_7', 'Rule 7: Font size height & readability table check')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('scanner.rule_13', "Rule 13: Strict bar on 'approx', 'gms', 'jumbo' qualifying words")}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('scanner.fssai_check', 'FSSAI: Veg/Non-Veg Mark & License Number Check')}</span>
                </li>
                <li className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>{t('scanner.sec_36', 'Sec 36(2): Dual MRP stickers & price alteration check')}</span>
                </li>
              </ul>
            </div>

            {/* Execute Button */}
            <button
              id="btn-run-compliance-scan"
              onClick={() => handleImageUpload(selectedImage || (scannedPanels[0]?.dataUrl || ''), scannedPanels.map(p => p.dataUrl), productHint, extractedTextPreview)}
              disabled={isScanning || (scannedPanels.length === 0 && !selectedImage && !extractedTextPreview)}
              className={`w-full py-3 px-4 rounded-xl font-bold text-xs sm:text-sm shadow-md flex items-center justify-center gap-2 transition cursor-pointer ${
                isScanning || (scannedPanels.length === 0 && !selectedImage && !extractedTextPreview)
                  ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
                  : 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20 active:scale-[0.99]'
              }`}
            >
              {isScanning ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-900 border-t-transparent rounded-full animate-spin"></div>
                  <span>{t('scanner.scanning', 'Validating & Analyzing Declarations...')}</span>
                </>
              ) : (
                <>
                  <span>
                    {validationModal?.type === 'LOW_QUALITY'
                      ? `Re-evaluating ${scannedPanels.length} Image Panels...` 
                      : t('scanner.run_scan', 'Run Statutory Compliance Scan')}
                  </span>
                  <ArrowRight className="w-4 h-4 shrink-0" />
                </>
              )}
            </button>

            {/* Scanning Progress feedback bar */}
            {isScanning && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span className="truncate max-w-[80%]">{scanningStep}</span>
                  <span className="font-mono">{scanningProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300 rounded-full"
                    style={{ width: `${scanningProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">{t('scanner.statutory_note_prefix', 'Statutory Note:')}</span> {t('scanner.statutory_note_desc', "Under Rule 6 of the Legal Metrology (Packaged Commodities) Rules, 2011, declarations must be legible, prominent, and conspicuous. Dual price stickers or omitted 'inclusive of all taxes' invoke liability under Section 36 of the Act.")}
            </div>
          </div>
        </div>
      </div>

      {/* Strict Product Validation Result Modal (Invalid Input or Low Quality Image) */}
      {validationModal && (
        <div 
          id="strict-product-validation-modal" 
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
          role="dialog"
          aria-modal="true"
        >
          <div 
            id="validation-modal-card"
            className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl border border-slate-200 text-center relative overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Top Accent Stripe */}
            <div className={`absolute top-0 inset-x-0 h-1.5 ${
              validationModal.type === 'LOW_QUALITY' 
                ? 'bg-gradient-to-r from-amber-400 via-amber-500 to-amber-600'
                : 'bg-gradient-to-r from-rose-500 via-rose-600 to-amber-500'
            }`} />

            {/* Warning / Error Icon */}
            <div className={`w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-xs ${
              validationModal.type === 'LOW_QUALITY'
                ? 'bg-amber-50 border border-amber-200 text-amber-600'
                : 'bg-rose-50 border border-rose-200 text-rose-600'
            }`}>
              {validationModal.type === 'LOW_QUALITY' ? (
                <AlertCircle className="w-7 h-7" />
              ) : (
                <AlertTriangle className="w-7 h-7" />
              )}
            </div>

            {/* Title */}
            <h3 id="validation-modal-title" className="text-xl font-extrabold text-slate-900 tracking-tight mb-2">
              {validationModal.title}
            </h3>

            {/* Primary Message */}
            <p id="validation-modal-message" className="text-sm font-semibold text-slate-800 mb-3 leading-relaxed">
              {validationModal.message}
            </p>

            {/* Detected Object: "Detected object: Car" */}
            {validationModal.detectedObject && (
              <div id="validation-modal-detected" className="mb-3 px-3.5 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-700 flex items-center justify-center gap-1.5">
                <span className="font-semibold text-slate-500">{t('scanner.detected_object', 'Detected object:')}</span>
                <span className="font-bold text-slate-900">{validationModal.detectedObject}</span>
              </div>
            )}

            {/* Instruction */}
            <p id="validation-modal-instruction" className="text-xs text-slate-500 mb-5 leading-relaxed">
              {validationModal.instruction || 'Please scan or upload a clear image of a packaged consumer product or its label.'}
            </p>

            {/* Action Button: "Scan Another Product" */}
            <button
              id="btn-validation-modal-action"
              onClick={handleDismissValidationModal}
              className="w-full py-3 px-5 rounded-xl text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 shadow-sm transition-all duration-150 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{validationModal.buttonText}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
