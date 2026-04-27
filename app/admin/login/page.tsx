"use client";

import { useEffect, useState, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ThemeToggle } from "@/components/theme-toggle";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const from = searchParams.get("from") || "/admin";

  const [offices, setOffices] = useState<string[]>([]);
  const [office, setOffice] = useState("");
  const [officesLoading, setOfficesLoading] = useState(true);
  const [officesError, setOfficesError] = useState<string | null>(null);

  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/offices", { cache: "no-store" });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (!res.ok) {
          setOfficesError(data?.error ?? "소속 목록을 불러오지 못했습니다.");
          return;
        }
        const list: string[] = Array.isArray(data?.offices)
          ? data.offices
          : [];
        setOffices(list);
        if (list.length > 0) setOffice(list[0]);
      } catch {
        if (!cancelled)
          setOfficesError("소속 목록을 불러오지 못했습니다.");
      } finally {
        if (!cancelled) setOfficesLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!office) {
      setError("소속을 선택해주세요.");
      return;
    }
    if (!password) {
      setError("비밀번호를 입력해주세요.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ office, password }),
      });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? "로그인에 실패했습니다.");
        return;
      }

      router.replace(from);
      router.refresh();
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setIsLoading(false);
    }
  };

  const isSelectDisabled =
    isLoading || officesLoading || !!officesError || offices.length === 0;

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="office">소속</Label>
        <Select
          id="office"
          value={office}
          onChange={(e) => setOffice(e.target.value)}
          disabled={isSelectDisabled}
        >
          {officesLoading ? (
            <option value="">불러오는 중...</option>
          ) : offices.length === 0 ? (
            <option value="">등록된 소속이 없습니다</option>
          ) : (
            offices.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))
          )}
        </Select>
        {officesError && (
          <p className="text-xs text-destructive">{officesError}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">비밀번호</Label>
        <Input
          id="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="소속 비밀번호를 입력하세요"
          disabled={isLoading}
        />
      </div>

      {error && (
        <p className="text-sm font-medium text-destructive">{error}</p>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isSelectDisabled}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          "로그인"
        )}
      </Button>
    </form>
  );
}

export default function AdminLoginPage() {
  return (
    <div className="flex items-center justify-center min-h-dvh px-4 bg-background">
      <div className="absolute top-3 right-3">
        <ThemeToggle />
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader className="items-center text-center space-y-2">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <CardTitle>관리자 로그인</CardTitle>
          <CardDescription>
            소속을 선택하고 해당 소속의 비밀번호로 로그인하세요.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Suspense fallback={null}>
            <LoginForm />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
