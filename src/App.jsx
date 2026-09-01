import React, { useState, useEffect, useCallback } from "react";

/* =========================================================
   RB OFFICE CALENDAR — SEPTEMBER TO DECEMBER 2026
   FULL SCREEN / NO PAGE SCROLL VERSION
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
  const firstDay = new Date(
    year,
    month - 1,
    1
  ).getDay();

  return firstDay === 0 ? 6 : firstDay - 1;
}

function buildMonthGrid(month) {
  const daysInMonth = getDaysInMonth(
    YEAR,
    month
  );

  const offset = getMondayBasedOffset(
    YEAR,
    month
  );

  const cells = [];

  for (let i = 0; i < offset; i++) {
    cells.push(null);
  }

  for (
    let day = 1;
    day <= daysInMonth;
    day++
  ) {
    cells.push(day);
  }

  while (cells.length % 7 !== 0) {
    cells.push(null);
  }

  const rows = [];

  for (
    let i = 0;
    i < cells.length;
    i += 7
  ) {
    rows.push(cells.slice(i, i + 7));
  }

  return rows;
}

function getDayName(year, month, day) {
  const date = new Date(
    year,
    month - 1,
    day
  );

  const jsDay = date.getDay();

  return DAYS_HEADER[
    jsDay === 0 ? 6 : jsDay - 1
  ];
}

function formatDateForDisplay(
  month,
  day
) {
  const monthName =
    MONTHS.find(
      (m) => m.month === month
    )?.name || "";

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
    type:
      row.event_type ||
      "Custom Event",
    holiday: row.is_public_holiday
      ? "Public Holiday"
      : "Not a Public Holiday",
    description:
      row.description || "",
    official: false,
    isOffice: Boolean(
      row.is_office_event
    ),
    color: row.is_office_event
      ? C.green
      : getTypeStyle(
          row.event_type
        ).color,
  };
}

// ─────────────────────────────────────────────
// INPUT STYLE
// ─────────────────────────────────────────────

const inputStyle = {
  background:
    "rgba(255,255,255,0.045)",
  border: `1px solid ${C.border}`,
  borderRadius: 8,
  padding: "9px 11px",
  color: C.white,
  fontSize: 12,
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
  const [activeMonth, setActiveMonth] =
    useState(9);

  const [selected, setSelected] =
    useState(null);

  const [dbEvents, setDbEvents] =
    useState({});

  const [loaded, setLoaded] =
    useState(false);

  const [error, setError] =
    useState(null);

  const [editing, setEditing] =
    useState(null);

  const [saving, setSaving] =
    useState(false);

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

  const [form, setForm] =
    useState(emptyForm);

  // ─────────────────────────────────────────────
  // AUTH
  // ─────────────────────────────────────────────

  const [session, setSession] =
    useState(null);

  const [showLogin, setShowLogin] =
    useState(false);

  const [loginForm, setLoginForm] =
    useState({
      email: "",
      password: "",
    });

  const [loginError, setLoginError] =
    useState(null);

  const [loginLoading, setLoginLoading] =
    useState(false);

  const isAdmin = Boolean(
    session?.access_token
  );

  // ─────────────────────────────────────────────
  // CURRENT MONTH
  // ─────────────────────────────────────────────

  const currentMonth =
    MONTHS.find(
      (item) =>
        item.month === activeMonth
    ) || MONTHS[0];

  // ─────────────────────────────────────────────
  // FETCH EVENTS
  // ─────────────────────────────────────────────

  const fetchEvents =
    useCallback(async () => {
      try {
        const rows = await sbFetch(
          `/rest/v1/events?select=*&event_date=gte.${YEAR}-09-01&event_date=lte.${YEAR}-12-31&order=event_date.asc`,
          {
            method: "GET",
          },
          session?.access_token
        );

        const map = {};

        (rows || []).forEach(
          (row) => {
            if (row.event_date) {
              map[row.event_date] =
                rowToEvent(row);
            }
          }
        );

        setDbEvents(map);
        setError(null);
      } catch (e) {
        console.error(
          "Fetch events failed:",
          e
        );

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

  const getEvent = (
    month,
    day
  ) => {
    const key = dateKey(
      YEAR,
      month,
      day
    );

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
            email:
              loginForm.email,
            password:
              loginForm.password,
          }),
        }
      );

      if (data?.access_token) {
        setSession({
          access_token:
            data.access_token,
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
      console.error(
        "Login failed:",
        e
      );

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
    if (!isAdmin || !selected)
      return;

    const selectedKey = dateKey(
      YEAR,
      selected.month,
      selected.day
    );

    if (
      OFFICIAL_EVENTS[
        selectedKey
      ]
    ) {
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
    if (
      !isAdmin ||
      !event ||
      event.official
    ) {
      return;
    }

    setForm({
      name: event.name,
      type:
        event.type ||
        "Custom Event",
      holiday:
        event.holiday ||
        "Not a Public Holiday",
      description:
        event.description || "",
      isOffice: Boolean(
        event.isOffice
      ),
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
        event_name:
          form.name.trim(),
        event_type:
          form.type.trim() ||
          "Custom Event",
        is_public_holiday:
          holidayText.includes(
            "public holiday"
          ) &&
          !holidayText.includes(
            "not"
          ),
        description:
          form.description.trim(),
        is_office_event:
          form.isOffice,
      };

      const existing =
        dbEvents[key];

      if (
        editing === "edit" &&
        existing
      ) {
        await sbFetch(
          `/rest/v1/events?id=eq.${existing.id}`,
          {
            method: "PATCH",
            body: JSON.stringify(
              body
            ),
          },
          session.access_token
        );
      } else {
        await sbFetch(
          "/rest/v1/events",
          {
            method: "POST",
            body: JSON.stringify(
              body
            ),
          },
          session.access_token
        );
      }

      setEditing(null);

      await fetchEvents();
    } catch (e) {
      console.error(
        "Save failed:",
        e
      );

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

    const event =
      dbEvents[key];

    if (!event) return;

    const confirmed =
      window.confirm(
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
      console.error(
        "Delete failed:",
        e
      );

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

    const event =
      dbEvents[oldKey];

    if (!event) return;

    const dayNumber =
      parseInt(newDay, 10);

    const monthNumber =
      parseInt(newMonth, 10);

    if (
      !MONTHS.some(
        (m) =>
          m.month ===
          monthNumber
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
      OFFICIAL_EVENTS[
        newKey
      ] ||
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
            event_date:
              newKey,
          }),
        },
        session.access_token
      );

      setActiveMonth(
        monthNumber
      );

      setSelected({
        month: monthNumber,
        day: dayNumber,
      });

      await fetchEvents();
    } catch (e) {
      console.error(
        "Move failed:",
        e
      );

      setError(
        `Move failed: ${e.message}`
      );
    }

    setSaving(false);
  };

  // ─────────────────────────────────────────────
  // SELECTED EVENT
  // ─────────────────────────────────────────────

  const selectedEvent =
    selected
      ? getEvent(
          selected.month,
          selected.day
        )
      : null;

  // ─────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────

  return (
    <div
      className="app-shell"
      style={{
        width: "100%",
        height: "100vh",
        overflow: "hidden",
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
      }}
    >
      {/* =================================================
          HEADER
          ================================================= */}

      <header
        className="app-header"
        style={{
          width: "100%",
          height: 78,
          borderBottom:
            `1px solid ${C.border}`,
          background:
            "rgba(8,17,38,0.95)",
          backdropFilter:
            "blur(12px)",
          position: "relative",
          zIndex: 20,
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: 1180,
            height: "100%",
            margin: "0 auto",
            padding:
              "10px 22px",
          }}
        >
          <div
            style={{
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent:
                "space-between",
              gap: 15,
            }}
          >
            {/* BRAND */}

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 12,
                minWidth: 0,
              }}
            >
              <div
                className="brand-logo"
                style={{
                  width: 45,
                  height: 45,
                  borderRadius: 11,
                  background:
                    "linear-gradient(135deg,#16264b,#0e1933)",
                  border:
                    `1px solid ${C.border}`,
                  display: "flex",
                  alignItems:
                    "center",
                  justifyContent:
                    "center",
                  flexShrink: 0,
                }}
              >
                <svg
                  width="34"
                  height="34"
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

              <div
                style={{
                  minWidth: 0,
                }}
              >
                <div
                  style={{
                    fontSize: 9,
                    color: C.lime,
                    fontWeight: 700,
                    letterSpacing:
                      "1.4px",
                    textTransform:
                      "uppercase",
                  }}
                >
                  Office Planning
                </div>

                <h1
                  style={{
                    margin: "2px 0 0",
                    fontSize: 21,
                    lineHeight: 1.1,
                    fontWeight: 750,
                    letterSpacing:
                      "-0.5px",
                  }}
                >
                  RB Office Calendar
                </h1>

                <p
                  className="header-description"
                  style={{
                    margin:
                      "3px 0 0",
                    color:
                      C.textMuted,
                    fontSize: 10,
                    whiteSpace:
                      "nowrap",
                  }}
                >
                  Plan meetings, office
                  activities, travel &
                  important events
                </p>
              </div>
            </div>

            {/* ADMIN */}

            <div
              style={{
                position:
                  "relative",
                flexShrink: 0,
              }}
            >
              {saving && (
                <span
                  style={{
                    position:
                      "absolute",
                    right: 0,
                    top: -17,
                    fontSize: 9,
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
                    gap: 7,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems:
                        "center",
                      gap: 6,
                      padding:
                        "7px 10px",
                      borderRadius: 8,
                      background:
                        C.greenDim,
                      border:
                        `1px solid rgba(52,211,153,.22)`,
                      color:
                        C.green,
                      fontSize: 10,
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
                        "7px 11px",
                      border:
                        `1px solid ${C.border}`,
                      background:
                        "transparent",
                      color:
                        C.textMuted,
                      fontSize: 10,
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
                      "8px 14px",
                    border:
                      `1px solid ${C.border}`,
                    background:
                      "linear-gradient(135deg,#17264a,#111d3a)",
                    color: C.white,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  🔐 Admin
                </button>
              )}

              {/* LOGIN PANEL */}

              {showLogin &&
                !isAdmin && (
                  <div
                    className="login-panel"
                    style={{
                      position:
                        "absolute",
                      top:
                        "calc(100% + 9px)",
                      right: 0,
                      width: 300,
                      background:
                        C.card,
                      border:
                        `1px solid ${C.border}`,
                      borderRadius: 11,
                      padding: 15,
                      boxShadow:
                        "0 18px 50px rgba(0,0,0,.45)",
                      zIndex: 100,
                    }}
                  >
                    <div
                      style={{
                        marginBottom:
                          10,
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
                          fontSize: 10,
                          color:
                            C.textMuted,
                          marginTop: 2,
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
                        marginBottom: 7,
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
                        marginBottom: 8,
                      }}
                    />

                    {loginError && (
                      <div
                        style={{
                          fontSize: 10,
                          color:
                            C.red,
                          marginBottom:
                            8,
                        }}
                      >
                        {loginError}
                      </div>
                    )}

                    <div
                      style={{
                        display: "flex",
                        gap: 6,
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
                            "8px 14px",
                          background:
                            C.lime,
                          color:
                            C.navy,
                          border:
                            "none",
                          fontSize: 11,
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
                            "8px 13px",
                          background:
                            "transparent",
                          color:
                            C.textMuted,
                          border:
                            `1px solid ${C.border}`,
                          fontSize: 11,
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
        className="main-area"
        style={{
          width: "100%",
          maxWidth: 1180,
          height:
            "calc(100vh - 78px)",
          margin: "0 auto",
          padding:
            "14px 22px 12px",
          boxSizing: "border-box",
          overflow: "hidden",
          display: "flex",
          flexDirection:
            "column",
        }}
      >
        {/* INTRO */}

        <section
          className="intro-section"
          style={{
            flexShrink: 0,
            marginBottom: 10,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems:
                "center",
              justifyContent:
                "space-between",
              gap: 10,
            }}
          >
            <div>
              <div
                style={{
                  color:
                    C.textMuted,
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing:
                    ".4px",
                  marginBottom:
                    3,
                }}
              >
                OFFICE CALENDAR ·{" "}
                {YEAR}
              </div>

              <h2
                style={{
                  margin: 0,
                  fontSize: 22,
                  lineHeight: 1.1,
                  fontWeight: 750,
                  letterSpacing:
                    "-.5px",
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
                  fontSize: 10,
                  fontWeight: 600,
                }}
              >
                ● You can manage
                events
              </div>
            )}
          </div>
        </section>

        {/* =================================================
            MONTH TABS
            ================================================= */}

        <div
          className="month-tabs"
          style={{
            background:
              "rgba(17,29,58,.75)",
            border:
              `1px solid ${C.border}`,
            borderRadius: 10,
            padding: 4,
            display: "flex",
            gap: 4,
            marginBottom: 10,
            overflowX: "auto",
            flexShrink: 0,
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
                    minWidth: 105,
                    padding:
                      "8px 12px",
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
                    fontSize: 11,
                    fontWeight: 750,
                  }}
                >
                  {month.name}{" "}
                  <span
                    style={{
                      opacity:
                        0.5,
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
            className="error-box"
            style={{
              background:
                C.redDim,
              border:
                `1px solid rgba(224,82,101,.25)`,
              color: C.red,
              padding:
                "7px 11px",
              borderRadius: 8,
              fontSize: 10,
              marginBottom: 8,
              flexShrink: 0,
            }}
          >
            {error}
          </div>
        )}

        {/* =================================================
            CALENDAR
            ================================================= */}

        <section
          className="calendar-section"
          style={{
            background:
              "rgba(17,29,58,.7)",
            border:
              `1px solid ${C.border}`,
            borderRadius: 13,
            overflow: "hidden",
            boxShadow:
              "0 15px 50px rgba(0,0,0,.18)",
            flex: 1,
            minHeight: 0,
            display: "flex",
            flexDirection:
              "column",
          }}
        >
          {/* CALENDAR TITLE BAR */}

          <div
            className="calendar-title"
            style={{
              padding:
                "10px 15px",
              borderBottom:
                `1px solid ${C.border}`,
              display: "flex",
              justifyContent:
                "space-between",
              alignItems:
                "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 750,
                }}
              >
                {currentMonth.name}{" "}
                {YEAR}
              </div>

              <div
                style={{
                  marginTop: 2,
                  fontSize: 9,
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
                fontSize: 9,
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
            className="day-headers"
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(7, minmax(0, 1fr))",
              gap: 1,
              background:
                C.border,
              flexShrink: 0,
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
                      "7px 3px",
                    fontSize: 9,
                    fontWeight: 750,
                    color:
                      index >= 5
                        ? index ===
                          6
                          ? C.red
                          : C.blue
                        : C.textMuted,
                    letterSpacing:
                      ".3px",
                  }}
                >
                  {dayName}
                </div>
              )
            )}
          </div>

          {/* CALENDAR GRID */}

          <div
            className="calendar-grid"
            style={{
              flex: 1,
              minHeight: 0,
              display: "flex",
              flexDirection:
                "column",
              gap: 1,
              background:
                C.border,
            }}
          >
            {buildMonthGrid(
              activeMonth
            ).map(
              (row, rowIndex) => (
                <div
                  key={
                    rowIndex
                  }
                  className="calendar-row"
                  style={{
                    display:
                      "grid",
                    gridTemplateColumns:
                      "repeat(7, minmax(0, 1fr))",
                    gap: 1,
                    background:
                      C.border,
                    flex: 1,
                    minHeight: 0,
                  }}
                >
                  {row.map(
                    (
                      day,
                      columnIndex
                    ) => {
                      if (!day) {
                        return (
                          <div
                            key={
                              columnIndex
                            }
                            style={{
                              background:
                                "rgba(17,29,58,.38)",
                              minWidth: 0,
                              minHeight: 0,
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
                          className={`calendar-cell ${
                            isSelected
                              ? "selected-cell"
                              : ""
                          }`}
                          style={{
                            minWidth: 0,
                            minHeight: 0,
                            padding:
                              "6px 7px",
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
                            overflow:
                              "hidden",
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
                                fontSize: 13,
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
                                  width: 5,
                                  height: 5,
                                  borderRadius:
                                    "50%",
                                  background:
                                    event.color ||
                                    C.blue,
                                  boxShadow:
                                    `0 0 7px ${event.color || C.blue}`,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                          </div>

                          {/* EVENT */}

                          {event && (
                            <div
                              className="calendar-event"
                              style={{
                                marginTop: 7,
                                borderRadius:
                                  6,
                                padding:
                                  "5px 6px",
                                background:
                                  typeStyle.background,
                                border:
                                  `1px solid ${typeStyle.color}33`,
                                overflow:
                                  "hidden",
                              }}
                            >
                              <div
                                style={{
                                  color:
                                    typeStyle.color,
                                  fontSize: 8,
                                  fontWeight:
                                    750,
                                  marginBottom:
                                    2,
                                  textTransform:
                                    "uppercase",
                                  letterSpacing:
                                    ".2px",
                                  whiteSpace:
                                    "nowrap",
                                  overflow:
                                    "hidden",
                                  textOverflow:
                                    "ellipsis",
                                }}
                              >
                                {
                                  event.type
                                }
                              </div>

                              <div
                                style={{
                                  color:
                                    C.white,
                                  fontSize: 9,
                                  lineHeight:
                                    1.25,
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
                                  wordBreak:
                                    "break-word",
                                }}
                              >
                                {
                                  event.name
                                }
                              </div>
                            </div>
                          )}

                          {!event && (
                            <div
                              style={{
                                marginTop:
                                  10,
                                color:
                                  C.textDim,
                                fontSize: 8,
                                opacity:
                                  0.35,
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
                                left: 7,
                                right: 7,
                                bottom: 3,
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
          </div>
        </section>

        {/* =================================================
            LEGEND
            ================================================= */}

        <div
          className="legend"
          style={{
            display: "flex",
            alignItems:
              "center",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 7,
            padding:
              "0 3px",
            color:
              C.textMuted,
            fontSize: 9,
            flexShrink: 0,
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
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 11,
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
          className="detail-panel"
          style={{
            marginTop: 8,
            background:
              C.card,
            border:
              `1px solid ${C.border}`,
            borderRadius: 11,
            padding:
              "11px 15px",
            minHeight: 75,
            maxHeight: 155,
            overflowY: "auto",
            flexShrink: 0,
          }}
        >
          {/* NOTHING SELECTED */}

          {!selected ? (
            <div>
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Select a date
              </div>

              <p
                style={{
                  margin:
                    "4px 0 0",
                  color:
                    C.textMuted,
                  fontSize: 10,
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
            /* FORM */

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "center",
                  gap: 10,
                  marginBottom:
                    8,
                }}
              >
                <div>
                  <div
                    style={{
                      color:
                        C.lime,
                      fontSize: 9,
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
                        2,
                      fontSize: 14,
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
                  maxWidth: 700,
                  display:
                    "grid",
                  gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",
                  gap: 7,
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
                        {
                          type.value
                        }
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
                  rows={2}
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
                    gap: 7,
                    fontSize: 10,
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
                    gap: 6,
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
                        "7px 12px",
                      border:
                        `1px solid ${C.border}`,
                      background:
                        "transparent",
                      color:
                        C.textMuted,
                      fontSize: 10,
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
                          "7px 12px",
                        border:
                          "none",
                        background:
                          C.redDim,
                        color:
                          C.red,
                        fontSize: 10,
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
                        "7px 14px",
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
                      fontSize: 10,
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
            /* EVENT DETAIL */

            <div>
              <div
                style={{
                  display: "flex",
                  justifyContent:
                    "space-between",
                  alignItems:
                    "flex-start",
                  gap: 10,
                }}
              >
                <div
                  style={{
                    minWidth: 0,
                  }}
                >
                  <div
                    style={{
                      color:
                        C.lime,
                      fontSize: 9,
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
                        "3px 0 0",
                      fontSize: 16,
                      fontWeight:
                        750,
                      lineHeight:
                        1.2,
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
                        gap: 5,
                        flexShrink: 0,
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
                            "6px 11px",
                          background:
                            "transparent",
                          border:
                            `1px solid ${C.border}`,
                          color:
                            C.white,
                          fontSize: 10,
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
                            "6px 11px",
                          background:
                            C.redDim,
                          border:
                            "none",
                          color:
                            C.red,
                          fontSize: 10,
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
                  gap: 5,
                  flexWrap:
                    "wrap",
                  marginTop: 7,
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
                          "3px 8px",
                        borderRadius:
                          20,
                        fontSize: 9,
                        fontWeight:
                          700,
                      }}
                    >
                      {
                        selectedEvent.type
                      }
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
                      "3px 8px",
                    borderRadius:
                      20,
                    fontSize: 9,
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
                          "3px 8px",
                        borderRadius:
                          20,
                        fontSize: 9,
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
                        "3px 8px",
                      borderRadius:
                        20,
                      fontSize: 9,
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
                      "7px 0 0",
                    color:
                      C.textMuted,
                    fontSize: 10,
                    lineHeight:
                      1.45,
                    maxWidth:
                      850,
                  }}
                >
                  {
                    selectedEvent.description
                  }
                </p>
              )}

              {/* ADMIN MOVE */}

              {!selectedEvent.official &&
                isAdmin && (
                  <div
                    style={{
                      marginTop: 8,
                      paddingTop:
                        7,
                      borderTop:
                        `1px solid ${C.border}`,
                    }}
                  >
                    <div
                      style={{
                        display:
                          "flex",
                        alignItems:
                          "center",
                        gap: 6,
                        flexWrap:
                          "wrap",
                      }}
                    >
                      <span
                        style={{
                          color:
                            C.textMuted,
                          fontSize: 9,
                        }}
                      >
                        Move event:
                      </span>

                      <select
                        id="move-month"
                        defaultValue={
                          selected.month
                        }
                        style={{
                          ...inputStyle,
                          width: 115,
                          padding:
                            "5px 7px",
                          fontSize: 9,
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
                          width: 55,
                          padding:
                            "5px 7px",
                          fontSize: 9,
                        }}
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
                        style={{
                          ...buttonBase,
                          padding:
                            "5px 10px",
                          border:
                            `1px solid ${C.border}`,
                          background:
                            "transparent",
                          color:
                            C.white,
                          fontSize: 9,
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
            /* EMPTY DATE */

            <div>
              <div
                style={{
                  color:
                    C.lime,
                  fontSize: 9,
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
                  marginTop: 3,
                  fontSize: 14,
                  fontWeight: 700,
                }}
              >
                No event scheduled
              </div>

              <p
                style={{
                  margin:
                    "3px 0 7px",
                  color:
                    C.textMuted,
                  fontSize: 10,
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
                      "6px 12px",
                    background:
                      C.lime,
                    color:
                      C.navy,
                    border:
                      "none",
                    fontSize: 10,
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

        {/* FOOTER NOTE */}

        <div
          className="footer-note"
          style={{
            marginTop: 5,
            padding:
              "2px 3px 0",
            color:
              C.textDim,
            fontSize: 8,
            lineHeight: 1.3,
            flexShrink: 0,
            whiteSpace:
              "nowrap",
            overflow:
              "hidden",
            textOverflow:
              "ellipsis",
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
          — Meetings, office activities,
          travel, important dates and
          national events.
        </div>
      </main>

      {/* =================================================
          GLOBAL CSS
          ================================================= */}

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
          overflow: hidden !important;
          background: ${C.navy};
        }

        html {
          overflow: hidden !important;
        }

        body {
          overflow: hidden !important;
          overscroll-behavior: none;
        }

        #root {
          overflow: hidden !important;
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

        button:disabled {
          cursor: not-allowed;
          opacity: .65;
        }

        input::placeholder,
        textarea::placeholder {
          color: ${C.textDim};
        }

        select option {
          color: ${C.white};
          background: ${C.card};
        }

        textarea {
          scrollbar-width: thin;
          scrollbar-color: ${C.border} transparent;
        }

        .detail-panel {
          scrollbar-width: thin;
          scrollbar-color: ${C.border} transparent;
        }

        /* Desktop / laptop */

        @media (min-width: 721px) {
          .calendar-cell:hover {
            background: ${C.cardHover} !important;
          }
        }

        /* Medium screens */

        @media (max-height: 760px) {
          .app-header {
            height: 68px !important;
          }

          .main-area {
            height: calc(100vh - 68px) !important;
            padding-top: 9px !important;
            padding-bottom: 7px !important;
          }

          .intro-section {
            margin-bottom: 7px !important;
          }

          .intro-section h2 {
            font-size: 19px !important;
          }

          .month-tabs {
            margin-bottom: 7px !important;
          }

          .calendar-title {
            padding-top: 7px !important;
            padding-bottom: 7px !important;
          }

          .day-headers > div {
            padding-top: 5px !important;
            padding-bottom: 5px !important;
          }

          .detail-panel {
            max-height: 125px !important;
            padding: 9px 13px !important;
          }

          .legend {
            margin-top: 5px !important;
          }

          .footer-note {
            display: none !important;
          }
        }

        /* Mobile */

        @media (max-width: 720px) {
          .app-header {
            height: 64px !important;
          }

          .main-area {
            height: calc(100vh - 64px) !important;
            padding: 8px !important;
          }

          .brand-logo {
            width: 39px !important;
            height: 39px !important;
          }

          .header-description {
            display: none !important;
          }

          .app-header h1 {
            font-size: 17px !important;
          }

          .app-header > div {
            padding-left: 10px !important;
            padding-right: 10px !important;
          }

          .intro-section {
            margin-bottom: 7px !important;
          }

          .intro-section h2 {
            font-size: 18px !important;
          }

          .intro-section > div > div:last-child {
            display: none !important;
          }

          .month-tabs {
            margin-bottom: 7px !important;
          }

          .month-tabs button {
            min-width: 90px !important;
            padding: 7px 8px !important;
            font-size: 10px !important;
          }

          .calendar-section {
            border-radius: 10px !important;
          }

          .calendar-title {
            padding: 8px 10px !important;
          }

          .calendar-title > div:first-child > div:first-child {
            font-size: 13px !important;
          }

          .calendar-title > div:first-child > div:last-child {
            font-size: 8px !important;
          }

          .day-headers > div {
            padding: 5px 2px !important;
            font-size: 8px !important;
          }

          .calendar-cell {
            padding: 4px !important;
          }

          .calendar-cell > div:first-child span:first-child {
            font-size: 11px !important;
          }

          .calendar-event {
            margin-top: 4px !important;
            padding: 3px 4px !important;
          }

          .calendar-event > div:first-child {
            font-size: 6px !important;
          }

          .calendar-event > div:last-child {
            font-size: 7px !important;
          }

          .legend {
            gap: 7px !important;
            font-size: 7px !important;
          }

          .legend span > span {
            width: 8px !important;
          }

          .detail-panel {
            margin-top: 6px !important;
            padding: 9px 10px !important;
            max-height: 130px !important;
            border-radius: 9px !important;
          }

          .footer-note {
            display: none !important;
          }

          .login-panel {
            right: -5px !important;
            width: min(300px, calc(100vw - 20px)) !important;
          }
        }

        /* Very small mobile */

        @media (max-width: 480px) {
          .app-header {
            height: 58px !important;
          }

          .main-area {
            height: calc(100vh - 58px) !important;
            padding: 6px !important;
          }

          .brand-logo {
            width: 35px !important;
            height: 35px !important;
          }

          .app-header h1 {
            font-size: 15px !important;
          }

          .app-header div {
            gap: 7px !important;
          }

          .app-header button {
            padding: 6px 9px !important;
            font-size: 9px !important;
          }

          .intro-section h2 {
            font-size: 16px !important;
          }

          .intro-section {
            margin-bottom: 5px !important;
          }

          .month-tabs {
            padding: 3px !important;
            gap: 3px !important;
          }

          .month-tabs button {
            min-width: 75px !important;
            padding: 6px 5px !important;
            font-size: 9px !important;
          }

          .calendar-title {
            padding: 6px 8px !important;
          }

          .calendar-title > div:first-child > div:first-child {
            font-size: 12px !important;
          }

          .day-headers > div {
            font-size: 7px !important;
            padding: 4px 1px !important;
          }

          .calendar-cell {
            padding: 3px !important;
          }

          .calendar-cell > div:first-child span:first-child {
            font-size: 10px !important;
          }

          .calendar-event {
            margin-top: 3px !important;
            padding: 2px 3px !important;
          }

          .calendar-event > div:first-child {
            font-size: 5px !important;
            margin-bottom: 1px !important;
          }

          .calendar-event > div:last-child {
            font-size: 6px !important;
          }

          .detail-panel {
            max-height: 115px !important;
            padding: 7px 8px !important;
          }

          .legend {
            display: none !important;
          }
        }

        /* Form responsive */

        @media (max-width: 600px) {
          .detail-panel textarea {
            min-height: 45px;
          }

          .detail-panel [style*="grid-template-columns"] {
            grid-template-columns: 1fr !important;
          }

          .detail-panel [style*="grid-column"] {
            grid-column: 1 !important;
          }
        }
      `}</style>
    </div>
  );
}
