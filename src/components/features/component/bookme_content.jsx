import React from "react";
// import { Link } from "react-router-dom";
import TrendPod from "./trending_pod";
import img from "../../../images/WhatsApp Image 2026-09-28 at 2.20.00 PM (1).jpeg";

class BookMeContent extends React.Component {
  render() {
    return (
      <>
        {/* Container stripped of restricting margins to span edge-to-edge */}
        <div className="w-auto md:h-150 lg:h-150 md:mt-10 lg:mt-10 mt-0 h-auto md:mx-28 bg-[#830000] overflow-hidden relative shadow-none">
          <img
            src={img}
            alt="Book Me Banner"
            className="w-full md:h-full h-80 object-cover object-center opacity-50"
          />
        </div>
        <div className="bg-[#F67D31] md:h-auto h-auto">
          <TrendPod />
        </div>
      </>
    );
  }
}

export default BookMeContent;
