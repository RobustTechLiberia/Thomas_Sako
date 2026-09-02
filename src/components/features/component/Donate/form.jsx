import React from "react";

class DonateForm extends React.Component {
  render() {
      return <>
      <div className="flex flex-wrap justify-evenly">
        <form action="#" method="POST">
        <div className="md:w-80 lg:w-80 w-auto">
            <input type="text" className="border py-3 w-auto" placeholder="First Name"/>

            <div/>
            <div className="md:w-80 lg:w-80 w-auto">
                <input type="text" className="border py-3 w-auto" placeholder="Last Name"/>
                </div>
                </div>
                <div className="flex flex-wrap justify-evenly">

<div className="md:w-80 lg:w-80 w-auto">
    address
    </div>

    <div className="md:w-80 lg:w-80 w-auto">
        street
        </div>
                    </div>
                </form>
      </>;
  }
}

export default DonateForm;
