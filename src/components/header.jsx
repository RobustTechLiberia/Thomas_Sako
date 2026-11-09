import React from "react";
import heading from "./../images/header.png";
import img from "./../images/1793551736652.jpg";

class Header extends React.Component {
  render() {
    return (
      <>
        <div className="flex min-h-28 flex-wrap items-center justify-center gap-4 bg-[#830000] px-4 py-3 sm:justify-between md:px-10">
          {/* header */}
          <img
            src={heading}
            alt="Heading"
            className="h-auto w-52 max-w-full object-contain sm:w-64 md:w-auto md:h-40"
          />

          {/* profile picture*/}
          <img
            src={img}
            alt="Profile"
            className="h-24 w-24 rounded-full object-cover object-center sm:h-28 sm:w-28 md:h-32 md:w-32"
          />
        </div>
      </>
    );
  }
}

export default Header;
