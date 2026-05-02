import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { isAdminRole } from "@/lib/server-auth/assert-role";
import { listConfirmedWithPlusOnes } from "@/lib/guests/db";

function csvEscape(value: string): string {
  if (/[",\n\r]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function GET(request: Request) {
  const session = await auth();
  if (!isAdminRole(session?.user?.role)) {
    return new NextResponse("forbidden", { status: 403 });
  }
  const url = new URL(request.url);
  const rows = await listConfirmedWithPlusOnes({
    search: url.searchParams.get("q"),
    source: (url.searchParams.get("source") as "admin" | "submitted" | null) ?? null,
  });
  const header = [
    "firstName",
    "lastName",
    "plusOneNames",
    "plusOneCount",
    "observation",
    "rsvpSubmittedAt",
    "source",
  ].join(",");
  const lines = rows.map((r) =>
    [
      csvEscape(r.firstName),
      csvEscape(r.lastName),
      csvEscape(r.plusOnes.map((p) => p.name).join("; ")),
      String(r.plusOnes.length),
      csvEscape(r.observation ?? ""),
      r.rsvpSubmittedAt ? new Date(r.rsvpSubmittedAt).toISOString() : "",
      csvEscape(r.source),
    ].join(","),
  );
  const body = "﻿" + [header, ...lines].join("\n");
  const fileName = `rsvps-${new Date().toISOString().slice(0, 10)}.csv`;
  return new NextResponse(body, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${fileName}"`,
    },
  });
}
