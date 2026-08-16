import React from "react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home";
import Quest1 from "./components/vote_poll/Questions/quest_1";
import Quest2 from "./components/vote_poll/Questions/quest_2";
import Quest3 from "./components/vote_poll/Questions/quest_3";
import PodcastPage from "./components/features/pages/podcast_page";
import AboutMe from "./components/features/pages/aboutme_page";
import BookMe from "./components/features/pages/bookme";
import Contact from "./components/features/pages/contact";
import Advert from "./components/features/pages/advertising";
import "./App.css";

class App extends React.Component {
  render() {
    return (
      <Routes>
        {/* Home layout wraps poll questions */}
        <Route path="/" element={<HomePage />}>
          <Route index element={<Quest1 />} />
          <Route path="quest1" element={<Quest1 />} />
          <Route path="quest2" element={<Quest2 />} />
          <Route path="quest3" element={<Quest3 />} />
        </Route>

        {/* Podcast is its own page */}
        <Route path="/podcast" element={<PodcastPage />} />
        <Route path="/about" element={<AboutMe />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/book" element={<BookMe />} />
        <Route path="/advertising" element={<Advert />} />
      </Routes>
    );
  }
}

export default App;
