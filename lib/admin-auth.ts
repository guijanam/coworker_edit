import { cookies } from "next/headers";
import { createHash } from "crypto";

export const ADMIN_COOKIE_NAME = "admin_session";
const COOKIE_MAX_AGE_SECONDS = 60 * 60 * 8; // 8시간

type OfficePasswordMap = Record<string, string>;

function getOfficePasswords(): OfficePasswordMap {
  const raw = process.env.ADMIN_PASSWORDS;
  if (!raw) {
    throw new Error(
      "ADMIN_PASSWORDS 환경변수가 설정되지 않았습니다. .env.local에 JSON 형태로 추가해주세요."
    );
  }
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(
      "ADMIN_PASSWORDS 값을 JSON으로 파싱하지 못했습니다. 예: {\"소속A\":\"비번\",\"소속B\":\"비번\"}"
    );
  }
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("ADMIN_PASSWORDS는 객체(JSON Object)여야 합니다.");
  }

  const map: OfficePasswordMap = {};
  for (const [k, v] of Object.entries(parsed as Record<string, unknown>)) {
    if (typeof v !== "string" || v.length === 0) continue;
    map[k.trim()] = v;
  }
  return map;
}

function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i++) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}

export function listConfiguredOffices(): string[] {
  try {
    return Object.keys(getOfficePasswords()).sort();
  } catch {
    return [];
  }
}

export function verifyOfficePassword(
  office: string,
  input: string
): boolean {
  const map = getOfficePasswords();
  const expected = map[office.trim()];
  if (!expected) return false;
  return timingSafeEqual(expected, input);
}

function tokenFor(office: string): string {
  const map = getOfficePasswords();
  const pw = map[office.trim()];
  if (!pw) throw new Error("소속에 해당하는 비밀번호가 없습니다.");
  // office와 비번을 함께 해싱 → 쿠키 위조 방지
  return createHash("sha256").update(`${office}:${pw}`).digest("base64url");
}

export async function setAdminSession(office: string) {
  const store = await cookies();
  const token = tokenFor(office);
  // 토큰에 office는 평문으로 함께 보관(검증 시 토큰 재생성 비교)
  const value = `${encodeURIComponent(office)}.${token}`;
  store.set(ADMIN_COOKIE_NAME, value, {
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

export async function getAdminSession(): Promise<{ office: string } | null> {
  try {
    const store = await cookies();
    const cookie = store.get(ADMIN_COOKIE_NAME)?.value;
    if (!cookie) return null;
    const [encOffice, token] = cookie.split(".");
    if (!encOffice || !token) return null;
    const office = decodeURIComponent(encOffice);
    const expected = tokenFor(office);
    if (!timingSafeEqual(expected, token)) return null;
    return { office };
  } catch {
    return null;
  }
}

export async function isAdminAuthenticated(): Promise<boolean> {
  return (await getAdminSession()) !== null;
}
