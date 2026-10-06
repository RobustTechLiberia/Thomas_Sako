import React from "react";
import { apiUrl } from "../../lib/api";

class DefaultPage extends React.Component {
  constructor(props) {
    super(props);
    this.state = { email: "", isSubmitting: false };
  }

  handleChange = (e) => {
    this.setState({ email: e.target.value });
  };

  handleSubmit = async (e) => {
    e.preventDefault();

    // validation
    if (!this.state.email || this.state.email.trim() === "") {
      return;
    }

    this.setState({ isSubmitting: true });

    try {
      const response = await fetch(apiUrl("/subscribe"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: this.state.email.trim() }),
      });

      if (response.ok) {
        this.setState({
          email: "",
          isSubmitting: false,
        });
      } else {
        this.setState({
          isSubmitting: false,
        });
      }
    } catch (error) {
      console.error("Error submitting email:", error);
      this.setState({
        isSubmitting: false,
      });
    }
  };

  render() {
    const { email, isSubmitting } = this.state;

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
            {isSubmitting ? "Subscribe" : "Subscribe"}
          </button>
        </form>
      </>
    );
  }
}

export default DefaultPage;
