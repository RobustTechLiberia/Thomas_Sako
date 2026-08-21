import React from "react";

class AboutMeNav extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-nowrap md:h-28 lg:h-28 h-15 md:mt-28 lg:mt-28 bg-violet-950 justify-start">
          <h1 className="text-white md:mx-20 lg:mx-20 md:mt-8 lg:py-8 py-3 mx-5 font-sans font-bold uppercase md:text-5xl lg:text-5xl text-3xl">
            about me
          </h1>
        </div>
      </>
    );
  }
}

export default AboutMeNav;
