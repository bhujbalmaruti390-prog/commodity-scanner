import fs from "node:fs";
import path from "node:path";
import { INITIAL_INSPECTIONS } from "../data/metrologyRules";
import { InspectionRecord } from "../types/metrology";

/**
 * ScubaDatabase: High-performance in-memory event & inspection database
 * Inspired by distributed real-time analysis databases (Scuba architecture),
 * featuring sub-millisecond in-memory filtering, time-series slice-and-dice,
 * columnar aggregations, and durable JSON disk persistence.
 */

export interface ScubaAuditEvent {
  id: string;
  timestamp: string;
  eventType: "INSPECTION_CREATED" | "INSPECTION_UPDATED" | "INSPECTION_DELETED" | "NOTICE_ISSUED" | "PROOF_VERIFIED" | "SCAN_PERFORMED";
  recordId: string;
  operatorRole: "inspector" | "user";
  operatorName?: string;
  productName?: string;
  complianceScore?: number;
  status?: string;
  metadata?: Record<string, any>;
}

export interface ScubaAggregationResult {
  totalRecords: number;
  compliantCount: number;
  nonCompliantCount: number;
  reviewCount: number;
  avgComplianceScore: number;
  byCategory: Record<string, number>;
  byStatus: Record<string, number>;
  byAction: Record<string, number>;
  topViolations: Array<{ rule: string; count: number; description: string }>;
}

export interface ScubaQueryParams {
  role?: string;
  status?: string;
  category?: string;
  search?: string;
  minScore?: number;
  maxScore?: number;
  limit?: number;
  offset?: number;
}

class ScubaDB {
  private dataDir: string;
  private inspectorInspectionsFile: string;
  private userInspectionsFile: string;
  private eventsFile: string;
  private inMemoryInspectorInspections: Map<string, any> = new Map();
  private inMemoryUserInspections: Map<string, any> = new Map();
  private inMemoryEvents: ScubaAuditEvent[] = [];
  private isInitialized: boolean = false;
  private lastFlushTime: string = new Date().toISOString();

  constructor() {
    this.dataDir = path.join(process.cwd(), "data");
    this.inspectorInspectionsFile = path.join(this.dataDir, "inspector_inspections.json");
    this.userInspectionsFile = path.join(this.dataDir, "user_inspections.json");
    this.eventsFile = path.join(this.dataDir, "scuba_events.json");
  }

