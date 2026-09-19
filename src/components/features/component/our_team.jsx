import React from "react";
import OurTeamGallery from "./our_team_gallery";

class OurTeam extends React.Component {
  render() {
    return (
      <>
        <div className="md:h-220 lg:h-220  bg-[#95b2f2] md:mt-20 lg:mt-20">
          <h1 className="md:text-left font-sans font-black lg:text-left text-left md:text-5xl lg:text-5xl md:pt-20 lg:pt-20 pt-10 text-4xl uppercase md:mx-20 lg:mx-20 mx-8 text-[#30497D]">
            our team
          </h1>
          <OurTeamGallery />
        </div>
      </>
    );
  }
}

export default OurTeam;
