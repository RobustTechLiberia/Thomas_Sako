import React from "react";
import advert from "../../../../../images/Advertising-2.png";

class Advert extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-col justify-center items-center object-cover border w-80 h-auto mb-20 md:mb-0 lg:mb-0 border-gray-400">
          <img
            src={advert}
            alt=""
            srcset=""
            className="w-auto h-auto object-cover"
          />
          <div className="flex flex-col justify-center items-center w-full bg-violet-950">
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
