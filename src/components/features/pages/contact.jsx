import React from "react";
import Nav from "../component/nav";
import ContactNav from "../component/contactMe";
import Content from "../component/contact_content";

class Contact extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <ContactNav />
        <Content />
      </>
    );
  }
}

export default Contact;
