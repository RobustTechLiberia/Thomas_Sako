import React from "react";
import Nav from "../component/nav";
import PlayListNav from "../component/playlist_nav";
import PlayListContent from "../component/playlist_content";

class PlayList extends React.Component {
  render() {
    return (
      <>
        <Nav />
        <PlayListNav />
        <PlayListContent/>
      </>
    );
  }
}

export default PlayList;
