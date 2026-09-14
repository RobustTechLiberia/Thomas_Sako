import React from "react";

const EMPTY = {
  name: "",
  email: "",
  phone: "",
  organization: "",
  eventType: "",
  eventDate: "",
  eventTime: "",
  eventLocation: "",
  message: "",
};

class BookingForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      form: { ...EMPTY },
      status: "idle", // idle | sending | success | error
      message: "",
      errors: {},
    };
  }

  handleChange = (e) => {
    const { name, value } = e.target;
    this.setState((prev) => ({
      form: { ...prev.form, [name]: value },
      status: "idle",
      message: "",
      errors: { ...prev.errors, [name]: undefined },
    }));
  };

  handleSubmit = async (e) => {
    e.preventDefault();
    const { form } = this.state;

    const errors = {};
    if (!form.name.trim()) errors.name = "Name is required";
    if (!form.email.trim()) errors.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(form.email.trim())) {
      errors.email = "Enter a valid email address";
    }
    if (!form.eventType.trim()) errors.eventType = "Event type is required";
    if (!form.eventDate.trim()) errors.eventDate = "Event date is required";

    if (Object.keys(errors).length) {
      this.setState({ errors, status: "error", message: "Please fix the highlighted fields." });
      return;
    }

    this.setState({ status: "sending", message: "" });

    try {
      const res = await fetch("/api/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        this.setState({
          form: { ...EMPTY },
          status: "success",
          message:
            "Booking request received. We'll reply within 1–2 business days — check your inbox for a confirmation.",
        });
      } else {
        this.setState({
          status: "error",
          message: data?.error || data?.message || "Something went wrong. Please try again.",
        });
      }
    } catch {
      this.setState({ status: "error", message: "Network error. Please try again later." });
    }
  };

  render() {
    const { form, status, message, errors } = this.state;
    const sending = status === "sending";

    const inputClass = (field) =>
      `w-full border bg-white px-4 py-3 text-gray-800 ${
        errors[field] ? "border-red-500" : "border-gray-400"
      }`;

    return (
      <section className="bg-white px-4 py-10 md:px-20 md:py-16">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-center font-sans font-bold capitalize text-4xl text-violet-950 md:text-5xl">
            Book Thomas
          </h2>
          <p className="mt-3 text-center font-sans text-gray-600">
            Fill out the form below and the team will get back to you within 1–2 business days.
          </p>

          <form
            onSubmit={this.handleSubmit}
            className="mt-8 grid gap-4 bg-violet-50 p-6 md:grid-cols-2 md:p-10"
            noValidate
          >
            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Full name *
              </label>
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("name")}
                placeholder="Jane Doe"
              />
              {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Email *
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("email")}
                placeholder="jane@example.com"
              />
              {errors.email && <p className="mt-1 text-xs text-red-600">{errors.email}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">Phone</label>
              <input
                type="tel"
                name="phone"
                value={form.phone}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("phone")}
                placeholder="+231 000 000 000"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Organization / company
              </label>
              <input
                type="text"
                name="organization"
                value={form.organization}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("organization")}
                placeholder="Acme Media"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Event type *
              </label>
              <select
                name="eventType"
                value={form.eventType}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("eventType")}
              >
                <option value="">Select an event type…</option>
                <option value="Podcast Interview">Podcast Interview</option>
                <option value="Speaking Engagement">Speaking Engagement</option>
                <option value="Moderation / Panel">Moderation / Panel</option>
                <option value="Keynote">Keynote</option>
                <option value="Media Appearance">Media Appearance</option>
                <option value="Other">Other</option>
              </select>
              {errors.eventType && <p className="mt-1 text-xs text-red-600">{errors.eventType}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Event date *
              </label>
              <input
                type="date"
                name="eventDate"
                value={form.eventDate}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("eventDate")}
              />
              {errors.eventDate && <p className="mt-1 text-xs text-red-600">{errors.eventDate}</p>}
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Event time
              </label>
              <input
                type="time"
                name="eventTime"
                value={form.eventTime}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("eventTime")}
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-semibold text-violet-950">
                Location
              </label>
              <input
                type="text"
                name="eventLocation"
                value={form.eventLocation}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("eventLocation")}
                placeholder="City, venue, or virtual"
              />
            </div>

            <div className="md:col-span-2">
              <label className="mb-1 block text-sm font-semibold text-violet-950">Message</label>
              <textarea
                name="message"
                rows="4"
                value={form.message}
                onChange={this.handleChange}
                disabled={sending}
                className={inputClass("message")}
                placeholder="Tell us about your audience, topic, and goals."
              />
            </div>

            <div className="md:col-span-2">
              <button
                type="submit"
                disabled={sending}
                className="w-full border-none bg-violet-900 px-6 py-3 text-xl font-semibold capitalize text-white cursor-pointer disabled:opacity-60 md:w-auto"
              >
                {sending ? "submitting…" : "submit booking request"}
              </button>
            </div>
          </form>

          {message && (
            <p
              className={`mt-4 text-center text-sm p-2.5 ${
                status === "success" ? "text-green-700 bg-green-200 " : "text-red-700 bg-red-200 "
              }`}
            >
              {message}
            </p>
          )}
        </div>
      </section>
    );
  }
}

export default BookingForm;