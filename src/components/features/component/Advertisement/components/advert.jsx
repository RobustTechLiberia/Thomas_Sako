import React from "react";
import AdSenseWidget from "./AdSenseWidget";
import img1 from "../../../../../images/1792015266507.jpg";

// import advert from "../../../../../images/Advertising-2.png";

class Advert extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-col justify-center items-center object-cover border w-80 h-auto mb-20 md:mb-0 lg:mb-0 border-gray-400">
          <img src={img1} alt="" className="w-auto h-auto" />
          <div className="flex flex-col justify-center items-center w-full bg-[#830000]">
            <h1 className="text-center text-[#F67D31] font-semibold text-lg px-5 py-5 uppercase">
              advertisement
            </h1>
          </div>
        </div>
      </>
    );
  }
}

export default Advert;
