import React from "react";
// donation form
import DonateForm from "../Donate/form";

class Donate extends React.Component {
  render() {
    return (
      <>
<div className="flex flex-wrap justify-center items-center md:mt-32 lg:py-32 mt-28 py-20 bg-white md:w-80 lg:w-80 w-auto h-96 shadow-xs">
    <DonateForm/>
</div>
      </>
    );
  }
}

export default Donate;
