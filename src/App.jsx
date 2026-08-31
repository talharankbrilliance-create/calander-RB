import React, { useState, useEffect, useCallback, useRef } from "react";

/*
 * DATE VERIFICATION:
 * September 2026 — 30 days, Sep 1 = Tuesday
 * Grid: Mon-based, offset = 1
 *
 * EVENT VERIFICATION:
 * Defence Day — 6 September (fixed) — National Day
 * Eid Milad-un-Nabi — ~25-26 Aug 2026 — NOT in September. EXCLUDED.
 *
 * SUPABASE:
 * Table: public.events
 * RLS: SELECT for anon, INSERT/UPDATE/DELETE for admin UUID only
 */

// ── Supabase config (anon/publishable key — safe for frontend) ──
const SB_URL = "https://sareoammotgevuolryqb.supabase.co";
const SB_KEY = "sb_publishable_UYJ8AC4BEXPmrHShs-rnSA_qKH6IknC";

function sbHeaders(token) {
  const h = {
    apikey: SB_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
  };
  if (token) h["Authorization"] = `Bearer ${token}`;
  else h["Authorization"] = `Bearer ${SB_KEY}`;
  return h;
}

async function sbFetch(path, opts = {}, token) {
  const res = await fetch(`${SB_URL}${path}`, {
    ...opts,
    headers: { ...sbHeaders(token), ...(opts.headers || {}) },
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }
  const ct = res.headers.get("content-type") || "";
  if (ct.includes("json")) return res.json();
  return null;
}

// ── Design tokens (unchanged) ──
const C = {
  navy: "#0b1530",
  card: "#111d3a",
  cardHover: "#162347",
  cardSelected: "#1a2d56",
  border: "#1e2f54",
  lime: "#c8f525",
  limeDim: "rgba(200,245,37,0.12)",
  white: "#f0f2f7",
  textMuted: "#7b87a3",
  textDim: "#4e5a74",
  blue: "#4e99f7",
  blueDim: "rgba(78,153,247,0.14)",
  red: "#e05265",
  redDim: "rgba(224,82,101,0.12)",
  green: "#34d399",
};

const DAYS_HEADER = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const START_OFFSET = 1;
const TOTAL_DAYS = 30;

const OFFICIAL_EVENTS = {
  6: {
    id: "official-defence-day",
    name: "Defence Day (Youm-e-Difa)",
    type: "National Day",
    holiday: "National day; not a gazetted public holiday since 2017",
    description:
      "Commemorates the defence of Pakistan during the 1965 India–Pakistan war. Marked with flag hoisting, military parades, award ceremonies, and tributes to the armed forces across the country. September 6 is observed annually on this fixed date.",
    official: true,
    color: C.lime,
  },
};

function buildGrid() {
  const cells = [];
  for (let i = 0; i < START_OFFSET; i++) cells.push(null);
  for (let d = 1; d <= TOTAL_DAYS; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  const rows = [];
  for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
  return rows;
}

const GRID = buildGrid();

const inputStyle = {
  background: "rgba(255,255,255,0.04)",
  border: `1px solid ${C.border}`,
  borderRadius: 6,
  padding: "9px 12px",
  color: C.white,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

// ── Helpers ──
function dateToDay(dateStr) {
  // "2026-09-15" → 15
  if (!dateStr) return null;
  const d = new Date(dateStr + "T00:00:00");
  if (d.getMonth() !== 8 || d.getFullYear() !== 2026) return null;
  return d.getDate();
}
function dayToDate(day) {
  return `2026-09-${String(day).padStart(2, "0")}`;
}

function rowToEvent(row) {
  return {
    id: row.id,
    name: row.event_name,
    type: row.event_type || "Custom Event",
    holiday: row.is_public_holiday ? "Public Holiday" : "Not a Public Holiday",
    description: row.description || "",
    official: false,
    isOffice: row.is_office_event || false,
    color: row.is_office_event ? C.green : C.blue,
  };
}

// ══════════════════════════════════════════════════════
export default function App() {
  const [selected, setSelected] = useState(null);
  const [dbEvents, setDbEvents] = useState({}); // day → event object
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null); // null | 'add' | 'edit'
  const [form, setForm] = useState({ name: "", type: "", holiday: "Not a Public Holiday", description: "", isOffice: false });
  const [saving, setSaving] = useState(false);

  // Auth state
  const [session, setSession] = useState(null); // { access_token, user }
  const [showLogin, setShowLogin] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdmin = !!session?.access_token;

  // ── Fetch events from Supabase ──
  const fetchEvents = useCallback(async () => {
    try {
      const rows = await sbFetch(
        "/rest/v1/events?select=*&event_date=gte.2026-09-01&event_date=lte.2026-09-30",
        { method: "GET" },
        session?.access_token
      );
      const map = {};
      (rows || []).forEach((r) => {
        const day = dateToDay(r.event_date);
        if (day) map[day] = rowToEvent(r);
      });
      setDbEvents(map);
      setError(null);
    } catch (e) {
      console.error("Fetch events failed:", e);
      setError("Could not load events from database.");
    }
    setLoaded(true);
  }, [session]);

  useEffect(() => { fetchEvents(); }, [fetchEvents]);

  // ── Auth ──
  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) return;
    setLoginLoading(true);
    setLoginError(null);
    try {
      const data = await sbFetch(
        "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          body: JSON.stringify({ email: loginForm.email, password: loginForm.password }),
        }
      );
      if (data?.access_token) {
        setSession({ access_token: data.access_token, user: data.user });
        setShowLogin(false);
        setLoginForm({ email: "", password: "" });
      } else {
        setLoginError("Login failed. Check your credentials.");
      }
    } catch (e) {
      setLoginError("Login failed. Check your credentials.");
    }
    setLoginLoading(false);
  };

  const handleLogout = () => {
    setSession(null);
    setEditing(null);
    setShowLogin(false);
  };

  // ── Combined event getter ──
  const getEvent = (day) => OFFICIAL_EVENTS[day] || dbEvents[day] || null;

  // ── CRUD (admin only, enforced by RLS) ──
  const openAdd = () => {
    setForm({ name: "", type: "", holiday: "Not a Public Holiday", description: "", isOffice: false });
    setEditing("add");
  };

  const openEdit = (ev) => {
    setForm({
      name: ev.name,
      type: ev.type,
      holiday: ev.holiday,
      description: ev.description,
      isOffice: ev.isOffice || false,
    });
    setEditing("edit");
  };

  const saveEvent = async () => {
    if (!form.name.trim() || !selected || !isAdmin) return;
    setSaving(true);
    try {
      const body = {
        event_date: dayToDate(selected),
        event_name: form.name.trim(),
        event_type: form.type || "Custom Event",
        is_public_holiday: form.holiday.toLowerCase().includes("public holiday") && !form.holiday.toLowerCase().includes("not"),
        description: form.description,
        is_office_event: form.isOffice,
      };

      if (editing === "edit" && dbEvents[selected]) {
        // UPDATE
        await sbFetch(
          `/rest/v1/events?id=eq.${dbEvents[selected].id}`,
          { method: "PATCH", body: JSON.stringify(body) },
          session.access_token
        );
      } else {
        // INSERT — check no duplicate for this date
        await sbFetch(
          "/rest/v1/events",
          { method: "POST", body: JSON.stringify(body) },
          session.access_token
        );
      }
      setEditing(null);
      await fetchEvents();
    } catch (e) {
      console.error("Save failed:", e);
      setError("Save failed: " + e.message);
    }
    setSaving(false);
  };

  const deleteEvent = async () => {
    if (!selected || !dbEvents[selected] || !isAdmin) return;
    setSaving(true);
    try {
      await sbFetch(
        `/rest/v1/events?id=eq.${dbEvents[selected].id}`,
        { method: "DELETE" },
        session.access_token
      );
      setEditing(null);
      await fetchEvents();
    } catch (e) {
      console.error("Delete failed:", e);
      setError("Delete failed: " + e.message);
    }
    setSaving(false);
  };

  const moveEvent = async (newDay) => {
    const nd = parseInt(newDay);
    if (!nd || nd < 1 || nd > 30 || nd === selected || !dbEvents[selected] || OFFICIAL_EVENTS[nd] || !isAdmin) return;
    setSaving(true);
    try {
      await sbFetch(
        `/rest/v1/events?id=eq.${dbEvents[selected].id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ event_date: dayToDate(nd) }),
        },
        session.access_token
      );
      setSelected(nd);
      setEditing(null);
      await fetchEvents();
    } catch (e) {
      console.error("Move failed:", e);
    }
    setSaving(false);
  };

  const ev = selected ? getEvent(selected) : null;

  const dayLabel = (day) => {
    const idx = (START_OFFSET + day - 1) % 7;
    return DAYS_HEADER[idx];
  };

  // ══════════════════════════════════════════════════════
  // RENDER — identical layout, only auth controls added
  // ══════════════════════════════════════════════════════
  return (
    <div style={{ minHeight: "100vh", background: C.navy, fontFamily: "'Inter', system-ui, -apple-system, sans-serif", color: C.white, padding: 0 }}>
      {/* Header */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "22px 16px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{ width: 42, height: 42, borderRadius: 10, background: C.card, border: `1.5px solid ${C.border}`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
              <svg width="32" height="32" viewBox="0 0 36 36">
                <text x="1" y="27" fontFamily="Arial Black,Impact,sans-serif" fontWeight="900" fontSize="24" fill={C.lime}>R</text>
                <text x="16" y="27" fontFamily="Arial Black,Impact,sans-serif" fontWeight="900" fontSize="24" fill="#fff">B</text>
              </svg>
            </div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, letterSpacing: "-0.4px" }}>September 2026</h1>
          </div>

          {/* Auth controls — small, top-right */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            {saving && <span style={{ fontSize: 11, color: C.lime }}>Saving…</span>}
            {isAdmin ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 11, color: C.green }}>● Admin</span>
                <button onClick={handleLogout} style={{
                  padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                  border: `1px solid ${C.border}`, background: "transparent", color: C.textMuted, fontFamily: "inherit",
                }}>
                  Logout
                </button>
              </div>
            ) : (
              <button onClick={() => setShowLogin(!showLogin)} style={{
                padding: "5px 12px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer",
                border: `1px solid ${C.border}`, background: "transparent", color: C.textDim, fontFamily: "inherit",
              }}>
                Admin
              </button>
            )}
          </div>
        </div>

        {/* Login panel — slides open when clicked */}
        {showLogin && !isAdmin && (
          <div style={{
            marginTop: 12, background: C.card, border: `1px solid ${C.border}`, borderRadius: 10,
            padding: "16px 18px", maxWidth: 340,
            marginLeft: "auto",
          }}>
            <p style={{ margin: "0 0 10px", fontSize: 13, fontWeight: 600, color: C.white }}>Admin login</p>
            <input
              placeholder="Email" type="email" value={loginForm.email}
              onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
              style={{ ...inputStyle, marginBottom: 8 }}
            />
            <input
              placeholder="Password" type="password" value={loginForm.password}
              onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
              onKeyDown={(e) => { if (e.key === "Enter") handleLogin(); }}
              style={{ ...inputStyle, marginBottom: 10 }}
            />
            {loginError && <p style={{ margin: "0 0 8px", fontSize: 12, color: C.red }}>{loginError}</p>}
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={handleLogin} disabled={loginLoading} style={{
                padding: "7px 18px", borderRadius: 6, border: "none",
                background: C.lime, color: C.navy, fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit",
              }}>
                {loginLoading ? "Signing in…" : "Sign in"}
              </button>
              <button onClick={() => { setShowLogin(false); setLoginError(null); }} style={{
                padding: "7px 14px", borderRadius: 6, border: `1px solid ${C.border}`,
                background: "transparent", color: C.textMuted, fontSize: 12, cursor: "pointer", fontFamily: "inherit",
              }}>
                Cancel
              </button>
            </div>
          </div>
        )}

        {error && (
          <p style={{ margin: "8px 0 0", fontSize: 12, color: C.red }}>{error}</p>
        )}
      </div>

      {/* Calendar */}
      <div style={{ maxWidth: 860, margin: "18px auto 0", padding: "0 16px" }}>
        {/* Day headers */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {DAYS_HEADER.map((d, i) => (
            <div key={d} style={{
              textAlign: "center", padding: "10px 0", fontSize: 11, fontWeight: 700, letterSpacing: "0.3px",
              color: i >= 5 ? (i === 6 ? C.red : C.blue) : C.textMuted,
              background: C.card,
              borderRadius: i === 0 ? "10px 0 0 0" : i === 6 ? "0 10px 0 0" : 0,
            }}>
              {d}
            </div>
          ))}
        </div>

        {/* Grid rows */}
        {GRID.map((row, ri) => (
          <div key={ri} style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginTop: 2 }}>
            {row.map((day, ci) => {
              if (!day) {
                return <div key={ci} style={{
                  background: C.card, minHeight: 76, opacity: 0.4,
                  borderRadius: ri === GRID.length - 1 && ci === 0 ? "0 0 0 10px" : ri === GRID.length - 1 && ci === 6 ? "0 0 10px 0" : 0,
                }} />;
              }
              const event = getEvent(day);
              const isSel = day === selected;
              const isWeekend = ci >= 5;
              return (
                <div
                  key={ci}
                  onClick={() => { setSelected(day); setEditing(null); }}
                  style={{
                    background: isSel ? C.cardSelected : C.card,
                    minHeight: 76, padding: "7px 8px", cursor: "pointer",
                    border: isSel ? `2px solid ${C.lime}` : "2px solid transparent",
                    borderRadius: ri === GRID.length - 1 && ci === 0 ? "0 0 0 10px" : ri === GRID.length - 1 && ci === 6 ? "0 0 10px 0" : 0,
                    transition: "border-color 0.12s, background 0.12s",
                    position: "relative",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between",
                  }}
                >
                  <span style={{
                    fontSize: 15, fontWeight: isSel ? 700 : 500,
                    color: isSel ? C.lime : ci === 6 ? C.red : isWeekend ? C.blue : C.white,
                  }}>
                    {day}
                  </span>

                  {event && (
                    <>
                      <span style={{ fontSize: 9, color: C.textMuted, marginTop: 2, lineHeight: 1.25, display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                        {event.name}
                      </span>
                      <div style={{
                        position: "absolute", bottom: 5, left: 7, right: 7, height: 3, borderRadius: 2,
                        background: event.color || C.lime,
                      }} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ maxWidth: 860, margin: "10px auto 0", padding: "0 16px", display: "flex", gap: 20, fontSize: 11, color: C.textMuted }}>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: C.lime, display: "inline-block" }} />
          Official event
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: C.blue, display: "inline-block" }} />
          Custom event
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
          <span style={{ width: 14, height: 3, borderRadius: 2, background: C.green, display: "inline-block" }} />
          Office event
        </span>
      </div>

      {/* Detail panel */}
      <div style={{ maxWidth: 860, margin: "20px auto 32px", padding: "0 16px" }}>
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: "20px 22px", minHeight: 80 }}>
          {!selected ? (
            <p style={{ margin: 0, color: C.textMuted, fontSize: 14 }}>Select a date to view or add event details.</p>
          ) : editing === "add" || editing === "edit" ? (
            /* ——— FORM (admin only) ——— */
            <div>
              <p style={{ margin: "0 0 14px", fontSize: 13, fontWeight: 600, color: C.lime }}>
                {editing === "add" ? "Add event" : "Edit event"} — {selected} September 2026 ({dayLabel(selected)})
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 10, maxWidth: 440 }}>
                <input placeholder="Event name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                <input placeholder="Event type (e.g. Office Event)" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} style={inputStyle} />
                <input placeholder="Holiday status (e.g. Public Holiday or Not a Public Holiday)" value={form.holiday} onChange={(e) => setForm({ ...form, holiday: e.target.value })} style={inputStyle} />
                <textarea placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} style={{ ...inputStyle, resize: "vertical" }} />
                <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.textMuted, cursor: "pointer" }}>
                  <input type="checkbox" checked={form.isOffice} onChange={(e) => setForm({ ...form, isOffice: e.target.checked })} />
                  Mark as office event
                </label>
                <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                  <button onClick={saveEvent} disabled={!form.name.trim() || saving} style={{
                    padding: "8px 20px", borderRadius: 6, border: "none", cursor: form.name.trim() ? "pointer" : "default",
                    background: form.name.trim() ? C.lime : C.border, color: form.name.trim() ? C.navy : C.textDim,
                    fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                  }}>
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button onClick={() => setEditing(null)} style={{
                    padding: "8px 16px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent",
                    color: C.textMuted, cursor: "pointer", fontSize: 13, fontFamily: "inherit",
                  }}>
                    Cancel
                  </button>
                  {editing === "edit" && (
                    <button onClick={deleteEvent} disabled={saving} style={{
                      padding: "8px 16px", borderRadius: 6, border: "none",
                      background: C.redDim, color: C.red, cursor: "pointer", fontSize: 13, fontWeight: 600, fontFamily: "inherit",
                    }}>
                      Delete event
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : ev ? (
            /* ——— EVENT DETAIL ——— */
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.lime }}>{selected} September 2026 — {dayLabel(selected)}</p>
                  <h2 style={{ margin: "4px 0 0", fontSize: 20, fontWeight: 700 }}>{ev.name}</h2>
                </div>
                {/* Admin-only edit/delete buttons — hidden for public */}
                {!ev.official && isAdmin && (
                  <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
                    <button onClick={() => openEdit(ev)} style={{
                      padding: "6px 14px", borderRadius: 6, border: `1px solid ${C.border}`, background: "transparent",
                      color: C.white, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    }}>
                      Edit
                    </button>
                    <button onClick={deleteEvent} disabled={saving} style={{
                      padding: "6px 14px", borderRadius: 6, border: "none",
                      background: C.redDim, color: C.red, cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit",
                    }}>
                      Delete
                    </button>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                <span style={{
                  background: ev.official ? C.limeDim : ev.isOffice ? "rgba(52,211,153,0.12)" : C.blueDim,
                  color: ev.official ? C.lime : ev.isOffice ? C.green : C.blue,
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {ev.type}
                </span>
                <span style={{
                  background: "rgba(255,255,255,0.05)", color: C.textMuted,
                  padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                }}>
                  {ev.holiday}
                </span>
                {ev.isOffice && (
                  <span style={{
                    background: "rgba(52,211,153,0.12)", color: C.green,
                    padding: "3px 10px", borderRadius: 20, fontSize: 11, fontWeight: 600,
                  }}>
                    Office Event
                  </span>
                )}
              </div>

              {ev.description && (
                <p style={{ margin: "14px 0 0", fontSize: 14, color: C.textMuted, lineHeight: 1.65 }}>{ev.description}</p>
              )}

              {/* Move-to-date — admin only */}
              {!ev.official && isAdmin && (
                <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 8, fontSize: 12, color: C.textMuted }}>
                  <span>Move to date:</span>
                  <input
                    type="number" min={1} max={30} placeholder="Day"
                    onKeyDown={(e) => { if (e.key === "Enter") moveEvent(e.target.value); }}
                    onBlur={(e) => { if (e.target.value) moveEvent(e.target.value); }}
                    style={{ ...inputStyle, width: 70, padding: "5px 8px", fontSize: 12 }}
                  />
                </div>
              )}
            </div>
          ) : (
            /* ——— EMPTY DATE ——— */
            <div>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 600, color: C.lime }}>{selected} September 2026 — {dayLabel(selected)}</p>
              <p style={{ margin: "8px 0 16px", color: C.textMuted, fontSize: 14 }}>No event for this date.</p>
              {/* Add button — admin only */}
              {isAdmin && (
                <button onClick={openAdd} style={{
                  padding: "8px 20px", borderRadius: 6, border: "none",
                  background: C.lime, color: C.navy, cursor: "pointer", fontSize: 13, fontWeight: 700, fontFamily: "inherit",
                }}>
                  Add custom event
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Data accuracy footer */}
      <div style={{ maxWidth: 860, margin: "0 auto", padding: "0 16px 24px", fontSize: 11, color: C.textDim, lineHeight: 1.6 }}>
        <p style={{ margin: 0 }}>
          Data note: Eid Milad-un-Nabi (12 Rabi al-Awwal 1448 AH) falls approximately 25–26 August 2026 per Pakistan moon-sighting forecasts, and is therefore not shown in this September calendar. Defence Day is observed on September 6 every year.
        </p>
      </div>
    </div>
  );
}
