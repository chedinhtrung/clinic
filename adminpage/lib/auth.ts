import { createHmac, timingSafeEqual } from "crypto";

export const AUTH_COOKIE_NAME = "clinic_admin_session";
const SESSION_VERSION = "v1";
const SESSION_DURATION_SECONDS = 60 * 60 * 24 * 14;

function requireEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`${name} environment variable is not set.`);
  }

  return value;
}

function getSessionSecret(): string {
  return requireEnv("ADMIN_SESSION_SECRET");
}

export function getAdminCredentials() {
  return {
    username: requireEnv("ADMIN_USERNAME"),
    password: requireEnv("ADMIN_PASSWORD"),
  };
}

function signSessionPayload(payload: string): string {
  return createHmac("sha256", getSessionSecret()).update(payload).digest("hex");
}

export function createSessionToken(): string {
  const expiresAt = Date.now() + SESSION_DURATION_SECONDS * 1000;
  const payload = `${SESSION_VERSION}.${expiresAt}`;
  const signature = signSessionPayload(payload);

  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  const parsed = parseSessionToken(token);

  if (!parsed) {
    return false;
  }

  const { version, expiresAtRaw, signature } = parsed;
  const payload = `${version}.${expiresAtRaw}`;
  const expectedSignature = signSessionPayload(payload);
  const provided = Buffer.from(signature, "hex");
  const expected = Buffer.from(expectedSignature, "hex");

  if (provided.length !== expected.length) {
    return false;
  }

  return timingSafeEqual(provided, expected);
}

export function getSessionMaxAge(): number {
  return SESSION_DURATION_SECONDS;
}

function parseSessionToken(token: string) {
  const [version, expiresAtRaw, signature] = token.split(".");

  if (!version || !expiresAtRaw || !signature || version !== SESSION_VERSION) {
    return null;
  }

  const expiresAt = Number(expiresAtRaw);

  if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    return null;
  }

  return { version, expiresAtRaw, signature };
}

export function hasLiveSessionToken(token: string | undefined): boolean {
  if (!token) {
    return false;
  }

  return parseSessionToken(token) !== null;
}
