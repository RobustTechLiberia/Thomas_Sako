import React from "react";
import Nav from "../component/nav";
import BookNav from "../component/booking_nav";
import BookMeContent from "../component/bookme_content";
import AutoBio from "../component/autobio";
import Footer from "../../footer";

class BookMe extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <BookNav />
        <BookMeContent />
        <AutoBio />
        <Footer />
      </>
    );
  }
}

export default BookMe;
