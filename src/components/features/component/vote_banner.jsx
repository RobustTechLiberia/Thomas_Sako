import React from "react";

class VoteBanner extends React.Component {
  render() {
    return (
      <>
        <div className="h-96 md:h-96 lg:h-96 bg-violet-900">
          <h1 className="text-center font-sans md:py-28 lg:py-28 py-20 font-semibold md:text-5xl lg:text-5xl  text-4xl text-white">
            vote on today's Daily Poll
          </h1>

          {/* vote button */}
          <div className="md:flex md:flex-col md:justify-center md:items-center lg:flex lg:flex-col lg:justify-center flex flex-wrap justify-center items-center">
            <a
              href="#"
              className="py-4 font-semibold border-none bg-green-700 px-10 text-xl rounded text-white font-sans lowercase"
            >
              vote now
            </a>
          </div>
        </div>
      </>
    );
  }
}

export default VoteBanner;
