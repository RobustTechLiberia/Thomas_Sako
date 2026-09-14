import React from "react";
import { Link } from "react-router-dom";
import Reveal from "../../reveal.jsx";
import youtube from "../../../images/Copilot_20260816_123052.png";
import podcast from "../../../images/Copilot_20260816_123356.png";
import playlist from "../../../images/Copilot_20260816_122807.png";
import AboutMe from "../../../images/Copilot_20260816_123803.png";
import Contact from "../../../images/Contact-2.png";
import BookMe from "../../../images/Copilot_20260816_124134.png";
import Cartoons from "../../../images/Cartoons.png";
import Mingle from "../../../images/The-Mingle-Project.png";

const ROW_ONE = [
  {
    key: "youtube",
    external: "https://www.youtube.com/@1847Liberty",
    img: youtube,
    label: "YouTube",
  },
  { key: "podcast", to: "/podcast", img: podcast, label: "Podcast" },
  { key: "playlist", to: "/playlist", img: playlist, label: "Play List" },
];

const ROW_TWO = [
  { key: "about", to: "/about", img: AboutMe, label: "About Me" },
  { key: "contact", to: "/contact", img: Contact, label: "Contact" },
  { key: "book", to: "/book", img: BookMe, label: "Book Thomas", square: true },
  { key: "cartoons", to: "/cartoons", img: Cartoons, label: "Cartoons" },
  { key: "mingle", to: "/mingle", img: Mingle, label: "The Mingle Project" },
];

const cardBody = (item) => {
  const img = (
    <img
      src={item.img}
      alt={item.label}
      className={`w-full object-cover hover:opacity-50 cursor-pointer ${
        item.square ? "aspect-square" : ""
      }`}
    />
  );
  return (
    <div className="w-full max-w-80 bg-white lib-card-lift">
      {item.external ? (
        <a href={item.external} target="_blank" rel="noopener noreferrer">
          {img}
        </a>
      ) : (
        <Link to={item.to}>{img}</Link>
      )}
      <p className="font-serif capitalize text-center text-xl">{item.label}</p>
    </div>
  );
};

class Features extends React.Component {
  render() {
    const row = (items) => (
      <div className="flex flex-wrap items-center justify-center gap-5 bg-white px-4 py-10 md:min-h-96">
        {items.map((item, idx) => (
          <Reveal key={item.key} delay={idx * 100}>
            {cardBody(item)}
          </Reveal>
        ))}
      </div>
    );
    return (
      <>
        {row(ROW_ONE, 0)}
        {/* Added mb-20 to create margin below this final container */}
        <div className="flex flex-wrap items-center justify-center gap-5 bg-white px-4 py-10 md:my-10 md:min-h-96">
          {ROW_TWO.map((item, idx) => (
            <Reveal key={item.key} delay={idx * 100}>
              {cardBody(item)}
            </Reveal>
          ))}
        </div>
      </>
    );
  }
}

export default Features;