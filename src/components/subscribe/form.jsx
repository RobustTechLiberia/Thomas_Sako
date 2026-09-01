import React from "react";

class DefaultPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { email: "" };
  }

  handleChange = (e) => {
    this.setState({ email: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    // validation
    if (!this.state.email || this.state.email.trim() === "") {
      console.warn("Submission blocked: Email field cannot be empty.");
      return;
    }

    try {
      const response = await fetch("http://localhost:8080/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.state.email.trim() }),
      });

      if (response.ok) {
        console.log("Subscription email sent successfully!");
        // Clear the input field automatically on success
        this.setState({ email: "" });
      } else {
        console.error("Failed to subscribe. Try again.");
      }
    } catch (error) {
      console.error("Error submitting email:", error);
    }
  };

  render() {
    return (
      <>
        <form
          onSubmit={this.handleSubmit}
          className="flex md:w-full lg:w-full max-w-xl flex-col gap-2 bg-white sm:flex-row sm:items-center"
        >
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            value={this.state.email}
            onChange={this.handleChange}
            className="md:w-full lg:w-full w-auto border border-gray-800 bg-white px-5 py-3 text-gray-800 sm:border-r-0"
            required
          />
          <button
            type="submit"
            className="w-auto border-none bg-violet-900 px-5 py-3 text-xl capitalize text-white cursor-pointer sm:w-auto"
          >
            subscribe
          </button>
        </form>
      </>
    );
  }
}

export default DefaultPage;
