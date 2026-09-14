import React from "react";
import Nav from "../component/nav";
import MingleNav from "../component/mingle_nav";
import MingleContent from "../component/mingle_content";
import Footer from "../../footer";

class MinglePage extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <MingleNav />
        <MingleContent />
        <Footer />
      </>
    );
  }
}

export default MinglePage;