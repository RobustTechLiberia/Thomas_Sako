import React from "react";
import GuestGallery from "./guest_gallery";

class GuestHost extends React.Component {
  render() {
    return (
      <>
        <div className="md:h-200 lg:h-200 bg-white">
          <h1 className="md:text-5xl lg:text-5xl md:mx-32 lg:mx-32 mx-10 md:mt-20 lg:mt-20 mt-10 text-4xl font-black text-violet-800 uppercase">
            guest host
          </h1>
          <GuestGallery />
        </div>
      </>
    );
  }
}

export default GuestHost;
