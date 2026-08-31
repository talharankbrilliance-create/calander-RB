import React, { useState, useEffect, useCallback } from "react";

/* =========================================================
   RB OFFICE CALENDAR — SEPTEMBER TO DECEMBER 2026
   =========================================================
   Features:
   - September, October, November, December 2026
   - Dynamic calendar dates
   - Supabase events
   - Admin login
   - Add / Edit / Delete / Move events
   - Office / Meeting / Travel / Important / Custom events
   - Pakistan national/official events
   - Responsive full-width layout
   ========================================================= */

// ─────────────────────────────────────────────
// SUPABASE
// ─────────────────────────────────────────────

const SB_URL = "https://sareoammotgevuolryqb.supabase.co";
const SB_KEY = "sb_publishable_UYJ8AC4BEXPmrHShs-rnSA_qKH6IknC";

function sbHeaders(token) {
  return {
    apikey: SB_KEY,
    "Content-Type": "application/json",
    Prefer: "return=representation",
    Authorization: `Bearer ${token || SB_KEY}`,
  };
}

async function sbFetch(path, opts = {}, token) {
  const res = await fetch(`${SB_URL}${path}`, {
    ...opts,
    headers: {
      ...sbHeaders(token),
      ...(opts.headers || {}),
    },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Supabase ${res.status}: ${text}`);
  }

  const contentType = res.headers.get("content-type") || "";

  if (contentType.includes("json")) {
    return res.json();
  }

  return null;
}

// ─────────────────────────────────────────────
// DESIGN
// ─────────────────────────────────────────────

const C = {
  navy: "#081126",
  navy2: "#0b1530",

  card: "#111d3a",
  cardHover: "#162347",
  cardSelected: "#1b315d",

  border: "#203257",

  lime: "#c8f525",
  limeDim: "rgba(200,245,37,0.12)",

  white: "#f0f2f7",
  textMuted: "#7f8ba7",
  textDim: "#53607d",

  blue: "#4e99f7",
  blueDim: "rgba(78,153,247,0.14)",

  green: "#34d399",
  greenDim: "rgba(52,211,153,0.12)",

  orange: "#fb923c",
  orangeDim: "rgba(251,146,60,0.12)",

  purple: "#a78bfa",
  purpleDim: "rgba(167,139,250,0.12)",

  red: "#e05265",
  redDim: "rgba(224,82,101,0.12)",
};

const MONTHS = [
  { month: 9, name: "September", short: "Sep" },
  { month: 10, name: "October", short: "Oct" },
  { month: 11, name: "November", short: "Nov" },
  { month: 12, name: "December", short: "Dec" },
];

const YEAR = 2026;

const DAYS_HEADER = [
  "Mon",
  "Tue",
  "Wed",
  "Thu",
  "Fri",
  "Sat",
  "Sun",
];

// ─────────────────────────────────────────────
// OFFICIAL PAKISTAN EVENTS
// ─────────────────────────────────────────────

const OFFICIAL_EVENTS = {
  "2026-09-06": {
    id: "official-defence-day",
    name: "Defence Day (Youm-e-Difa)",
    type: "National Day",
    holiday: "National Day",
    description:
      "Commemorates the defence of Pakistan during the 1965 India–Pakistan war. Observed annually on September 6 with tributes and national ceremonies.",
    official: true,
    color: C.lime,
  },

  "2026-09-07": {
    id: "official-air-force-day",
    name: "Air Force Day",
    type: "National Event",
    holiday: "National Observance",
    description:
      "Pakistan Air Force Day is observed on September 7 in remembrance of the role of the Pakistan Air Force during the 1965 war.",
    official: true,
    color: C.lime,
  },

  "2026-11-09": {
    id: "official-iqbal-day",
    name: "Iqbal Day",
    type: "National Day",
    holiday: "Public Holiday / National Day",
    description:
      "Iqbal Day commemorates the birth anniversary of Allama Muhammad Iqbal on November 9.",
    official: true,
    color: C.lime,
  },

  "2026-12-25": {
    id: "official-quaid-day",
    name: "Quaid-e-Azam Day",
    type: "National Day",
    holiday: "Public Holiday",
    description:
      "Commemorates the birth anniversary of Quaid-e-Azam Muhammad Ali Jinnah on December 25.",
    official: true,
    color: C.lime,
  },
};

// ─────────────────────────────────────────────
// EVENT TYPES
// ─────────────────────────────────────────────

const EVENT_TYPES = [
  {
    value: "Office Event",
    color: C.green,
    background: C.greenDim,
  },
  {
    value: "Meeting",
    color: C.purple,
    background: C.purpleDim,
  },
  {
    value: "Travel / Outside",
    color: C.orange,
    background: C.orangeDim,
  },
  {
    value: "Important",
    color: C.red,
    background: C.redDim,
  },
  {
    value: "Custom Event",
    color: C.blue,
    background: C.blueDim,
  },
];

function getTypeStyle(type, isOfficial = false) {
  if (isOfficial) {
    return {
      color: C.lime,
      background: C.limeDim,
    };
  }

  const found = EVENT_TYPES.find(
    (item) => item.value === type
  );

  return (
    found || {
      color: C.blue,
      background: C.blueDim,
    }
  );
}

// ─────────────────────────────────────────────
// DATE HELPERS
// ─────────────────────────────────────────────

function pad(value) {
  return String(value).padStart(2, "0");
}

function dateKey(year, month, day) {
  return `${year}-${pad(month)}-${pad(day)}`;
}

function getDaysInMonth(year, month) {
  return new Date(year, month, 0).getDate();
}

function getMondayBasedOffset(year, month) {
  const firstDay = new Date(year, month - 1, 1).getDay();

  return firstDay === 0 ? 6 : firstDay - 1;
}

function buildMonthGrid(month) {
  const daysInMonth = getDaysInMonth(YEAR, month);
  const offset = getMondayBasedOffset(YEAR, month);

  const cells = [];

  for (let i = 0; i < offset; i++) {
    cells.push(null);
  }

  for (let day = 1; day <= daysInMonth; day++) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows = [];

  for (let i = 0; i < cells.length; i += 7) {
    rows.push(cells.slice(i, i + 7));
  }

  return rows;
}

function getDayName(year, month, day) {
  const date = new Date(year, month - 1, day);
  const jsDay = date.getDay();

  return DAYS_HEADER[jsDay === 0 ? 6 : jsDay - 1];
}

function formatDateForDisplay(month, day) {
  const monthName =
    MONTHS.find((m) => m.month === month)?.name || "";

  return `${day} ${monthName} ${YEAR}`;
}

// ─────────────────────────────────────────────
// SUPABASE ROW
// ─────────────────────────────────────────────

function rowToEvent(row) {
  return {
    id: row.id,
    date: row.event_date,
    name: row.event_name,
    type: row.event_type || "Custom Event",
    holiday: row.is_public_holiday
      ? "Public Holiday"
      : "Not a Public Holiday",
    description: row.description || "",
    official: false,
    isOffice: Boolean(row.is_office_event),
    color: row.is_office_event
      ? C.green
      : getTypeStyle(row.event_type).color,
  };
}

// ─────────────────────────────────────────────
// INPUT STYLE
// ─────────────────────────────────────────────

const inputStyle = {
  background: "rgba(255,255,255,0.045)",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "10px 12px",
  color: C.white,
  fontSize: 13,
  outline: "none",
  width: "100%",
  boxSizing: "border-box",
  fontFamily: "inherit",
};

const buttonBase = {
  borderRadius: 8,
  fontFamily: "inherit",
  cursor: "pointer",
};

// =========================================================
// APP
// =========================================================

export default function App() {
  const [activeMonth, setActiveMonth] = useState(9);

  const [selected, setSelected] = useState(null);

  const [dbEvents, setDbEvents] = useState({});

  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);

  const [editing, setEditing] = useState(null);

  const [saving, setSaving] = useState(false);

  // ─────────────────────────────────────────────
  // FORM
  // ─────────────────────────────────────────────

  const emptyForm = {
    name: "",
    type: "Office Event",
    holiday: "Not a Public Holiday",
    description: "",
    isOffice: true,
  };

  const [form, setForm] = useState(emptyForm);

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────

  const [session, setSession] = useState(null);

  const [showLogin, setShowLogin] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdmin = Boolean(session?.access_token);

  // ─────────────────────────────────────────────
  // CURRENT MONTH
  // ─────────────────────────────────────────────

  const currentMonth =
    MONTHS.find((item) => item.month === activeMonth) ||
    MONTHS[0];

  // ─────────────────────────────────────────────
  // FETCH EVENTS
  // ─────────────────────────────────────────────

  const fetchEvents = useCallback(async () => {
    try {
      const rows = await sbFetch(
        `/rest/v1/events?select=*&event_date=gte.${YEAR}-09-01&event_date=lte.${YEAR}-12-31&order=event_date.asc`,
        {
          method: "GET",
        },
        session?.access_token
      );

      const map = {};

      (rows || []).forEach((row) => {
        if (row.event_date) {
          map[row.event_date] = rowToEvent(row);
        }
      });

      setDbEvents(map);
      setError(null);
    } catch (e) {
      console.error("Fetch events failed:", e);

      setError(
        "Could not load events from database."
      );
    }

    setLoaded(true);
  }, [session]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // ─────────────────────────────────────────────
  // GET EVENT
  // ─────────────────────────────────────────────

  const getEvent = (month, day) => {
    const key = dateKey(YEAR, month, day);

    return (
      OFFICIAL_EVENTS[key] ||
      dbEvents[key] ||
      null
    );
  };

  // ─────────────────────────────────────────────
  // SELECT DATE
  // ─────────────────────────────────────────────

  const selectDate = (day) => {
    setSelected({
      month: activeMonth,
      day,
    });

    setEditing(null);
  };

  // ─────────────────────────────────────────────
  // MONTH CHANGE
  // ─────────────────────────────────────────────

  const changeMonth = (month) => {
    setActiveMonth(month);
    setSelected(null);
    setEditing(null);
    setError(null);
  };

  // ─────────────────────────────────────────────
  // LOGIN
  // ─────────────────────────────────────────────

  const handleLogin = async () => {
    if (
      !loginForm.email ||
      !loginForm.password
    ) {
      setLoginError(
        "Please enter email and password."
      );
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const data = await sbFetch(
        "/auth/v1/token?grant_type=password",
        {
          method: "POST",
          body: JSON.stringify({
            email: loginForm.email,
            password: loginForm.password,
          }),
        }
      );

      if (data?.access_token) {
        setSession({
          access_token: data.access_token,
          user: data.user,
        });

        setShowLogin(false);

        setLoginForm({
          email: "",
          password: "",
        });
      } else {
        setLoginError(
          "Login failed. Check your credentials."
        );
      }
    } catch (e) {
      console.error("Login failed:", e);

      setLoginError(
        "Login failed. Check your credentials."
      );
    }

    setLoginLoading(false);
  };

  // ─────────────────────────────────────────────
  // LOGOUT
  // ─────────────────────────────────────────────

  const handleLogout = () => {
    setSession(null);
    setEditing(null);
    setSelected(null);
    setShowLogin(false);
  };

  // ─────────────────────────────────────────────
  // OPEN ADD
  // ─────────────────────────────────────────────

  const openAdd = () => {
    if (!isAdmin || !selected) return;

    const selectedKey = dateKey(
      YEAR,
      selected.month,
      selected.day
    );

    if (OFFICIAL_EVENTS[selectedKey]) {
      setError(
        "This is an official event and cannot be edited."
      );
      return;
    }

    setForm({
      ...emptyForm,
    });

    setEditing("add");
    setError(null);
  };

  // ─────────────────────────────────────────────
  // OPEN EDIT
  // ─────────────────────────────────────────────

  const openEdit = (event) => {
    if (!isAdmin || !event || event.official) {
      return;
    }

    setForm({
      name: event.name,
      type: event.type || "Custom Event",
      holiday:
        event.holiday ||
        "Not a Public Holiday",
      description: event.description || "",
      isOffice: Boolean(event.isOffice),
    });

    setEditing("edit");
    setError(null);
  };

  // ─────────────────────────────────────────────
  // SAVE
  // ─────────────────────────────────────────────

  const saveEvent = async () => {
    if (
      !form.name.trim() ||
      !selected ||
      !isAdmin
    ) {
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const key = dateKey(
        YEAR,
        selected.month,
        selected.day
      );

      const holidayText =
        form.holiday.toLowerCase();

      const body = {
        event_date: key,
        event_name: form.name.trim(),
        event_type:
          form.type.trim() || "Custom Event",

        is_public_holiday:
          holidayText.includes(
            "public holiday"
          ) &&
          !holidayText.includes("not"),

        description:
          form.description.trim(),

        is_office_event:
          form.isOffice,
      };

      const existing = dbEvents[key];

      if (
        editing === "edit" &&
        existing
      ) {
        await sbFetch(
          `/rest/v1/events?id=eq.${existing.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(body),
          },
          session.access_token
        );
      } else {
        await sbFetch(
          "/rest/v1/events",
          {
            method: "POST",
            body: JSON.stringify(body),
          },
          session.access_token
        );
      }

      setEditing(null);

      await fetchEvents();
    } catch (e) {
      console.error("Save failed:", e);

      setError(
        `Save failed: ${e.message}`
      );
    }

    setSaving(false);
  };

  // ─────────────────────────────────────────────
  // DELETE
  // ─────────────────────────────────────────────

  const deleteEvent = async () => {
    if (
      !selected ||
      !isAdmin
    ) {
      return;
    }

    const key = dateKey(
      YEAR,
      selected.month,
      selected.day
    );

    const event = dbEvents[key];

    if (!event) return;

    const confirmed = window.confirm(
      `Delete "${event.name}"?`
    );

    if (!confirmed) return;

    setSaving(true);
    setError(null);

    try {
      await sbFetch(
        `/rest/v1/events?id=eq.${event.id}`,
        {
          method: "DELETE",
        },
        session.access_token
      );

      setEditing(null);

      await fetchEvents();
    } catch (e) {
      console.error("Delete failed:", e);

      setError(
        `Delete failed: ${e.message}`
      );
    }

    setSaving(false);
  };

  // ─────────────────────────────────────────────
  // MOVE EVENT
  // ─────────────────────────────────────────────

  const moveEvent = async (
    newMonth,
    newDay
  ) => {
    if (
      !selected ||
      !isAdmin
    ) {
      return;
    }

    const oldKey = dateKey(
      YEAR,
      selected.month,
      selected.day
    );

    const event = dbEvents[oldKey];

    if (!event) return;

    const dayNumber = parseInt(
      newDay,
      10
    );

    const monthNumber = parseInt(
      newMonth,
      10
    );

    if (
      !MONTHS.some(
        (m) => m.month === monthNumber
      )
    ) {
      return;
    }

    const maxDays =
      getDaysInMonth(
        YEAR,
        monthNumber
      );

    if (
      !dayNumber ||
      dayNumber < 1 ||
      dayNumber > maxDays
    ) {
      return;
    }

    const newKey = dateKey(
      YEAR,
      monthNumber,
      dayNumber
    );

    if (
      OFFICIAL_EVENTS[newKey] ||
      dbEvents[newKey]
    ) {
      setError(
        "That date already has an event."
      );
      return;
    }

    setSaving(true);
    setError(null);

    try {
      await sbFetch(
        `/rest/v1/events?id=eq.${event.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            event_date: newKey,
          }),
        },
        session.access_token
      );

      setActiveMonth(monthNumber);

      setSelected({
        month: monthNumber,
        day: dayNumber,
      });

      await fetchEvents();
    } catch (e) {
      console.error("Move failed:", e);

      setError(
        `Move failed: ${e.message}`
      );
    }

    setSaving(false);
  };

  // ─────────────────────────────────────────────
  // SELECTED EVENT
  // ─────────────────────────────────────────────

  const selectedEvent = selected
    ? getEvent(
        selected.month,
        selected.day
      )
    : null;

  const selectedKey = selected
    ? dateKey(
        YEAR,
        selected.month,
        selected.day
      )
    : null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        width: "100%",
        background: `
          radial-gradient(
            circle at 50% -10%,
            rgba(78,153,247,0.08),
            transparent 38%
          ),
          ${C.navy}
        `,
        color: C.white,
        fontFamily:
          "'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
        boxSizing: "border-box",
      }}
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <header
        style={{
          width: "100%",
          borderBottom:
            `1px solid ${C.border}`,
          background:
            "rgba(8,17,38,0.92)",
          backdropFilter:
            "blur(12px)",
          position: "sticky",
          top: 0,
          zIndex: 20,
        }}
      >
        <div
          style={{
            maxWidth: 1180,
            margin: "0 auto",
            padding:
              "18px 22px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 20,
              flexWrap: "wrap",
            }}
          >
            {/* BRAND */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 12,
                  background:
                    "linear-gradient(135deg,#16264b,#0e1933)",
                  border:
                    `1px solid ${C.border}`,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  boxShadow:
                    "0 8px 30px rgba(0,0,0,.2)",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="36"
                  height="36"
                  viewBox="0 0 36 36"
                >
                  <text
                    x="1"
                    y="27"
                    fontFamily="Arial Black, Impact, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    fill={C.lime}
                  >
                    R
                  </text>

                  <text
                    x="16"
                    y="27"
                    fontFamily="Arial Black, Impact, sans-serif"
                    fontWeight="900"
                    fontSize="24"
                    fill="#fff"
                  >
                    B
                  </text>
                </svg>
              </div>

              <div>
                <div
                  style={{
                    fontSize: 10,
                    color: C.lime,
                    fontWeight: 700,
                    letterSpacing:
                      "1.5px",
                    textTransform:
                      "uppercase",
                    marginBottom: 3,
                  }}
                >
                  Office Planning
                </div>

                <h1
                  style={{
                    margin: 0,
                    fontSize: 23,
                    lineHeight: 1.1,
                    fontWeight: 750,
                    letterSpacing:
                      "-0.5px",
                  }}
                >
                  RB Office Calendar
                </h1>

                <p
                  style={{
                    margin:
                      "5px 0 0",
                    color:
                      C.textMuted,
                    fontSize: 12,
                  }}
                >
                  Plan meetings, office activities,
                  travel & important events
                </p>
              </div>
            </div>

            {/* ADMIN */}

            <div
              style={{
                position:
                  "relative",
              }}
            >
              {saving && (
                <span
                  style={{
                    position:
                      "absolute",
                    right: 0,
                    top: -19,
                    fontSize: 10,
                    color:
                      C.lime,
                  }}
                >
                  Saving…
                </span>
              )}

              {isAdmin ? (
                <div
                  style={{
                    display: "flex",
                    alignItems:
                      "center",
                    gap: 9,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 7,
                      padding:
                        "8px 12px",
                      borderRadius: 9,
                      background:
                        C.greenDim,
                      border:
                        `1px solid rgba(52,211,153,.22)`,
                      color:
                        C.green,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    <span>●</span>
                    Admin Mode
                  </div>

                  <button
                    onClick={
                      handleLogout
                    }
                    style={{
                      ...buttonBase,
                      padding:
                        "8px 13px",
                      border:
                        `1px solid ${C.border}`,
                      background:
                        "transparent",
                      color:
                        C.textMuted,
                      fontSize: 11,
                      fontWeight: 600,
                    }}
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() =>
                    setShowLogin(
                      !showLogin
                    )
                  }
                  style={{
                    ...buttonBase,
                    padding:
                      "9px 17px",
                    border:
                      `1px solid ${C.border}`,
                    background:
                      "linear-gradient(135deg,#17264a,#111d3a)",
                    color: C.white,
                    fontSize: 12,
                    fontWeight: 700,
                    boxShadow:
                      "0 5px 20px rgba(0,0,0,.15)",
                  }}
                >
                  🔐 Admin
                </button>
              )}

              {/* LOGIN PANEL */}

              {showLogin &&
                !isAdmin && (
                  <div
                    style={{
                      position:
                        "absolute",
                      top:
                        "calc(100% + 10px)",
                      right: 0,
                      width: 310,
                      background:
                        C.card,
                      border:
                        `1px solid ${C.border}`,
                      borderRadius: 12,
                      padding: 17,
                      boxShadow:
                        "0 18px 50px rgba(0,0,0,.4)",
                      zIndex: 30,
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          12,
                      }}
                    >
                      <div
                        style={{
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        Admin Login
                      </div>

                      <div
                        style={{
                          fontSize: 11,
                          color:
                            C.textMuted,
                          marginTop: 3,
                        }}
                      >
                        Sign in to manage
                        office events
                      </div>
                    </div>

                    <input
                      placeholder="Email"
                      type="email"
                      value={
                        loginForm.email
                      }
                      onChange={(e) =>
                        setLoginForm({
                          ...loginForm,
                          email:
                            e.target.value,
                        })
                      }
                      style={{
                        ...inputStyle,
                        marginBottom: 8,
                      }}
                    />

                    <input
                      placeholder="Password"
                      type="password"
                      value={
                        loginForm.password
                      }
                      onChange={(e) =>
                        setLoginForm({
                          ...loginForm,
                          password:
                            e.target.value,
                        })
                      }
                      onKeyDown={(e) => {
                        if (
                          e.key ===
                          "Enter"
                        ) {
                          handleLogin();
                        }
                      }}
                      style={{
                        ...inputStyle,
                        marginBottom: 9,
                      }}
                    />

                    {loginError && (
                      <div
                        style={{
                          fontSize: 11,
                          color:
                            C.red,
                          marginBottom:
                            9,
                        }}
                      >
                        {loginError}
                      </div>
                    )}

                    <div
                      style={{
                        display:
                          "flex",
                        gap: 7,
                      }}
                    >
                      <button
                        onClick={
                          handleLogin
                        }
                        disabled={
                          loginLoading
                        }
                        style={{
                          ...buttonBase,
                          padding:
                            "8px 16px",
                          background:
                            C.lime,
                          color:
                            C.navy,
                          border:
                            "none",
                          fontSize: 12,
                          fontWeight: 800,
                        }}
                      >
                        {loginLoading
                          ? "Signing in…"
                          : "Sign in"}
                      </button>

                      <button
                        onClick={() => {
                          setShowLogin(
                            false
                          );
                          setLoginError(
                            null
                          );
                        }}
                        style={{
                          ...buttonBase,
                          padding:
                            "8px 14px",
                          background:
                            "transparent",
                          color:
                            C.textMuted,
                          border:
                            `1px solid ${C.border}`,
                          fontSize: 12,
                        }}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
          ================================================= */}

      <main
        style={{
          width: "100%",
          maxWidth: 1180,
          margin: "0 auto",
          padding:
            "26px 22px 50px",
          boxSizing: "border-box",
        }}
      >
        {/* INTRO */}

        <section
          style={{
            marginBottom: 22,
          }}
        >
          <div
            style={{
              display:
                "flex",
              alignItems:
                "flex-end",
              justifyContent:
                "space-between",
              gap: 15,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  color:
                    C.textMuted,
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing:
                    ".4px",
                  marginBottom:
                    6,
                }}
              >
                OFFICE CALENDAR
                · {YEAR}
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 27,
                  fontWeight: 750,
                  letterSpacing:
                    "-.6px",
                }}
              >
                Keep the whole team
                <span
                  style={{
                    color:
                      C.lime,
                  }}
                >
                  {" "}
                  on track.
                </span>
              </h2>
            </div>

            {isAdmin && (
              <div
                style={{
                  color:
                    C.green,
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                ● You can manage events
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            MONTH TABS
            ================================================= */}

        <div
          style={{
            background:
              "rgba(17,29,58,.75)",
            border:
              `1px solid ${C.border}`,
            borderRadius: 12,
            padding: 5,
            display:
              "flex",
            gap: 5,
            marginBottom: 18,
            overflowX:
              "auto",
          }}
        >
          {MONTHS.map(
            (month) => {
              const active =
                month.month ===
                activeMonth;

              return (
                <button
                  key={
                    month.month
                  }
                  onClick={() =>
                    changeMonth(
                      month.month
                    )
                  }
                  style={{
                    ...buttonBase,
                    flex: 1,
                    minWidth: 120,
                    padding:
                      "10px 15px",
                    border:
                      active
                        ? `1px solid ${C.lime}`
                        : "1px solid transparent",
                    background:
                      active
                        ? C.limeDim
                        : "transparent",
                    color:
                      active
                        ? C.lime
                        : C.textMuted,
                    fontSize: 12,
                    fontWeight: 750,
                  }}
                >
                  {month.name}{" "}
                  <span
                    style={{
                      opacity:
                        .55,
                      fontWeight:
                        500,
                    }}
                  >
                    {YEAR}
                  </span>
                </button>
              );
            }
          )}
        </div>

        {/* ERROR */}

        {error && (
          <div
            style={{
              background:
                C.redDim,
              border:
                `1px solid rgba(224,82,101,.25)`,
              color: C.red,
              padding:
                "10px 13px",
              borderRadius: 9,
              fontSize: 12,
              marginBottom:
                12,
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            CALENDAR
            ================================================= */}

        <section
          style={{
            background:
              "rgba(17,29,58,.7)",
            border:
              `1px solid ${C.border}`,
            borderRadius: 15,
            overflow:
              "hidden",
            boxShadow:
              "0 20px 60px rgba(0,0,0,.18)",
          }}
        >
          {/* CALENDAR TITLE BAR */}

          <div
            style={{
              padding:
                "16px 18px",
              borderBottom:
                `1px solid ${C.border}`,
              display:
                "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 12,
              flexWrap:
                "wrap",
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 750,
                }}
              >
                {currentMonth.name}{" "}
                {YEAR}
              </div>

              <div
                style={{
                  marginTop: 3,
                  fontSize: 11,
                  color:
                    C.textMuted,
                }}
              >
                Click any date to view
                details
              </div>
            </div>

            <div
              style={{
                fontSize: 11,
                color:
                  C.textMuted,
              }}
            >
              {loaded
                ? "✓ Events synced"
                : "Loading events…"}
            </div>
          </div>

          {/* DAY HEADERS */}

          <div
            style={{
              display:
                "grid",
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",
              gap: 1,
              background:
                C.border,
            }}
          >
            {DAYS_HEADER.map(
              (
                dayName,
                index
              ) => (
                <div
                  key={
                    dayName
                  }
                  style={{
                    background:
                      C.card,
                    textAlign:
                      "center",
                    padding:
                      "11px 4px",
                    fontSize: 10,
                    fontWeight: 750,
                    color:
                      index >= 5
                        ? index ===
                          6
                          ? C.red
                          : C.blue
                        : C.textMuted,
                    letterSpacing:
                      ".4px",
                  }}
                >
                  {dayName}
                </div>
              )
            )}
          </div>

          {/* CALENDAR */}

          {buildMonthGrid(
            activeMonth
          ).map(
            (row, rowIndex) => (
              <div
                key={
                  rowIndex
                }
                style={{
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(7, minmax(0, 1fr))",
                  gap: 1,
                  background:
                    C.border,
                  borderTop:
                    rowIndex
                      ? `1px solid ${C.border}`
                      : "none",
                }}
              >
                {row.map(
                  (
                    day,
                    columnIndex
                  ) => {
                    if (
                      !day
                    ) {
                      return (
                        <div
                          key={
                            columnIndex
                          }
                          style={{
                            minHeight:
                              102,
                            background:
                              "rgba(17,29,58,.38)",
                          }}
                        />
                      );
                    }

                    const key =
                      dateKey(
                        YEAR,
                        activeMonth,
                        day
                      );

                    const event =
                      getEvent(
                        activeMonth,
                        day
                      );

                    const isSelected =
                      selected?.month ===
                        activeMonth &&
                      selected?.day ===
                        day;

                    const isWeekend =
                      columnIndex >=
                      5;

                    const typeStyle =
                      event
                        ? getTypeStyle(
                            event.type,
                            event.official
                          )
                        : null;

                    return (
                      <div
                        key={
                          columnIndex
                        }
                        onClick={() =>
                          selectDate(
                            day
                          )
                        }
                        style={{
                          minHeight:
                            102,
                          padding:
                            "9px 9px 8px",
                          background:
                            isSelected
                              ? C.cardSelected
                              : C.card,
                          cursor:
                            "pointer",
                          position:
                            "relative",
                          boxSizing:
                            "border-box",
                          outline:
                            isSelected
                              ? `2px solid ${C.lime}`
                              : "none",
                          outlineOffset:
                            "-2px",
                          transition:
                            "background .12s ease",
                        }}
                      >
                        {/* DATE */}

                        <div
                          style={{
                            display:
                              "flex",
                            alignItems:
                              "center",
                            justifyContent:
                              "space-between",
                          }}
                        >
                          <span
                            style={{
                              fontSize: 15,
                              fontWeight:
                                isSelected
                                  ? 800
                                  : 600,
                              color:
                                isSelected
                                  ? C.lime
                                  : columnIndex ===
                                    6
                                  ? C.red
                                  : isWeekend
                                  ? C.blue
                                  : C.white,
                            }}
                          >
                            {day}
                          </span>

                          {event && (
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius:
                                  "50%",
                                background:
                                  event.color ||
                                  C.blue,
                                boxShadow:
                                  `0 0 8px ${event.color || C.blue}`,
                              }}
                            />
                          )}
                        </div>

                        {/* EVENT */}

                        {event && (
                          <div
                            style={{
                              marginTop:
                                13,
                              borderRadius:
                                7,
                              padding:
                                "6px 7px",
                              background:
                                typeStyle.background,
                              border:
                                `1px solid ${typeStyle.color}33`,
                            }}
                          >
                            <div
                              style={{
                                color:
                                  typeStyle.color,
                                fontSize: 9,
                                fontWeight:
                                  750,
                                marginBottom:
                                  3,
                                textTransform:
                                  "uppercase",
                                letterSpacing:
                                  ".25px",
                              }}
                            >
                              {event.type}
                            </div>

                            <div
                              style={{
                                color:
                                  C.white,
                                fontSize: 10,
                                lineHeight:
                                  1.3,
                                fontWeight:
                                  600,
                                display:
                                  "-webkit-box",
                                WebkitLineClamp:
                                  2,
                                WebkitBoxOrient:
                                  "vertical",
                                overflow:
                                  "hidden",
                              }}
                            >
                              {event.name}
                            </div>
                          </div>
                        )}

                        {!event && (
                          <div
                            style={{
                              marginTop:
                                22,
                              color:
                                C.textDim,
                              fontSize: 9,
                              opacity:
                                .45,
                            }}
                          >
                            —
                          </div>
                        )}

                        {/* BOTTOM BAR */}

                        {event && (
                          <div
                            style={{
                              position:
                                "absolute",
                              left: 9,
                              right: 9,
                              bottom: 5,
                              height: 2,
                              borderRadius:
                                2,
                              background:
                                event.color ||
                                C.blue,
                            }}
                          />
                        )}
                      </div>
                    );
                  }
                )}
              </div>
            )
          )}
        </section>

        {/* =================================================
            LEGEND
            ================================================= */}

        <div
          style={{
            display:
              "flex",
            alignItems:
              "center",
            gap: 15,
            flexWrap:
              "wrap",
            marginTop: 13,
            padding:
              "0 4px",
            color:
              C.textMuted,
            fontSize: 10,
          }}
        >
          {[
            [
              C.lime,
              "Official / National",
            ],
            [
              C.green,
              "Office Event",
            ],
            [
              C.purple,
              "Meeting",
            ],
            [
              C.orange,
              "Travel / Outside",
            ],
            [
              C.red,
              "Important",
            ],
            [
              C.blue,
              "Custom",
            ],
          ].map(
            ([color, label]) => (
              <span
                key={label}
                style={{
                  display:
                    "flex",
                  alignItems:
                    "center",
                  gap: 5,
                }}
              >
                <span
                  style={{
                    width: 13,
                    height: 3,
                    borderRadius:
                      2,
                    background:
                      color,
                  }}
                />

                {label}
              </span>
            )
          )}
        </div>

        {/* =================================================
            DETAIL PANEL
            ================================================= */}

        <section
          style={{
            marginTop: 20,
            background:
              C.card,
            border:
              `1px solid ${C.border}`,
            borderRadius: 13,
            padding:
              "20px 22px",
            minHeight: 115,
          }}
        >
          {/* NOTHING SELECTED */}

          {!selected ? (
            <div>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color:
                    C.white,
                }}
              >
                Select a date
              </div>

              <p
                style={{
                  margin:
                    "6px 0 0",
                  color:
                    C.textMuted,
                  fontSize: 12,
                }}
              >
                Click any date above to
                view events or add office
                activities.
              </p>
            </div>
          ) : editing ===
              "add" ||
            editing ===
              "edit" ? (
            // ─────────────────────
            // FORM
            // ─────────────────────

            <div>
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: 10,
                  marginBottom:
                    15,
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        C.lime,
                      fontSize: 11,
                      fontWeight:
                        700,
                    }}
                  >
                    {editing ===
                    "add"
                      ? "ADD EVENT"
                      : "EDIT EVENT"}
                  </div>

                  <div
                    style={{
                      marginTop:
                        3,
                      fontSize: 17,
                      fontWeight:
                        750,
                    }}
                  >
                    {formatDateForDisplay(
                      selected.month,
                      selected.day
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  maxWidth:
                    650,
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <input
                  placeholder="Event name *"
                  value={
                    form.name
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name:
                        e.target
                          .value,
                    })
                  }
                  style={{
                    ...inputStyle,
                    gridColumn:
                      "1 / -1",
                  }}
                />

                <select
                  value={
                    form.type
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type:
                        e.target
                          .value,
                    })
                  }
                  style={
                    inputStyle
                  }
                >
                  {EVENT_TYPES.map(
                    (type) => (
                      <option
                        key={
                          type.value
                        }
                        value={
                          type.value
                        }
                        style={{
                          background:
                            C.card,
                        }}
                      >
                        {type.value}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    form.holiday
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      holiday:
                        e.target
                          .value,
                    })
                  }
                  style={
                    inputStyle
                  }
                >
                  <option
                    value="Not a Public Holiday"
                    style={{
                      background:
                        C.card,
                    }}
                  >
                    Not a Public Holiday
                  </option>

                  <option
                    value="Public Holiday"
                    style={{
                      background:
                        C.card,
                    }}
                  >
                    Public Holiday
                  </option>

                  <option
                    value="National Observance"
                    style={{
                      background:
                        C.card,
                    }}
                  >
                    National Observance
                  </option>
                </select>

                <textarea
                  placeholder="Description / notes"
                  value={
                    form.description
                  }
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target
                          .value,
                    })
                  }
                  rows={4}
                  style={{
                    ...inputStyle,
                    resize:
                      "vertical",
                    gridColumn:
                      "1 / -1",
                  }}
                />

                <label
                  style={{
                    display:
                      "flex",
                    alignItems:
                      "center",
                    gap: 8,
                    fontSize: 12,
                    color:
                      C.textMuted,
                    cursor:
                      "pointer",
                  }}
                >
                  <input
                    type="checkbox"
                    checked={
                      form.isOffice
                    }
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isOffice:
                          e.target
                            .checked,
                      })
                    }
                  />
                  Office event
                </label>

                <div
                  style={{
                    display:
                      "flex",
                    justifyContent:
                      "flex-end",
                    gap: 7,
                  }}
                >
                  <button
                    onClick={() =>
                      setEditing(
                        null
                      )
                    }
                    style={{
                      ...buttonBase,
                      padding:
                        "9px 15px",
                      border:
                        `1px solid ${C.border}`,
                      background:
                        "transparent",
                      color:
                        C.textMuted,
                      fontSize: 12,
                    }}
                  >
                    Cancel
                  </button>

                  {editing ===
                    "edit" && (
                    <button
                      onClick={
                        deleteEvent
                      }
                      disabled={
                        saving
                      }
                      style={{
                        ...buttonBase,
                        padding:
                          "9px 15px",
                        border:
                          "none",
                        background:
                          C.redDim,
                        color:
                          C.red,
                        fontSize: 12,
                        fontWeight:
                          700,
                      }}
                    >
                      Delete
                    </button>
                  )}

                  <button
                    onClick={
                      saveEvent
                    }
                    disabled={
                      !form.name.trim() ||
                      saving
                    }
                    style={{
                      ...buttonBase,
                      padding:
                        "9px 18px",
                      border:
                        "none",
                      background:
                        form.name.trim()
                          ? C.lime
                          : C.border,
                      color:
                        form.name.trim()
                          ? C.navy
                          : C.textDim,
                      fontSize: 12,
                      fontWeight:
                        800,
                    }}
                  >
                    {saving
                      ? "Saving…"
                      : "Save Event"}
                  </button>
                </div>
              </div>
            </div>
          ) : selectedEvent ? (
            // ─────────────────────
            // EVENT DETAIL
            // ─────────────────────

            <div>
              <div
                style={{
                  display:
                    "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: 15,
                  flexWrap:
                    "wrap",
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        C.lime,
                      fontSize: 11,
                      fontWeight:
                        700,
                    }}
                  >
                    {formatDateForDisplay(
                      selected.month,
                      selected.day
                    )}{" "}
                    ·{" "}
                    {getDayName(
                      YEAR,
                      selected.month,
                      selected.day
                    )}
                  </div>

                  <h3
                    style={{
                      margin:
                        "5px 0 0",
                      fontSize: 21,
                      fontWeight:
                        750,
                    }}
                  >
                    {
                      selectedEvent.name
                    }
                  </h3>
                </div>

                {!selectedEvent.official &&
                  isAdmin && (
                    <div
                      style={{
                        display:
                          "flex",
                        gap: 7,
                      }}
                    >
                      <button
                        onClick={() =>
                          openEdit(
                            selectedEvent
                          )
                        }
                        style={{
                          ...buttonBase,
                          padding:
                            "7px 14px",
                          background:
                            "transparent",
                          border:
                            `1px solid ${C.border}`,
                          color:
                            C.white,
                          fontSize: 11,
                          fontWeight:
                            700,
                        }}
                      >
                        Edit
                      </button>

                      <button
                        onClick={
                          deleteEvent
                        }
                        disabled={
                          saving
                        }
                        style={{
                          ...buttonBase,
                          padding:
                            "7px 14px",
                          background:
                            C.redDim,
                          border:
                            "none",
                          color:
                            C.red,
                          fontSize: 11,
                          fontWeight:
                            700,
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  )}
              </div>

              {/* TAGS */}

              <div
                style={{
                  display:
                    "flex",
                  gap: 6,
                  flexWrap:
                    "wrap",
                  marginTop:
                    12,
                }}
              >
                {(() => {
                  const style =
                    getTypeStyle(
                      selectedEvent.type,
                      selectedEvent.official
                    );

                  return (
                    <span
                      style={{
                        background:
                          style.background,
                        color:
                          style.color,
                        padding:
                          "4px 10px",
                        borderRadius:
                          20,
                        fontSize: 10,
                        fontWeight:
                          700,
                      }}
                    >
                      {selectedEvent.type}
                    </span>
                  );
                })()}

                <span
                  style={{
                    background:
                      "rgba(255,255,255,.05)",
                    color:
                      C.textMuted,
                    padding:
                      "4px 10px",
                    borderRadius:
                      20,
                    fontSize: 10,
                    fontWeight:
                      600,
                  }}
                >
                  {
                    selectedEvent.holiday
                  }
                </span>

                {selectedEvent.isOffice &&
                  !selectedEvent.official && (
                    <span
                      style={{
                        background:
                          C.greenDim,
                        color:
                          C.green,
                        padding:
                          "4px 10px",
                        borderRadius:
                          20,
                        fontSize: 10,
                        fontWeight:
                          700,
                      }}
                    >
                      Office
                      Event
                    </span>
                  )}

                {selectedEvent.official && (
                  <span
                    style={{
                      background:
                        C.limeDim,
                      color:
                        C.lime,
                      padding:
                        "4px 10px",
                      borderRadius:
                        20,
                      fontSize: 10,
                      fontWeight:
                        700,
                    }}
                  >
                    Official
                  </span>
                )}
              </div>

              {/* DESCRIPTION */}

              {selectedEvent.description && (
                <p
                  style={{
                    margin:
                      "13px 0 0",
                    color:
                      C.textMuted,
                    fontSize: 13,
                    lineHeight:
                      1.65,
                    maxWidth:
                      800,
                  }}
                >
                  {
                    selectedEvent.description
                  }
                </p>
              )}

              {/* ADMIN ACTIONS */}

              {!selectedEvent.official &&
                isAdmin && (
                  <div
                    style={{
                      marginTop:
                        17,
                      paddingTop:
                        14,
                      borderTop:
                        `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        color:
                          C.textDim,
                        fontWeight:
                          700,
                        textTransform:
                          "uppercase",
                        letterSpacing:
                          ".6px",
                        marginBottom:
                          8,
                      }}
                    >
                      Admin tools
                    </div>

                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 8,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <span
                        style={{
                          color:
                            C.textMuted,
                          fontSize: 11,
                        }}
                      >
                        Move event to:
                      </span>

                      <select
                        id="move-month"
                        defaultValue={
                          selected.month
                        }
                        style={{
                          ...inputStyle,
                          width: 130,
                          padding:
                            "7px 9px",
                          fontSize: 11,
                        }}
                      >
                        {MONTHS.map(
                          (month) => (
                            <option
                              key={
                                month.month
                              }
                              value={
                                month.month
                              }
                              style={{
                                background:
                                  C.card,
                              }}
                            >
                              {
                                month.name
                              }
                            </option>
                          )
                        )}
                      </select>

                      <input
                        id="move-day"
                        type="number"
                        min="1"
                        max="31"
                        placeholder="Day"
                        style={{
                          ...inputStyle,
                          width: 70,
                          padding:
                            "7px 9px",
                          fontSize: 11,
                        }}
                      />

                      <button
                        onClick={() => {
                          const month =
                            document.getElementById(
                              "move-month"
                            )
                              ?.value;

                          const day =
                            document.getElementById(
                              "move-day"
                            )
                              ?.value;

                          if (
                            month &&
                            day
                          ) {
                            moveEvent(
                              month,
                              day
                            );
                          }
                        }}
                        style={{
                          ...buttonBase,
                          padding:
                            "7px 13px",
                          border:
                            `1px solid ${C.border}`,
                          background:
                            "transparent",
                          color:
                            C.white,
                          fontSize: 11,
                          fontWeight:
                            700,
                        }}
                      >
                        Move
                      </button>
                    </div>
                  </div>
                )}
            </div>
          ) : (
            // ─────────────────────
            // EMPTY DATE
            // ─────────────────────

            <div>
              <div
                style={{
                  color:
                    C.lime,
                  fontSize: 11,
                  fontWeight:
                    700,
                }}
              >
                {formatDateForDisplay(
                  selected.month,
                  selected.day
                )}{" "}
                ·{" "}
                {getDayName(
                  YEAR,
                  selected.month,
                  selected.day
                )}
              </div>

              <div
                style={{
                  marginTop:
                    5,
                  fontSize: 17,
                  fontWeight:
                    700,
                }}
              >
                No event scheduled
              </div>

              <p
                style={{
                  margin:
                    "5px 0 14px",
                  color:
                    C.textMuted,
                  fontSize: 12,
                }}
              >
                This date is available
                for an office activity,
                meeting, travel or custom
                event.
              </p>

              {isAdmin && (
                <button
                  onClick={
                    openAdd
                  }
                  style={{
                    ...buttonBase,
                    padding:
                      "9px 17px",
                    background:
                      C.lime,
                    color:
                      C.navy,
                    border:
                      "none",
                    fontSize: 12,
                    fontWeight:
                      800,
                  }}
                >
                  + Add Event
                </button>
              )}
            </div>
          )}
        </section>

        {/* =================================================
            FOOTER NOTE
            ================================================= */}

        <div
          style={{
            marginTop: 18,
            padding:
              "12px 4px 0",
            color:
              C.textDim,
            fontSize: 10,
            lineHeight:
              1.6,
          }}
        >
          <strong
            style={{
              color:
                C.textMuted,
            }}
          >
            RB Office Calendar
          </strong>{" "}
          — Use the calendar to keep track
          of meetings, office activities,
          travel, important dates and
          national events. Admin users can
          add and manage custom events.
        </div>
      </main>

      {/* =================================================
          MOBILE STYLES
          ================================================= */}

      <style>{`
        * {
          box-sizing: border-box;
        }

        html, body, #root {
          margin: 0;
          padding: 0;
          width: 100%;
          min-height: 100%;
          background: ${C.navy};
        }

        body {
          overflow-x: hidden;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button:hover {
          filter: brightness(1.08);
        }

        input::placeholder,
        textarea::placeholder {
          color: ${C.textDim};
        }

        select option {
          color: ${C.white};
        }

        @media (max-width: 720px) {
          main {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          header > div {
            padding-left: 12px !important;
            padding-right: 12px !important;
          }

          h1 {
            font-size: 20px !important;
          }

          .calendar-mobile {
            overflow-x: auto;
          }
        }

        @media (max-width: 560px) {
          main {
            padding-top: 18px !important;
          }
        }
      `}</style>
    </div>
  );
}
