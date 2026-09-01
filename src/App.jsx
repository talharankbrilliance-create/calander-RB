import React, { useState, useEffect, useCallback } from "react";
import {
  Client,
  Databases,
  Account,
  ID,
  Query,
  Permission,
  Role,
} from "appwrite";

/* =========================================================
   RB OFFICE CALENDAR — APPWRITE VERSION
   SEPTEMBER TO DECEMBER 2026
   ========================================================= */

/* ─────────────────────────────────────────────
   APPWRITE
   ───────────────────────────────────────────── */

const APPWRITE_ENDPOINT = "https://fra.cloud.appwrite.io/v1";
const APPWRITE_PROJECT_ID = "6a9698ce00010509b898";
const DATABASE_ID = "database-6a969bf50001918a6620";
const TABLE_ID = "events";

const client = new Client()
  .setEndpoint(APPWRITE_ENDPOINT)
  .setProject(APPWRITE_PROJECT_ID);

const databases = new Databases(client);
const account = new Account(client);

/* ─────────────────────────────────────────────
   DESIGN
   ───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   OFFICIAL EVENTS
   ───────────────────────────────────────────── */

const OFFICIAL_EVENTS = {
  "2026-09-06": {
    id: "official-defence-day",
    name: "Defence Day (Youm-e-Difa)",
    type: "National Day",
    holiday: "National Day",
    description:
      "Commemorates the defence of Pakistan during the 1965 India–Pakistan war.",
    official: true,
    color: C.lime,
  },

  "2026-09-07": {
    id: "official-air-force-day",
    name: "Air Force Day",
    type: "National Event",
    holiday: "National Observance",
    description:
      "Pakistan Air Force Day is observed on September 7.",
    official: true,
    color: C.lime,
  },

  "2026-11-09": {
    id: "official-iqbal-day",
    name: "Iqbal Day",
    type: "National Day",
    holiday: "Public Holiday",
    description:
      "Iqbal Day commemorates the birth anniversary of Allama Muhammad Iqbal.",
    official: true,
    color: C.lime,
  },

  "2026-12-25": {
    id: "official-quaid-day",
    name: "Quaid-e-Azam Day",
    type: "National Day",
    holiday: "Public Holiday",
    description:
      "Commemorates the birth anniversary of Quaid-e-Azam Muhammad Ali Jinnah.",
    official: true,
    color: C.lime,
  },
};

/* ─────────────────────────────────────────────
   EVENT TYPES
   ───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   DATE HELPERS
   ───────────────────────────────────────────── */

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

/* ─────────────────────────────────────────────
   APPWRITE ROW → EVENT
   ───────────────────────────────────────────── */

