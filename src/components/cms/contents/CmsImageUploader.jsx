import React from "react";

class CmsImageUploader extends React.Component {
  state = { uploading: false, error: "" };
  upload = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/") || file.size > 5 * 1024 * 1024) { this.setState({ error: "Choose an image under 5 MB." }); return; }
    const reader = new FileReader();
    reader.onload = async () => { this.setState({ uploading: true, error: "" }); try { const response = await fetch("/api/cms/contents/image", { method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${this.props.token}` }, body: JSON.stringify({ image: reader.result }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error || "Image upload failed."); this.props.onUploaded(data.image); } catch (error) { this.setState({ error: error.message }); } finally { this.setState({ uploading: false }); } };
    reader.readAsDataURL(file);
  };
  render() { return <div><label className="block text-sm font-semibold text-stone-800">Cover image<input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={this.upload} className="mt-1.5 block w-full text-sm text-stone-600 file:mr-3 file:border-0 file:bg-stone-200 file:px-3 file:py-2 file:text-sm file:font-semibold file:text-stone-800" /></label>{this.state.uploading && <p className="mt-2 text-sm text-stone-500">Saving image…</p>}{this.state.error && <p className="mt-2 text-sm text-[#830000]">{this.state.error}</p>}{this.props.value && <img src={this.props.value} alt="Selected cover" className="mt-3 h-28 w-44 object-cover" />}</div>; }
}
export default CmsImageUploader;
