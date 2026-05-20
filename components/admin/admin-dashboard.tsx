"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LogOut,
  Plus,
  Pencil,
  Trash2,
  RefreshCw,
  Search,
  Loader2,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/modal";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  VISIBLE_COWORKER_COLUMNS,
  type CoworkerInput,
  type CoworkerRow,
} from "@/lib/coworker-types";
import { CoworkerForm } from "@/components/admin/coworker-form";
import { cn } from "@/lib/utils";

const TABLE = "coworker_list";

interface AdminDashboardProps {
  office: string;
}

export function AdminDashboard({ office }: AdminDashboardProps) {
  const router = useRouter();

  const [rows, setRows] = useState<CoworkerRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [positionFilter, setPositionFilter] = useState<string>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [editingRow, setEditingRow] = useState<CoworkerRow | null>(null);

  const [deleteTarget, setDeleteTarget] = useState<CoworkerRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchRows = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    const { data, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("office_name", office)
      .order("staff_id", { ascending: true })
      .range(0, 10000);

    if (error) {
      setError(error.message);
      setRows([]);
    } else {
      setRows((data ?? []) as CoworkerRow[]);
    }
    setIsLoading(false);
  }, [office]);

  useEffect(() => {
    fetchRows();
  }, [fetchRows]);

  useEffect(() => {
    if (!info) return;
    const t = setTimeout(() => setInfo(null), 2500);
    return () => clearTimeout(t);
  }, [info]);

  const positions = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) {
      if (r.staff_position) set.add(r.staff_position);
    }
    return [...set].sort();
  }, [rows]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return rows.filter((r) => {
      if (positionFilter !== "all" && r.staff_position !== positionFilter)
        return false;
      if (!q) return true;
      return (
        r.staff_name?.toLowerCase().includes(q) ||
        r.office_name?.toLowerCase().includes(q) ||
        r.phone_number?.toLowerCase().includes(q)
      );
    });
  }, [rows, search, positionFilter]);

  const openCreate = () => {
    setFormMode("create");
    setEditingRow(null);
    setFormOpen(true);
  };

  const openEdit = (row: CoworkerRow) => {
    setFormMode("edit");
    setEditingRow(row);
    setFormOpen(true);
  };

  const handleSubmit = async (input: CoworkerInput) => {
    setError(null);
    // 다른 소속으로 변경되지 않도록 항상 현재 로그인 소속으로 고정
    const scoped: CoworkerInput = { ...input, office_name: office };

    if (formMode === "create") {
      let nextStaffId = await allocateNextStaffId();
      let { error } = await supabase
        .from(TABLE)
        .insert({ ...scoped, staff_id: nextStaffId });
      // PK 충돌(동시 추가)이면 한 번 더 재시도
      if (error && /duplicate key|23505/i.test(error.message)) {
        nextStaffId = await allocateNextStaffId();
        ({ error } = await supabase
          .from(TABLE)
          .insert({ ...scoped, staff_id: nextStaffId }));
      }
      if (error) throw new Error(error.message);
      setInfo(`${scoped.staff_name} 님을 추가했습니다. (사번 ${nextStaffId})`);
    } else if (editingRow) {
      const { error } = await supabase
        .from(TABLE)
        .update(scoped)
        .eq("staff_id", editingRow.staff_id)
        .eq("office_name", office);
      if (error) throw new Error(error.message);
      setInfo(`${scoped.staff_name} 님의 정보를 수정했습니다.`);
    }
    setFormOpen(false);
    setEditingRow(null);
    await fetchRows();
  };

  // 전체 테이블에서 가장 큰 staff_id + 1을 발급. 충돌 시 1회 재시도.
  const allocateNextStaffId = async (): Promise<number> => {
    const { data, error } = await supabase
      .from(TABLE)
      .select("staff_id")
      .order("staff_id", { ascending: false })
      .limit(1);
    if (error) throw new Error(error.message);
    const max = data?.[0]?.staff_id ?? 0;
    return max + 1;
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    setError(null);
    const { error } = await supabase
      .from(TABLE)
      .delete()
      .eq("staff_id", deleteTarget.staff_id)
      .eq("office_name", office);
    setIsDeleting(false);
    if (error) {
      setError(error.message);
      return;
    }
    setInfo(`${deleteTarget.staff_name} 님을 삭제했습니다.`);
    setDeleteTarget(null);
    await fetchRows();
  };

  const handleLogout = async () => {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  };

  return (
    <div className="flex flex-col min-h-dvh">
      <header className="sticky top-0 z-30 flex items-center gap-2 px-4 py-3 border-b bg-background/95 backdrop-blur">
        <h1 className="text-base font-bold">근무자 관리</h1>
        <Badge variant="secondary" className="ml-1">
          {office}
        </Badge>
        <div className="ml-auto flex items-center gap-2">
          <ThemeToggle />
          <Button
            variant="outline"
            size="sm"
            onClick={handleLogout}
            className="gap-1.5"
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </Button>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-2 px-4 py-3 border-b">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="이름, 소속, 전화번호 검색"
            className="pl-8 w-64"
          />
        </div>

        <div className="flex items-center gap-1.5">
          <Button
            variant={positionFilter === "all" ? "default" : "outline"}
            size="sm"
            onClick={() => setPositionFilter("all")}
          >
            전체
          </Button>
          {positions.map((p) => (
            <Button
              key={p}
              variant={positionFilter === p ? "default" : "outline"}
              size="sm"
              onClick={() => setPositionFilter(p)}
            >
              {p}
            </Button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-2">
          <span className="text-xs text-muted-foreground">
            총 {filtered.length}명
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchRows}
            disabled={isLoading}
            className="gap-1.5"
          >
            <RefreshCw
              className={cn("h-4 w-4", isLoading && "animate-spin")}
            />
            새로고침
          </Button>
          <Button size="sm" onClick={openCreate} className="gap-1.5">
            <Plus className="h-4 w-4" />
            추가
          </Button>
        </div>
      </div>

      {info && (
        <div className="px-4 py-2 text-sm text-emerald-700 bg-emerald-100 dark:text-emerald-200 dark:bg-emerald-900/30 border-b">
          {info}
        </div>
      )}
      {error && (
        <div className="px-4 py-2 text-sm text-destructive bg-destructive/10 border-b">
          {error}
        </div>
      )}

      <main className="flex-1 px-2 py-2 overflow-auto">
        <div className="border rounded-md overflow-auto">
          <Table className="min-w-max">
            <TableHeader>
              <TableRow>
                {VISIBLE_COWORKER_COLUMNS.map((col) => (
                  <TableHead
                    key={col.key}
                    className="bg-background text-xs whitespace-nowrap text-center"
                  >
                    {col.label}
                  </TableHead>
                ))}
                <TableHead className="bg-background text-xs text-center sticky right-0">
                  관리
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading && rows.length === 0 ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <TableRow key={`sk-${i}`}>
                    {VISIBLE_COWORKER_COLUMNS.map((col) => (
                      <TableCell key={col.key}>
                        <Skeleton className="h-4 w-20" />
                      </TableCell>
                    ))}
                    <TableCell>
                      <Skeleton className="h-7 w-24" />
                    </TableCell>
                  </TableRow>
                ))
              ) : filtered.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={VISIBLE_COWORKER_COLUMNS.length + 1}
                    className="text-center text-muted-foreground py-8"
                  >
                    {rows.length === 0
                      ? "등록된 근무자가 없습니다."
                      : "검색 결과가 없습니다."}
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((row) => (
                  <TableRow key={row.staff_id} className={cn(row.leave && "opacity-50")}>
                    {VISIBLE_COWORKER_COLUMNS.map((col) => (
                      <TableCell
                        key={col.key}
                        className="text-xs whitespace-nowrap text-center"
                      >
                        {formatCell(row[col.key], col.type)}
                      </TableCell>
                    ))}
                    <TableCell className="text-xs whitespace-nowrap text-center sticky right-0 bg-background">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => openEdit(row)}
                          aria-label="수정"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="삭제"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </main>

      <CoworkerForm
        open={formOpen}
        mode={formMode}
        initial={editingRow}
        lockedOffice={office}
        onClose={() => {
          setFormOpen(false);
          setEditingRow(null);
        }}
        onSubmit={handleSubmit}
      />

      <Modal
        open={!!deleteTarget}
        onClose={() => !isDeleting && setDeleteTarget(null)}
        title="근무자 삭제"
        description={
          deleteTarget
            ? `${deleteTarget.staff_name} 님의 데이터를 정말 삭제하시겠습니까?`
            : ""
        }
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
            >
              취소
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                "삭제"
              )}
            </Button>
          </>
        }
      >
        <p className="text-sm text-muted-foreground">
          이 작업은 되돌릴 수 없습니다.
        </p>
      </Modal>
    </div>
  );
}

function formatCell(value: unknown, type?: string): string {
  if (type === "boolean") return value === true ? "휴직" : "-";
  if (value === null || value === undefined) return "-";
  if (typeof value === "string" && value.length === 0) return "-";
  return String(value);
}
