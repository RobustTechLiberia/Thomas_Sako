import React from "react";
import { Link } from "react-router-dom";
import TrendPod from "./trending_pod";

class BookMeContent extends React.Component {
  render() {
    return (
      <>
        {/* Container stripped of restricting margins to span edge-to-edge */}
        <div className="w-full md:h-150 lg:h-150 md:px-20 md:mt-10 lg:mt-10 lg:px-20 px-2 mt-2 h-auto bg-white overflow-hidden relative shadow-none">
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
