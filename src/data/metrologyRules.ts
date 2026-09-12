import { InspectionRecord } from '../types/metrology';

export interface StatutoryRuleDefinition {
  rule_id: string;
  rule_name: string;
  act_section: string;
  description: string;
  mandatory_for: string;
  statutory_penalty: string;
  standard_format_example: string;
}

export const LEGAL_METROLOGY_RULES: StatutoryRuleDefinition[] = [
  {
    rule_id: 'Rule 6(1)(a) & (b)',
    rule_name: 'Name & Address of Manufacturer / Packer / Importer',
    act_section: 'Section 18 & Section 36(1) of LM Act, 2009',
    description: 'Every package shall bear the name and complete postal address of the manufacturer or the packer or importer, including pin code.',
    mandatory_for: 'All Packaged Commodities',
    statutory_penalty: 'Fine up to ₹25,000 for first offence, ₹50,000 for second offence, and up to ₹1,00,000 or imprisonment for subsequent offences.',
    standard_format_example: 'Mfg & Pkd by: Sunrise Agro Foods Pvt Ltd, Plot 42, Sector 8, IMT Manesar, Gurugram, Haryana - 122050'
  },
  {
    rule_id: 'Rule 6(1)(c)',
    rule_name: 'Generic or Common Name of Commodity',
    act_section: 'Section 18 of LM Act, 2009',
    description: 'The common or generic name of the commodity contained in the package must be clearly stated.',
    mandatory_for: 'All Packaged Commodities',
    statutory_penalty: 'Notice of violation, compounding fine under Section 48 or prosecution under Section 36.',
    standard_format_example: 'Roasted & Salted Almonds / Detergent Powder / Whole Wheat Flour'
  },
  {
    rule_id: 'Rule 6(1)(d) & Rule 12',
    rule_name: 'Net Quantity in Standard SI Units',
    act_section: 'Section 18 & Section 36 of LM Act, 2009',
    description: 'Net quantity must be declared in standard SI units (g, kg, ml, l, m, or N/count). Non-standard units (gms, kgs, ltr, lbs, oz) are strictly prohibited.',
    mandatory_for: 'All Packaged Commodities',
    statutory_penalty: 'Penalty up to ₹25,000 under Section 36(1); seizure of non-compliant stock.',
    standard_format_example: 'Net Quantity: 500 g (or 1 kg, 750 ml, 10 N)'
  },
  {
    rule_id: 'Rule 6(1)(e)',
    rule_name: 'Month and Year of Manufacture / Packing / Import',
    act_section: 'Section 18 of LM Act, 2009',
    description: 'Mandatory declaration of Month and Year in which the product was manufactured, pre-packed, or imported (e.g. MM/YYYY or Month YYYY).',
    mandatory_for: 'All Packaged Commodities',
    statutory_penalty: 'Notice for violation of packaging rules and statutory fine.',
    standard_format_example: 'Mfg. Date: 04/2024 or Pkd. On: April 2024'
  },
  {
    rule_id: 'Rule 6(1)(f)',
    rule_name: 'Maximum Retail Price (MRP) with "Incl. of all taxes"',
    act_section: 'Section 18 & Section 36(2) of LM Act, 2009',
    description: 'MRP must be stated as Maximum or Max. Retail Price ₹/Rs. xx.xx (incl. of all taxes). Stickers pasting higher MRP or charging above MRP is a cognizable offence.',
    mandatory_for: 'All Packaged Commodities',
    statutory_penalty: 'Fine from ₹2,000 to ₹50,000; compounding or criminal prosecution under Section 36(2).',
    standard_format_example: 'MRP ₹ 149.00 (inclusive of all taxes)'
  },
  {
    rule_id: 'Rule 6(11) (2021 Amendment)',
    rule_name: 'Unit Sale Price (USP)',
    act_section: 'Section 18 of LM Act, 2009',
    description: 'Declaration of Unit Sale Price in terms of Rupees per g/kg or per ml/litre for commodities packed above 1 kg or 1 litre.',
    mandatory_for: 'Commodities > 1kg / 1L (or per item/number)',
    statutory_penalty: 'Notice of non-compliance and fine under Section 36.',
    standard_format_example: 'Unit Sale Price: ₹ 0.35 / g (or ₹ 350.00 / kg)'
  },
  {
    rule_id: 'Rule 6(1)(da)',
    rule_name: 'Consumer Care Helpline, Email & Contact Address',
    act_section: 'Section 18 of LM Act, 2009',
    description: 'Name, address, telephone number, and email of the grievance officer/office for consumer complaints must be prominently printed.',
    mandatory_for: 'All Packaged Commodities',
    statutory_penalty: 'Violation notice and penalty under Rule 32 / Section 36.',
    standard_format_example: 'Consumer Care: Toll-Free 1800-111-2222, Email: care@sunrisefoods.in'
  },
  {
    rule_id: 'Rule 6(10)',
    rule_name: 'Country of Origin',
    act_section: 'Section 18 of LM Act, 2009 & Rule 6(10)',
    description: 'Declaration of the country where the commodity was produced or manufactured.',
    mandatory_for: 'All Packaged Commodities (Mandatory for Imports & E-Commerce)',
    statutory_penalty: 'Fine and mandatory recall of unlabeled import packages.',
    standard_format_example: 'Country of Origin: India (or Made in India)'
  },
  {
    rule_id: 'Rule 7 & Schedule II',
    rule_name: 'Minimum Font Height & Readability on Principal Display Panel',
    act_section: 'Rule 7 & 9 of LM(PC) Rules, 2011',
    description: 'Declarations must satisfy minimum font height standards (1.0 mm to 6.0 mm depending on Net Quantity/PDP area) and maintain sharp contrast.',
    mandatory_for: 'All Packages',
    statutory_penalty: 'Summary notice for illegible labeling.',
    standard_format_example: 'Min height: 2.0 mm (for 50g-200g), 4.0 mm (200g-1kg)'
  },
  {
    rule_id: 'Rule 13',
    rule_name: 'Prohibition of Qualifying or Misleading Words',
    act_section: 'Rule 13 & Section 36 of LM Act, 2009',
    description: 'No package shall contain qualifying words like "approx", "giant", "jumbo", "not less than", "when packed", or "full".',
    mandatory_for: 'All Packages',
    statutory_penalty: 'Strict liability penalty up to ₹25,000.',
    standard_format_example: 'Direct declaration only: "Net Qty: 500 g" (NEVER "approx 500 gms")'
  }
];

