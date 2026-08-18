import React from "react";

class PlayListNav extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-nowrap md:h-28 lg:h-28 h-15 bg-violet-950 justify-start">
          <h1 className="text-white md:mx-20 lg:mx-20 md:mt-13 lg:mt-13 py-3 mx-5 font-sans font-bold uppercase md:text-5xl lg:text-5xl text-xl">
            play list
          </h1>
        </div>
      </>
    );
  }
}

export default PlayListNav;
