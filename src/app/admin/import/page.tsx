"use client";

import { useEffect, useRef, useState } from "react";
import * as XLSX from "xlsx";
import { getGyms, importMembers, type MemberRow } from "./actions";

const SECRET = "nexagym_admin_2024";

// Columnas que intentamos mapear automáticamente desde el Excel
const COL_MAP: Record<string, keyof MemberRow> = {
  nombre: "first_name", name: "first_name", "primer nombre": "first_name",
  apellido: "last_name", surname: "last_name", "apellidos": "last_name",
  dni: "dni", documento: "dni", "n° doc": "dni",
  email: "email", correo: "email", "e-mail": "email",
  telefono: "phone", teléfono: "phone", celular: "phone", tel: "phone",
  "fecha nacimiento": "birth_date", "fecha de nacimiento": "birth_date", nacimiento: "birth_date",
  direccion: "address", dirección: "address", domicilio: "address",
  notas: "notes", observaciones: "notes", nota: "notes",
};

function normalizeKey(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").trim();
}

function parseDate(val: unknown): string | null {
  if (!val) return null;
  if (typeof val === "number") {
    // Excel serial date
    const date = XLSX.SSF.parse_date_code(val);
    if (!date) return null;
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const s = String(val).trim();
  // DD/MM/YYYY
  const m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})$/);
  if (m) {
    const y = m[3].length === 2 ? "20" + m[3] : m[3];
    return `${y}-${m[2].padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  }
  return null;
}

type Gym = { id: string; name: string };

export default function AdminImportPage() {
  const [authed, setAuthed] = useState(false);
  const [secretInput, setSecretInput] = useState("");
  const [authError, setAuthError] = useState(false);

  const [gyms, setGyms] = useState<Gym[]>([]);
  const [selectedGym, setSelectedGym] = useState("");

  const [rows, setRows] = useState<MemberRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [unmapped, setUnmapped] = useState<string[]>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ inserted: number } | null>(null);
  const [error, setError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  function handleAuth(e: React.FormEvent) {
    e.preventDefault();
    if (secretInput === SECRET) {
      setAuthError(false);
      setAuthed(true);
      getGyms().then(setGyms);
    } else {
      setAuthError(true);
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    setResult(null);
    setError("");

    const reader = new FileReader();
    reader.onload = (ev) => {
      const data = new Uint8Array(ev.target!.result as ArrayBuffer);
      const wb = XLSX.read(data, { type: "array" });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const raw: Record<string, unknown>[] = XLSX.utils.sheet_to_json(ws, { defval: "" });

      if (!raw.length) { setError("El archivo está vacío."); return; }

      // Mapear columnas
      const headers = Object.keys(raw[0]);
      const missing: string[] = [];
      const mapping: Record<string, keyof MemberRow> = {};

      headers.forEach((h) => {
        const norm = normalizeKey(h);
        if (COL_MAP[norm]) mapping[h] = COL_MAP[norm];
        else missing.push(h);
      });

      setUnmapped(missing);

      const parsed: MemberRow[] = raw
        .filter((r) => {
          // Necesitamos al menos nombre o apellido
          const fn = Object.entries(mapping).find(([, v]) => v === "first_name")?.[0];
          const ln = Object.entries(mapping).find(([, v]) => v === "last_name")?.[0];
          return fn ? String(r[fn]).trim() : ln ? String(r[ln]).trim() : false;
        })
        .map((r) => {
          const m: MemberRow = {
            first_name: "", last_name: "", dni: null, email: null,
            phone: null, birth_date: null, address: null, notes: null,
          };
          Object.entries(mapping).forEach(([col, field]) => {
            const val = r[col];
            if (field === "birth_date") {
              m.birth_date = parseDate(val);
            } else {
              (m as Record<string, unknown>)[field] = val ? String(val) : null;
            }
          });
          return m;
        });

      setRows(parsed);
    };
    reader.readAsArrayBuffer(file);
  }

  async function handleImport() {
    if (!selectedGym) { setError("Seleccioná un gym."); return; }
    if (!rows.length) { setError("No hay socios para importar."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await importMembers(selectedGym, rows);
      setResult(res);
      setRows([]);
      setFileName("");
      if (fileRef.current) fileRef.current.value = "";
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Error al importar.");
    } finally {
      setLoading(false);
    }
  }

  // ── Auth screen ──────────────────────────────────────────────────────────────
  if (!authed) {
    return (
      <div style={{ minHeight: "100vh", background: "#0B0D10", display: "flex", alignItems: "center", justifyContent: "center", fontFamily: "Inter, sans-serif" }}>
        <div style={{ background: "#161A20", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "40px 36px", width: 360 }}>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 20, color: "#F5F3EF", marginBottom: 4 }}>
            NEXA<span style={{ color: "#FF5A1F" }}>GYM</span>
          </div>
          <p style={{ color: "#8A8780", fontSize: 14, margin: "0 0 24px" }}>Panel de importación — solo admin</p>
          <form onSubmit={handleAuth} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
            <input
              type="password" autoFocus required placeholder="Clave secreta"
              value={secretInput} onChange={e => setSecretInput(e.target.value)}
              style={{ padding: "12px 14px", borderRadius: 8, border: `1.5px solid ${authError ? "#EF4444" : "rgba(255,255,255,0.12)"}`, background: "#0E1013", color: "#F5F3EF", fontSize: 15, fontFamily: "inherit" }}
            />
            {authError && <p style={{ color: "#EF4444", fontSize: 13, margin: 0 }}>Clave incorrecta</p>}
            <button type="submit" style={{ background: "#FF5A1F", color: "#0B0D10", fontWeight: 700, fontSize: 15, padding: 13, borderRadius: 8, border: "none", cursor: "pointer", fontFamily: "inherit" }}>
              Entrar
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── Main screen ──────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: "100vh", background: "#0B0D10", color: "#F5F3EF", fontFamily: "Inter, sans-serif", padding: "40px 5vw" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ marginBottom: 36 }}>
          <div style={{ fontFamily: "Space Grotesk, sans-serif", fontWeight: 700, fontSize: 22, marginBottom: 4 }}>
            NEXA<span style={{ color: "#FF5A1F" }}>GYM</span> <span style={{ color: "#8A8780", fontWeight: 400 }}>/ Importar socios</span>
          </div>
          <p style={{ color: "#8A8780", fontSize: 14, margin: 0 }}>Cargá el Excel de un cliente y asignalo al gym correspondiente.</p>
        </div>

        {/* Step 1 — Gym */}
        <Section n="1" title="Seleccioná el gym">
          <select
            value={selectedGym} onChange={e => setSelectedGym(e.target.value)}
            style={{ padding: "11px 14px", borderRadius: 8, border: "1.5px solid rgba(255,255,255,0.12)", background: "#161A20", color: "#F5F3EF", fontSize: 15, fontFamily: "inherit", minWidth: 300 }}
          >
            <option value="">— Elegí un gym —</option>
            {gyms.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </Section>

        {/* Step 2 — File */}
        <Section n="2" title="Subí el archivo Excel o CSV">
          <input
            ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
            onChange={handleFile}
            style={{ color: "#F5F3EF", fontSize: 14 }}
          />
          {fileName && <p style={{ color: "#8A8780", fontSize: 13, margin: "8px 0 0" }}>📄 {fileName} — {rows.length} socios detectados</p>}
          {unmapped.length > 0 && (
            <p style={{ color: "#FEBC2E", fontSize: 13, margin: "8px 0 0" }}>
              ⚠ Columnas no reconocidas (se ignoran): {unmapped.join(", ")}
            </p>
          )}
        </Section>

        {/* Preview */}
        {rows.length > 0 && (
          <Section n="3" title={`Preview — primeros ${Math.min(rows.length, 10)} de ${rows.length} socios`}>
            <div style={{ overflowX: "auto", borderRadius: 10, border: "1px solid rgba(255,255,255,0.08)" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "#161A20" }}>
                    {["Nombre", "Apellido", "DNI", "Email", "Teléfono", "Nacimiento"].map(h => (
                      <th key={h} style={{ padding: "10px 14px", textAlign: "left", color: "#8A8780", fontWeight: 600, whiteSpace: "nowrap" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {rows.slice(0, 10).map((r, i) => (
                    <tr key={i} style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                      <td style={{ padding: "9px 14px" }}>{r.first_name || <span style={{ color: "#EF4444" }}>—</span>}</td>
                      <td style={{ padding: "9px 14px" }}>{r.last_name || "—"}</td>
                      <td style={{ padding: "9px 14px", color: "#8A8780" }}>{r.dni || "—"}</td>
                      <td style={{ padding: "9px 14px", color: "#8A8780" }}>{r.email || "—"}</td>
                      <td style={{ padding: "9px 14px", color: "#8A8780" }}>{r.phone || "—"}</td>
                      <td style={{ padding: "9px 14px", color: "#8A8780" }}>{r.birth_date || "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {error && <p style={{ color: "#EF4444", fontSize: 13, marginTop: 12 }}>{error}</p>}

            <button
              onClick={handleImport} disabled={loading || !selectedGym}
              style={{ marginTop: 20, background: loading ? "#8A8780" : "#FF5A1F", color: "#0B0D10", fontWeight: 700, fontSize: 15, padding: "13px 28px", borderRadius: 9, border: "none", cursor: loading ? "not-allowed" : "pointer", fontFamily: "inherit" }}
            >
              {loading ? "Importando..." : `Importar ${rows.length} socios al gym seleccionado →`}
            </button>
          </Section>
        )}

        {/* Result */}
        {result && (
          <div style={{ background: "rgba(76,138,23,0.12)", border: "1px solid rgba(76,138,23,0.4)", borderRadius: 12, padding: "20px 24px", marginTop: 24 }}>
            <p style={{ color: "#7DB83A", fontWeight: 700, fontSize: 16, margin: "0 0 4px" }}>✓ Importación exitosa</p>
            <p style={{ color: "#8A8780", fontSize: 14, margin: 0 }}>{result.inserted} socios cargados correctamente.</p>
          </div>
        )}

        {!rows.length && error && (
          <p style={{ color: "#EF4444", fontSize: 14, marginTop: 12 }}>{error}</p>
        )}
      </div>
    </div>
  );
}

function Section({ n, title, children }: { n: string; title: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 32 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 16 }}>
        <div style={{ width: 28, height: 28, borderRadius: "50%", background: "#FF5A1F", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 13, color: "#0B0D10", flexShrink: 0 }}>{n}</div>
        <span style={{ fontWeight: 600, fontSize: 16 }}>{title}</span>
      </div>
      <div style={{ paddingLeft: 40 }}>{children}</div>
    </div>
  );
}