export const INSPECTOR_INITIAL_INSPECTIONS: InspectionRecord[] = [];

export const USER_INITIAL_INSPECTIONS: InspectionRecord[] = [];

export const INITIAL_INSPECTIONS: InspectionRecord[] = [];

export const DEMO_PRESET_SCANS = [
  {
    id: 'preset-compliant-biscuit',
    title: 'Compliant Butter Biscuits (300 g)',
    subtitle: 'Fully compliant pack meeting all Legal Metrology 2011 criteria',
    category: 'Food & Bakery',
    thumbnail: 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?auto=format&fit=crop&w=500&q=80',
    raw_text: `NutriBake Butter Delite
Generic Name: Butter Biscuits
Net Quantity: 300 g
Manufactured & Packed by: NutriBake Foods India Pvt Ltd, Plot 19, KIADB Industrial Area, Doddaballapura, Bengaluru, Karnataka - 561203
Month & Year of Mfg: 08/2026
MRP: ₹ 60.00 (inclusive of all taxes)
Unit Sale Price: ₹ 0.20 / g
Consumer Care Cell:
Manager - Consumer Care, NutriBake Foods,
Toll-Free: 1800-425-9090, Email: feedback@nutribake.co.in
Country of Origin: India`,
    expected_status: 'COMPLIANT'
  },
  {
    id: 'preset-detergent-violations',
    title: 'Violation Pack: Laundry Detergent (approx 500 gms)',
    subtitle: 'Violations: Prohibited "approx 500 gms", missing consumer care phone & email, omitted tax clause',
    category: 'Household & Cleaning',
    thumbnail: 'https://images.unsplash.com/photo-1610557892470-55d9e80c0bce?auto=format&fit=crop&w=500&q=80',
    raw_text: `UltraWash Super Clean
Commodity: Detergent Powder
Net Wt: approx 500 gms
Mfg Date: 05/2026
Mfg by: Ultra Care Chemicals, Plot 8, GIDC, Vapi
MRP: Rs. 95/-
Made in India`,
    expected_status: 'NON_COMPLIANT'
  },
  {
    id: 'preset-dual-mrp-snack',
    title: 'Violation Pack: Potato Wafers (Dual MRP Sticker)',
    subtitle: 'Violations: Tampered MRP sticker (₹45 sticker over printed ₹30), Section 36(2) offence',
    category: 'Packaged Snacks',
    thumbnail: 'https://images.unsplash.com/photo-1566478989037-eec170784d0b?auto=format&fit=crop&w=500&q=80',
    raw_text: `Crispy Crunchy Potato Wafers
Common Name: Salted Potato Chips
Net Qty: 80 g
Pkd On: 07/2026
Printed MRP: ₹ 30.00 (incl. of all taxes)
[STICKER OVERLAY]: ₹ 45.00
Mfg: Crisp Foods Ltd, Surat - 395007
Customer Care: 1800-333-4444
Country of Origin: India`,
    expected_status: 'NON_COMPLIANT'
  },
  {
    id: 'preset-imported-cream',
    title: 'Violation Pack: Imported Facial Cream',
    subtitle: 'Violations: Missing Country of Origin, incomplete importer address, font size < 1mm',
    category: 'Cosmetics',
    thumbnail: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=500&q=80',
    raw_text: `Lumière Glow Radiance Cream
Net Vol: 50 ml
Imported by: Luxe Trading, Mumbai
Price: Rs. 499 (taxes extra)
Batch: LX-99`,
    expected_status: 'NON_COMPLIANT'
  },
  {
    id: 'preset-invalid-car',
    title: 'Test Invalid: Red Sedan Car (Non-Commodity)',
    subtitle: 'Demonstration: Strict validation detects car and triggers "Invalid Input" popup',
    category: 'Validation Test (Invalid Input)',
    thumbnail: 'https://images.unsplash.com/photo-1503376780353-7e6692767b70?auto=format&fit=crop&w=500&q=80',
    raw_text: `Red sports car automobile parked outside. Non-packaged object.`,
    expected_status: 'INVALID_INPUT'
  },
  {
    id: 'preset-invalid-person',
    title: 'Test Invalid: Human Portrait / Person',
    subtitle: 'Demonstration: Strict validation detects human and triggers "Invalid Input" popup',
    category: 'Validation Test (Invalid Input)',
    thumbnail: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=500&q=80',
    raw_text: `Portrait photograph of a smiling person. Non-packaged object.`,
    expected_status: 'INVALID_INPUT'
  },
  {
    id: 'preset-invalid-tree',
    title: 'Test Invalid: Outdoor Tree & Forest',
    subtitle: 'Demonstration: Strict validation detects tree/nature and triggers "Invalid Input" popup',
    category: 'Validation Test (Invalid Input)',
    thumbnail: 'https://images.unsplash.com/photo-1502082553048-f009c37129b9?auto=format&fit=crop&w=500&q=80',
    raw_text: `Outdoor landscape showing large oak tree in a forest. Non-packaged object.`,
    expected_status: 'INVALID_INPUT'
  },
  {
    id: 'preset-low-quality-blurry',
    title: 'Test Quality: Blurry Unreadable Package Label',
    subtitle: 'Demonstration: Detects packaging but label is unreadable, triggering "Image Quality Too Low"',
    category: 'Validation Test (Low Quality)',
    thumbnail: 'https://images.unsplash.com/photo-1584824486509-112e4181ff6b?auto=format&fit=crop&w=500&q=80',
    raw_text: `Blurry out-of-focus unreadable package label text.`,
    expected_status: 'LOW_QUALITY'
  },
  {
    id: 'preset-valid-sugar',
    title: 'Madhur Pure & Hygienic Sugar 1 kg',
    subtitle: 'Valid Commodity: Crystal white refined sugar with standard statutory markings',
    category: 'Grocery & Staples',
    thumbnail: 'https://images.unsplash.com/photo-1581441363689-1f3c3c414635?auto=format&fit=crop&w=500&q=80',
    raw_text: `Madhur Pure & Hygienic Sugar
Net Quantity: 1 kg
Unit Sale Price: ₹ 48.00 per kg
MRP: ₹ 48.00 (inclusive of all taxes)
Packed On: 08/2026
Best Before: 24 months from packaging
Customer Care: 1800-222-784 care@madhursugar.com
Country of Origin: India
Packed by: Shree Renuka Sugars Ltd, Munoli, Tal. Saundatti, Dist. Belagavi, Karnataka - 591117`,
    expected_status: 'COMPLIANT'
  }
];