  private ensureDir(): void {
    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true });
    }
  }

  public init(): void {
    if (this.isInitialized) return;
    this.ensureDir();

    // 1. Load Inspector inspections into isolated table
    if (fs.existsSync(this.inspectorInspectionsFile)) {
      try {
        const raw = fs.readFileSync(this.inspectorInspectionsFile, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((rec) => {
            if (rec && rec.id) this.inMemoryInspectorInspections.set(rec.id, rec);
          });
        }
      } catch (err) {
        console.error("[ScubaDB] Error reading inspector_inspections.json:", err);
      }
    } else {
      this.persistInspectorInspections();
    }

    // 2. Load User inspections into isolated table
    if (fs.existsSync(this.userInspectionsFile)) {
      try {
        const raw = fs.readFileSync(this.userInspectionsFile, "utf8");
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          list.forEach((rec) => {
            if (rec && rec.id) this.inMemoryUserInspections.set(rec.id, rec);
          });
        }
      } catch (err) {
        console.error("[ScubaDB] Error reading user_inspections.json:", err);
      }
    } else {
      this.persistUserInspections();
    }

    // 3. Load audit events
    if (fs.existsSync(this.eventsFile)) {
      try {
        const rawEvents = fs.readFileSync(this.eventsFile, "utf8");
        const parsedEvents = JSON.parse(rawEvents);
        if (Array.isArray(parsedEvents)) {
          this.inMemoryEvents = parsedEvents;
        }
      } catch (err) {
        this.inMemoryEvents = [];
      }
    }

    this.isInitialized = true;
    console.log(`[ScubaDB] Isolated databases initialized: ${this.inMemoryInspectorInspections.size} inspector records, ${this.inMemoryUserInspections.size} user records.`);
  }

  private persistInspectorInspections(): void {
    this.ensureDir();
    const arrayData = Array.from(this.inMemoryInspectorInspections.values());
    fs.writeFileSync(this.inspectorInspectionsFile, JSON.stringify(arrayData, null, 2), "utf8");
    this.lastFlushTime = new Date().toISOString();
  }

  private persistUserInspections(): void {
    this.ensureDir();
    const arrayData = Array.from(this.inMemoryUserInspections.values());
    fs.writeFileSync(this.userInspectionsFile, JSON.stringify(arrayData, null, 2), "utf8");
    this.lastFlushTime = new Date().toISOString();
  }

  private persistEvents(): void {
    this.ensureDir();
    fs.writeFileSync(this.eventsFile, JSON.stringify(this.inMemoryEvents, null, 2), "utf8");
  }

  public logEvent(event: Omit<ScubaAuditEvent, "id" | "timestamp">): ScubaAuditEvent {
    const newEvent: ScubaAuditEvent = {
      id: `scuba_evt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      timestamp: new Date().toISOString(),
      ...event,
    };
    this.inMemoryEvents.unshift(newEvent);
    if (this.inMemoryEvents.length > 1000) {
      this.inMemoryEvents = this.inMemoryEvents.slice(0, 1000);
    }
    this.persistEvents();
    return newEvent;
  }

  public getAll(role: string = "inspector"): any[] {
    this.init();
    if (role === "user") {
      return Array.from(this.inMemoryUserInspections.values());
    }
    return Array.from(this.inMemoryInspectorInspections.values());
  }

  public getById(id: string, role?: string): any | null {
    this.init();
    if (role === "user") {
      return this.inMemoryUserInspections.get(id) || null;
    }
    if (role === "inspector") {
      return this.inMemoryInspectorInspections.get(id) || null;
    }
    return this.inMemoryInspectorInspections.get(id) || this.inMemoryUserInspections.get(id) || null;
  }

  public insert(record: any): any {
    this.init();
    const role = record.created_by_role === "user" ? "user" : "inspector";
    if (!record.id) {
      const prefix = role === "user" ? "PROOF-" : "INSP-";
      record.id = prefix + Date.now();
    }
    record.created_by_role = role;

    if (role === "user") {
      this.inMemoryUserInspections.set(record.id, record);
      this.persistUserInspections();
    } else {
      this.inMemoryInspectorInspections.set(record.id, record);
      this.persistInspectorInspections();
    }

    this.logEvent({
      eventType: role === "user" ? "PROOF_VERIFIED" : "INSPECTION_CREATED",
      recordId: record.id,
      operatorRole: role,
      operatorName: record.officer_name || record.created_by_user_name,
      productName: record.product_name,
      complianceScore: record.compliance_score,
      status: record.overall_status,
      metadata: {
        reference: record.inspection_reference_no,
        violationsCount: record.violations_count || record.violations?.length || 0,
      },
    });

    return record;
  }

  public update(id: string, updates: any): any | null {
    this.init();
    // Check user database
    if (this.inMemoryUserInspections.has(id)) {
      const existing = this.inMemoryUserInspections.get(id);
      const merged = { ...existing, ...updates, id, created_by_role: "user" };
      this.inMemoryUserInspections.set(id, merged);
      this.persistUserInspections();
      return merged;
    }

    // Check inspector database
    if (this.inMemoryInspectorInspections.has(id)) {
      const existing = this.inMemoryInspectorInspections.get(id);
      const merged = { ...existing, ...updates, id, created_by_role: "inspector" };
      this.inMemoryInspectorInspections.set(id, merged);
      this.persistInspectorInspections();
      return merged;
    }

    return null;
  }

  public delete(id: string): boolean {
    this.init();
    if (this.inMemoryUserInspections.has(id)) {
      const existing = this.inMemoryUserInspections.get(id);
      this.inMemoryUserInspections.delete(id);
      this.persistUserInspections();
      this.logEvent({
        eventType: "INSPECTION_DELETED",
        recordId: id,
        operatorRole: "user",
        productName: existing?.product_name,
      });
      return true;
    }

    if (this.inMemoryInspectorInspections.has(id)) {
      const existing = this.inMemoryInspectorInspections.get(id);
      this.inMemoryInspectorInspections.delete(id);
      this.persistInspectorInspections();
      this.logEvent({
        eventType: "INSPECTION_DELETED",
        recordId: id,
        operatorRole: "inspector",
        productName: existing?.product_name,
      });
      return true;
    }

    return false;
  }

  public query(params: ScubaQueryParams): { records: any[]; total: number; aggregations: ScubaAggregationResult } {
    this.init();
    const role = params.role || "inspector";
    let list = role === "user"
      ? Array.from(this.inMemoryUserInspections.values())
      : Array.from(this.inMemoryInspectorInspections.values());

    if (params.status && params.status !== "ALL") {
      list = list.filter((item) => item.overall_status === params.status);
    }

    if (params.category && params.category !== "ALL") {
      list = list.filter((item) => item.category === params.category);
    }

    if (params.search) {
      const q = params.search.toLowerCase();
      list = list.filter(
        (item) =>
          item.product_name?.toLowerCase().includes(q) ||
          item.brand_name?.toLowerCase().includes(q) ||
          item.inspection_reference_no?.toLowerCase().includes(q) ||
          item.barcode_or_sku?.toLowerCase().includes(q)
      );
    }

    if (params.minScore !== undefined) {
      list = list.filter((item) => item.compliance_score >= params.minScore!);
    }

    if (params.maxScore !== undefined) {
      list = list.filter((item) => item.compliance_score <= params.maxScore!);
    }

    // Scuba Columnar Aggregations on filtered slice
    const aggregations = this.computeAggregations(list);

    const total = list.length;
    const offset = params.offset || 0;
    const limit = params.limit || total;
    const paginated = list.slice(offset, offset + limit);

    return {
      records: paginated,
      total,
      aggregations,
    };
  }

  public computeAggregations(dataset: any[]): ScubaAggregationResult {
    let compliantCount = 0;
    let nonCompliantCount = 0;
    let reviewCount = 0;
    let scoreSum = 0;
    const byCategory: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const byAction: Record<string, number> = {};
    const violationMap: Record<string, { count: number; description: string }> = {};

    dataset.forEach((item) => {
      if (item.overall_status === "COMPLIANT") compliantCount++;
      else if (item.overall_status === "NON_COMPLIANT") nonCompliantCount++;
      else reviewCount++;

      scoreSum += Number(item.compliance_score) || 0;

      const cat = item.category || "General";
      byCategory[cat] = (byCategory[cat] || 0) + 1;

      const st = item.overall_status || "UNKNOWN";
      byStatus[st] = (byStatus[st] || 0) + 1;

      const act = item.officer_action_recommended || "NO_ACTION";
      byAction[act] = (byAction[act] || 0) + 1;

      if (Array.isArray(item.violations)) {
        item.violations.forEach((v: any) => {
          const ruleKey = v.rule || v.act_section || "General";
          if (!violationMap[ruleKey]) {
            violationMap[ruleKey] = { count: 0, description: v.title || v.description || "" };
          }
          violationMap[ruleKey].count++;
        });
      }
    });

    const topViolations = Object.entries(violationMap)
      .map(([rule, data]) => ({ rule, count: data.count, description: data.description }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalRecords: dataset.length,
      compliantCount,
      nonCompliantCount,
      reviewCount,
      avgComplianceScore: dataset.length > 0 ? Math.round(scoreSum / dataset.length) : 0,
      byCategory,
      byStatus,
      byAction,
      topViolations,
    };
  }

  public getStats(): {
    engine: string;
    version: string;
    totalRecords: number;
    inspectorRecords: number;
    userRecords: number;
    eventsLogged: number;
    lastFlushTime: string;
    status: "healthy" | "degraded";
  } {
    this.init();
    return {
      engine: "Scuba In-Memory Event & Columnar Database (Isolated Multi-Role)",
      version: "3.3.0-scuba",
      totalRecords: this.inMemoryInspectorInspections.size + this.inMemoryUserInspections.size,
      inspectorRecords: this.inMemoryInspectorInspections.size,
      userRecords: this.inMemoryUserInspections.size,
      eventsLogged: this.inMemoryEvents.length,
      lastFlushTime: this.lastFlushTime,
      status: "healthy",
    };
  }
}

export const scubaDb = new ScubaDB();
