import { useEffect, useState } from "react";
import { auth } from "./api.js";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
import Polls from "./pages/Polls.jsx";
import Podcasts from "./pages/Podcasts.jsx";
import Playlists from "./pages/Playlists.jsx";
import Pages from "./pages/Pages.jsx";
import Bookings from "./pages/Bookings.jsx";
import Subscribers from "./pages/Subscribers.jsx";
import Settings from "./pages/Settings.jsx";
import Notifications from "./pages/Notifications.jsx";
import Users from "./pages/Users.jsx";
import Audit from "./pages/Audit.jsx";

const NAV_GROUPS = [
  { label: "Overview", items: [{ key: "dashboard", label: "Dashboard" }] },
  {
    label: "Content",
    items: [
      { key: "polls", label: "Polls" },
      { key: "podcasts", label: "Podcasts" },
      { key: "playlists", label: "Playlists" },
      { key: "pages", label: "Pages" },
      { key: "settings", label: "Sponsors & Ads" },
    ],
  },
  {
    label: "Audience",
    items: [
      { key: "bookings", label: "Bookings" },
      { key: "subscribers", label: "Subscribers" },
      { key: "notifications", label: "Notifications" },
    ],
  },
  {
    label: "Administration",
    adminOnly: true,
    items: [
      { key: "users", label: "Users" },
      { key: "audit", label: "Audit Log" },
    ],
  },
];

const isAdmin = (user) => user?.role === "admin";

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [section, setSection] = useState("dashboard");
  const [sidebarVisible, setSidebarVisible] = useState(true);
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("cms-theme");
    if (saved === "light" || saved === "dark") return saved;
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("cms-theme", theme);
  }, [theme]);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("admin:unauthorized", onUnauthorized);
    auth
      .me()
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
    return () => window.removeEventListener("admin:unauthorized", onUnauthorized);
  }, []);

  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1025) setSidebarVisible(true);
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSidebarVisible(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (loading) return <div className="cms-shell">Checking session…</div>;

  if (!user) return <Login onLogin={setUser} />;

  const renderSection = () => {
    // Privileged sections are unreachable for editors even if they somehow
    // navigate here (e.g. after their role was changed mid-session).
    if (section === "users" || section === "audit") {
      if (!isAdmin(user)) return <Dashboard />;
    }
    switch (section) {
      case "dashboard":
        return <Dashboard />;
      case "polls":
        return <Polls />;
      case "podcasts":
        return <Podcasts />;
      case "playlists":
        return <Playlists />;
      case "bookings":
        return <Bookings />;
      case "subscribers":
        return <Subscribers />;
      case "settings":
        return <Settings />;
      case "notifications":
        return <Notifications />;
      case "users":
        return <Users />;
      case "audit":
        return <Audit />;
      case "pages":
        return <Pages />;
      default:
        return <Dashboard />;
    }
  };

  const handleLogout = () => {
    auth.logout();
    setUser(null);
  };

  const go = (key) => {
    setSection(key);
    if (window.innerWidth < 1025) setSidebarVisible(false);
  };

  return (
    <div className="cms-shell">
      <header className="cms-header">
        <button
          type="button"
          className={`cms-menu-btn ${sidebarVisible ? "open" : ""}`}
          aria-label="Toggle navigation menu"
          aria-expanded={sidebarVisible}
          aria-controls="cms-nav"
          onClick={() => setSidebarVisible((v) => !v)}
        >
          <span className="cms-menu-bar" />
          <span className="cms-menu-bar" />
          <span className="cms-menu-bar" />
        </button>
        <div className="cms-brand">1847 Liberty CMS</div>
        <div className="cms-user">
          <span>
            {user.displayName || user.email} · {user.role}
          </span>
          <button
            type="button"
            className="cms-theme-btn"
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
          >
            {theme === "dark" ? "☀" : "☾"}
          </button>
          <button type="button" className="btn btn-ghost" onClick={handleLogout}>
            Log out
          </button>
        </div>
      </header>
      <div className={`cms-body ${sidebarVisible ? "" : "nav-collapsed"}`}>
        <nav
          id="cms-nav"
          className="cms-nav"
          aria-label="Admin sections"
        >
          {NAV_GROUPS.filter((group) => !group.adminOnly || isAdmin(user)).map((group) => (
            <div className="cms-nav-group" key={group.label}>
              <div className="cms-nav-group-label">{group.label}</div>
              {group.items.map((s) => (
                <button
                  type="button"
                  key={s.key}
                  className={`cms-nav-item ${section === s.key ? "active" : ""}`}
                  onClick={() => go(s.key)}
                >
                  {s.label}
                </button>
              ))}
            </div>
          ))}
        </nav>
        <main className="cms-main">{renderSection()}</main>
      </div>
    </div>
  );
}