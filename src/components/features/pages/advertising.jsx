import React from "react";
import Nav from "../component/nav";
import AdvertNav from "../component/advert_nav";
import AdvertContent from "../component/advert_content";
import Footer from "../../footer";

class Advert extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <AdvertNav />
        <AdvertContent />
        <Footer />
      </>
    );
  }
}

export default Advert;