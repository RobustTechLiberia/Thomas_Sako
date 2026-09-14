import React, { useEffect, useState } from "react";
import { api } from "../api.js";

const BLOCK_TYPES = ["heading", "subtitle", "paragraph", "image", "card", "quote", "embed", "link"];

const defaultBlock = (type = "paragraph") => {
  const base = { type };
  if (type === "card") base.title = "New card";
  if (type === "image") base.image = "";
  if (type === "embed" || type === "link") base.url = "";
  if (type === "quote") base.author = "";
  return base;
};

export default function Pages() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [msg, setMsg] = useState(null);
  const [search, setSearch] = useState("");

  const load = async () => {
    try {
      const params = new URLSearchParams({ limit: 100 });
      if (search) params.set("search", search);
      const data = await api(`/admin/pages?${params}`);
      setRows(data.rows ?? []);
    } catch (err) {
      setError(err.message);
    }
  };
  useEffect(() => {
    load();
  }, []);

  const open = (p = null) => {
    if (p) {
      setForm({
        id: p.id,
        slug: p.slug,
        title: p.title,
        description: p.description ?? "",
        body: Array.isArray(p.body) ? [...p.body] : [],
        status: p.status,
      });
    } else {
      setForm({
        slug: "",
        title: "",
        description: "",
        body: [],
        status: "draft",
      });
    }
    setError(null);
    setMsg(null);
  };

  const updateBlock = (i, key, value) => {
    const body = [...form.body];
    body[i] = { ...body[i], [key]: value };
    setForm({ ...form, body });
  };
  const addBlock = (type = "paragraph") => setForm({ ...form, body: [...form.body, defaultBlock(type)] });
  const removeBlock = (i) => setForm({ ...form, body: form.body.filter((_, idx) => idx !== i) });
  const moveBlock = (i, dir) => {
    const body = [...form.body];
    const j = i + dir;
    if (j < 0 || j >= body.length) return;
    [body[i], body[j]] = [body[j], body[i]];
    setForm({ ...form, body });
  };

  const save = async () => {
    setSaving(true);
    setError(null);
    try {
      if (form.id) {
        await api(`/admin/pages/${form.id}`, { method: "PUT", body: form });
      } else {
        await api(`/admin/pages`, { method: "POST", body: form });
      }
      setForm(null);
      setMsg("Page saved");
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <h1>Pages</h1>
      <p className="sub">Edit the content blocks for each site page.</p>

      <div className="flex between">
        <input
          placeholder="Search…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && load()}
          style={{ width: 260 }}
        />
        <button className="btn primary" onClick={() => open()}>
          + New Page
        </button>
      </div>

      {error && <div className="alert error">{error}</div>}
      {msg && <div className="alert success">{msg}</div>}

      {form && (
        <div className="card mt">
          <h3>{form.id ? `Edit: ${form.slug}` : "New page"}</h3>
          <div className="flex" style={{ gap: 10 }}>
            <div className="field" style={{ flex: 1 }}>
              <label>Slug</label>
              <input value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} disabled={Boolean(form.id)} />
            </div>
            <div className="field" style={{ flex: 2 }}>
              <label>Title</label>
              <input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
            </div>
            <div className="field" style={{ width: 140 }}>
              <label>Status</label>
              <select value={form.status} onChange={(e) => setForm({ ...form, status: e.target.value })}>
                <option value="draft">Draft</option>
                <option value="published">Published</option>
              </select>
            </div>
          </div>
          <div className="field">
            <label>Description</label>
            <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
          </div>
          <div className="field">
            <label>Content blocks</label>
            {form.body.map((block, i) => (
              <div className="block-row" key={i}>
                <select value={block.type} onChange={(e) => updateBlock(i, "type", e.target.value)}>
                  {BLOCK_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                {["title", "text", "image", "url", "button", "author", "role", "key"].map((k) => {
                  if (k === "title" && !["card", "quote"].includes(block.type)) return null;
                  if (k === "text" && !["heading", "subtitle", "paragraph", "card", "quote"].includes(block.type)) return null;
                  if (["image", "url", "button"].includes(k) && !["image", "embed", "link"].includes(block.type)) return null;
                  if (["author", "role"].includes(k) && !["quote", "card"].includes(block.type)) return null;
                  if (k === "key" && block.type !== "card") return null;
                  return (
                    <input
                      key={k}
                      className="grow"
                      placeholder={k}
                      value={block[k] ?? ""}
                      onChange={(e) => updateBlock(i, k, e.target.value)}
                    />
                  );
                })}
                <button className="btn small" onClick={() => moveBlock(i, -1)}>
                  ↑
                </button>
                <button className="btn small" onClick={() => moveBlock(i, 1)}>
                  ↓
                </button>
                <button className="btn small danger" onClick={() => removeBlock(i)}>
                  ✕
                </button>
              </div>
            ))}
            <div className="flex" style={{ gap: 6, marginTop: 8 }}>
              {BLOCK_TYPES.slice(0, 5).map((t) => (
                <button key={t} className="btn small" onClick={() => addBlock(t)}>
                  + {t}
                </button>
              ))}
            </div>
          </div>
          <div className="flex">
            <button className="btn primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save"}
            </button>
            <button className="btn" onClick={() => setForm(null)}>
              Cancel
            </button>
          </div>
        </div>
      )}

      <div className="table-wrap mt">
        <table>
          <thead>
            <tr>
              <th>Slug</th>
              <th>Title</th>
              <th>Blocks</th>
              <th>Status</th>
              <th>Updated</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id}>
                <td style={{ fontFamily: "monospace" }}>{p.slug}</td>
                <td>{p.title}</td>
                <td className="muted">{Array.isArray(p.body) ? p.body.length : 0}</td>
                <td>
                  <span className={`badge ${p.status}`}>{p.status}</span>
                </td>
                <td className="muted">{p.updatedAt}</td>
                <td>
                  <button className="btn small" onClick={() => open(p)}>
                    Edit
                  </button>
                </td>
              </tr>
            ))}
            {!rows.length && (
              <tr>
                <td colSpan={6} className="muted">
                  No pages found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
}