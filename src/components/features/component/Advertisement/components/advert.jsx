import React from "react";
import AdSenseWidget from "./AdSenseWidget";
// import advert from "../../../../../images/Advertising-2.png";

class Advert extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-col justify-center items-center object-cover border w-80 h-auto mb-20 md:mb-0 lg:mb-0 border-gray-400">
          <AdSenseWidget client="ca-pub-XXXXXXXXXXXXXXXX" slot="YYYYYYYYYY" />
          <div className="flex flex-col justify-center items-center w-full bg-[#253C6D]">
            <h1 className="text-center text-white font-semibold text-lg px-5 py-5 uppercase">
              advertisement
            </h1>
          </div>
        </div>
      </>
    );
  }
}

export default Advert;
