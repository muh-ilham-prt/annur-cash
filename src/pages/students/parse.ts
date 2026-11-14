import * as XLSX from "xlsx";
import type { Student } from "../../helpers/domain";

export type Row = { line: number; name: string; cls: string; nis: string; status: "new" | "dup" | "err"; msg: string };

export const MAX_FILE = 2 * 1024 * 1024;
export const MAX_ROWS = 2000;
const CLASS_RE = /^(1[0-2]|[1-9])[A-Z]?$/;
const HEAD: Record<"name" | "cls" | "nis", string[]> = { name: ["nama", "nama siswa", "nama lengkap", "name", "siswa"], cls: ["kelas", "class", "rombel"], nis: ["nis", "nisn", "no induk", "nomor induk", "nis/nisn"] };

// xlsx reads .xlsx, .xls and .csv alike.
export function readSheet(bytes: Uint8Array): unknown[][] {
  const book = XLSX.read(bytes, { type: "array" });
  const sheet = book.Sheets[book.SheetNames[0]];
  return sheet ? XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true, blankrows: false }) : [];
}

const normHead = (v: unknown) => String(v ?? "").toLowerCase().replace(/[^a-z/ ]/g, "").replace(/\s+/g, " ").trim();

/** Validates every data row against the StudentSheet rules; duplicates in the file count too. */
export function evaluate(rows: unknown[][], existing: Student[], msg: Record<string, string>): Row[] {
  let hi = -1;
  let map = { name: 0, cls: 1, nis: 2 };
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const m: Partial<Record<keyof typeof HEAD, number>> = {};
    rows[r].forEach((c, i) => {
      const h = normHead(c);
      for (const k of Object.keys(HEAD) as (keyof typeof HEAD)[]) if (HEAD[k].includes(h) && m[k] == null) m[k] = i;
    });
    if (m.name != null && m.cls != null) {
      hi = r;
      map = { name: m.name!, cls: m.cls!, nis: m.nis ?? -1 };
      break;
    }
  }
  const data = rows.slice(hi + 1);
  if (data.length > MAX_ROWS) throw new Error(msg.tooMany);
  const seenKey = new Set(existing.map((s) => s.name.toLowerCase() + "|" + s.cls));
  const seenNis = new Set(existing.map((s) => s.nis).filter(Boolean));
  return data.map((r, i) => {
    const cell = (k: keyof typeof map) => (map[k] >= 0 ? String(r[map[k]] ?? "").trim() : "");
    const name = cell("name").replace(/\s+/g, " ");
    const rawNis = cell("nis");
    const cls = cell("cls").toUpperCase().replace(/\.0+$/, "").replace(/^KELAS\s*/, "").replace(/[\s.\-_]/g, "");
    const row: Row = { line: hi + 2 + i, name, cls, nis: "", status: "new", msg: "" };
    if (/e\+/i.test(rawNis)) return { ...row, status: "err", msg: msg.nisSci };
    row.nis = rawNis.replace(/\D/g, "");
    const key = name.toLowerCase() + "|" + cls;
    if (name.length < 3 || name.length > 60) return { ...row, status: "err", msg: msg.badName };
    if (!CLASS_RE.test(cls)) return { ...row, status: "err", msg: msg.badClass };
    if (rawNis && !row.nis) return { ...row, status: "err", msg: msg.badNis };
    if (row.nis.length > 16) return { ...row, status: "err", msg: msg.longNis };
    if (seenKey.has(key)) return { ...row, status: "dup", msg: msg.dup };
    if (row.nis && seenNis.has(row.nis)) return { ...row, status: "dup", msg: msg.dupNis };
    seenKey.add(key);
    if (row.nis) seenNis.add(row.nis);
    return row;
  });
}
