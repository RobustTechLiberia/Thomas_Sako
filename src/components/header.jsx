import React from "react";
import heading from "./../images/header.png";
import img from "./../images/Copilot_20260816_124134.png";

class Header extends React.Component {
  render() {
    return (
      <>
        <div className="bg-violet-950 flex flex-wrap md:items-center md:justify-center lg:justify-center lg:items-center justify-between items-start gap-4 h-28 md:h-auto lg:h-auto">
          {/* header */}
          <img
            src={heading}
            alt="Heading"
            className=" md:h-56 lg:h-56 md:w-auto lg:w-auto w-52 h-auto sm:h-auto sm:w-52 object-cover"
          />

          {/* profile picture*/}
          <img
            src={img}
            alt="Profile"
            className="h-28 w-28 md:w-24 lg:h-32 lg:w-32 object-center object-cover  rounded-full border-none"
          />
        </div>
      </>
    );
  }
}

export default Header;
