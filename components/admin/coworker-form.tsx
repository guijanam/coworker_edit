"use client";

import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Modal } from "@/components/ui/modal";
import {
  COWORKER_COLUMNS,
  type CoworkerColumnMeta,
  type CoworkerInput,
  type CoworkerRow,
} from "@/lib/coworker-types";

interface CoworkerFormProps {
  open: boolean;
  mode: "create" | "edit";
  initial?: CoworkerRow | null;
  /** 현재 로그인 소속 — office_name 필드를 고정하고 추가 시 자동 채움 */
  lockedOffice?: string;
  onClose: () => void;
  onSubmit: (input: CoworkerInput) => Promise<void>;
}

const EMPTY: Record<string, string> = COWORKER_COLUMNS.reduce(
  (acc, col) => ({ ...acc, [col.key]: "" }),
  {}
);

export function CoworkerForm({
  open,
  mode,
  initial,
  lockedOffice,
  onClose,
  onSubmit,
}: CoworkerFormProps) {
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 폼에 실제로 렌더링할 컬럼:
  // - hidden 컬럼은 기본 제외 (staff_id는 자동 발급이므로 추가 시에도 숨김)
  // - office_name은 hidden이지만 잠금 상태로 항상 보여줌 (현재 소속 확인용)
  const visibleFields: CoworkerColumnMeta[] = useMemo(() => {
    return COWORKER_COLUMNS.filter((col) => {
      if (col.key === "office_name") return true;
      return !col.hidden;
    });
  }, []);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const next: Record<string, string> = { ...EMPTY };
      for (const col of COWORKER_COLUMNS) {
        const v = initial[col.key];
        next[col.key] = v === null || v === undefined ? "" : String(v);
      }
      if (lockedOffice) next.office_name = lockedOffice;
      setValues(next);
    } else {
      setValues({
        ...EMPTY,
        ...(lockedOffice ? { office_name: lockedOffice } : {}),
      });
    }
    setError(null);
  }, [open, initial, lockedOffice]);

  const handleChange = (key: string, value: string) => {
    setValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    setError(null);

    // 보이는 필드의 required만 체크
    for (const col of visibleFields) {
      if (col.required && !values[col.key]?.trim()) {
        setError(`${col.label}은(는) 필수입니다.`);
        return;
      }
    }

    // staff_id: create 시에는 부모(handleSubmit)에서 자동 발급하므로 보내지 않음
    const payload: CoworkerInput = {
      staff_id: mode === "edit" ? initial?.staff_id : undefined,
      staff_name: values.staff_name.trim(),
      staff_position: emptyToNull(values.staff_position),
      office_name: emptyToNull(values.office_name),
      phone_number: emptyToNull(values.phone_number),
      reference_date: emptyToNull(values.reference_date),
      reference_shift: emptyToNull(values.reference_shift),
      leave: values.leave === "true",
      // 숨김 필드는 기존 값 유지 (수정 시), 추가 시에는 null
      pattern_id: initial?.pattern_id ?? null,
      user_id: initial?.user_id ?? null,
    };

    setIsSaving(true);
    try {
      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : "저장에 실패했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      open={open}
      onClose={isSaving ? () => undefined : onClose}
      title={mode === "create" ? "근무자 추가" : "근무자 수정"}
      description="coworker_list 테이블의 한 행을 관리합니다."
      className="max-w-lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={isSaving}>
            취소
          </Button>
          <Button onClick={handleSubmit} disabled={isSaving}>
            {isSaving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : mode === "create" ? (
              "추가"
            ) : (
              "저장"
            )}
          </Button>
        </>
      }
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visibleFields.map((col) => (
          <div key={col.key} className="space-y-1.5">
            <Label htmlFor={`field-${col.key}`}>
              {col.label}
              {col.required && (
                <span className="text-destructive ml-0.5">*</span>
              )}
            </Label>
            {col.type === "select" ? (
              <Select
                id={`field-${col.key}`}
                value={values[col.key] ?? ""}
                onChange={(e) => handleChange(col.key, e.target.value)}
                disabled={isSaving}
              >
                <option value="">선택하세요</option>
                {(col.options ?? []).map((opt) => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </Select>
            ) : col.type === "boolean" ? (
              <div className="flex items-center h-9">
                <input
                  id={`field-${col.key}`}
                  type="checkbox"
                  checked={values[col.key] === "true"}
                  onChange={(e) =>
                    handleChange(col.key, e.target.checked ? "true" : "false")
                  }
                  disabled={isSaving}
                  className="h-4 w-4 rounded border-input accent-primary"
                />
                <span className="ml-2 text-sm text-muted-foreground">
                  {values[col.key] === "true" ? "휴직 중" : "근무 중"}
                </span>
              </div>
            ) : (
              <Input
                id={`field-${col.key}`}
                type={col.type}
                value={values[col.key] ?? ""}
                onChange={(e) => handleChange(col.key, e.target.value)}
                disabled={
                  isSaving || (col.key === "office_name" && !!lockedOffice)
                }
                readOnly={col.key === "office_name" && !!lockedOffice}
                required={col.required}
              />
            )}
          </div>
        ))}
      </div>
      {error && (
        <p className="mt-3 text-sm font-medium text-destructive">{error}</p>
      )}
    </Modal>
  );
}

function emptyToNull(v: string | undefined): string | null {
  if (v === undefined) return null;
  const trimmed = v.trim();
  return trimmed === "" ? null : trimmed;
}
