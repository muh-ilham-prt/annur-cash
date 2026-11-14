import { apiFetch } from "./api";
import type { Student } from "./domain";

type Row = { id: number; name: string; cls: string | null; nis: string | null; status?: "active" | "candidate"; ppdb_id?: string | null };
const toStudent = (r: Row): Student => ({ id: String(r.id), name: r.name, cls: r.cls ?? "", nis: r.nis ?? "", status: r.status ?? "active", ppdbId: r.ppdb_id ?? undefined });
const body = (s: Pick<Student, "name" | "cls" | "nis">) => JSON.stringify({ name: s.name, cls: s.cls, nis: s.nis || null });

export async function fetchStudents() {
  const all: Student[] = [];
  for (let page = 1, last = 1; page <= last; page++) {
    const res = await apiFetch<{ data: Row[]; last_page: number }>(`/students?per_page=500&page=${page}`);
    last = res.last_page;
    all.push(...res.data.map(toStudent));
  }
  return all;
}

export const createStudent = async (s: Student) => toStudent(await apiFetch<Row>("/students", { method: "POST", body: body(s) }));
export const updateStudent = async (s: Student) => toStudent(await apiFetch<Row>(`/students/${s.id}`, { method: "PUT", body: body(s) }));
export const deleteStudent = (s: Student) => apiFetch(`/students/${s.id}`, { method: "DELETE" });
export const importStudents = (rows: Student[]) =>
  apiFetch<{ created: number; skipped: unknown[] }>("/students/import", { method: "POST", body: JSON.stringify({ rows: rows.map((r) => JSON.parse(body(r))) }) });
