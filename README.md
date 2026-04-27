# 동서울 월간 근무표 + 관리자 대시보드

원본 [dongseoung-month-cowoker](https://github.com/guijanam/dongseoung-month-cowoker)의 월간 근무표 조회 화면 위에 Supabase `coworker_list` 테이블을 CRUD 할 수 있는 관리자 대시보드를 추가한 버전입니다.

## 시작하기

### 1. 환경변수 설정

`.env.local`을 생성하고 다음 값을 채웁니다.

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
ADMIN_PASSWORD=원하는_비밀번호
```

`ADMIN_PASSWORD`는 절대 클라이언트로 노출되지 않으며, 서버 라우트(`/api/admin/login`)에서만 사용됩니다.

### 2. 의존성 설치 / 실행

```bash
npm install
npm run dev
```

- 일반 사용자: `http://localhost:3000`
- 관리자 로그인: `http://localhost:3000/admin/login`
- 관리자 대시보드: `http://localhost:3000/admin`

## 관리자 대시보드 기능

- `coworker_list` 테이블 전체 조회 (사번 오름차순)
- 이름·사번·소속·전화번호로 검색
- 직무(`staff_position`)별 필터 탭
- 행 추가 / 수정 / 삭제 (모달 폼)
- HttpOnly 쿠키 기반 세션 (8시간), Next.js proxy(미들웨어)에서 `/admin/*` 보호
- 다크 모드 토글, 원본 디자인(shadcn/ui + Tailwind v4) 유지

### 다루는 컬럼

`staff_id` (PK), `staff_name`, `staff_position`, `office_name`, `phone_number`,
`reference_date`, `reference_shift`, `pattern_id`, `user_id`

> Supabase RLS가 활성화되어 있다면 anon 키로 INSERT/UPDATE/DELETE가 차단될 수 있습니다.
> 개발 시에는 정책을 일시적으로 허용하거나, 운영에서는 service role key를 서버 라우트에서 사용하도록 확장하세요.

## 스크립트

```bash
npm run dev    # 개발 서버
npm run build  # 프로덕션 빌드
npm run start  # 프로덕션 서버
npm run lint
```

## 구조

```
app/
  page.tsx                 # 원본 월간 근무표 화면
  admin/
    login/page.tsx         # 관리자 로그인
    page.tsx               # 관리자 대시보드 (서버에서 인증 체크)
  api/admin/
    login/route.ts         # 비밀번호 검증 + 세션 쿠키 발급
    logout/route.ts        # 세션 쿠키 제거
components/
  admin/
    admin-dashboard.tsx    # 목록 + 검색 + CRUD 트리거
    coworker-form.tsx      # 추가/수정 모달 폼
  ui/                      # shadcn 스타일 공용 UI
lib/
  admin-auth.ts            # 비밀번호 검증 / 세션 헬퍼
  coworker-types.ts        # 테이블 타입과 컬럼 메타
  supabase.ts              # Supabase 클라이언트
proxy.ts                   # Next.js 16 proxy: /admin/* 보호
```
