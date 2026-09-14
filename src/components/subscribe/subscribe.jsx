import React from "react";
import UpdateForm from "../subscribe/form";

class Subscribe extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center  bg-white">
          {/* heading */}
          <h1 className="text-center font-sans font-semibold md:text-5xl lg:text-5xl text-3xl sm:text-4xl md:mx-0 lg:mx-0 mx-1">
            Sign up for daily updates
          </h1>
        </div>
        {/* paragraph */}
        <div className="flex justify-center px-4 py-3 text-center">
          <p className="font-serif capitalize md:text-md lg:text-md text-lg text-center">
            balance news, independent perspectives. delievered every morning.
          </p>
        </div>
        {/* form */}
        <div className="flex w-full justify-center bg-white px-4">
          <UpdateForm />
        </div>
      </>
    );
  }
}

export default Subscribe;
