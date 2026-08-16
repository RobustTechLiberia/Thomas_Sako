import React from "react";
import Nav from "../component/nav";
import AboutMeNav from "../component/aboutme_nav";
import AboutContent from "../component/about_me_content";

class AboutMe extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <AboutMeNav />
        <AboutContent />
      </>
    );
  }
}

export default AboutMe;
