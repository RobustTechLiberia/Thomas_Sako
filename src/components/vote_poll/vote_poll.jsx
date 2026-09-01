import React from "react";
import { Outlet } from "react-router-dom";

class VotePoll extends React.Component {
  render() {
    return (
      <>
        <div
          className="flex flex-wrap bg-white py-8 md:min-h-160 md:justify-between md:bg-violet-100 lg:bg-violet-200"
          id="poll"
        >
          <Outlet />
        </div>
      </>
    );
  }
}

export default VotePoll;
