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
    try {
      const response = await fetch("http://localhost:8080/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: this.state.email }),
      });

      if (response.ok) {
        console.log("Subscription email sent successfully!");
      } else {
        // eslint-disable-next-line no-undef
        console.error("Failed to subscribe. Try again.", error);
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
          className="h-auto bg-white flex items-center gap-2"
        >
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            value={this.state.email}
            onChange={this.handleChange}
            className="border border-gray-800 py-3 border-r-0 bg-white text-gray-800 md:w-xl lg:w-xl w-auto px-5"
            required
          />
          <button
            type="submit"
            className="bg-violet-900 cursor-pointer text-white text-xl capitalize py-3 px-5 border-none"
          >
            subscribe
          </button>
        </form>
      </>
    );
  }
}

export default DefaultPage;
