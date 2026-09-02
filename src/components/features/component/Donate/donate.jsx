import React from "react";
import DonateForm from "../Donate/form";

class Donate extends React.Component {
  render() {
    return (
      <>
        <div className="flex flex-wrap justify-center items-center md:mt-32 lg:py-32 mt-28 py-20 bg-white md:w-140 lg:w-160 w-full min-h-96 shadow-sm rounded-lg">
          <DonateForm />
        </div>
      </>
    );
  }
}

export default Donate;
