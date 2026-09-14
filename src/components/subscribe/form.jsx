import React from "react";
import { createPortal } from "react-dom";

const MODAL_STYLES = `
@keyframes libAlertIn {
  from { opacity: 0; transform: translateY(14px) scale(0.95); }
  to { opacity: 1; transform: translateY(0) scale(1); }
}
.lib-alert-card, .lib-alert-backdrop {
  animation: libAlertIn 0.22s ease-out both;
}
`;

class DefaultPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      email: "",
      status: "idle",
      message: "",
    };
    this.timer = null;
  }

  componentWillUnmount() {
    if (this.timer) clearTimeout(this.timer);
  }

  dismissAlert = () => {
    if (this.timer) clearTimeout(this.timer);
    this.setState({ status: "idle", message: "" });
  };

  startTimer = (ms) => {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(this.dismissAlert, ms);
  };

  handleChange = (e) => {
    if (this.timer) clearTimeout(this.timer);
    this.setState({ email: e.target.value, status: "idle", message: "" });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    const email = this.state.email.trim();
    if (!email) {
      this.setState({ status: "error", message: "Please enter your email address." });
      this.startTimer(6000);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      this.setState({ status: "error", message: "Please enter a valid email address." });
      this.startTimer(6000);
      return;
    }

    this.setState({ status: "sending", message: "" });

    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok) {
        const already = data.message === "already_subscribed";
        this.setState({
          email: "",
          status: "success",
          message: already
            ? "You're already subscribed!"
            : "Thanks for subscribing — please confirm in your inbox.",
        });
        this.startTimer(already ? 3500 : 4500);
      } else {
        this.setState({
          status: "error",
          message: data?.error || data?.message || "Something went wrong. Please try again.",
        });
        this.startTimer(6000);
      }
    } catch {
      this.setState({
        status: "error",
        message: "Network error. Please try again later.",
      });
      this.startTimer(6000);
    }
  };

  render() {
    const { email, status, message } = this.state;
    const sending = status === "sending";
    const isSuccess = status === "success";
    const showAlert = isSuccess || status === "error";

    return (
      <>
        <style>{MODAL_STYLES}</style>
        <form
          onSubmit={this.handleSubmit}
          className="flex w-full max-w-xl flex-col gap-3 bg-white sm:flex-row sm:gap-0 sm:items-stretch"
        >
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            value={email}
            onChange={this.handleChange}
            className="w-full border border-gray-800 bg-white px-5 py-3 text-gray-800 sm:flex-1 sm:border-r-0"
            required
            disabled={sending}
          />
          <button
            type="submit"
            disabled={sending}
            className="w-full border-none bg-violet-900 px-5 py-3 text-xl capitalize text-white cursor-pointer sm:w-auto sm:px-8 disabled:opacity-60"
          >
            {sending ? "sending…" : "subscribe"}
          </button>
        </form>

        {showAlert &&
          createPortal(
          <div
            className="fixed inset-0 z-[9999] flex items-center justify-center px-4 py-6"
            role="alertdialog"
            aria-modal="true"
            aria-label={isSuccess ? "Success" : "Error"}
          >
            <div
              className="lib-alert-backdrop absolute inset-0 bg-violet-950/70 cursor-pointer"
              onClick={this.dismissAlert}
            />
            <div
              className={`lib-alert-card relative w-full max-w-md rounded-2xl border-t-8 bg-white p-7 text-center shadow-2xl ${
                isSuccess ? "border-green-600" : "border-red-600"
              }`}
            >
              <button
                type="button"
                onClick={this.dismissAlert}
                aria-label="Close"
                className="absolute right-3 top-3 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700"
              >
                ✕
              </button>

              <div
                className={`mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full text-white ${
                  isSuccess ? "bg-green-600" : "bg-red-600"
                }`}
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="h-8 w-8"
                  aria-hidden="true"
                >
                  {isSuccess ? (
                    <path d="M20 6 9 17l-5-5" />
                  ) : (
                    <path d="M18 6 6 18M6 6l12 12" />
                  )}
                </svg>
              </div>

              <h3
                className={`font-sans text-2xl font-bold capitalize ${
                  isSuccess ? "text-green-700" : "text-red-700"
                }`}
              >
                {isSuccess ? "Subscribed!" : "Something's off"}
              </h3>
              <p className="mx-auto mt-2 max-w-sm font-serif text-base text-gray-600">
                {message}
              </p>
              <button
                type="button"
                onClick={this.dismissAlert}
                className={`mt-6 w-full cursor-pointer rounded-lg px-6 py-3 font-sans text-base capitalize text-white transition-colors ${
                  isSuccess
                    ? "bg-violet-900 hover:bg-violet-800"
                    : "bg-red-600 hover:bg-red-500"
                }`}
              >
                {isSuccess ? "Awesome" : "Try again"}
              </button>
            </div>
          </div>,
          document.body
        )}
      </>
    );
  }
}

export default DefaultPage;