function rowToEvent(row) {
  return {
    id: row.$id,
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

/* =========================================================
   APP
   ========================================================= */

export default function App() {
  const [activeMonth, setActiveMonth] = useState(9);
  const [selected, setSelected] = useState(null);
  const [dbEvents, setDbEvents] = useState({});
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(null);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const emptyForm = {
    name: "",
    type: "Office Event",
    holiday: "Not a Public Holiday",
    description: "",
    isOffice: true,
  };

  const [form, setForm] = useState(emptyForm);

  /* ─────────────────────────────────────────────
     AUTH
     ───────────────────────────────────────────── */

  const [session, setSession] = useState(null);
  const [showLogin, setShowLogin] = useState(false);

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
  });

  const [loginError, setLoginError] = useState(null);
  const [loginLoading, setLoginLoading] = useState(false);

  const isAdmin = Boolean(session);

  /* ─────────────────────────────────────────────
     CURRENT MONTH
     ───────────────────────────────────────────── */

  const currentMonth =
    MONTHS.find((item) => item.month === activeMonth) ||
    MONTHS[0];

  /* ─────────────────────────────────────────────
     CHECK APPWRITE SESSION
     ───────────────────────────────────────────── */

  useEffect(() => {
    let mounted = true;

    async function checkSession() {
      try {
        const user = await account.get();

        if (mounted && user) {
          setSession(user);
        }
      } catch {
        if (mounted) {
          setSession(null);
        }
      }
    }

    checkSession();

    return () => {
      mounted = false;
    };
  }, []);

  /* ─────────────────────────────────────────────
     FETCH EVENTS
     ───────────────────────────────────────────── */

  const fetchEvents = useCallback(async () => {
    try {
      const response = await databases.listDocuments(
        DATABASE_ID,
        TABLE_ID,
        [
          Query.greaterThanEqual(
            "event_date",
            `${YEAR}-09-01`
          ),
          Query.lessThanEqual(
            "event_date",
            `${YEAR}-12-31`
          ),
          Query.orderAsc("event_date"),
          Query.limit(500),
        ]
      );

      const map = {};

      (response.documents || []).forEach((row) => {
        if (row.event_date) {
          map[row.event_date] = rowToEvent(row);
        }
      });

      setDbEvents(map);
      setError(null);
    } catch (e) {
  console.error("Login failed:", e);

  setLoginError(
    e?.message || "Login failed. Please try again."
  );
}

    setLoaded(true);
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  /* ─────────────────────────────────────────────
     GET EVENT
     ───────────────────────────────────────────── */

  const getEvent = (month, day) => {
    const key = dateKey(YEAR, month, day);

    return (
      OFFICIAL_EVENTS[key] ||
      dbEvents[key] ||
      null
    );
  };

  /* ─────────────────────────────────────────────
     SELECT DATE
     ───────────────────────────────────────────── */

  const selectDate = (day) => {
    setSelected({
      month: activeMonth,
      day,
    });

    setEditing(null);
  };

  /* ─────────────────────────────────────────────
     MONTH
     ───────────────────────────────────────────── */

  const changeMonth = (month) => {
    setActiveMonth(month);
    setSelected(null);
    setEditing(null);
    setError(null);
  };

  /* ─────────────────────────────────────────────
     LOGIN
     ───────────────────────────────────────────── */

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setLoginError(
        "Please enter email and password."
      );
      return;
    }

    setLoginLoading(true);
    setLoginError(null);

    try {
      const user = await account.createEmailPasswordSession(
        loginForm.email.trim(),
        loginForm.password
      );

      setSession(user);
      setShowLogin(false);

      setLoginForm({
        email: "",
        password: "",
      });

      setError(null);
    } catch (e) {
      console.error("Login failed:", e);

      setLoginError(
        "Login failed. Check your email and password."
      );
    }

    setLoginLoading(false);
  };

  /* ─────────────────────────────────────────────
     LOGOUT
     ───────────────────────────────────────────── */

  const handleLogout = async () => {
    try {
      await account.deleteSession("current");
    } catch (e) {
      console.error("Logout error:", e);
    }

    setSession(null);
    setEditing(null);
    setSelected(null);
    setShowLogin(false);
  };

  /* ─────────────────────────────────────────────
     OPEN ADD
     ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     OPEN EDIT
     ───────────────────────────────────────────── */

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

  /* ─────────────────────────────────────────────
     SAVE EVENT
     ───────────────────────────────────────────── */

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
          holidayText.includes("public holiday") &&
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
        await databases.updateDocument(
          DATABASE_ID,
          TABLE_ID,
          existing.id,
          body
        );
      } else {
        await databases.createDocument(
          DATABASE_ID,
          TABLE_ID,
          ID.unique(),
          body,
          [
            Permission.read(Role.any()),
            Permission.update(Role.users()),
            Permission.delete(Role.users()),
          ]
        );
      }

      setEditing(null);

      await fetchEvents();
    } catch (e) {
      console.error("Save failed:", e);

      setError(
        `Save failed: ${
          e.message || "Appwrite error"
        }`
      );
    }

    setSaving(false);
  };

  /* ─────────────────────────────────────────────
     DELETE EVENT
     ───────────────────────────────────────────── */

  const deleteEvent = async () => {
    if (!selected || !isAdmin) return;

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
      await databases.deleteDocument(
        DATABASE_ID,
        TABLE_ID,
        event.id
      );

      setEditing(null);

      await fetchEvents();
    } catch (e) {
      console.error("Delete failed:", e);

      setError(
        `Delete failed: ${
          e.message || "Appwrite error"
        }`
      );
    }

    setSaving(false);
  };

  /* ─────────────────────────────────────────────
     MOVE EVENT
     ───────────────────────────────────────────── */

  const moveEvent = async (
    newMonth,
    newDay
  ) => {
    if (!selected || !isAdmin) return;

    const oldKey = dateKey(
      YEAR,
      selected.month,
      selected.day
    );

    const event = dbEvents[oldKey];

    if (!event) return;

    const dayNumber = parseInt(newDay, 10);
    const monthNumber = parseInt(newMonth, 10);

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
      setError("Please enter a valid day.");
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
      await databases.updateDocument(
        DATABASE_ID,
        TABLE_ID,
        event.id,
        {
          event_date: newKey,
        }
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
        `Move failed: ${
          e.message || "Appwrite error"
        }`
      );
    }

    setSaving(false);
  };

  /* ─────────────────────────────────────────────
     SELECTED EVENT
     ───────────────────────────────────────────── */

  const selectedEvent = selected
    ? getEvent(
        selected.month,
        selected.day
      )
    : null;

  /* =========================================================
     RENDER
     ========================================================= */

  return (
    <div className="app">

      <header className="header">
        <div className="header-inner">

          <div className="brand">

            <div className="logo">
              <svg
                width="32"
                height="32"
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

            <div className="brand-text">
              <div className="brand-small">
                Office Planning
              </div>

              <h1>
                RB Office Calendar
              </h1>

              <p>
                Meetings, office activities,
                travel & important events
              </p>
            </div>

          </div>

          <div className="admin-area">

            {saving && (
              <span className="saving-text">
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

            {showLogin && !isAdmin && (
              <div className="login-panel">

                <div className="login-title">
                  Admin Login
                </div>

                <div className="login-subtitle">
                  Sign in to manage office events
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
                  className="login-input"
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
                  className="login-input"
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
                    className="sign-in-btn"
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
                    className="cancel-btn"
                  >
                    Cancel
                  </button>

                </div>

              </div>
            )}

          </div>

        </div>
      </header>

      <main className="main">

        <section className="intro">

          <div>
            <div className="intro-label">
              OFFICE CALENDAR · {YEAR}
            </div>

            <h2>
              Keep the whole team
              <span> on track.</span>
            </h2>
          </div>

          {isAdmin && (
            <div className="manage-status">
              ● You can manage events
            </div>
          )}

        </section>

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
                    ? "month-btn active"
                    : "month-btn"
                }
              >
                {month.name}
                <small>
                  {YEAR}
                </small>
              </button>
            );
          })}

        </div>

        {error && (
          <div className="error-box">
            {error}
          </div>
        )}

        <section className="calendar-card">

          <div className="calendar-title">

            <div>
              <div className="calendar-month">
                {currentMonth.name} {YEAR}
              </div>

              <div className="calendar-hint">
                Click a date to view details
              </div>
            </div>

            <div className="sync-status">
              {loaded
                ? "✓ Events synced"
                : "Loading events…"}
            </div>

          </div>

          <div className="days-header">

            {DAYS_HEADER.map(
              (dayName, index) => (
                <div
                  key={dayName}
                  className={
                    index >= 5
                      ? index === 6
                        ? "day-head sunday"
                        : "day-head saturday"
                      : "day-head"
                  }
                >
                  <span className="day-full">
                    {dayName}
                  </span>

                  <span className="day-short">
                    {dayName.charAt(0)}
                  </span>
                </div>
              )
            )}

          </div>

          <div className="calendar-grid">

            {buildMonthGrid(
              activeMonth
            ).map(
              (row, rowIndex) => (

                <div
                  key={rowIndex}
                  className="calendar-row"
                >

                  {row.map(
                    (
                      day,
                      columnIndex
                    ) => {

                      if (!day) {
                        return (
                          <div
                            key={columnIndex}
                            className="empty-cell"
                          />
                        );
                      }

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

                          <div className="date-top">

                            <span
                              className={
                                columnIndex === 6
                                  ? "date-number sunday"
                                  : isWeekend
                                  ? "date-number saturday"
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
                                    `0 0 7px ${
                                      event.color ||
                                      C.blue
                                    }`,
                                }}
                              />
                            )}

                          </div>

                          {event ? (
                            <div
                              className="event-box"
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
                            <div className="no-event">
                              —
                            </div>
                          )}

                          {event && (
                            <div
                              className="event-line"
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
              )
            )}

          </div>

        </section>

        <div className="legend">

          {[
            [C.lime, "Official"],
            [C.green, "Office"],
            [C.purple, "Meeting"],
            [C.orange, "Travel"],
            [C.red, "Important"],
            [C.blue, "Custom"],
          ].map(
            ([color, label]) => (
              <span
                key={label}
                className="legend-item"
              >
                <i
                  style={{
                    background: color,
                  }}
                />
                {label}
              </span>
            )
          )}

        </div>

        <section className="detail-panel">

          {!selected ? (

            <div>
              <div className="detail-title">
                Select a date
              </div>

              <p className="detail-muted">
                Click any date above to view events
                or add office activities.
              </p>
            </div>

          ) : editing === "add" ||
            editing === "edit" ? (

            <div>

              <div className="form-heading">

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

              <div className="form-grid">

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
                  rows={3}
                  className="form-input textarea full"
                />

                <label className="office-check">
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
                  Office event
                </label>

                <div className="form-buttons">

                  <button
                    onClick={() =>
                      setEditing(null)
                    }
                    className="cancel-form-btn"
                  >
                    Cancel
                  </button>

                  {editing === "edit" && (
                    <button
                      onClick={deleteEvent}
                      disabled={saving}
                      className="delete-form-btn"
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
                    className="save-form-btn"
                  >
                    {saving
                      ? "Saving…"
                      : "Save Event"}
                  </button>

                </div>

              </div>

            </div>

          ) : selectedEvent ? (

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
                        className="edit-btn"
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
                        color: style.color,
                        background:
                          style.background,
                      }}
                    >
                      {selectedEvent.type}
                    </span>
                  );
                })()}

                <span className="tag muted-tag">
                  {selectedEvent.holiday}
                </span>

                {selectedEvent.isOffice &&
                  !selectedEvent.official && (
                    <span className="tag office-tag">
                      Office Event
                    </span>
                  )}

                {selectedEvent.official && (
                  <span className="tag official-tag">
                    Official
                  </span>
                )}

              </div>

              {selectedEvent.description && (
                <p className="description">
                  {selectedEvent.description}
                </p>
              )}

              {!selectedEvent.official &&
                isAdmin && (

                  <div className="admin-tools">

                    <div className="tools-title">
                      Admin tools
                    </div>

                    <div className="move-row">

                      <span>
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
                              {month.name}
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
                        className="move-btn"
                      >
                        Move
                      </button>

                    </div>

                  </div>
                )}

            </div>

          ) : (

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

              <div className="empty-title">
                No event scheduled
              </div>

              <p className="detail-muted">
                This date is available for an
                office activity, meeting, travel
                or custom event.
              </p>

              {isAdmin && (
                <button
                  onClick={openAdd}
                  className="add-event-btn"
                >
                  + Add Event
                </button>
              )}

            </div>
          )}

        </section>

        <div className="footer-note">
          <strong>
            RB Office Calendar
          </strong>{" "}
          — Meetings, office activities,
          travel, important dates and national
          events.
        </div>

      </main>

      <style>{`

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
          min-height: 100%;
          background: ${C.navy};
        }

        html {
          overflow-x: hidden;
          overflow-y: auto;
        }

        body {
          overflow-x: hidden;
          overflow-y: auto;
          overscroll-behavior: auto;
        }

        button,
        input,
        textarea,
        select {
          font-family: inherit;
        }

        button {
          -webkit-tap-highlight-color: transparent;
        }

        button:hover {
          filter: brightness(1.08);
        }

        input::placeholder,
        textarea::placeholder {
          color: ${C.textDim};
        }

        select option {
          background: ${C.card};
          color: ${C.white};
        }

        .app {
          width: 100%;
          min-height: 100dvh;
          height: auto;
          overflow: visible;
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

        .header {
          width: 100%;
          height: 74px;
          flex-shrink: 0;
          border-bottom: 1px solid ${C.border};
          background: rgba(8,17,38,.94);
          backdrop-filter: blur(12px);
          position: relative;
          z-index: 50;
        }

        .header-inner {
          width: 100%;
          max-width: 1180px;
          height: 100%;
          margin: 0 auto;
          padding: 10px 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 15px;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 11px;
          min-width: 0;
        }

        .logo {
          width: 42px;
          height: 42px;
          border-radius: 10px;
          background:
            linear-gradient(
              135deg,
              #16264b,
              #0e1933
            );
          border: 1px solid ${C.border};
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .brand-text {
          min-width: 0;
        }

        .brand-small {
          color: ${C.lime};
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 1.3px;
          text-transform: uppercase;
          margin-bottom: 2px;
        }

        .brand h1 {
          margin: 0;
          font-size: 19px;
          line-height: 1.05;
          font-weight: 800;
          white-space: nowrap;
        }

        .brand p {
          margin: 3px 0 0;
          color: ${C.textMuted};
          font-size: 9px;
          white-space: nowrap;
        }

        .admin-area {
          position: relative;
          flex-shrink: 0;
        }

        .saving-text {
          position: absolute;
          right: 0;
          top: -14px;
          font-size: 8px;
          color: ${C.lime};
        }

        .admin-actions {
          display: flex;
          align-items: center;
          gap: 7px;
        }

        .admin-badge {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 7px 9px;
          border-radius: 8px;
          background: ${C.greenDim};
          border: 1px solid rgba(52,211,153,.22);
          color: ${C.green};
          font-size: 9px;
          font-weight: 800;
        }

        .logout-btn,
        .admin-btn {
          border-radius: 8px;
          font-family: inherit;
          cursor: pointer;
          padding: 7px 10px;
          font-size: 9px;
          font-weight: 700;
        }

        .logout-btn {
          border: 1px solid ${C.border};
          background: transparent;
          color: ${C.textMuted};
        }

        .admin-btn {
          border: 1px solid ${C.border};
          background: linear-gradient(
            135deg,
            #17264a,
            #111d3a
          );
          color: ${C.white};
        }

        .login-panel {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          width: 285px;
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 11px;
          padding: 14px;
          box-shadow: 0 18px 50px rgba(0,0,0,.45);
          z-index: 100;
        }

        .login-title {
          font-size: 13px;
          font-weight: 800;
        }

        .login-subtitle {
          color: ${C.textMuted};
          font-size: 9px;
          margin-top: 3px;
          margin-bottom: 10px;
        }

        .login-input {
          width: 100%;
          padding: 8px 10px;
          border-radius: 7px;
          border: 1px solid ${C.border};
          background: rgba(255,255,255,.045);
          color: ${C.white};
          outline: none;
          font-size: 11px;
          margin-bottom: 7px;
        }

        .login-error {
          color: ${C.red};
          font-size: 9px;
          margin-bottom: 7px;
        }

        .login-buttons {
          display: flex;
          gap: 6px;
        }

        .sign-in-btn,
        .cancel-btn {
          border-radius: 7px;
          padding: 7px 12px;
          font-size: 10px;
          font-weight: 700;
          cursor: pointer;
        }

        .sign-in-btn {
          background: ${C.lime};
          color: ${C.navy};
          border: none;
        }

        .cancel-btn {
          background: transparent;
          color: ${C.textMuted};
          border: 1px solid ${C.border};
        }

        .main {
          width: 100%;
          max-width: 1180px;
          min-height: calc(100dvh - 74px);
          height: auto;
          margin: 0 auto;
          padding: 15px 20px 20px;
          overflow: visible;
          display: flex;
          flex-direction: column;
        }

        .intro {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          margin-bottom: 10px;
        }

        .intro-label {
          color: ${C.textMuted};
          font-size: 8px;
          font-weight: 700;
          letter-spacing: .4px;
          margin-bottom: 3px;
        }

        .intro h2 {
          margin: 0;
          font-size: 20px;
          line-height: 1.05;
          font-weight: 800;
          letter-spacing: -.4px;
        }

        .intro h2 span {
          color: ${C.lime};
        }

        .manage-status {
          color: ${C.green};
          font-size: 9px;
          font-weight: 700;
        }

        .month-tabs {
          flex-shrink: 0;
          width: 100%;
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
          padding: 4px;
          background: rgba(17,29,58,.75);
          border: 1px solid ${C.border};
          border-radius: 9px;
          margin-bottom: 9px;
        }

        .month-btn {
          min-width: 0;
          border: 1px solid transparent;
          background: transparent;
          color: ${C.textMuted};
          padding: 7px 5px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 10px;
          font-weight: 750;
        }

        .month-btn small {
          opacity: .45;
          font-size: 8px;
          margin-left: 3px;
        }

        .month-btn.active {
          color: ${C.lime};
          background: ${C.limeDim};
          border-color: ${C.lime};
        }

        .error-box {
          flex-shrink: 0;
          background: ${C.redDim};
          border: 1px solid rgba(224,82,101,.25);
          color: ${C.red};
          padding: 7px 10px;
          border-radius: 7px;
          font-size: 9px;
          margin-bottom: 7px;
        }

        .calendar-card {
          flex-shrink: 0;
          width: 100%;
          background: rgba(17,29,58,.7);
          border: 1px solid ${C.border};
          border-radius: 11px;
          overflow: hidden;
          box-shadow: 0 15px 40px rgba(0,0,0,.16);
        }

        .calendar-title {
          height: 45px;
          padding: 7px 12px;
          border-bottom: 1px solid ${C.border};
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: 8px;
        }

        .calendar-month {
          font-size: 13px;
          font-weight: 800;
        }

        .calendar-hint {
          color: ${C.textMuted};
          font-size: 8px;
          margin-top: 2px;
        }

        .sync-status {
          color: ${C.green};
          font-size: 8px;
          font-weight: 700;
        }

        .days-header {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 1px;
          background: ${C.border};
        }

        .day-head {
          min-width: 0;
          background: ${C.card};
          text-align: center;
          padding: 5px 2px;
          color: ${C.textMuted};
          font-size: 8px;
          font-weight: 800;
        }

        .day-head.saturday {
          color: ${C.blue};
        }

        .day-head.sunday {
          color: ${C.red};
        }

        .day-short {
          display: none;
        }

        .calendar-grid {
          width: 100%;
        }

        .calendar-row {
          display: grid;
          grid-template-columns: repeat(7, minmax(0, 1fr));
          gap: 1px;
          background: ${C.border};
        }

        .calendar-cell,
        .empty-cell {
          min-width: 0;
          height: 73px;
          background: ${C.card};
        }

        .calendar-cell {
          padding: 5px 5px 4px;
          position: relative;
          cursor: pointer;
          overflow: hidden;
          transition: background .12s ease;
        }

        .calendar-cell:hover {
          background: ${C.cardHover};
        }

        .calendar-cell.selected {
          background: ${C.cardSelected};
          outline: 2px solid ${C.lime};
          outline-offset: -2px;
        }

        .empty-cell {
          background: rgba(17,29,58,.38);
        }

        .date-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .date-number {
          font-size: 11px;
          font-weight: 700;
          color: ${C.white};
        }

        .date-number.saturday {
          color: ${C.blue};
        }

        .date-number.sunday {
          color: ${C.red};
        }

        .calendar-cell.selected .date-number {
          color: ${C.lime};
          font-weight: 900;
        }

        .event-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          flex-shrink: 0;
        }

        .event-box {
          margin-top: 6px;
          border: 1px solid;
          border-radius: 5px;
          padding: 4px 5px;
          overflow: hidden;
        }

        .event-type {
          font-size: 6px;
          line-height: 1;
          font-weight: 900;
          text-transform: uppercase;
          letter-spacing: .15px;
          margin-bottom: 2px;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-name {
          color: ${C.white};
          font-size: 8px;
          line-height: 1.2;
          font-weight: 650;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
          word-break: break-word;
        }

        .no-event {
          color: ${C.textDim};
          font-size: 7px;
          opacity: .45;
          margin-top: 16px;
        }

        .event-line {
          position: absolute;
          left: 5px;
          right: 5px;
          bottom: 3px;
          height: 2px;
          border-radius: 2px;
        }

        .legend {
          flex-shrink: 0;
          display: flex;
          align-items: center;
          gap: 9px;
          flex-wrap: wrap;
          margin: 6px 2px;
          color: ${C.textMuted};
          font-size: 7px;
        }

        .legend-item {
          display: flex;
          align-items: center;
          gap: 3px;
          white-space: nowrap;
        }

        .legend-item i {
          width: 9px;
          height: 2px;
          border-radius: 2px;
        }

        .detail-panel {
          width: 100%;
          flex: none;
          min-height: 110px;
          overflow: visible;
          background: ${C.card};
          border: 1px solid ${C.border};
          border-radius: 10px;
          padding: 12px 14px;
        }

        .detail-title {
          font-size: 11px;
          font-weight: 800;
        }

        .detail-muted {
          margin: 4px 0 0;
          color: ${C.textMuted};
          font-size: 9px;
          line-height: 1.45;
        }

        .detail-date {
          color: ${C.lime};
          font-size: 9px;
          font-weight: 800;
        }

        .detail-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 10px;
        }

        .detail-header h3 {
          margin: 3px 0 0;
          font-size: 15px;
          font-weight: 800;
        }

        .detail-actions {
          display: flex;
          gap: 5px;
        }

        .edit-btn,
        .delete-btn {
          border-radius: 6px;
          padding: 5px 9px;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
        }

        .edit-btn {
          background: transparent;
          color: ${C.white};
          border: 1px solid ${C.border};
        }

        .delete-btn {
          background: ${C.redDim};
          color: ${C.red};
          border: none;
        }

        .tags {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 7px;
        }

        .tag {
          padding: 3px 7px;
          border-radius: 20px;
          font-size: 7px;
          font-weight: 750;
        }

        .muted-tag {
          background: rgba(255,255,255,.05);
          color: ${C.textMuted};
        }

        .office-tag {
          background: ${C.greenDim};
          color: ${C.green};
        }

        .official-tag {
          background: ${C.limeDim};
          color: ${C.lime};
        }

        .description {
          margin: 7px 0 0;
          color: ${C.textMuted};
          font-size: 9px;
          line-height: 1.5;
          max-width: 800px;
        }

        .admin-tools {
          margin-top: 8px;
          padding-top: 7px;
          border-top: 1px solid ${C.border};
        }

        .tools-title {
          color: ${C.textDim};
          font-size: 7px;
          font-weight: 800;
          text-transform: uppercase;
          letter-spacing: .5px;
          margin-bottom: 5px;
        }

        .move-row {
          display: flex;
          align-items: center;
          gap: 5px;
          flex-wrap: wrap;
          color: ${C.textMuted};
          font-size: 8px;
        }

        .move-month,
        .move-day {
          border: 1px solid ${C.border};
          background: rgba(255,255,255,.045);
          color: ${C.white};
          border-radius: 6px;
          padding: 5px 7px;
          outline: none;
          font-size: 8px;
        }

        .move-month {
          width: 105px;
        }

        .move-day {
          width: 50px;
        }

        .move-btn {
          border: 1px solid ${C.border};
          background: transparent;
          color: ${C.white};
          border-radius: 6px;
          padding: 5px 9px;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
        }

        .empty-title {
          margin-top: 3px;
          font-size: 13px;
          font-weight: 800;
        }

        .add-event-btn {
          margin-top: 7px;
          padding: 6px 11px;
          background: ${C.lime};
          color: ${C.navy};
          border: none;
          border-radius: 6px;
          font-size: 9px;
          font-weight: 850;
          cursor: pointer;
        }

        .form-heading {
          margin-bottom: 7px;
        }

        .form-label {
          color: ${C.lime};
          font-size: 8px;
          font-weight: 800;
        }

        .form-date {
          margin-top: 2px;
          font-size: 13px;
          font-weight: 800;
        }

        .form-grid {
          max-width: 700px;
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 6px;
        }

        .form-input {
          width: 100%;
          min-width: 0;
          border: 1px solid ${C.border};
          background: rgba(255,255,255,.045);
          color: ${C.white};
          border-radius: 6px;
          padding: 7px 8px;
          font-size: 9px;
          outline: none;
        }

        .form-input.full {
          grid-column: 1 / -1;
        }

        .textarea {
          resize: none;
        }

        .office-check {
          display: flex;
          align-items: center;
          gap: 5px;
          color: ${C.textMuted};
          font-size: 8px;
        }

        .form-buttons {
          display: flex;
          justify-content: flex-end;
          align-items: center;
          gap: 5px;
        }

        .cancel-form-btn,
        .delete-form-btn,
        .save-form-btn {
          border-radius: 6px;
          padding: 6px 9px;
          font-size: 8px;
          font-weight: 750;
          cursor: pointer;
        }

        .cancel-form-btn {
          border: 1px solid ${C.border};
          background: transparent;
          color: ${C.textMuted};
        }

        .delete-form-btn {
          border: none;
          background: ${C.redDim};
          color: ${C.red};
        }

        .save-form-btn {
          border: none;
          background: ${C.lime};
          color: ${C.navy};
          font-weight: 850;
        }

        .footer-note {
          flex-shrink: 0;
          margin-top: 5px;
          color: ${C.textDim};
          font-size: 7px;
          line-height: 1.3;
        }

        .footer-note strong {
          color: ${C.textMuted};
        }

        @media (max-width: 800px) {

          .header {
            height: 68px;
          }

          .main {
            min-height: calc(100dvh - 68px);
            height: auto;
            padding: 10px 12px 14px;
          }

          .brand p {
            display: none;
          }

          .brand h1 {
            font-size: 17px;
          }

          .logo {
            width: 38px;
            height: 38px;
          }

          .intro h2 {
            font-size: 18px;
          }

          .calendar-cell,
          .empty-cell {
            height: 68px;
          }

          .event-name {
            font-size: 7px;
          }

          .event-type {
            font-size: 5.5px;
          }

          .detail-panel {
            padding: 10px 12px;
          }
        }

        @media (max-width: 560px) {

          html,
          body,
          #root {
            width: 100%;
            max-width: 100%;
            overflow-x: hidden;
            overflow-y: auto;
          }

          .app {
            width: 100%;
            max-width: 100%;
            min-height: 100dvh;
            height: auto;
            overflow: visible;
          }

          .header {
            height: 61px;
          }

          .header-inner {
            padding: 7px 9px;
            gap: 6px;
          }

          .brand {
            gap: 7px;
            min-width: 0;
          }

          .logo {
            width: 34px;
            height: 34px;
            border-radius: 8px;
          }

          .brand-small {
            font-size: 6px;
            letter-spacing: .8px;
          }

          .brand h1 {
            font-size: 14px;
            letter-spacing: -.2px;
          }

          .brand p {
            display: none;
          }

          .admin-btn {
            padding: 6px 8px !important;
            font-size: 8px !important;
          }

          .admin-badge {
            padding: 5px 7px;
            font-size: 7px;
          }

          .logout-btn {
            padding: 5px 7px !important;
            font-size: 7px !important;
          }

          .login-panel {
            position: fixed;
            top: 57px;
            left: 8px;
            right: 8px;
            width: auto;
            max-width: none;
            padding: 12px;
            border-radius: 10px;
          }

          .login-title {
            font-size: 12px;
          }

          .login-input {
            padding: 8px;
            font-size: 10px;
          }

          .main {
            width: 100%;
            max-width: 100%;
            min-height: calc(100dvh - 61px);
            height: auto;
            padding: 7px 7px 14px;
            overflow: visible;
          }

          .intro {
            margin-bottom: 6px;
          }

          .intro-label {
            font-size: 6px;
            margin-bottom: 2px;
          }

          .intro h2 {
            font-size: 14px;
          }

          .manage-status {
            font-size: 7px;
          }

          .month-tabs {
            gap: 2px;
            padding: 3px;
            margin-bottom: 6px;
          }

          .month-btn {
            padding: 6px 2px;
            font-size: 8px;
          }

          .month-btn small {
            display: none;
          }

          .calendar-card {
            border-radius: 8px;
          }

          .calendar-title {
            height: 38px;
            padding: 5px 8px;
          }

          .calendar-month {
            font-size: 11px;
          }

          .calendar-hint {
            font-size: 6px;
          }

          .sync-status {
            font-size: 6px;
          }

          .day-head {
            padding: 4px 1px;
            font-size: 7px;
          }

          .day-full {
            display: none;
          }

          .day-short {
            display: inline;
          }

          .calendar-cell,
          .empty-cell {
            height: 57px;
          }

          .calendar-cell {
            padding: 4px 3px 3px;
          }

          .date-number {
            font-size: 9px;
          }

          .event-dot {
            width: 4px;
            height: 4px;
          }

          .event-box {
            margin-top: 4px;
            padding: 3px 3px;
            border-radius: 4px;
          }

          .event-type {
            font-size: 4.5px;
            margin-bottom: 1px;
          }

          .event-name {
            font-size: 6px;
            line-height: 1.15;
          }

          .no-event {
            font-size: 6px;
            margin-top: 11px;
          }

          .event-line {
            left: 3px;
            right: 3px;
            bottom: 2px;
            height: 1.5px;
          }

          .legend {
            gap: 6px;
            margin: 4px 1px;
            font-size: 6px;
          }

          .legend-item {
            gap: 2px;
          }

          .legend-item i {
            width: 7px;
          }

          .detail-panel {
            padding: 8px 9px;
            border-radius: 8px;
          }

          .detail-title {
            font-size: 10px;
          }

          .detail-muted {
            font-size: 7px;
            line-height: 1.35;
          }

          .detail-date {
            font-size: 7px;
          }

          .detail-header h3 {
            font-size: 12px;
          }

          .detail-actions {
            gap: 3px;
          }

          .edit-btn,
          .delete-btn {
            padding: 4px 7px;
            font-size: 7px;
          }

          .tags {
            margin-top: 5px;
            gap: 3px;
          }

          .tag {
            padding: 2px 5px;
            font-size: 6px;
          }

          .description {
            margin-top: 5px;
            font-size: 7px;
            line-height: 1.35;
            max-height: 31px;
            overflow: hidden;
          }

          .admin-tools {
            margin-top: 5px;
            padding-top: 5px;
          }

          .tools-title {
            font-size: 6px;
            margin-bottom: 3px;
          }

          .move-row {
            gap: 3px;
            font-size: 7px;
          }

          .move-month,
          .move-day,
          .move-btn {
            padding: 4px 5px;
            font-size: 7px;
          }

          .move-month {
            width: 83px;
          }

          .move-day {
            width: 43px;
          }

          .move-btn {
            padding-left: 7px;
            padding-right: 7px;
          }

          .empty-title {
            font-size: 11px;
          }

          .add-event-btn {
            margin-top: 5px;
            padding: 5px 8px;
            font-size: 7px;
          }

          .form-heading {
            margin-bottom: 5px;
          }

          .form-label {
            font-size: 6px;
          }

          .form-date {
            font-size: 11px;
          }

          .form-grid {
            gap: 4px;
          }

          .form-input {
            padding: 6px;
            font-size: 7px;
          }

          .textarea {
            height: 40px;
          }

          .office-check {
            font-size: 7px;
          }

          .form-buttons {
            gap: 3px;
          }

          .cancel-form-btn,
          .delete-form-btn,
          .save-form-btn {
            padding: 5px 7px;
            font-size: 7px;
          }

          .footer-note {
            display: none;
          }
        }

        @media (max-width: 380px) {

          .brand h1 {
            font-size: 12px;
          }

          .logo {
            width: 30px;
            height: 30px;
          }

          .admin-btn {
            font-size: 7px !important;
            padding: 5px 6px !important;
          }

          .intro h2 {
            font-size: 12px;
          }

          .calendar-cell,
          .empty-cell {
            height: 52px;
          }

          .event-name {
            font-size: 5.5px;
          }

          .event-type {
            font-size: 4px;
          }

          .date-number {
            font-size: 8px;
          }

          .detail-panel {
            padding: 7px;
          }
        }

      `}</style>
    </div>
  );
}
