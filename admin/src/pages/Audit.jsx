import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Audit() {
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [error, setError] = useState(null);
  const [actor, setActor] = useState("");
  const [entity, setEntity] = useState("");

  const load = async (p = page) => {
    try {
      const params = new URLSearchParams({ page: p, limit: 30 });
      if (actor) params.set("actorId", actor);
      if (entity) params.set("entityType", entity);
      const data = await api(`/admin/audit?${params}`);
      setRows(data.rows ?? []);
      setTotal(data.total ?? 0);
    } catch (err) {
      setError(err.message);
    }
  };

  useEffect(() => {
    load(1);
    setPage(1);
  }, [actor, entity]);

  const PRETTY_ACTIONS = {
    create: "Created",
    update: "Updated",
    delete: "Deleted",
    activate: "Activated",
    archive: "Archived",
    login: "Login",
    set_status: "Status changed",
    change_password: "Password changed",
  };

  return (
    <>
      <h1>Audit Log</h1>
      <p className="sub">Immutable record of CMS activity.</p>

      <div className="flex">
        <input
          placeholder="Actor ID…"
          value={actor}
          onChange={(e) => setActor(e.target.value)}
          style={{ width: 120 }}
        />
        <select value={entity} onChange={(e) => setEntity(e.target.value)} style={{ width: 160 }}>
          <option value="">All entities</option>
          <option value="poll">Poll</option>
          <option value="page">Page</option>
          <option value="subscriber">Subscriber</option>
          <option value="settings">Settings</option>
          <option value="user">User</option>
          <option value="media">Media</option>
        </select>
        <span className="muted">{total} records</span>
      </div>

      {error && <div className="alert error">{error}</div>}

      <div className="table-wrap mt">
        <table>
          <thead>
            <tr>
              <th>Actor</th>
              <th>Action</th>
              <th>Entity</th>
              <th>Details</th>
              <th>IP</th>
              <th>When</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id}>
                <td>{r.actorId ?? "system"}</td>
                <td>{PRETTY_ACTIONS[r.action] ?? r.action}</td>
                <td>
                  {r.entityType} #{r.entityId}
                </td>
                <td className="muted" style={{ maxWidth: 300, overflow: "hidden", textOverflow: "ellipsis" }}>
                  {r.newValues ? JSON.stringify(r.newValues).slice(0, 80) : "—"}
                </td>
                <td className="muted">{r.ipAddress ?? "—"}</td>
                <td className="muted">{r.createdAt}</td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="muted">
                  No audit records.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      <div className="pager">
        <button className="btn small" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          ← Prev
        </button>
        <span className="muted">Page {page}</span>
        <button className="btn small" disabled={rows.length < 30} onClick={() => setPage(page + 1)}>
          Next →
        </button>
      </div>
    </>
  );
}