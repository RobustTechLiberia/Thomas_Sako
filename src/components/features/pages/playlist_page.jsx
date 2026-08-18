import React from "react";
import Nav from "../component/nav";
import PlayListNav from "../component/playlist_nav";

class PlayList extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <PlayListNav />
      </>
    );
  }
}

export default PlayList;
