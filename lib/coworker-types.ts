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
}

export type CoworkerInput = Omit<CoworkerRow, "staff_id"> & {
  staff_id?: number;
};

export const COWORKER_COLUMNS: {
  key: keyof CoworkerRow;
  label: string;
  type: "text" | "number" | "date";
  required?: boolean;
}[] = [
  { key: "staff_id", label: "사번", type: "number", required: true },
  { key: "staff_name", label: "이름", type: "text", required: true },
  { key: "staff_position", label: "직무", type: "text" },
  { key: "office_name", label: "소속", type: "text" },
  { key: "phone_number", label: "전화번호", type: "text" },
  { key: "reference_date", label: "기준일", type: "date" },
  { key: "reference_shift", label: "기준 근무", type: "text" },
  { key: "pattern_id", label: "패턴 ID", type: "text" },
  { key: "user_id", label: "사용자 ID", type: "text" },
];
