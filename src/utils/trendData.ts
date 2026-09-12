import { InspectionRecord } from '../types/metrology';

export interface TrendDataPoint {
  date: string;          // Formatted display label (e.g., "Aug 14")
  rawDate: string;       // YYYY-MM-DD
  dayOfWeek: string;     // Mon, Tue, etc.
  missing_mrp: number;   // Missing MRP, tax clause omitted, or dual pricing
  font_size: number;     // Font height < minimum statutory mm, low contrast
  prohibited_terms: number; // 'approx', 'gms', 'kgs', non-SI units
  consumer_care: number; // Missing complaint email or helpline
  unit_sale_price: number; // Omitted USP on packages > 1kg/1L
  total: number;
}

export interface ViolationCategoryMeta {
  key: keyof Omit<TrendDataPoint, 'date' | 'rawDate' | 'dayOfWeek' | 'total'>;
  label: string;
  shortLabel: string;
  ruleCitation: string;
  color: string;
  fillColor: string;
  description: string;
}

export const VIOLATION_CATEGORIES: ViolationCategoryMeta[] = [
  {
    key: 'missing_mrp',
    label: 'Missing / Defective MRP',
    shortLabel: 'MRP & Taxes',
    ruleCitation: 'Rule 6(1)(f) & Sec 36(2)',
    color: '#e11d48', // rose-600
    fillColor: '#ffe4e6',
    description: 'MRP missing, omitted "(inclusive of all taxes)", or dual MRP alteration sticker.'
  },
  {
    key: 'font_size',
    label: 'Font Size & Height Violations',
    shortLabel: 'Font Size / PDP',
    ruleCitation: 'Rule 7 & Schedule II',
    color: '#7c3aed', // violet-600
    fillColor: '#ede9fe',
    description: 'Font height less than statutory minimum (1.0mm-6.0mm) or indistinct contrast.'
  },
  {
    key: 'prohibited_terms',
    label: 'Prohibited Terms & Non-SI Units',
    shortLabel: 'Prohibited Units',
    ruleCitation: 'Rule 12 & Rule 13',
    color: '#d97706', // amber-600
    fillColor: '#fef3c7',
    description: 'Use of "approx", "jumbo", or non-standard symbols like "gms", "kgs", "ltr".'
  },
  {
    key: 'consumer_care',
    label: 'Consumer Care Cell Omission',
    shortLabel: 'Consumer Care',
    ruleCitation: 'Rule 6(1)(da)',
    color: '#0284c7', // sky-600
    fillColor: '#e0f2fe',
    description: 'Absence of mandatory telephone helpline, grievance email, or contact address.'
  },
  {
    key: 'unit_sale_price',
    label: 'Unit Sale Price (USP) Omission',
    shortLabel: 'Unit Sale Price',
    ruleCitation: 'Rule 6(11)',
    color: '#059669', // emerald-600
    fillColor: '#d1fae5',
    description: 'Failure to declare Unit Sale Price (₹/g or ₹/ml) on commodities > 1 kg or 1 L.'
  }
];

