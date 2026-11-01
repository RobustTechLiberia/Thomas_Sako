import React from "react";
import { Outlet } from "react-router-dom";
import Header from "../components/header";
import Section from "../components/section";
import Features from "../components/features/component/default";
import Footer from "../components/footer";
// import Subscribe from "../components/subscribe/subscribe";

class HomePage extends React.Component {
  render() {
    return (
      <>
        <Header />
        <Outlet />
        <Section />
        {/* <Subscribe /> */}
        <Features />
        <Footer />
      </>
    );
  }
}

export default HomePage;
