import React, { useEffect, useState } from "react";
import { api } from "../api.js";

export default function Users() {
  const [users, setUsers] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);

  const load = async () => {
    try {
      const data = await api("/admin/users");
      setUsers(data.users ?? []);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => { load(); }, []);

  const openCreate = () =>
    setForm({ email: "", displayName: "", role: "editor", password: "" });

  const openEdit = (u) =>
    setForm({ id: u.id, email: u.email, displayName: u.displayName ?? "", role: u.role, password: "", isActive: u.isActive });

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        const body = { email: form.email, displayName: form.displayName, role: form.role, isActive: form.isActive };
        if (form.password) body.password = form.password;
        await api(`/admin/users/${form.id}`, { method: "PATCH", body });
      } else {
        await api("/admin/users", { method: "POST", body: { email: form.email, displayName: form.displayName, role: form.role, password: form.password } });
      }
      setForm(null);
      setMsg(form.id ? "User updated" : "User created");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id) => {
    if (!confirm("Delete this user?")) return;
    try {
      await api(`/admin/users/${id}`, { method: "DELETE" });
      setMsg("User deleted");
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <h1>Users</h1>
      <p className="sub">Admin accounts with access to the CMS.</p>

      <div className="flex between">
        <span className="muted">{users.length} total</span>
        <button className="btn primary" onClick={openCreate}>+ New User</button>
      </div>

      {msg && <div className="alert success">{msg}</div>}
      {error && <div className="alert error">{error}</div>}

      {form && (
        <div className="card mt">
          <h3>{form.id ? "Edit user" : "Create user"}</h3>
          <div className="flex" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            </div>
            <div className="field" style={{ flex: 1 }}>
              <label>Display name</label>
              <input value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} />
            </div>
            <div className="field" style={{ width: 140 }}>
              <label>Role</label>
              <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="admin">admin</option>
                <option value="editor">editor</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>{form.id ? "New password (blank = keep)" : "Password"}</label>
            <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          {form.id !== undefined && (
            <div className="field">
              <label>
                <input type="checkbox" checked={form.isActive ?? true} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
                {" "}Active
              </label>
            </div>
          )}
          <div className="flex">
            <button className="btn primary" onClick={save} disabled={saving}>{saving ? "Saving…" : "Save"}</button>
            <button className="btn" onClick={() => setForm(null)}>Cancel</button>
          </div>
        </div>
      )}

      <div className="table-wrap mt">
        <table>
          <thead>
            <tr><th>ID</th><th>Email</th><th>Display name</th><th>Role</th><th>Active</th><th>Last login</th><th>Actions</th></tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u.id}>
                <td>{u.id}</td>
                <td>{u.email}</td>
                <td>{u.displayName ?? "—"}</td>
                <td><span className={`badge ${u.role}`}>{u.role}</span></td>
                <td>{u.isActive ? "✓" : "—"}</td>
                <td className="muted">{u.lastLoginAt ?? "—"}</td>
                <td>
                  <div className="flex">
                    <button className="btn small" onClick={() => openEdit(u)}>Edit</button>
                    <button className="btn small danger" onClick={() => remove(u.id)}>Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}