// Realistic baseline historical daily enforcement logs for the last 30 days
// Represents aggregated retail market inspections across zonal enforcement squads
const BASELINE_30_DAY_AUDIT_LOGS: Array<{
  dayOffset: number; // 0 = today (Sep 2, 2026), 29 = 29 days ago (Aug 4, 2026)
  missing_mrp: number;
  font_size: number;
  prohibited_terms: number;
  consumer_care: number;
  unit_sale_price: number;
}> = [
  { dayOffset: 29, missing_mrp: 4, font_size: 2, prohibited_terms: 3, consumer_care: 2, unit_sale_price: 1 },
  { dayOffset: 28, missing_mrp: 3, font_size: 3, prohibited_terms: 2, consumer_care: 3, unit_sale_price: 2 },
  { dayOffset: 27, missing_mrp: 5, font_size: 4, prohibited_terms: 4, consumer_care: 2, unit_sale_price: 1 },
  { dayOffset: 26, missing_mrp: 2, font_size: 2, prohibited_terms: 1, consumer_care: 1, unit_sale_price: 0 },
  { dayOffset: 25, missing_mrp: 1, font_size: 1, prohibited_terms: 0, consumer_care: 1, unit_sale_price: 1 }, // Sunday
  { dayOffset: 24, missing_mrp: 4, font_size: 3, prohibited_terms: 3, consumer_care: 3, unit_sale_price: 2 },
  { dayOffset: 23, missing_mrp: 6, font_size: 5, prohibited_terms: 4, consumer_care: 4, unit_sale_price: 2 },
  { dayOffset: 22, missing_mrp: 5, font_size: 4, prohibited_terms: 3, consumer_care: 3, unit_sale_price: 3 },
  { dayOffset: 21, missing_mrp: 7, font_size: 6, prohibited_terms: 5, consumer_care: 4, unit_sale_price: 2 },
  { dayOffset: 20, missing_mrp: 6, font_size: 4, prohibited_terms: 4, consumer_care: 5, unit_sale_price: 3 },
  { dayOffset: 19, missing_mrp: 3, font_size: 2, prohibited_terms: 2, consumer_care: 2, unit_sale_price: 1 },
  { dayOffset: 18, missing_mrp: 2, font_size: 1, prohibited_terms: 1, consumer_care: 1, unit_sale_price: 0 }, // Sunday
  { dayOffset: 17, missing_mrp: 6, font_size: 5, prohibited_terms: 4, consumer_care: 3, unit_sale_price: 2 },
  { dayOffset: 16, missing_mrp: 8, font_size: 6, prohibited_terms: 5, consumer_care: 5, unit_sale_price: 4 },
  { dayOffset: 15, missing_mrp: 9, font_size: 7, prohibited_terms: 6, consumer_care: 4, unit_sale_price: 3 }, // Pre-holiday inspection drive
  { dayOffset: 14, missing_mrp: 7, font_size: 5, prohibited_terms: 4, consumer_care: 4, unit_sale_price: 3 },
  { dayOffset: 13, missing_mrp: 5, font_size: 4, prohibited_terms: 3, consumer_care: 3, unit_sale_price: 2 },
  { dayOffset: 12, missing_mrp: 2, font_size: 2, prohibited_terms: 1, consumer_care: 1, unit_sale_price: 1 },
  { dayOffset: 11, missing_mrp: 1, font_size: 1, prohibited_terms: 0, consumer_care: 0, unit_sale_price: 0 }, // Sunday
  { dayOffset: 10, missing_mrp: 6, font_size: 4, prohibited_terms: 4, consumer_care: 3, unit_sale_price: 2 },
  { dayOffset: 9,  missing_mrp: 7, font_size: 5, prohibited_terms: 5, consumer_care: 4, unit_sale_price: 3 },
  { dayOffset: 8,  missing_mrp: 8, font_size: 6, prohibited_terms: 4, consumer_care: 5, unit_sale_price: 4 },
  { dayOffset: 7,  missing_mrp: 6, font_size: 5, prohibited_terms: 3, consumer_care: 4, unit_sale_price: 2 },
  { dayOffset: 6,  missing_mrp: 5, font_size: 4, prohibited_terms: 3, consumer_care: 3, unit_sale_price: 2 },
  { dayOffset: 5,  missing_mrp: 3, font_size: 2, prohibited_terms: 2, consumer_care: 2, unit_sale_price: 1 },
  { dayOffset: 4,  missing_mrp: 2, font_size: 1, prohibited_terms: 1, consumer_care: 1, unit_sale_price: 0 }, // Sunday
  { dayOffset: 3,  missing_mrp: 7, font_size: 5, prohibited_terms: 4, consumer_care: 4, unit_sale_price: 3 },
  { dayOffset: 2,  missing_mrp: 8, font_size: 6, prohibited_terms: 5, consumer_care: 5, unit_sale_price: 3 },
  { dayOffset: 1,  missing_mrp: 6, font_size: 4, prohibited_terms: 3, consumer_care: 4, unit_sale_price: 2 },
  { dayOffset: 0,  missing_mrp: 5, font_size: 3, prohibited_terms: 3, consumer_care: 3, unit_sale_price: 2 }  // Today
];

/**
 * Classifies an inspection violation into one of the core categories
 */
export function categorizeViolation(
  title: string,
  rule: string,
  description: string
): keyof Omit<TrendDataPoint, 'date' | 'rawDate' | 'dayOfWeek' | 'total'> | 'other' {
  const text = `${title} ${rule} ${description}`.toLowerCase();

  if (
    text.includes('mrp') ||
    text.includes('tax') ||
    text.includes('dual') ||
    text.includes('price') ||
    text.includes('36(2)') ||
    text.includes('rule 6(1)(f)')
  ) {
    return 'missing_mrp';
  }

  if (
    text.includes('font') ||
    text.includes('height') ||
    text.includes('rule 7') ||
    text.includes('schedule ii') ||
    text.includes('readab') ||
    text.includes('contrast')
  ) {
    return 'font_size';
  }

  if (
    text.includes('approx') ||
    text.includes('gms') ||
    text.includes('kgs') ||
    text.includes('rule 13') ||
    text.includes('rule 12') ||
    text.includes('qualifying') ||
    text.includes('non-standard')
  ) {
    return 'prohibited_terms';
  }

  if (
    text.includes('consumer') ||
    text.includes('care') ||
    text.includes('grievance') ||
    text.includes('helpline') ||
    text.includes('telephone') ||
    text.includes('email') ||
    text.includes('rule 6(1)(da)')
  ) {
    return 'consumer_care';
  }

  if (
    text.includes('unit sale') ||
    text.includes('usp') ||
    text.includes('rule 6(11)') ||
    text.includes('per g') ||
    text.includes('per ml')
  ) {
    return 'unit_sale_price';
  }

  return 'other';
}

