import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { InspectionRecord, DeclarationItem } from '../types/metrology';

export type ReportRoleType = 'inspector' | 'user';

/**
 * Draws the statutory validation status badge at the bottom-right corner of the document.
 * - Green Checkmark (Correct Sign) when statutorily compliant / valid
 * - Red Cross (Wrong Sign) when violations are present / invalid
 */
function drawStatutoryValidationStamp(
  doc: jsPDF,
  isValid: boolean,
  violationsCount: number,
  x: number,
  y: number,
  width = 58,
  height = 23
): void {
  if (isValid) {
    // Valid: Soft green container with crisp emerald border
    doc.setFillColor(240, 253, 244);
    doc.setDrawColor(16, 185, 129);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    // Inner subtle border
    doc.setDrawColor(167, 243, 208);
    doc.setLineWidth(0.25);
    doc.roundedRect(x + 0.8, y + 0.8, width - 1.6, height - 1.6, 1.4, 1.4, 'S');

    // Correct Green Circular Badge
    const cx = x + 7.5;
    const cy = y + height / 2;
    doc.setFillColor(16, 185, 129);
    doc.circle(cx, cy, 4.6, 'F');

    // Correct Green Sign: Bold White Checkmark
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.1);
    doc.line(cx - 2.2, cy, cx - 0.7, cy + 1.9);
    doc.line(cx - 0.7, cy + 1.9, cx + 2.5, cy - 1.9);

    // Text Descriptions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(5, 150, 105);
    doc.text('VALID', x + 15, y + 6.5);

    doc.setFontSize(6);
    doc.setTextColor(6, 95, 70);
    doc.text('STATUTORILY COMPLIANT', x + 15, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(71, 85, 105);
    doc.text('Legal Metrology Rules, 2011', x + 15, y + 14.5);

    doc.setFont('helvetica', 'bold');
    doc.setTextColor(5, 150, 105);
    doc.text('✓ Zero Infractions • Approved', x + 15, y + 18.5);
  } else {
    // Invalid: Soft red/rose container with distinct crimson border
    doc.setFillColor(255, 241, 242);
    doc.setDrawColor(225, 29, 72);
    doc.setLineWidth(0.8);
    doc.roundedRect(x, y, width, height, 2, 2, 'FD');

    // Inner subtle border
    doc.setDrawColor(254, 205, 211);
    doc.setLineWidth(0.25);
    doc.roundedRect(x + 0.8, y + 0.8, width - 1.6, height - 1.6, 1.4, 1.4, 'S');

    // Wrong Red Circular Badge
    const cx = x + 7.5;
    const cy = y + height / 2;
    doc.setFillColor(225, 29, 72);
    doc.circle(cx, cy, 4.6, 'F');

    // Wrong Red Sign: Bold White Cross
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1.1);
    doc.line(cx - 2.0, cy - 2.0, cx + 2.0, cy + 2.0);
    doc.line(cx + 2.0, cy - 2.0, cx - 2.0, cy + 2.0);

    // Text Descriptions
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(190, 18, 60);
    doc.text('INVALID', x + 14, y + 6.5);

    doc.setFontSize(5.8);
    doc.setTextColor(159, 18, 57);
    doc.text('STATUTORY INFRACTIONS', x + 14, y + 10.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(5);
    doc.setTextColor(71, 85, 105);
    doc.text(`${violationsCount || 1} Infraction(s) Detected`, x + 14, y + 14.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(4.5);
    doc.setTextColor(190, 18, 60);
    doc.text('✕ Action Req. under Sec 36 LM Act', x + 14, y + 18.5, { maxWidth: width - 15 });
  }
}

/**
 * Generates and downloads a clean, professional, high-resolution PDF report
 * tailored to the active role:
 * - Inspector: Statutory Notice of Violation & Inspection Report (Form LM-PC)
 * - User: Pre-Market Packaging Compliance Certificate & Artwork Audit (Form LM-USER/CERT)
 */
export async function downloadInspectionPDF(
  inspection: InspectionRecord,
  role: ReportRoleType | string = 'inspector'
): Promise<void> {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const isCompliant = inspection.overall_status === 'COMPLIANT';

  // Palette
  const primaryNavy = [15, 23, 42];      // slate-900
  const secondarySlate = [71, 85, 105];  // slate-600
  const goldAccent = [217, 119, 6];      // amber-600
  const roseRed = [225, 29, 72];         // rose-600
  const emeraldGreen = [5, 150, 105];    // emerald-600

  // 1. Top Decorative Bar
  doc.setFillColor(15, 23, 42);
  doc.rect(0, 0, pageWidth, 7, 'F');
  doc.setFillColor(217, 119, 6);
  doc.rect(0, 7, pageWidth, 1.5, 'F');

  // 2. Letterhead Header
  let y = 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('GOVERNMENT OF INDIA', pageWidth / 2, y, { align: 'center' });

  y += 5;
  doc.setFontSize(13);
  doc.setTextColor(15, 23, 42);
  doc.text('MINISTRY OF CONSUMER AFFAIRS, FOOD & PUBLIC DISTRIBUTION', pageWidth / 2, y, { align: 'center' });

  y += 4.5;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text('DIRECTORATE OF LEGAL METROLOGY • ENFORCEMENT & COMPLIANCE WING', pageWidth / 2, y, { align: 'center' });

  y += 4;
  doc.setFontSize(7.5);
  doc.text('Legal Metrology Act, 2009 (Sections 18 & 36) | Legal Metrology (Packaged Commodities) Rules, 2011', pageWidth / 2, y, { align: 'center' });

  // Thin separator
  y += 4;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageWidth - 14, y);

  // 3. Document Title Banner (Role-Specific)
  y += 6;
  let bannerTitle = '';
  let bannerSubtitle = '';
  let bannerColor = primaryNavy;

  if (role === 'user' || role === 'retailer_audit') {
    bannerTitle = 'PRE-MARKET PACKAGING COMPLIANCE & ARTWORK AUDIT CERTIFICATE';
    bannerSubtitle = `Industry Self-Audit under Legal Metrology (Packaged Commodities) Rules, 2011 | Ref: ${inspection.inspection_reference_no}`;
    bannerColor = isCompliant ? emeraldGreen : [180, 83, 9];
  } else {
    bannerTitle = isCompliant
      ? 'STATUTORY PACKAGING COMPLIANCE INSPECTION CERTIFICATE'
      : 'STATUTORY INSPECTION REPORT & NOTICE OF VIOLATION (FORM LM-PC)';
    bannerSubtitle = `Inspection Conducted Pursuant to Statutory Powers Under Section 18 of the Legal Metrology Act, 2009`;
    bannerColor = isCompliant ? emeraldGreen : roseRed;
  }

  doc.setFillColor(bannerColor[0], bannerColor[1], bannerColor[2]);
  doc.roundedRect(14, y, pageWidth - 28, 12, 1.5, 1.5, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(255, 255, 255);
  doc.text(bannerTitle, pageWidth / 2, y + 5.2, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(226, 232, 240);
  doc.text(bannerSubtitle, pageWidth / 2, y + 9.5, { align: 'center' });

  // 4. Metadata Grid Block
  y += 16;
  const metaBoxY = y;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, metaBoxY, pageWidth - 28, 30, 2, 2, 'FD');

  const col1X = 18;
  const col2X = (pageWidth / 2) + 4;
  let metaRowY = metaBoxY + 5.5;

  const printMetaRow = (label1: string, val1: string, label2: string, val2: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    doc.text(label1, col1X, metaRowY);
    doc.text(label2, col2X, metaRowY);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(15, 23, 42);
    doc.text(val1, col1X + 38, metaRowY);
    doc.text(val2, col2X + 38, metaRowY);
    metaRowY += 5.5;
  };

  printMetaRow(
    'Reference No:', inspection.inspection_reference_no,
    'Date & Time:', new Date(inspection.timestamp).toLocaleString()
  );
  printMetaRow(
    'Product / SKU:', inspection.product_name.substring(0, 32),
    'Brand / Trademark:', inspection.brand_name || 'Generic / Unbranded'
  );
  printMetaRow(
    'Commodity Category:', inspection.category,
    'Manufacturer/Packer:', inspection.manufacturer_name.substring(0, 32)
  );
  printMetaRow(
    'Premises of Audit:', (inspection.retailer_premise || 'Retail Outlet').substring(0, 32),
    'Officer / Auditor:', `${inspection.officer_name} (${inspection.officer_badge})`
  );
  printMetaRow(
    'Compliance Score:', `${inspection.compliance_score} / 100 (${inspection.overall_status})`,
    'Action Status:', inspection.officer_action_recommended
  );

  y = metaBoxY + 33;

  // 5. Section 1: Mandatory Declarations Table (Rule 6)
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('1. VERIFICATION OF STATUTORY DECLARATIONS (RULE 6 OF LM-PC RULES, 2011)', 14, y);

  y += 2;
  const declarationRows = (Object.values(inspection.declarations) as DeclarationItem[]).map((d) => [
    d.rule_reference,
    d.name,
    d.detected_text || 'NOT DETECTED ON PACKAGE',
    d.status === 'PRESENT_AND_COMPLIANT' ? 'COMPLIANT' : d.status === 'DEFECTIVE' ? 'DEFECTIVE' : 'MISSING',
    d.remarks || 'Standard inscription verification'
  ]);

  // Safe autoTable runner helper that guarantees a valid final Y position
  const safeRunAutoTable = (options: any, defaultAddedHeight: number = 40): number => {
    try {
      const runner = typeof autoTable === 'function' ? autoTable : (autoTable as any)?.default;
      if (typeof runner === 'function') {
        runner(doc, options);
      } else if (typeof (doc as any).autoTable === 'function') {
        (doc as any).autoTable(options);
      }
    } catch (tblErr) {
      console.warn('AutoTable rendering warning:', tblErr);
    }
    const finalY = (doc as any).lastAutoTable?.finalY;
    if (typeof finalY === 'number' && !isNaN(finalY)) {
      return finalY + 6;
    }
    return (options.startY || y) + defaultAddedHeight;
  };

  y = safeRunAutoTable({
    startY: y,
    margin: { left: 14, right: 14 },
    head: [['Statutory Rule', 'Mandatory Declaration', 'Detected Inscription', 'Compliance', 'Remarks']],
    body: declarationRows,
    theme: 'grid',
    headStyles: {
      fillColor: [30, 41, 59],
      textColor: [255, 255, 255],
      fontSize: 7.5,
      fontStyle: 'bold',
      halign: 'left'
    },
    styles: {
      fontSize: 7,
      cellPadding: 2,
      textColor: [30, 41, 59]
    },
    columnStyles: {
      0: { cellWidth: 26, fontStyle: 'bold' },
      1: { cellWidth: 36, fontStyle: 'bold' },
      2: { cellWidth: 46 },
      3: { cellWidth: 24, fontStyle: 'bold' },
      4: { cellWidth: 'auto' }
    },
    didParseCell: (data: any) => {
      if (data.section === 'body' && data.column.index === 3) {
        if (data.cell.raw === 'COMPLIANT') {
          data.cell.styles.textColor = [5, 150, 105];
        } else {
          data.cell.styles.textColor = [225, 29, 72];
        }
      }
    }
  }, declarationRows.length * 7 + 15);

  // 6. Section 2: Rule 7 Typography, Font Height & Prohibited Words Analysis
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text('2. PRINCIPAL DISPLAY PANEL (PDP) & TYPOGRAPHIC STANDARDS (RULE 7 & RULE 13)', 14, y);

  y += 3;
  const typoBoxY = y;
  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(226, 232, 240);
  doc.roundedRect(14, typoBoxY, pageWidth - 28, 18, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);

  const fontStatus = inspection.font_analysis?.font_status === 'compliant' ? 'COMPLIANT' : 'NON-COMPLIANT';
  const prohibitedText = inspection.prohibited_practices?.has_prohibited_terms
    ? `DETECTED: ${inspection.prohibited_practices.detected_prohibited_terms.join(', ')}`
    : 'NONE DETECTED (Rule 13 Compliant)';
  const dualMrpText = inspection.prohibited_practices?.has_dual_mrp
    ? 'TAMPERING / DUAL MRP DETECTED (Sec 36(2) Offence)'
    : 'Single Authentic Manufacturer Price Verified';

  doc.text(`• Measured Minimum Font Height: ${inspection.font_analysis?.estimated_min_height_mm || 0} mm (Statutory Min: ${inspection.font_analysis?.required_min_height_mm || 2.0} mm) - Status: ${fontStatus}`, 18, typoBoxY + 5);
  doc.text(`• Prohibited Qualifying Adjectives (Rule 13): ${prohibitedText}`, 18, typoBoxY + 9.5);
  doc.text(`• Dual MRP & Tax Statement Integrity (Sec 36): ${dualMrpText}`, 18, typoBoxY + 14);

  y = typoBoxY + 22;

  // 7. Section 3: Statutory Violations (if any) or Clearance Note
  if (inspection.violations && inspection.violations.length > 0) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(225, 29, 72);
    doc.text(`3. SPECIFIC STATUTORY INFRACTIONS FLAGGED (${inspection.violations.length} CHARGES RECORDED)`, 14, y);

    y += 2;
    const violationRows = inspection.violations.map((v, i) => [
      `${i + 1}. [${v.severity}] ${v.rule}\n${v.act_section}`,
      `${v.title}\n\n${v.description}`,
      v.remedial_action,
      v.statutory_penalty_summary
    ]);

    y = safeRunAutoTable({
      startY: y,
      margin: { left: 14, right: 14 },
      head: [['Charge & Section', 'Nature of Infraction', 'Required Remedial Action', 'Statutory Penalty / Exposure']],
      body: violationRows,
      theme: 'grid',
      headStyles: {
        fillColor: [190, 18, 60],
        textColor: [255, 255, 255],
        fontSize: 7.5,
        fontStyle: 'bold'
      },
      styles: {
        fontSize: 7,
        cellPadding: 2.5,
        textColor: [15, 23, 42]
      },
      columnStyles: {
        0: { cellWidth: 36, fontStyle: 'bold' },
        1: { cellWidth: 62 },
        2: { cellWidth: 46 },
        3: { cellWidth: 'auto', fontStyle: 'bold', textColor: [190, 18, 60] }
      }
    }, violationRows.length * 10 + 15);
  } else {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(5, 150, 105);
    doc.text('3. STATUTORY CLEARANCE CERTIFICATE', 14, y);

    y += 3;
    doc.setFillColor(236, 253, 245);
    doc.setDrawColor(167, 243, 208);
    doc.roundedRect(14, y, pageWidth - 28, 12, 1.5, 1.5, 'FD');

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(6, 95, 70);
    doc.text(
      'The inspected packaged commodity has been verified against all mandatory statutory requirements under Rule 6, Rule 7, Rule 12 and Rule 13 of the Legal Metrology (Packaged Commodities) Rules, 2011. Zero non-compliances were identified. Certified suitable for retail commerce.',
      18,
      y + 5,
      { maxWidth: pageWidth - 36 }
    );
    y += 17;
  }

  // 8. Dedicated Full-Width Executive Sign-off Block & Bottom-Right Statutory Validation Stamp
  // Required vertical clearance: ~62mm for the entire section
  const signatureBlockHeight = 62;
  const bottomFooterClearance = 18; // mm above bottom of page

  // If there is not enough room at the bottom of the page, move the ENTIRE signature section to the next page
  if (y + signatureBlockHeight > pageHeight - bottomFooterClearance) {
    doc.addPage();
    y = 22; // Clean top margin on fresh page
  } else {
    // Generous vertical spacing before signature block
    y += 5;
  }

  // Top divider line across full page width
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.4);
  doc.line(14, y, pageWidth - 14, y);
  y += 5.5;

  // Role-specific text configuration
  const isUserRole = role === 'user' || role === 'retailer_audit';
  const headingLine1 = isUserRole
    ? 'INDUSTRY PRE-MARKET AUDIT SIGN-OFF & CERTIFICATION'
    : 'ENFORCEMENT OFFICER SIGN-OFF & PANCHNAMA WITNESS';
  const headingLine2 = isUserRole
    ? 'CORPORATE PACKAGING QA SIGNATURE'
    : 'INSPECTING OFFICER SIGNATURE';

  const officerLine1 = isUserRole
    ? 'Auditor Name: Certified Packaging QA Lead'
    : `Officer Name: ${inspection.officer_name}`;
  const officerLine2 = isUserRole
    ? 'Official Division: Packaging Compliance Division'
    : `Official Badge No: ${inspection.officer_badge}`;
  const officerLine3 = isUserRole
    ? 'Audit Status: Transmitted to Legal & Regulatory Affairs'
    : `Action Recommended: ${inspection.officer_action_recommended.replace(/_/g, ' ')}`;

  const signatoryName = isUserRole
    ? 'Certified QA Lead Auditor'
    : inspection.officer_name;
  const signatoryTitle = isUserRole
    ? 'Packaging Compliance Division'
    : 'Inspector of Legal Metrology';
  const signatoryOrg = isUserRole
    ? 'Corporate Regulatory Affairs'
    : 'Directorate of Legal Metrology';

  // 1. Dedicated Full-Width Heading wrapped into exactly TWO lines
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42); // slate-900
  doc.text(headingLine1, 14, y);
  y += 4.5;
  doc.text(headingLine2, 14, y);
  y += 6.5;

  // 2. Officer Details below heading
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85); // slate-700
  doc.text(officerLine1, 14, y);
  y += 4.2;
  doc.text(officerLine2, 14, y);
  y += 4.2;
  doc.text(officerLine3, 14, y);
  y += 6.5;

  // 3. Dedicated Signature Area below details (Left) & Statutory Validation Stamp (Right)
  const ySigArea = y;

  // Signature line
  doc.setDrawColor(148, 163, 184); // slate-400
  doc.setLineWidth(0.4);
  doc.line(14, ySigArea + 2, 85, ySigArea + 2);

  // Signatory details below signature line
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(15, 23, 42);
  doc.text(signatoryName, 14, ySigArea + 6.5);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(71, 85, 105);
  doc.text(signatoryTitle, 14, ySigArea + 10.5);
  doc.text(signatoryOrg, 14, ySigArea + 14.5);

  // Official Authority Seal / Attestation Box (in center column)
  const sealX = 92;
  const sealWidth = 38;
  const sealHeight = 22;
  doc.setDrawColor(203, 213, 225);
  doc.setLineWidth(0.3);
  doc.setLineDashPattern([1.5, 1.5], 0);
  doc.roundedRect(sealX, ySigArea - 2, sealWidth, sealHeight, 1.5, 1.5);
  doc.setLineDashPattern([], 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(6);
  doc.setTextColor(100, 116, 139);
  doc.text('OFFICIAL SEAL & STAMP', sealX + sealWidth / 2, ySigArea + 3.5, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(5.5);
  doc.setTextColor(148, 163, 184);
  doc.text(isUserRole ? 'CORPORATE QA CELL' : 'LEGAL METROLOGY ACT, 2009', sealX + sealWidth / 2, ySigArea + 8.5, { align: 'center' });
  doc.text(isUserRole ? 'PRE-PRINT VERIFICATION' : 'DIRECTORATE ATTESTATION', sealX + sealWidth / 2, ySigArea + 12.5, { align: 'center' });
  doc.text(`DATE: ${new Date().toISOString().split('T')[0]}`, sealX + sealWidth / 2, ySigArea + 16.5, { align: 'center' });

  // Draw Bottom-Right Statutory Validation Stamp (Right column)
  const stampWidth = 62;
  const stampHeight = 22;
  const stampX = pageWidth - 14 - stampWidth;
  const stampY = ySigArea - 2;

  const isInspectionValid = (inspection.overall_status === 'COMPLIANT' || (inspection.violations || []).length === 0);
  drawStatutoryValidationStamp(
    doc,
    isInspectionValid,
    (inspection.violations || []).length,
    stampX,
    stampY,
    stampWidth,
    stampHeight
  );

  y = ySigArea + 24;

  // 9. Document Footer (strictly separated from content on every page)
  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    // Footer horizontal divider line
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.3);
    doc.line(14, pageHeight - 11, pageWidth - 14, pageHeight - 11);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(148, 163, 184);
    doc.text(
      `Legal Metrology Automated Enforcement System • Ref: ${inspection.inspection_reference_no} • Page ${p} of ${totalPages}`,
      14,
      pageHeight - 6
    );
    doc.text(
      `Generated: ${new Date().toISOString().split('T')[0]} • Valid for official proceedings under LM Act 2009`,
      pageWidth - 14,
      pageHeight - 6,
      { align: 'right' }
    );
  }

  // Trigger download with rock-solid fallback for sandboxed iframes
  const safeFilename = `${inspection.inspection_reference_no.replace(/[^a-zA-Z0-9_-]/g, '_')}_${role}_Report.pdf`;

  try {
    const pdfBlob = doc.output('blob');
    const blobUrl = URL.createObjectURL(pdfBlob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = safeFilename;
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }, 2000);
  } catch (blobErr) {
    console.warn('Blob URL download failed, falling back to direct doc.save:', blobErr);
    doc.save(safeFilename);
  }
}
