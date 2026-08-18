import React from "react";

class Content extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:gap-10 lg:gap-10 gap-8 md:mt-0 lg:mt-0 mt-10 bg-white md:h-132 lg:h-132 h-auto">
          <div className="md:w-96 lg:w-96 w-80  border-b-violet-300 border-b-10 md:h-120 lg:h-120 h-96 md:shadow-xl lg:shadow-xl shadow-2xs">
            {/* content */}
          </div>
          <div className="md:w-96 lg:w-96 w-80  border-b-green-300 border-b-10 md:h-120 lg:h-120 h-96 md:shadow-xl lg:shadow-xl shadow-2xs">
            {/* content */}
          </div>
          <div className="md:w-96 lg:w-96 w-80  border-b-violet-900 border-b-10 md:h-120 lg:h-120 h-96 md:shadow-xl lg:shadow-xl shadow-2xs">
            {/* content */}
          </div>
        </div>
      </>
    );
  }
}

export default Content;
