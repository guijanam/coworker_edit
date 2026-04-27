import { cookies } from "next/headers";

export const ADMIN_COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8시간

function getAdminPassword(): string {
  const pw = process.env.ADMIN_PASSWORD;
  if (!pw) {
    throw new Error(
      "ADMIN_PASSWORD 환경변수가 설정되지 않았습니다. .env.local에 추가해주세요."
    );
  }
  return pw;
}

export function verifyAdminPassword(input: string): boolean {
  const expected = getAdminPassword();
  if (input.length !== expected.length) return false;
  let mismatch = 0;
  for (let i = 0; i < expected.length; i++) {
    mismatch |= expected.charCodeAt(i) ^ input.charCodeAt(i);
  }
  return mismatch === 0;
}

function getSessionToken(): string {
  const pw = getAdminPassword();
  if (typeof globalThis.crypto?.subtle === "undefined") {
    return Buffer.from(`admin:${pw}`).toString("base64url");
  }
  return Buffer.from(`admin:${pw}`).toString("base64url");
}

export async function setAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, getSessionToken(), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: COOKIE_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const store = await cookies();
  store.set(ADMIN_COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0,
  });
}

export async function isAdminAuthenticated(): Promise<boolean> {
  try {
    const store = await cookies();
    const cookie = store.get(ADMIN_COOKIE_NAME)?.value;
    if (!cookie) return false;
    return cookie === getSessionToken();
  } catch {
    return false;
  }
}
