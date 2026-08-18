import React from "react";
import Nav from "../component/nav";
import BookNav from "../component/booking_nav";
import BookMeContent from "../component/bookme_content";

class BookMe extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <BookNav />
        <BookMeContent />
      </>
    );
  }
}

export default BookMe;
