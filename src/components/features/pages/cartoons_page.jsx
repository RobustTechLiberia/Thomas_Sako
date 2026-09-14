import React from "react";
import Nav from "../component/nav";
import CartoonNav from "../component/cartoon_nav";
import CartoonsContent from "../component/cartoons_content";
import Footer from "../../footer";

class CartoonsPage extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <CartoonNav />
        <CartoonsContent />
        <Footer />
      </>
    );
  }
}

export default CartoonsPage;