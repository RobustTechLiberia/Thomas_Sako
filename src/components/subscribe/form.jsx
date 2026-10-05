import React from "react";

class DefaultPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { email: "", statusMessage: "", isSubmitting: false };
  }

  handleChange = (e) => {
    this.setState({ email: e.target.value, statusMessage: "" });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    // validation
    if (!this.state.email || this.state.email.trim() === "") {
      this.setState({ statusMessage: "Enter your email address." });
      return;
    }

    this.setState({ isSubmitting: true, statusMessage: "" });

    try {
      // Same-origin requests work locally through Vite's proxy and in every
      // production deployment. A hard-coded localhost URL cannot work once
      // the site is deployed.
      const response = await fetch("/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.state.email.trim() }),
      });

      if (response.ok) {
        this.setState({
          email: "",
          isSubmitting: false,
          statusMessage: "Thanks! Please check your inbox for confirmation.",
        });
      } else {
        const data = await response.json().catch(() => ({}));
        this.setState({
          isSubmitting: false,
          statusMessage: data.error || "Unable to subscribe. Please try again.",
        });
      }
    } catch (error) {
      console.error("Error submitting email:", error);
      this.setState({
        isSubmitting: false,
        statusMessage: "Unable to reach the subscription service. Please try again.",
      });
    }
  };

  render() {
    const { email, isSubmitting, statusMessage } = this.state;

    return (
      <>
        <form
          onSubmit={this.handleSubmit}
          className="h-auto bg-white flex items-center gap-2"
        >
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            value={email}
            onChange={this.handleChange}
            disabled={isSubmitting}
            className="border border-gray-800 py-3 border-r-0 bg-white text-gray-800 md:w-xl lg:w-xl w-52 sm:w-52 px-5"
            required
          />
          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#830000] cursor-pointer text-white text-xl capitalize py-3 px-5 border-none"
          >
            {isSubmitting ? "sending..." : "subscribe"}
          </button>
          {statusMessage && (
            <p className="w-full text-sm text-[#830000]" role="status">
              {statusMessage}
            </p>
          )}
        </form>
      </>
    );
  }
}

export default DefaultPage;
