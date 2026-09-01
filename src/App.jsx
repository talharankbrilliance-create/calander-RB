import React, { useState, useEffect, useCallback } from "react";

/* =========================================================
   RB OFFICE CALENDAR — SEPTEMBER TO DECEMBER 2026
   RESPONSIVE / NO PAGE SCROLL VERSION
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
        if (!row.event_date) return;

        const event = rowToEvent(row);

        /*
         * One event per date is assumed by this calendar.
         * If multiple rows exist on the same date,
         * keep the first one.
         */
        if (!map[row.event_date]) {
          map[row.event_date] = event;
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
    setError(null);
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
      !loginForm.email.trim() ||
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
            email: loginForm.email.trim(),
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
    setLoginError(null);
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

    if (dbEvents[selectedKey]) {
      setError(
        "This date already has an event."
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
      !isAdmin ||
      saving
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
          Boolean(form.isOffice),
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
        if (OFFICIAL_EVENTS[key]) {
          throw new Error(
            "Official dates cannot be overwritten."
          );
        }

        if (existing) {
          throw new Error(
            "An event already exists on this date."
          );
        }

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
      !isAdmin ||
      saving
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
      !isAdmin ||
      saving
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
      setError("Invalid month.");
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
      setError(
        `Please enter a valid day between 1 and ${maxDays}.`
      );
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

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="app-shell">

      {/* =================================================
          HEADER
          ================================================= */}

      <header className="top-header">
        <div className="header-inner">

          {/* BRAND */}

          <div className="brand">

            <div className="brand-logo">
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

            <div className="brand-copy">

              <div className="eyebrow">
                Office Planning
              </div>

              <h1>
                RB Office Calendar
              </h1>

              <p>
                Plan meetings, office activities,
                travel & important events
              </p>

            </div>
          </div>

          {/* ADMIN */}

          <div className="admin-area">

            {saving && (
              <span className="saving-label">
                Saving…
              </span>
            )}

            {isAdmin ? (
              <div className="admin-actions">

                <div className="admin-badge">
                  <span>●</span>
                  Admin Mode
                </div>

                <button
                  onClick={handleLogout}
                  className="logout-btn"
                >
                  Logout
                </button>

              </div>
            ) : (
              <button
                onClick={() =>
                  setShowLogin(!showLogin)
                }
                className="admin-btn"
              >
                🔐 Admin
              </button>
            )}

            {/* LOGIN */}

            {showLogin && !isAdmin && (
              <div className="login-panel">

                <div className="login-heading">
                  <div className="login-title">
                    Admin Login
                  </div>

                  <div className="login-subtitle">
                    Sign in to manage office events
                  </div>
                </div>

                <input
                  placeholder="Email"
                  type="email"
                  value={loginForm.email}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      email: e.target.value,
                    })
                  }
                  className="form-input"
                />

                <input
                  placeholder="Password"
                  type="password"
                  value={loginForm.password}
                  onChange={(e) =>
                    setLoginForm({
                      ...loginForm,
                      password: e.target.value,
                    })
                  }
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      handleLogin();
                    }
                  }}
                  className="form-input"
                />

                {loginError && (
                  <div className="login-error">
                    {loginError}
                  </div>
                )}

                <div className="login-buttons">

                  <button
                    onClick={handleLogin}
                    disabled={loginLoading}
                    className="primary-btn"
                  >
                    {loginLoading
                      ? "Signing in…"
                      : "Sign in"}
                  </button>

                  <button
                    onClick={() => {
                      setShowLogin(false);
                      setLoginError(null);
                    }}
                    className="secondary-btn"
                  >
                    Cancel
                  </button>

                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* =================================================
          MAIN
          ================================================= */}

      <main className="main-content">

        {/* INTRO */}

        <section className="intro-section">

          <div>
            <div className="section-label">
              OFFICE CALENDAR · {YEAR}
            </div>

            <h2>
              Keep the whole team
              <span> on track.</span>
            </h2>
          </div>

          {isAdmin && (
            <div className="admin-status">
              ● You can manage events
            </div>
          )}

        </section>

        {/* =================================================
            MONTH TABS
            ================================================= */}

        <div className="month-tabs">

          {MONTHS.map((month) => {
            const active =
              month.month === activeMonth;

            return (
              <button
                key={month.month}
                onClick={() =>
                  changeMonth(month.month)
                }
                className={
                  active
                    ? "month-tab active"
                    : "month-tab"
                }
              >
                {month.name}

                <span>
                  {YEAR}
                </span>
              </button>
            );
          })}

        </div>

        {/* ERROR */}

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        {/* =================================================
            CALENDAR
            ================================================= */}

        <section className="calendar-card">

          {/* TITLE */}

          <div className="calendar-titlebar">

            <div>
              <div className="calendar-title">
                {currentMonth.name} {YEAR}
              </div>

              <div className="calendar-subtitle">
                Click any date to view details
              </div>
            </div>

            <div className="sync-status">
              {loaded
                ? "✓ Events synced"
                : "Loading events…"}
            </div>

          </div>

          {/* CALENDAR SCROLL CONTAINER */}

          <div className="calendar-scroll">

            <div className="calendar-grid">

              {/* DAY HEADERS */}

              <div className="days-row">

                {DAYS_HEADER.map(
                  (dayName, index) => (
                    <div
                      key={dayName}
                      className={
                        index >= 5
                          ? index === 6
                            ? "day-header sunday"
                            : "day-header saturday"
                          : "day-header"
                      }
                    >
                      {dayName}
                    </div>
                  )
                )}

              </div>

              {/* DAYS */}

              {buildMonthGrid(
                activeMonth
              ).map((row, rowIndex) => (

                <div
                  key={rowIndex}
                  className="calendar-row"
                >

                  {row.map(
                    (day, columnIndex) => {

                      if (!day) {
                        return (
                          <div
                            key={columnIndex}
                            className="empty-cell"
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
                        selected?.day === day;

                      const isWeekend =
                        columnIndex >= 5;

                      const typeStyle =
                        event
                          ? getTypeStyle(
                              event.type,
                              event.official
                            )
                          : null;

                      return (
                        <div
                          key={columnIndex}
                          onClick={() =>
                            selectDate(day)
                          }
                          className={
                            isSelected
                              ? "calendar-cell selected"
                              : "calendar-cell"
                          }
                        >

                          {/* DATE */}

                          <div className="date-top">

                            <span
                              className={
                                isSelected
                                  ? "date-number selected-date"
                                  : columnIndex === 6
                                  ? "date-number sunday-date"
                                  : isWeekend
                                  ? "date-number weekend-date"
                                  : "date-number"
                              }
                            >
                              {day}
                            </span>

                            {event && (
                              <span
                                className="event-dot"
                                style={{
                                  background:
                                    event.color ||
                                    C.blue,
                                  boxShadow:
                                    `0 0 8px ${
                                      event.color ||
                                      C.blue
                                    }`,
                                }}
                              />
                            )}

                          </div>

                          {/* EVENT */}

                          {event ? (
                            <div
                              className="event-card"
                              style={{
                                background:
                                  typeStyle.background,
                                borderColor:
                                  `${typeStyle.color}33`,
                              }}
                            >

                              <div
                                className="event-type"
                                style={{
                                  color:
                                    typeStyle.color,
                                }}
                              >
                                {event.type}
                              </div>

                              <div className="event-name">
                                {event.name}
                              </div>

                            </div>
                          ) : (
                            <div className="empty-dash">
                              —
                            </div>
                          )}

                          {/* BOTTOM BAR */}

                          {event && (
                            <div
                              className="event-bottom-bar"
                              style={{
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
              ))}

            </div>
          </div>
        </section>

        {/* =================================================
            LEGEND
            ================================================= */}

        <div className="legend">

          {[
            [C.lime, "Official / National"],
            [C.green, "Office Event"],
            [C.purple, "Meeting"],
            [C.orange, "Travel / Outside"],
            [C.red, "Important"],
            [C.blue, "Custom"],
          ].map(([color, label]) => (
            <span
              key={label}
              className="legend-item"
            >
              <span
                className="legend-line"
                style={{
                  background: color,
                }}
              />
              {label}
            </span>
          ))}

        </div>

        {/* =================================================
            DETAIL PANEL
            ================================================= */}

        <section className="detail-panel">

          {/* NOTHING SELECTED */}

          {!selected ? (
            <div>
              <div className="detail-title">
                Select a date
              </div>

              <p className="detail-description">
                Click any date above to view
                events or add office activities.
              </p>
            </div>

          ) : editing === "add" ||
            editing === "edit" ? (

            // ─────────────────────
            // FORM
            // ─────────────────────

            <div>

              <div className="form-header">

                <div>
                  <div className="form-label">
                    {editing === "add"
                      ? "ADD EVENT"
                      : "EDIT EVENT"}
                  </div>

                  <div className="form-date">
                    {formatDateForDisplay(
                      selected.month,
                      selected.day
                    )}
                  </div>
                </div>

              </div>

              <div className="event-form">

                <input
                  placeholder="Event name *"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="form-input full"
                />

                <select
                  value={form.type}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      type: e.target.value,
                    })
                  }
                  className="form-input"
                >
                  {EVENT_TYPES.map(
                    (type) => (
                      <option
                        key={type.value}
                        value={type.value}
                      >
                        {type.value}
                      </option>
                    )
                  )}
                </select>

                <select
                  value={form.holiday}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      holiday: e.target.value,
                    })
                  }
                  className="form-input"
                >
                  <option>
                    Not a Public Holiday
                  </option>

                  <option>
                    Public Holiday
                  </option>

                  <option>
                    National Observance
                  </option>
                </select>

                <textarea
                  placeholder="Description / notes"
                  value={form.description}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      description:
                        e.target.value,
                    })
                  }
                  rows={4}
                  className="form-input full textarea"
                />

                <label className="office-checkbox">
                  <input
                    type="checkbox"
                    checked={form.isOffice}
                    onChange={(e) =>
                      setForm({
                        ...form,
                        isOffice:
                          e.target.checked,
                      })
                    }
                  />

                  <span>
                    Office event
                  </span>
                </label>

                <div className="form-actions">

                  <button
                    onClick={() =>
                      setEditing(null)
                    }
                    className="secondary-btn"
                  >
                    Cancel
                  </button>

                  {editing === "edit" && (
                    <button
                      onClick={deleteEvent}
                      disabled={saving}
                      className="delete-btn"
                    >
                      Delete
                    </button>
                  )}

                  <button
                    onClick={saveEvent}
                    disabled={
                      !form.name.trim() ||
                      saving
                    }
                    className={
                      form.name.trim()
                        ? "primary-btn"
                        : "disabled-btn"
                    }
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

              <div className="detail-header">

                <div>

                  <div className="detail-date">
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

                  <h3>
                    {selectedEvent.name}
                  </h3>

                </div>

                {!selectedEvent.official &&
                  isAdmin && (
                    <div className="detail-actions">

                      <button
                        onClick={() =>
                          openEdit(
                            selectedEvent
                          )
                        }
                        className="secondary-btn"
                      >
                        Edit
                      </button>

                      <button
                        onClick={deleteEvent}
                        disabled={saving}
                        className="delete-btn"
                      >
                        Delete
                      </button>

                    </div>
                  )}

              </div>

              {/* TAGS */}

              <div className="tags">

                {(() => {
                  const style =
                    getTypeStyle(
                      selectedEvent.type,
                      selectedEvent.official
                    );

                  return (
                    <span
                      className="tag"
                      style={{
                        background:
                          style.background,
                        color:
                          style.color,
                      }}
                    >
                      {selectedEvent.type}
                    </span>
                  );
                })()}

                <span className="tag neutral">
                  {selectedEvent.holiday}
                </span>

                {selectedEvent.isOffice &&
                  !selectedEvent.official && (
                    <span className="tag office">
                      Office Event
                    </span>
                  )}

                {selectedEvent.official && (
                  <span className="tag official">
                    Official
                  </span>
                )}

              </div>

              {/* DESCRIPTION */}

              {selectedEvent.description && (
                <p className="event-description">
                  {selectedEvent.description}
                </p>
              )}

              {/* ADMIN TOOLS */}

              {!selectedEvent.official &&
                isAdmin && (
                  <div className="admin-tools">

                    <div className="admin-tools-title">
                      Admin tools
                    </div>

                    <div className="move-controls">

                      <span className="move-label">
                        Move event to:
                      </span>

                      <select
                        id="move-month"
                        defaultValue={
                          selected.month
                        }
                        className="move-month"
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
                        className="move-day"
                      />

                      <button
                        onClick={() => {
                          const month =
                            document.getElementById(
                              "move-month"
                            )?.value;

                          const day =
                            document.getElementById(
                              "move-day"
                            )?.value;

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
                        className="secondary-btn"
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

              <div className="detail-date">
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

              <div className="no-event-title">
                No event scheduled
              </div>

              <p className="detail-description">
                This date is available for an
                office activity, meeting, travel
                or custom event.
              </p>

              {isAdmin && (
                <button
                  onClick={openAdd}
                  className="primary-btn add-event-btn"
                >
                  + Add Event
                </button>
              )}

            </div>
          )}

        </section>

        {/* =================================================
            FOOTER
            ================================================= */}

        <div className="footer-note">

          <strong>
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
          STYLES
          ================================================= */}

      <style>{`

        /* =================================================
           GLOBAL
           ================================================= */

        * {
          box-sizing: border-box;
        }

        html,
        body,
        #root {
          margin: 0;
          padding: 0;
          width: 100%;
          height: 100%;
          background: ${C.navy};
        }

        body {
          overflow: hidden;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button {
          transition:
            filter .15s ease,
            transform .1s ease,
            background .15s ease;
        }

        button:hover:not(:disabled) {
          filter: brightness(1.08);
        }

        button:active:not(:disabled) {
          transform: translateY(1px);
        }

        button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        input::placeholder,
        textarea::placeholder {
          color: ${C.textDim};
        }

        select option {
          background: ${C.card};
          color: ${C.white};
        }

        /* =================================================
           APP
           ================================================= */

        .app-shell {
          width: 100%;
          height: 100dvh;
          min-height: 0;
          display: flex;
          flex-direction: column;
          overflow: hidden;

          background:
            radial-gradient(
              circle at 50% -10%,
              rgba(78,153,247,0.08),
              transparent 38%
            ),
            ${C.navy};

          color: ${C.white};

          font-family:
            Inter,
            system-ui,
            -apple-system,
            BlinkMacSystemFont,
            "Segoe UI",
            sans-serif;
        }

        /* =================================================
           HEADER
           ================================================= */

        .top-header {
          width: 100%;
          flex: 0 0 auto;

          border-bottom:
            1px solid ${C.border};

          background:
            rgba(8,17,38,.94);

          backdrop-filter:
            blur(12px);

          position: relative;
          z-index: 50;
        }

        .header-inner {
          width: 100%;
          max-width: 1180px;
          margin: 0 auto;

          padding:
            14px 22px;

          display: flex;
          align-items: center;
          justify-content: space-between;

          gap: 18px;
        }

        .brand {
          min-width: 0;

          display: flex;
          align-items: center;

          gap: 13px;
        }

        .brand-logo {
          width: 46px;
          height: 46px;
          flex: 0 0 46px;

          border-radius: 11px;

          background:
            linear-gradient(
              135deg,
              #16264b,
              #0e1933
            );

          border:
            1px solid ${C.border};

          display: flex;
          align-items: center;
          justify-content: center;

          box-shadow:
            0 8px 30px rgba(0,0,0,.2);
        }

        .brand-copy {
          min-width: 0;
        }

        .eyebrow {
          color: ${C.lime};

          font-size: 9px;
          font-weight: 800;

          letter-spacing: 1.5px;
          text-transform: uppercase;

          margin-bottom: 3px;
        }

        .brand h1 {
          margin: 0;

          font-size: 21px;
          line-height: 1.1;

          font-weight: 750;

          letter-spacing: -.45px;
        }

        .brand p {
          margin: 4px 0 0;

          color: ${C.textMuted};

          font-size: 11px;

          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        /* =================================================
           ADMIN
           ================================================= */

        .admin-area {
          position: relative;
          flex: 0 0 auto;
        }

        .saving-label {
          position: absolute;

          right: 0;
          top: -17px;

          color: ${C.lime};

          font-size: 9px;
          font-weight: 700;
        }

        .admin-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .admin-badge {
          display: flex;
          align-items: center;
          gap: 6px;

          padding: 8px 11px;

          border-radius: 8px;

          background:
            ${C.greenDim};

          border:
            1px solid rgba(52,211,153,.22);

          color: ${C.green};

          font-size: 10px;
          font-weight: 750;

          white-space: nowrap;
        }

        .admin-btn {
          ${/* intentionally left blank */ ""}
        }

        .admin-btn,
        .logout-btn,
        .primary-btn,
        .secondary-btn,
        .delete-btn,
        .disabled-btn {
          ${""}
        }

        .admin-btn {
          ${""}
        }

        .admin-btn {
          padding: 9px 15px;

          border:
            1px solid ${C.border};

          border-radius: 8px;

          background:
            linear-gradient(
              135deg,
              #17264a,
              #111d3a
            );

          color: ${C.white};

          font-size: 11px;
          font-weight: 750;

          cursor: pointer;
        }

        .logout-btn {
          padding: 8px 12px;

          border:
            1px solid ${C.border};

          border-radius: 8px;

          background: transparent;

          color: ${C.textMuted};

          font-size: 10px;
          font-weight: 650;

          cursor: pointer;
        }

        /* =================================================
           LOGIN
           ================================================= */

        .login-panel {
          position: absolute;

          top: calc(100% + 9px);
          right: 0;

          width: min(310px, calc(100vw - 24px));

          padding: 16px;

          background: ${C.card};

          border:
            1px solid ${C.border};

          border-radius: 12px;

          box-shadow:
            0 18px 50px rgba(0,0,0,.45);

          z-index: 100;
        }

        .login-heading {
          margin-bottom: 12px;
        }

        .login-title {
          font-size: 13px;
          font-weight: 750;
        }

        .login-subtitle {
          margin-top: 3px;

          color: ${C.textMuted};

          font-size: 10px;
        }

        .form-input {
          width: 100%;

          min-width: 0;

          background:
            rgba(255,255,255,.045);

          border:
            1px solid ${C.border};

          border-radius: 8px;

          padding:
            9px 11px;

          color: ${C.white};

          font-size: 12px;

          outline: none;

          box-sizing: border-box;
        }

        .login-panel .form-input {
          margin-bottom: 8px;
        }

        .form-input:focus {
          border-color:
            rgba(200,245,37,.55);

          box-shadow:
            0 0 0 2px
            rgba(200,245,37,.06);
        }

        .login-error {
          color: ${C.red};

          font-size: 10px;

          margin-bottom: 8px;
        }

        .login-buttons {
          display: flex;
          gap: 7px;
        }

        .primary-btn {
          padding:
            8px 15px;

          border: none;

          border-radius: 8px;

          background:
            ${C.lime};

          color:
            ${C.navy};

          font-size: 11px;
          font-weight: 800;

          cursor: pointer;
        }

        .secondary-btn {
          padding:
            8px 13px;

          border:
            1px solid ${C.border};

          border-radius: 8px;

          background:
            transparent;

          color:
            ${C.textMuted};

          font-size: 11px;
          font-weight: 650;

          cursor: pointer;
        }

        .delete-btn {
          padding:
            8px 13px;

          border: none;

          border-radius: 8px;

          background:
            ${C.redDim};

          color:
            ${C.red};

          font-size: 11px;
          font-weight: 750;

          cursor: pointer;
        }

        .disabled-btn {
          padding:
            8px 15px;

          border: none;

          border-radius: 8px;

          background:
            ${C.border};

          color:
            ${C.textDim};

          font-size: 11px;
          font-weight: 800;
        }

        /* =================================================
           MAIN
           ================================================= */

        .main-content {
          width: 100%;
          max-width: 1180px;

          margin: 0 auto;

          padding:
            20px 22px 24px;

          flex: 1 1 auto;

          min-height: 0;

          display: flex;
          flex-direction: column;

          overflow: hidden;
        }

        /* =================================================
           INTRO
           ================================================= */

        .intro-section {
          flex: 0 0 auto;

          margin-bottom: 14px;

          display: flex;

          align-items: flex-end;
          justify-content: space-between;

          gap: 12px;
        }

        .section-label {
          color: ${C.textMuted};

          font-size: 9px;
          font-weight: 650;

          letter-spacing: .45px;

          margin-bottom: 5px;
        }

        .intro-section h2 {
          margin: 0;

          font-size: 23px;
          line-height: 1.1;

          font-weight: 750;

          letter-spacing: -.55px;
        }

        .intro-section h2 span {
          color: ${C.lime};
        }

        .admin-status {
          color: ${C.green};

          font-size: 10px;
          font-weight: 650;

          white-space: nowrap;
        }

        /* =================================================
           MONTH TABS
           ================================================= */

        .month-tabs {
          flex: 0 0 auto;

          background:
            rgba(17,29,58,.75);

          border:
            1px solid ${C.border};

          border-radius: 10px;

          padding: 4px;

          display: flex;

          gap: 4px;

          margin-bottom: 10px;

          overflow-x: auto;

          scrollbar-width: thin;
        }

        .month-tab {
          flex: 1 1 0;

          min-width: 105px;

          padding:
            8px 12px;

          border:
            1px solid transparent;

          border-radius: 7px;

          background: transparent;

          color: ${C.textMuted};

          font-size: 10px;
          font-weight: 750;

          cursor: pointer;

          white-space: nowrap;
        }

        .month-tab span {
          opacity: .5;
          font-weight: 500;
        }

        .month-tab.active {
          border-color: ${C.lime};

          background:
            ${C.limeDim};

          color: ${C.lime};
        }

        /* =================================================
           ERROR
           ================================================= */

        .error-box {
          flex: 0 0 auto;

          background:
            ${C.redDim};

          border:
            1px solid rgba(224,82,101,.25);

          color: ${C.red};

          padding:
            8px 11px;

          border-radius: 8px;

          font-size: 10px;

          margin-bottom: 8px;
        }

        /* =================================================
           CALENDAR
           ================================================= */

        .calendar-card {
          flex: 1 1 auto;

          min-height: 0;

          background:
            rgba(17,29,58,.7);

          border:
            1px solid ${C.border};

          border-radius: 13px;

          overflow: hidden;

          box-shadow:
            0 20px 60px rgba(0,0,0,.18);

          display: flex;
          flex-direction: column;
        }

        .calendar-titlebar {
          flex: 0 0 auto;

          padding:
            10px 14px;

          border-bottom:
            1px solid ${C.border};

          display: flex;

          align-items: center;
          justify-content: space-between;

          gap: 10px;
        }

        .calendar-title {
          font-size: 15px;
          font-weight: 750;
        }

        .calendar-subtitle {
          margin-top: 2px;

          color: ${C.textMuted};

          font-size: 9px;
        }

        .sync-status {
          color: ${C.textMuted};

          font-size: 9px;

          white-space: nowrap;
        }

        .calendar-scroll {
          flex: 1 1 auto;

          min-height: 0;

          overflow: auto;

          scrollbar-width: thin;
          scrollbar-color:
            ${C.border}
            transparent;
        }

        .calendar-grid {
          min-width: 700px;

          width: 100%;
        }

        .days-row,
        .calendar-row {
          display: grid;

          grid-template-columns:
            repeat(7, minmax(0, 1fr));

          gap: 1px;

          background:
            ${C.border};
        }

        .day-header {
          min-height: 28px;

          display: flex;
          align-items: center;
          justify-content: center;

          background: ${C.card};

          color: ${C.textMuted};

          font-size: 9px;
          font-weight: 750;

          letter-spacing: .3px;
        }

        .day-header.saturday {
          color: ${C.blue};
        }

        .day-header.sunday {
          color: ${C.red};
        }

        .calendar-row {
          border-top:
            1px solid ${C.border};
        }

        .calendar-row:first-of-type {
          border-top: none;
        }

        .calendar-cell,
        .empty-cell {
          min-height: 76px;

          position: relative;

          padding:
            7px 7px 6px;

          background:
            ${C.card};

          box-sizing: border-box;
        }

        .calendar-cell {
          cursor: pointer;

          transition:
            background .12s ease;
        }

        .calendar-cell:hover {
          background:
            ${C.cardHover};
        }

        .calendar-cell.selected {
          background:
            ${C.cardSelected};

          outline:
            2px solid ${C.lime};

          outline-offset:
            -2px;

          z-index: 2;
        }

        .empty-cell {
          background:
            rgba(17,29,58,.35);
        }

        .date-top {
          display: flex;

          align-items: center;
          justify-content: space-between;
        }

        .date-number {
          color: ${C.white};

          font-size: 12px;
          font-weight: 600;
        }

        .selected-date {
          color: ${C.lime};

          font-weight: 800;
        }

        .weekend-date {
          color: ${C.blue};
        }

        .sunday-date {
          color: ${C.red};
        }

        .event-dot {
          width: 5px;
          height: 5px;

          flex: 0 0 5px;

          border-radius: 50%;
        }

        .event-card {
          margin-top: 7px;

          border:
            1px solid transparent;

          border-radius: 6px;

          padding:
            5px 6px;
        }

        .event-type {
          font-size: 7px;
          font-weight: 800;

          text-transform: uppercase;

          letter-spacing: .2px;

          margin-bottom: 2px;
        }

        .event-name {
          color: ${C.white};

          font-size: 8px;
          line-height: 1.3;

          font-weight: 650;

          display: -webkit-box;

          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;

          overflow: hidden;
        }

        .empty-dash {
          margin-top: 13px;

          color: ${C.textDim};

          font-size: 8px;

          opacity: .45;
        }

        .event-bottom-bar {
          position: absolute;

          left: 7px;
          right: 7px;
          bottom: 4px;

          height: 2px;

          border-radius: 2px;
        }

        /* =================================================
           LEGEND
           ================================================= */

        .legend {
          flex: 0 0 auto;

          display: flex;
          align-items: center;

          gap: 12px;

          flex-wrap: wrap;

          margin-top: 7px;

          padding:
            0 3px;

          color:
            ${C.textMuted};

          font-size: 8px;
        }

        .legend-item {
          display: flex;
          align-items: center;

          gap: 4px;

          white-space: nowrap;
        }

        .legend-line {
          width: 11px;
          height: 2px;

          border-radius: 2px;
        }

        /* =================================================
           DETAIL PANEL
           ================================================= */

        .detail-panel {
          flex: 0 0 auto;

          margin-top: 10px;

          background:
            ${C.card};

          border:
            1px solid ${C.border};

          border-radius: 11px;

          padding:
            14px 16px;

          max-height: 260px;

          overflow: auto;
        }

        .detail-title {
          font-size: 12px;
          font-weight: 700;
        }

        .detail-date,
        .form-label {
          color: ${C.lime};

          font-size: 9px;
          font-weight: 750;
        }

        .detail-description {
          margin:
            5px 0 0;

          color:
            ${C.textMuted};

          font-size: 10px;
          line-height: 1.5;
        }

        .detail-header {
          display: flex;

          align-items: flex-start;
          justify-content: space-between;

          gap: 10px;
        }

        .detail-header h3 {
          margin:
            3px 0 0;

          font-size: 16px;
          font-weight: 750;
        }

        .detail-actions {
          display: flex;

          gap: 6px;

          flex-wrap: wrap;
        }

        .tags {
          display: flex;

          gap: 5px;

          flex-wrap: wrap;

          margin-top: 8px;
        }

        .tag {
          padding:
            3px 8px;

          border-radius: 20px;

          font-size: 8px;
          font-weight: 700;
        }

        .tag.neutral {
          background:
            rgba(255,255,255,.05);

          color:
            ${C.textMuted};
        }

        .tag.office {
          background:
            ${C.greenDim};

          color:
            ${C.green};
        }

        .tag.official {
          background:
            ${C.limeDim};

          color:
            ${C.lime};
        }

        .event-description {
          margin:
            9px 0 0;

          color:
            ${C.textMuted};

          font-size: 10px;

          line-height: 1.55;

          max-width: 800px;
        }

        .admin-tools {
          margin-top: 10px;

          padding-top: 9px;

          border-top:
            1px solid ${C.border};
        }

        .admin-tools-title {
          color:
            ${C.textDim};

          font-size: 8px;

          font-weight: 750;

          text-transform: uppercase;

          letter-spacing: .5px;

          margin-bottom: 6px;
        }

        .move-controls {
          display: flex;

          align-items: center;

          gap: 6px;

          flex-wrap: wrap;
        }

        .move-label {
          color:
            ${C.textMuted};

          font-size: 9px;
        }

        .move-month,
        .move-day {
          height: 29px;

          background:
            rgba(255,255,255,.045);

          border:
            1px solid ${C.border};

          border-radius: 7px;

          color:
            ${C.white};

          padding:
            0 8px;

          font-size: 9px;

          outline: none;
        }

        .move-month {
          width: 120px;
        }

        .move-day {
          width: 62px;
        }

        /* =================================================
           EVENT FORM
           ================================================= */

        .form-header {
          margin-bottom: 10px;
        }

        .form-date {
          margin-top: 3px;

          font-size: 14px;

          font-weight: 750;
        }

        .event-form {
          max-width: 720px;

          display: grid;

          grid-template-columns:
            repeat(2, minmax(0, 1fr));

          gap: 8px;
        }

        .event-form .full {
          grid-column:
            1 / -1;
        }

        .textarea {
          resize: vertical;
          min-height: 75px;
        }

        .office-checkbox {
          display: flex;

          align-items: center;

          gap: 7px;

          color:
            ${C.textMuted};

          font-size: 10px;

          cursor: pointer;
        }

        .office-checkbox input {
          accent-color:
            ${C.lime};
        }

        .form-actions {
          display: flex;

          justify-content: flex-end;

          align-items: center;

          gap: 6px;

          flex-wrap: wrap;
        }

        .no-event-title {
          margin-top: 3px;

          font-size: 14px;

          font-weight: 700;
        }

        .add-event-btn {
          margin-top: 9px;
        }

        /* =================================================
           FOOTER
           ================================================= */

        .footer-note {
          flex: 0 0 auto;

          margin-top: 8px;

          padding:
            0 3px;

          color:
            ${C.textDim};

          font-size: 8px;

          line-height: 1.5;
        }

        .footer-note strong {
          color:
            ${C.textMuted};
        }

        /* =================================================
           TABLET
           ================================================= */

        @media (max-width: 850px) {

          .main-content {
            padding-left: 14px;
            padding-right: 14px;
          }

          .header-inner {
            padding-left: 14px;
            padding-right: 14px;
          }

          .brand h1 {
            font-size: 19px;
          }

          .brand p {
            max-width: 400px;
          }

          .calendar-grid {
            min-width: 650px;
          }

          .calendar-cell,
          .empty-cell {
            min-height: 70px;
          }

          .detail-panel {
            max-height: 245px;
          }
        }

        /* =================================================
           MOBILE
           ================================================= */

        @media (max-width: 650px) {

          html,
          body,
          #root {
            height: 100%;
          }

          .app-shell {
            height: 100dvh;
          }

          .top-header {
            z-index: 100;
          }

          .header-inner {
            padding:
              10px 10px;

            align-items: flex-start;

            gap: 8px;
          }

          .brand {
            gap: 9px;

            min-width: 0;

            flex: 1 1 auto;
          }

          .brand-logo {
            width: 39px;
            height: 39px;
            flex-basis: 39px;

            border-radius: 9px;
          }

          .brand-logo svg {
            width: 31px;
            height: 31px;
          }

          .eyebrow {
            font-size: 7px;
            letter-spacing: 1px;

            margin-bottom: 2px;
          }

          .brand h1 {
            font-size: 16px;

            letter-spacing: -.3px;
          }

          .brand p {
            display: none;
          }

          .admin-area {
            flex: 0 0 auto;
          }

          .admin-btn {
            padding:
              7px 10px;

            font-size: 9px;
          }

          .admin-actions {
            gap: 5px;
          }

          .admin-badge {
            padding:
              6px 7px;

            font-size: 8px;
          }

          .logout-btn {
            padding:
              6px 8px;

            font-size: 8px;
          }

          .login-panel {
            position: fixed;

            top: 58px;

            right: 8px;
            left: 8px;

            width: auto;

            max-width: none;

            padding: 14px;

            z-index: 200;
          }

          .main-content {
            padding:
              12px 8px 10px;

            min-height: 0;
          }

          .intro-section {
            margin-bottom: 9px;

            align-items: center;
          }

          .section-label {
            font-size: 7px;

            margin-bottom: 3px;
          }

          .intro-section h2 {
            font-size: 17px;
          }

          .admin-status {
            font-size: 8px;
          }

          .month-tabs {
            margin-bottom: 7px;

            padding: 3px;

            border-radius: 8px;
          }

          .month-tab {
            min-width: 90px;

            padding:
              7px 9px;

            font-size: 9px;
          }

          .error-box {
            font-size: 9px;

            padding:
              7px 9px;

            margin-bottom: 6px;
          }

          .calendar-card {
            border-radius: 10px;
          }

          .calendar-titlebar {
            padding:
              8px 10px;
          }

          .calendar-title {
            font-size: 13px;
          }

          .calendar-subtitle {
            font-size: 8px;
          }

          .sync-status {
            font-size: 8px;
          }

          .calendar-grid {
            min-width: 560px;
          }

          .day-header {
            min-height: 25px;

            font-size: 8px;
          }

          .calendar-cell,
          .empty-cell {
            min-height: 64px;

            padding:
              6px 5px;
          }

          .date-number {
            font-size: 10px;
          }

          .event-dot {
            width: 4px;
            height: 4px;
            flex-basis: 4px;
          }

          .event-card {
            margin-top: 5px;

            padding:
              4px 4px;

            border-radius: 5px;
          }

          .event-type {
            font-size: 6px;
          }

          .event-name {
            font-size: 7px;
          }

          .event-bottom-bar {
            left: 5px;
            right: 5px;
            bottom: 3px;
          }

          .legend {
            gap: 8px;

            margin-top: 6px;

            font-size: 7px;
          }

          .legend-line {
            width: 9px;
          }

          .detail-panel {
            margin-top: 7px;

            padding:
              11px 11px;

            border-radius: 9px;

            max-height: 210px;
          }

          .detail-header h3 {
            font-size: 14px;
          }

          .detail-date,
          .form-label {
            font-size: 8px;
          }

          .detail-description,
          .event-description {
            font-size: 9px;
          }

          .event-form {
            grid-template-columns:
              1fr;

            gap: 7px;
          }

          .event-form .full {
            grid-column:
              auto;
          }

          .form-actions {
            justify-content:
              flex-start;
          }

          .move-controls {
            align-items:
              stretch;
          }

          .move-label {
            width: 100%;
          }

          .move-month {
            flex: 1 1 140px;
            width: auto;
          }

          .move-day {
            flex: 0 0 65px;
          }

          .footer-note {
            display: none;
          }
        }

        /* =================================================
           SMALL MOBILE
           ================================================= */

        @media (max-width: 420px) {

          .brand h1 {
            font-size: 14px;
          }

          .admin-badge {
            display: none;
          }

          .admin-btn {
            font-size: 8px;

            padding:
              7px 8px;
          }

          .logout-btn {
            font-size: 8px;
          }

          .intro-section h2 {
            font-size: 15px;
          }

          .admin-status {
            display: none;
          }

          .calendar-grid {
            min-width: 520px;
          }

          .calendar-cell,
          .empty-cell {
            min-height: 60px;
          }

          .event-name {
            -webkit-line-clamp: 1;
          }

          .detail-actions {
            width: 100%;
          }

          .detail-actions button {
            flex: 1;
          }

          .form-actions button {
            flex: 1;
          }
        }

      `}</style>
    </div>
  );
}
