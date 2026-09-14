import { useEffect, useState } from "react";
import { api } from "../api.js";
import { fmtDate } from "../lib/format.js";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [recentBookings, setRecentBookings] = useState([]);
  const [recentPodcasts, setRecentPodcasts] = useState([]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [subscribers, bookings, notif] = await Promise.all([
          api("/subscribers/stats"),
          api("/bookings/stats"),
          api("/notifications/stats"),
        ]);
        // Recent activity (best-effort; failures leave empty lists).
        const [recents] = await Promise.all([
          api("/bookings?limit=5"),
        ]);
        const [pods] = await Promise.all([api("/podcasts?limit=5")]);
        if (!mounted) return;
        setStats({
          subscribers: subscribers || {},
          bookings: bookings || {},
          notifications: notif || {},
        });
        setRecentBookings(recents?.rows || []);
        setRecentPodcasts(pods?.rows || []);
      } catch (err) {
        if (mounted) setError(err.message || "Failed to load dashboard");
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const totalBookings = stats?.bookings
    ? Object.values(stats.bookings).reduce((a, b) => a + b, 0)
    : 0;
  const activeSubscribers = stats?.subscribers?.subscribed || 0;
  const notificationsSent = stats?.notifications?.notifications?.sent || 0;

  const statusBadge = (s) => {
    const map = {
      new: "badge-blue",
      contacted: "badge-amber",
      pending: "badge-amber",
      confirmed: "badge-green",
      completed: "badge-gray",
      cancelled: "badge-red",
      declined: "badge-red",
      resolved: "badge-gray",
    };
    return <span className={`badge ${map[s] || "badge-gray"}`}>{s}</span>;
  };

  return (
    <>
      <h1 className="page-title">Dashboard</h1>
      {error && <p className="msg msg-err">{error}</p>}

      <div className="stat-grid">
        <div className="stat">
          <div className="num">{activeSubscribers}</div>
          <div className="label">Active subscribers</div>
        </div>
        <div className="stat">
          <div className="num">{totalBookings}</div>
          <div className="label">Booking requests</div>
        </div>
        <div className="stat">
          <div className="num">{stats?.bookings?.pending || 0}</div>
          <div className="label">Pending bookings</div>
        </div>
        <div className="stat">
          <div className="num">{notificationsSent}</div>
          <div className="label">Notifications sent</div>
        </div>
        <div className="stat">
          <div className="num">{stats?.notifications?.recipients?.sent || 0}</div>
          <div className="label">Emails delivered</div>
        </div>
      </div>

      <div className="card">
        <h2 className="card-title">Recent booking requests</h2>
        {!recentBookings.length ? (
          <p className="muted">No bookings yet.</p>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Event</th>
                <th>Date</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {recentBookings.map((b) => (
                <tr key={b.id}>
                  <td>{b.name}</td>
                  <td>{b.email}</td>
                  <td>{b.eventType || "—"}</td>
                  <td>{b.eventDate || "—"}</td>
                  <td>{statusBadge(b.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div className="card">
        <h2 className="card-title">Recent podcasts</h2>
        {!recentPodcasts.length ? (
          <p className="muted">No podcasts yet.</p>
        ) : (
          <table className="cms-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Published</th>
              </tr>
            </thead>
            <tbody>
              {recentPodcasts.map((p) => (
                <tr key={p.id}>
                  <td>{p.title}</td>
                  <td>
                    <span className={`badge ${p.status === "published" ? "badge-green" : "badge-gray"}`}>
                      {p.status}
                    </span>
                  </td>
                  <td>{p.publishedAt ? fmtDate(p.publishedAt) : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}