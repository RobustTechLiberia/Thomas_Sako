import React from "react";
import Nav from "../component/nav";
import PlayListNav from "../component/playlist_nav";
import PlayListContent from "../component/playlist_content";
import Footer from "../../footer";

class PlayList extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <PlayListNav />
        <PlayListContent />
        <Footer />
      </>
    );
  }
}

export default PlayList;
