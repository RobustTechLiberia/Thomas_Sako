import React from "react";
import Nav from "../component/nav";
import AdvertNav from "../component/advert_nav";

class Advert extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <AdvertNav />
      </>
    );
  }
}

export default Advert;
