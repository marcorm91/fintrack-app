import {
  clearOfflinePinRecord,
  getOfflinePinRecord,
  setOfflinePinRecord
} from '../db';

const PIN_PATTERN = /^\d{6}$/;
const PIN_RECORD_VERSION = 1;
const PBKDF2_ITERATIONS = 600_000;
const SALT_BYTES = 16;
const DERIVED_BITS = 256;
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MILLISECONDS = 30_000;

type OfflinePinRecord = {
  version: number;
  salt: string;
  hash: string;
  iterations: number;
  failedAttempts: number;
  lockedUntil: number;
};

export type OfflinePinVerification =
  | { status: 'success' }
  | { status: 'invalid'; remainingAttempts: number }
  | { status: 'locked'; retryAfterSeconds: number }
  | { status: 'not-configured' };

export class OfflinePinFormatError extends Error {
  constructor() {
    super('El PIN debe contener exactamente 6 dígitos.');
    this.name = 'OfflinePinFormatError';
  }
}

function bytesToBase64(bytes: Uint8Array) {
  let binary = '';
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }
  return btoa(binary);
}

function base64ToBytes(value: string) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

function parseOfflinePinRecord(value: string | null): OfflinePinRecord | null {
  if (!value) {
    return null;
  }
  try {
    const record = JSON.parse(value) as Partial<OfflinePinRecord>;
    if (
      record.version !== PIN_RECORD_VERSION ||
      typeof record.salt !== 'string' ||
      typeof record.hash !== 'string' ||
      !Number.isSafeInteger(record.iterations) ||
      (record.iterations ?? 0) < PBKDF2_ITERATIONS ||
      !Number.isSafeInteger(record.failedAttempts) ||
      (record.failedAttempts ?? -1) < 0 ||
      !Number.isFinite(record.lockedUntil) ||
      (record.lockedUntil ?? -1) < 0
    ) {
      return null;
    }
    const salt = base64ToBytes(record.salt);
    const hash = base64ToBytes(record.hash);
    if (salt.length < SALT_BYTES || hash.length !== DERIVED_BITS / 8) {
      return null;
    }
    return record as OfflinePinRecord;
  } catch {
    return null;
  }
}

async function derivePin(pin: string, salt: Uint8Array, iterations: number) {
  const saltBuffer = new Uint8Array(salt.length);
  saltBuffer.set(salt);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(pin),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const bits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBuffer.buffer,
      iterations,
      hash: 'SHA-256'
    },
    keyMaterial,
    DERIVED_BITS
  );
  return new Uint8Array(bits);
}

function hashesMatch(left: Uint8Array, right: Uint8Array) {
  if (left.length !== right.length) {
    return false;
  }
  let difference = 0;
  for (let index = 0; index < left.length; index += 1) {
    difference |= left[index] ^ right[index];
  }
  return difference === 0;
}

function serializeRecord(record: OfflinePinRecord) {
  return JSON.stringify(record);
}

export async function hasOfflinePin() {
  return parseOfflinePinRecord(await getOfflinePinRecord()) !== null;
}

export async function configureOfflinePin(pin: string) {
  if (!PIN_PATTERN.test(pin)) {
    throw new OfflinePinFormatError();
  }
  const salt = crypto.getRandomValues(new Uint8Array(SALT_BYTES));
  const hash = await derivePin(pin, salt, PBKDF2_ITERATIONS);
  const record: OfflinePinRecord = {
    version: PIN_RECORD_VERSION,
    salt: bytesToBase64(salt),
    hash: bytesToBase64(hash),
    iterations: PBKDF2_ITERATIONS,
    failedAttempts: 0,
    lockedUntil: 0
  };
  await setOfflinePinRecord(serializeRecord(record));
}

export async function disableOfflinePin() {
  await clearOfflinePinRecord();
}

export async function verifyOfflinePin(pin: string): Promise<OfflinePinVerification> {
  if (!PIN_PATTERN.test(pin)) {
    return { status: 'invalid', remainingAttempts: MAX_FAILED_ATTEMPTS };
  }
  const record = parseOfflinePinRecord(await getOfflinePinRecord());
  if (!record) {
    return { status: 'not-configured' };
  }

  const now = Date.now();
  if (record.lockedUntil > now) {
    return {
      status: 'locked',
      retryAfterSeconds: Math.max(1, Math.ceil((record.lockedUntil - now) / 1000))
    };
  }
  let expiredLockout = false;
  if (record.lockedUntil > 0) {
    record.failedAttempts = 0;
    record.lockedUntil = 0;
    expiredLockout = true;
  }

  const candidate = await derivePin(pin, base64ToBytes(record.salt), record.iterations);
  if (hashesMatch(candidate, base64ToBytes(record.hash))) {
    if (record.failedAttempts > 0 || expiredLockout) {
      record.failedAttempts = 0;
      record.lockedUntil = 0;
      await setOfflinePinRecord(serializeRecord(record));
    }
    return { status: 'success' };
  }

  record.failedAttempts += 1;
  if (record.failedAttempts >= MAX_FAILED_ATTEMPTS) {
    record.failedAttempts = 0;
    record.lockedUntil = now + LOCKOUT_MILLISECONDS;
    await setOfflinePinRecord(serializeRecord(record));
    return {
      status: 'locked',
      retryAfterSeconds: Math.ceil(LOCKOUT_MILLISECONDS / 1000)
    };
  }
  await setOfflinePinRecord(serializeRecord(record));
  return {
    status: 'invalid',
    remainingAttempts: MAX_FAILED_ATTEMPTS - record.failedAttempts
  };
}
