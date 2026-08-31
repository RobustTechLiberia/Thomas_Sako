import React from "react";
import heading from "./../images/header.png";
import img from "./../images/Copilot_20260816_124134.png";

class Header extends React.Component {
  render() {
    return (
      <>
        <div className="bg-violet-950 flex flex-wrap items-center justify-center gap-4 px-4 py-3 sm:px-6 md:px-8">
          {/* header */}
          <img
            src={heading}
            alt="Heading"
            className="h-auto w-full max-w-64 object-contain md:max-w-none md:w-auto md:h-56"
          />

          {/* profile picture*/}
          <img
            src={img}
            alt="Profile"
            className="h-20 w-20 shrink-0 rounded-full border-none object-center object-cover sm:h-24 sm:w-24 lg:h-32 lg:w-32"
          />
        </div>
      </>
    );
  }
}

export default Header;
