import React from "react";
import { apiUrl } from "../../lib/api";

class DefaultPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      email: "",
      isSubmitting: false,
      errorMessage: "",
      successMessage: "",
    };

    this._submissionInProgress = false;
  }

  handleChange = (e) => {
    this.setState({
      email: e.target.value,
      errorMessage: "",
      successMessage: "",
    });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    if (this._submissionInProgress || this.state.isSubmitting) {
      return;
    }

    const email = this.state.email.trim();

    if (!email) {
      this.setState({
        errorMessage: "Please enter your email address.",
        successMessage: "",
      });
      return;
    }

    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailPattern.test(email)) {
      this.setState({
        errorMessage: "Please enter a valid email address.",
        successMessage: "",
      });
      return;
    }

    this._submissionInProgress = true;

    this.setState({
      isSubmitting: true,
      errorMessage: "",
      successMessage: "",
    });

    try {
      const response = await fetch(apiUrl("/subscribe"), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const responseText = await response.text();
      let responseData = {};

      if (responseText) {
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = {};
        }
      }

      if (!response.ok) {
        throw new Error(
          responseData.message ||
            responseData.error ||
            (response.status === 400
              ? "Please check your email address and try again."
              : response.status === 409
                ? "This email address is already subscribed."
                : response.status === 429
                  ? "Too many requests. Please try again later."
                  : response.status >= 500
                    ? "Server error. Please try again later."
                    : `Subscription failed. HTTP ${response.status}.`),
        );
      }

      this.setState({
        email: "",
        isSubmitting: false,
        errorMessage: "",
        successMessage:
          responseData.message || "You have subscribed successfully.",
      });
    } catch (error) {
      this.setState({
        isSubmitting: false,
        errorMessage:
          error.message === "Failed to fetch"
            ? "Unable to connect to the server. Check your API URL and server connection."
            : error.message || "Unable to subscribe. Please try again.",
        successMessage: "",
      });
    } finally {
      this._submissionInProgress = false;
    }
  };

  render() {
    const { email, isSubmitting, errorMessage, successMessage } = this.state;

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
            autoComplete="email"
            maxLength={254}
            className="border border-gray-800 py-3 border-r-0 bg-white text-gray-800 md:w-xl lg:w-xl w-52 sm:w-52 px-5"
            required
          />

          <button
            type="submit"
            disabled={isSubmitting}
            className="bg-[#830000] cursor-pointer text-white text-xl capitalize py-3 px-5 border-none disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {isSubmitting ? "Subscribing..." : "Subscribe"}
          </button>
        </form>

        {errorMessage && (
          <p role="alert" className="mt-2 text-sm font-semibold text-red-600">
            {errorMessage}
          </p>
        )}

        {successMessage && (
          <p
            role="status"
            className="mt-2 text-sm font-semibold text-green-600"
          >
            {successMessage}
          </p>
        )}
      </>
    );
  }
}

export default DefaultPage;
