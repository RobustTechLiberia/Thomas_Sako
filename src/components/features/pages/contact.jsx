import React from "react";
import Nav from "../component/nav";
import ContactNav from "../component/contactMe";
import Content from "../component/contact_content";
import Footer from "../../footer";

class Contact extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <ContactNav />
        <Content />
        <Footer/>
      </>
    );
  }
}

export default Contact;
