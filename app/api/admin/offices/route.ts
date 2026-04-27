import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function GET() {
  const { data, error } = await supabase
    .from("coworker_list")
    .select("office_name")
    .not("office_name", "is", null)
    .range(0, 10000);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const offices = [
    ...new Set(
      (data ?? [])
        .map((r: { office_name: string | null }) => r.office_name?.trim())
        .filter((v): v is string => !!v)
    ),
  ].sort();

  return NextResponse.json({ offices });
}
