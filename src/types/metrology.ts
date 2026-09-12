export type DeclarationStatus = 
  | 'PRESENT_AND_COMPLIANT' 
  | 'DEFECTIVE' 
  | 'MISSING' 
  | 'NOT_APPLICABLE';

export type ComplianceOverallStatus = 
  | 'COMPLIANT' 
  | 'NON_COMPLIANT' 
  | 'NEEDS_REVIEW';

export type OfficerAction = 
  | 'NO_ACTION' 
  | 'ISSUE_NOTICE' 
  | 'SEIZE_COMMODITY' 
  | 'COMPOUNDING_OFFENCE' 
  | 'WARNING';

export type ViolationSeverity = 'CRITICAL' | 'MAJOR' | 'MINOR';

export interface DeclarationItem {
  id: string;
  name: string;
  rule_reference: string;
  act_section: string;
  status: DeclarationStatus;
  detected_text: string;
  required_format?: string;
  remarks: string;
  confidence: number;
  bounding_box?: {
    ymin: number;
    xmin: number;
    ymax: number;
    xmax: number;
  };
}

export interface FontAndReadabilityAnalysis {
  estimated_min_height_mm: number;
  required_min_height_mm: number;
  contrast_rating: 'high' | 'medium' | 'low';
  font_status: 'compliant' | 'non_compliant' | 'warning';
  readability_notes: string;
}

export interface PlacementAnalysis {
  pdp_declared: boolean;
  is_conspicuous: boolean;
  grouping_status: 'proper' | 'scattered' | 'obscured';
  remarks: string;
}

export interface ProhibitedPracticesAnalysis {
  has_prohibited_terms: boolean;
  detected_prohibited_terms: string[];
  has_dual_mrp: boolean;
  dual_mrp_details?: string;
  is_tax_inclusive_omitted: boolean;
}

export interface ViolationDetail {
  id: string;
  severity: ViolationSeverity;
  rule: string;
  act_section: string;
  title: string;
  description: string;
  remedial_action: string;
  statutory_penalty_summary: string;
}

export interface InspectionRecord {
  id: string;
  inspection_reference_no: string;
  timestamp: string;
  product_name: string;
  brand_name: string;
  category: string;
  batch_or_lot: string;
  barcode_or_sku: string;
  manufacturer_name: string;
  retailer_premise?: string;
  officer_name: string;
  officer_badge: string;
  overall_status: ComplianceOverallStatus;
  compliance_score: number;
  violations_count: number;
  declarations: Record<string, DeclarationItem>;
  font_analysis: FontAndReadabilityAnalysis;
  placement_analysis: PlacementAnalysis;
  prohibited_practices: ProhibitedPracticesAnalysis;
  violations: ViolationDetail[];
  summary: string;
  officer_action_recommended: OfficerAction;
  image_url: string;
  officer_notes?: string;
  supporting_photos?: string[];
  created_by_role?: 'inspector' | 'user';
  created_by_user_id?: string;
  created_by_user_name?: string;
  status_history?: {
    date: string;
    action: string;
    by: string;
  }[];
}

export interface InspectionStatistics {
  total_inspected: number;
  total_compliant: number;
  total_non_compliant: number;
  total_needs_review: number;
  notices_issued: number;
  common_violations: {
    rule: string;
    title: string;
    count: number;
  }[];
  compliance_rate: number;
}

export interface ProductImageValidationResult {
  isPackagedCommodity: boolean;
  labelReadable?: boolean;
  detectedObject: string;
  confidence: number;
  reason: string;
}

export interface ValidationFailureResponse {
  isValid: false;
  validation_status: 'INVALID_INPUT' | 'LOW_QUALITY';
  title: string;
  message: string;
  subtext: string;
  detected_object?: string;
  button_text: string;
}

export type ScanApiResponse = (InspectionRecord & { isValid?: true }) | ValidationFailureResponse;
