import React from "react";
import TrendPod from "./trending_pod";

class BookMeContent extends React.Component {
  render() {
    return (
      <>
        {/* Container stripped of restricting margins to span edge-to-edge */}
        <div className="relative mt-2 w-full overflow-hidden bg-white px-2 shadow-none md:mt-10 md:px-20">
          <iframe
            className="w-full aspect-video border-none" // Makes it act like a responsive fluid image
            src="https://www.youtube.com/embed/G9cl0kgd8Q4?si=PKpP5gIdk8t9iS5j"
            title="YouTube video player"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          ></iframe>
        </div>
        <TrendPod />
      </>
    );
  }
}

export default BookMeContent;
