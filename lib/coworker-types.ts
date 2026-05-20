export interface CoworkerRow {
  staff_id: number;
  staff_name: string;
  pattern_id: string | null;
  reference_date: string | null;
  reference_shift: string | null;
  user_id: string | null;
  staff_position: string | null;
  office_name: string | null;
  phone_number: string | null;
  leave: boolean | null;
}

export type CoworkerInput = Omit<CoworkerRow, "staff_id"> & {
  staff_id?: number;
};

export interface CoworkerColumnMeta {
  key: keyof CoworkerRow;
  label: string;
  type: "text" | "number" | "date" | "select" | "boolean";
  required?: boolean;
  /** 관리자 화면(목록/수정 폼)에서 숨길지 여부 */
  hidden?: boolean;
  /** type === "select" 인 경우 선택지 */
  options?: string[];
}

export const STAFF_POSITION_OPTIONS = ["기관사", "차장"] as const;

export const COWORKER_COLUMNS: CoworkerColumnMeta[] = [
  { key: "staff_id", label: "사번", type: "number", required: true, hidden: true },
  { key: "staff_name", label: "이름", type: "text", required: true },
  {
    key: "staff_position",
    label: "직무",
    type: "select",
    options: [...STAFF_POSITION_OPTIONS],
  },
  { key: "office_name", label: "소속", type: "text", hidden: true },
  { key: "phone_number", label: "전화번호", type: "text" },
  { key: "reference_date", label: "기준일", type: "date" },
  { key: "reference_shift", label: "기준 근무", type: "text" },
  { key: "leave", label: "휴직", type: "boolean" },
  { key: "pattern_id", label: "패턴 ID", type: "text", hidden: true },
  { key: "user_id", label: "사용자 ID", type: "text", hidden: true },
];

export const VISIBLE_COWORKER_COLUMNS = COWORKER_COLUMNS.filter(
  (c) => !c.hidden
);
