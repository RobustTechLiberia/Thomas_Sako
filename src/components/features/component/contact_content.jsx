import React from "react";

class Content extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:gap-10 lg:gap-10 gap-8 md:mt-0 lg:mt-0 mt-10 bg-white md:h-132 lg:h-132 h-auto">
          <div className="md:w-80 lg:w-80 w-80  border-b-violet-300 border-b-10 md:h-96 lg:h-96 h-96 md:shadow-lg lg:shadow-lg shadow-2xs">
            1
          </div>
          <div className="md:w-80 lg:w-80 w-80  border-b-green-300 border-b-10 md:h-96 lg:h-96 h-96 shadow">
            2
          </div>
          <div className="md:w-80 lg:w-80 w-80  border-b-violet-900 border-b-10 md:h-96 lg:h-96 h-96 shadow">
            3
          </div>
        </div>
      </>
    );
  }
}

export default Content;
