import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { INITIAL_INSPECTIONS } from "../data/metrologyRules";

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  role: "inspector" | "user";
  badgeOrOrg: string;
  passwordHash: string;
  salt: string;
  createdAt: string;
  lastLoginAt?: string;
}

export interface SanitizedUser {
  id: string;
  name: string;
  email: string;
  role: "inspector" | "user";
  badgeOrOrg: string;
  loggedInAt: string;
  createdAt?: string;
}

const DATA_DIR = path.join(process.cwd(), "data");
const USERS_FILE = path.join(DATA_DIR, "users.json");
const INSPECTIONS_FILE = path.join(DATA_DIR, "inspections.json");

function ensureDataDir(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString("hex");
}

function sanitizeUser(user: StoredUser): SanitizedUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    badgeOrOrg: user.badgeOrOrg,
    loggedInAt: new Date().toISOString(),
    createdAt: user.createdAt,
  };
}

export function initDatabase(): void {
  ensureDataDir();

  // Initialize Users DB with defaults if missing
  if (!fs.existsSync(USERS_FILE)) {
    const defaultUsers: StoredUser[] = [];

    // Seed 1: Official Inspector
    const inspectorSalt = crypto.randomBytes(16).toString("hex");
    defaultUsers.push({
      id: "usr_inspector_seed",
      name: "Insp. Rajesh Sharma",
      email: "inspector@legalmetrology.gov.in",
      role: "inspector",
      badgeOrOrg: "Dept. of Consumer Affairs (Badge #LM-DL-409)",
      salt: inspectorSalt,
      passwordHash: hashPassword("Password@123", inspectorSalt),
      createdAt: new Date().toISOString(),
    });

    // Seed 2: Industry / Commercial User
    const userSalt = crypto.randomBytes(16).toString("hex");
    defaultUsers.push({
      id: "usr_user_seed",
      name: "Priya Verma",
      email: "user@packagingcompliance.com",
      role: "user",
      badgeOrOrg: "FMCG Packaging Quality & Compliance Division",
      salt: userSalt,
      passwordHash: hashPassword("Password@123", userSalt),
      createdAt: new Date().toISOString(),
    });

    fs.writeFileSync(USERS_FILE, JSON.stringify(defaultUsers, null, 2), "utf8");
    console.log("[DB] Users database initialized at", USERS_FILE);
  }

  // Initialize Inspections DB as empty array if missing
  if (!fs.existsSync(INSPECTIONS_FILE)) {
    fs.writeFileSync(INSPECTIONS_FILE, "[]\n", "utf8");
    console.log("[DB] Clean Inspections database initialized at", INSPECTIONS_FILE);
  }
}

export function getAllUsers(): StoredUser[] {
  ensureDataDir();
  if (!fs.existsSync(USERS_FILE)) {
    return [];
  }
  try {
    const raw = fs.readFileSync(USERS_FILE, "utf8");
    return JSON.parse(raw) as StoredUser[];
  } catch (err) {
    console.error("[DB] Error reading users.json:", err);
    return [];
  }
}

function saveAllUsers(users: StoredUser[]): void {
  ensureDataDir();
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf8");
}

export function registerUser(params: {
  name: string;
  email: string;
  role: "inspector" | "user";
  badgeOrOrg?: string;
  password: string;
}): SanitizedUser {
  const emailClean = params.email.trim().toLowerCase();
  const nameClean = params.name.trim();
  const role = params.role === "inspector" ? "inspector" : "user";
  const badgeOrOrg =
    params.badgeOrOrg?.trim() ||
    (role === "inspector"
      ? "Dept. of Consumer Affairs • Legal Metrology"
      : "Commercial Packaging & Compliance");

  if (!emailClean || !nameClean || !params.password) {
    throw new Error("Full name, valid email, and password are required.");
  }

  if (params.password.length < 6) {
    throw new Error("Password must be at least 6 characters long.");
  }

  const users = getAllUsers();
  const existing = users.find((u) => u.email.toLowerCase() === emailClean);
  if (existing) {
    throw new Error(`An account with email '${emailClean}' already exists. Please sign in.`);
  }

  const salt = crypto.randomBytes(16).toString("hex");
  const passwordHash = hashPassword(params.password, salt);

  const newUser: StoredUser = {
    id: `usr_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    name: nameClean,
    email: emailClean,
    role,
    badgeOrOrg,
    salt,
    passwordHash,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  users.push(newUser);
  saveAllUsers(users);

  return sanitizeUser(newUser);
}

export function loginUser(email: string, password: string): SanitizedUser {
  const emailClean = email.trim().toLowerCase();
  if (!emailClean || !password) {
    throw new Error("Email and password are required.");
  }

  const users = getAllUsers();
  const user = users.find((u) => u.email.toLowerCase() === emailClean);

  if (!user) {
    throw new Error("Account not found with this email. Please check your credentials or register.");
  }

  const inputHash = hashPassword(password, user.salt);
  const isMatch = crypto.timingSafeEqual(
    Buffer.from(inputHash, "hex"),
    Buffer.from(user.passwordHash, "hex")
  );

  if (!isMatch) {
    throw new Error("Incorrect password entered. Please try again.");
  }

  // Update last login
  user.lastLoginAt = new Date().toISOString();
  saveAllUsers(users);

  return sanitizeUser(user);
}

import { scubaDb } from "./scubaDatabase";

export function getInspections(role?: string): any[] {
  return scubaDb.getAll(role);
}

export function saveInspections(inspections: any[]): void {
  inspections.forEach((item) => {
    scubaDb.insert(item);
  });
}

export { scubaDb };
