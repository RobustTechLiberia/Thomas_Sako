import React from "react";
// vercel web analytics
import { Analytics } from "@vercel/analytics/react";
import { Routes, Route } from "react-router-dom";
import HomePage from "./pages/home";
import VotePoll from "./components/vote_poll/vote_poll";
import Quest from "./components/vote_poll/Questions/quest";
import PodcastPage from "./components/features/pages/podcast_page";
import AboutMe from "./components/features/pages/aboutme_page";
import BookMe from "./components/features/pages/bookme";
import Contact from "./components/features/pages/contact";
import Advert from "./components/features/pages/advertising";
import "./App.css";
import PlayList from "./components/features/pages/playlist_page";
import Results from "./components/vote_poll/Questions/Result/results";
import CmsPage from "./pages/cms";
import CmsDynamicPage from "./pages/cms_dynamic_page";

class App extends React.Component {
  render() {
    return (
      <>
        <Routes>
          <Route path="/" element={<HomePage />}>
            <Route element={<VotePoll />}>
              <Route index element={<Quest />} />
              <Route path="quest" element={<Quest />} />
            </Route>
          </Route>

          <Route path="/podcast" element={<PodcastPage />} />
          <Route path="/playlist" element={<PlayList />} />
          <Route path="/about" element={<AboutMe />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/book" element={<BookMe />} />
          <Route path="/advertising" element={<Advert />} />
          <Route path="/results" element={<Results />} />
          <Route path="/cms" element={<CmsPage />} />
          <Route path="/:slug" element={<CmsDynamicPage />} />
        </Routes>
        <Analytics />
      </>
    );
  }
}

export default App;
