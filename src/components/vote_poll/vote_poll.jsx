import React from "react";
import { Outlet } from "react-router-dom";

class VotePoll extends React.Component {
  render() {
    return (
      <div className="bg-violet-100 md:h-160 lg:h-160 h-auto flex flex-wrap md:justify-between lg:justify-between justify-center items-center" id="poll">
        <Outlet />
      </div>
    );
  }
}

export default VotePoll;
