import React from "react";
import Nav from "../component/nav";
import ContactNav from "../component/contactMe";
import Content from "../component/contact_content";
import Footer from "../../footer";
import SocialIcons from "../component/socialmedia_icon";
import VoteBanner from "../component/vote_banner";

class Contact extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <ContactNav />
        <Content />
        <SocialIcons />
        <VoteBanner/>
        <Footer />
      </>
    );
  }
}

export default Contact;
