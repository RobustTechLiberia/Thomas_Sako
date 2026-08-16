import React from "react";
import Nav from "../component/nav";
import BookNav from "../component/booking_nav";

class BookMe extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <BookNav />
      </>
    );
  }
}

export default BookMe;
