import React from "react";

class DefaultPage extends React.Component {
  render() {
    return (
      <>
        <form action="#" className="h-auto bg-white">
          <input
            type="email"
            name="email"
            id="email"
            placeholder="Email"
            className="border border-gray-800 py-3 border-r-0 bg-white text-gray-800 md:w-xl lg:w-xl w-auto px-5"
            required
          />
          <button
            type="submit"
            className="bg-violet-900 text-white text-xl capitalize py-3 px-5 border-none"
          >
            subscribe
          </button>
        </form>
      </>
    );
  }
}

export default DefaultPage;
