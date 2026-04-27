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
  onClose,
  onSubmit,
}: CoworkerFormProps) {
  const [values, setValues] = useState<Record<string, string>>(EMPTY);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 폼에 실제로 렌더링할 컬럼:
  // - hidden 컬럼은 기본 제외
  // - 단 staff_id는 PK이므로 create 모드에서만 노출
  const visibleFields: CoworkerColumnMeta[] = useMemo(() => {
    return COWORKER_COLUMNS.filter((col) => {
      if (col.key === "staff_id") return mode === "create";
      return !col.hidden;
    });
  }, [mode]);

  useEffect(() => {
    if (!open) return;
    if (initial) {
      const next: Record<string, string> = { ...EMPTY };
      for (const col of COWORKER_COLUMNS) {
        const v = initial[col.key];
        next[col.key] = v === null || v === undefined ? "" : String(v);
      }
      setValues(next);
    } else {
      setValues(EMPTY);
    }
    setError(null);
  }, [open, initial]);

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

    let staffIdNum: number | undefined;
    if (mode === "create") {
      staffIdNum = Number(values.staff_id);
      if (!Number.isFinite(staffIdNum)) {
        setError("사번은 숫자여야 합니다.");
        return;
      }
    } else if (initial) {
      staffIdNum = initial.staff_id;
    }

    const payload: CoworkerInput = {
      staff_id: staffIdNum,
      staff_name: values.staff_name.trim(),
      staff_position: emptyToNull(values.staff_position),
      office_name: emptyToNull(values.office_name),
      phone_number: emptyToNull(values.phone_number),
      reference_date: emptyToNull(values.reference_date),
      reference_shift: emptyToNull(values.reference_shift),
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
            ) : (
              <Input
                id={`field-${col.key}`}
                type={col.type}
                value={values[col.key] ?? ""}
                onChange={(e) => handleChange(col.key, e.target.value)}
                disabled={isSaving}
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
