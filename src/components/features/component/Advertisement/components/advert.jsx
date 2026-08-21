import { Component } from "react";
import advert1 from "../../../../../images/Advertising-2.png";
import advert2 from "../../../../../images/Advertising-2.png";
import advert3 from "../../../../../images/Advertising-2.png";
import advert4 from "../../../../../images/Advertising-2.png";
import advert5 from "../../../../../images/Advertising-2.png";

class Advert extends Component {
  state = { current: 0 };

  componentDidMount() {
    this.interval = setInterval(() => {
      this.setState((prev) => ({ current: (prev.current + 1) % 5 }));
    }, 300000); // auto-slide every 5 minutes
  }

  componentWillUnmount() {
    clearInterval(this.interval);
  }

  render() {
    // Images with their respective links
    const adverts = [
      { src: advert1, link: "https://site1.com" },
      { src: advert2, link: "https://site2.com" },
      { src: advert3, link: "https://site3.com" },
      { src: advert4, link: "https://site4.com" },
      { src: advert5, link: "https://site5.com" },
    ];

    const { current } = this.state;

    return (
      <>
        {/* Container */}
        <div className="flex flex-col justify-center items-center object-cover border w-72 h-auto mb-20 md:mb-0 lg:mb-0 border-gray-400">
          <a
            href={adverts[current].link}
            target="_blank"
            rel="noopener noreferrer"
          >
            <img
              src={adverts[current].src}
              alt={`advert-${current}`}
              className="w-72 h-72 object-cover"
            />
          </a>
          <div className="flex flex-col justify-center items-center w-full bg-violet-950">
            <h1 className="text-center text-white font-semibold text-lg px-5 py-5 uppercase">
              advertisement
            </h1>
          </div>
        </div>
      </>
    );
  }
}

export default Advert;
