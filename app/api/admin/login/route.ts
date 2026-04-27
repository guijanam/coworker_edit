import { NextResponse } from "next/server";
import {
  setAdminSession,
  verifyOfficePassword,
  listConfiguredOffices,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  let office: string | undefined;
  let password: string | undefined;
  try {
    const body = await request.json();
    office = typeof body?.office === "string" ? body.office.trim() : undefined;
    password = typeof body?.password === "string" ? body.password : undefined;
  } catch {
    return NextResponse.json(
      { error: "잘못된 요청입니다." },
      { status: 400 }
    );
  }

  if (!office) {
    return NextResponse.json(
      { error: "소속을 선택해주세요." },
      { status: 400 }
    );
  }
  if (!password) {
    return NextResponse.json(
      { error: "비밀번호를 입력해주세요." },
      { status: 400 }
    );
  }

  try {
    const configured = listConfiguredOffices();
    if (!configured.includes(office)) {
      return NextResponse.json(
        { error: "이 소속은 관리자 인증이 설정되어 있지 않습니다." },
        { status: 401 }
      );
    }
    if (!verifyOfficePassword(office, password)) {
      return NextResponse.json(
        { error: "비밀번호가 올바르지 않습니다." },
        { status: 401 }
      );
    }
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "서버 설정 오류가 발생했습니다.";
    return NextResponse.json({ error: message }, { status: 500 });
  }

  await setAdminSession(office);
  return NextResponse.json({ ok: true, office });
}
