import React from "react";
import Nav from "../component/nav";
import AboutMeNav from "../component/aboutme_nav";
import AboutContent from "../component/about_me_content";
import Footer from "../../footer";

class AboutMe extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <AboutMeNav />
        <AboutContent />
        <Footer />
      </>
    );
  }
}

export default AboutMe;