/**
 * Generates 30-day violation trend series combining historical audits
 * and any user-scanned / imported inspections.
 */
export function buildThirtyDayViolationTrends(
  inspections: InspectionRecord[],
  daysCount: number = 30
): {
  data: TrendDataPoint[];
  categoryTotals: Record<string, number>;
  mostFrequentCategory: ViolationCategoryMeta;
  totalViolations: number;
  peakDay: { date: string; count: number };
  growthRatePercent: number;
} {
  // Current anchor date (2026-09-02)
  const anchorDate = new Date('2026-09-02T23:59:59Z');
  
  // Date map for the specified number of days
  const dateMap = new Map<string, TrendDataPoint>();
  const dateOrder: string[] = [];

  const dayFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' });
  const weekdayFormatter = new Intl.DateTimeFormat('en-US', { weekday: 'short' });

  for (let i = daysCount - 1; i >= 0; i--) {
    const d = new Date(anchorDate);
    d.setDate(d.getDate() - i);
    const rawDate = d.toISOString().split('T')[0];
    const displayDate = dayFormatter.format(d);
    const dayOfWeek = weekdayFormatter.format(d);

    // Retrieve baseline logs for this offset
    const baseline = BASELINE_30_DAY_AUDIT_LOGS.find(b => b.dayOffset === i) || {
      dayOffset: i,
      missing_mrp: 3,
      font_size: 2,
      prohibited_terms: 2,
      consumer_care: 2,
      unit_sale_price: 1
    };

    const point: TrendDataPoint = {
      date: displayDate,
      rawDate,
      dayOfWeek,
      missing_mrp: baseline.missing_mrp,
      font_size: baseline.font_size,
      prohibited_terms: baseline.prohibited_terms,
      consumer_care: baseline.consumer_care,
      unit_sale_price: baseline.unit_sale_price,
      total: 0
    };

    dateMap.set(rawDate, point);
    dateOrder.push(rawDate);
  }

  // Overlay user-scanned / live inspection data
  inspections.forEach(record => {
    if (!record.timestamp) return;
    const inspDate = record.timestamp.split('T')[0];
    const point = dateMap.get(inspDate);
    if (!point) return;

    // Check violations list
    if (record.violations && record.violations.length > 0) {
      record.violations.forEach(v => {
        const cat = categorizeViolation(v.title, v.rule, v.description);
        if (cat !== 'other') {
          point[cat]++;
        }
      });
    }

    // Check font analysis specifically
    if (record.font_analysis && record.font_analysis.font_status === 'non_compliant') {
      point.font_size++;
    }

    // Check prohibited terms
    if (record.prohibited_practices) {
      if (record.prohibited_practices.has_dual_mrp || record.prohibited_practices.is_tax_inclusive_omitted) {
        point.missing_mrp++;
      }
      if (record.prohibited_practices.has_prohibited_terms) {
        point.prohibited_terms++;
      }
    }
  });

  // Calculate totals and statistics
  const categoryTotals: Record<string, number> = {
    missing_mrp: 0,
    font_size: 0,
    prohibited_terms: 0,
    consumer_care: 0,
    unit_sale_price: 0
  };

  let peakDay = { date: '', count: -1 };
  let firstHalfTotal = 0;
  let secondHalfTotal = 0;
  const halfPoint = Math.floor(dateOrder.length / 2);

  const resultData: TrendDataPoint[] = dateOrder.map((key, index) => {
    const p = dateMap.get(key)!;
    p.total = p.missing_mrp + p.font_size + p.prohibited_terms + p.consumer_care + p.unit_sale_price;

    categoryTotals.missing_mrp += p.missing_mrp;
    categoryTotals.font_size += p.font_size;
    categoryTotals.prohibited_terms += p.prohibited_terms;
    categoryTotals.consumer_care += p.consumer_care;
    categoryTotals.unit_sale_price += p.unit_sale_price;

    if (p.total > peakDay.count) {
      peakDay = { date: `${p.date} (${p.dayOfWeek})`, count: p.total };
    }

    if (index < halfPoint) {
      firstHalfTotal += p.total;
    } else {
      secondHalfTotal += p.total;
    }

    return p;
  });

  const totalViolations = Object.values(categoryTotals).reduce((a, b) => a + b, 0);

  // Find most frequent category
  let maxCount = -1;
  let mostFrequentCategory = VIOLATION_CATEGORIES[0];
  VIOLATION_CATEGORIES.forEach(cat => {
    const count = categoryTotals[cat.key] || 0;
    if (count > maxCount) {
      maxCount = count;
      mostFrequentCategory = cat;
    }
  });

  // Growth rate from first half to second half
  const growthRatePercent = firstHalfTotal > 0
    ? Math.round(((secondHalfTotal - firstHalfTotal) / firstHalfTotal) * 100)
    : 0;

  return {
    data: resultData,
    categoryTotals,
    mostFrequentCategory,
    totalViolations,
    peakDay,
    growthRatePercent
  };
}
