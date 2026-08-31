import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../images/Copilot_20260816_124825.png";

class Nav extends React.Component {
  constructor(props) {
    super(props);
    this.state = { isOpen: false };
  }

  toggleMenu = () => {
    this.setState((prev) => ({ isOpen: !prev.isOpen }));
  };

  render() {
    return (
      <>
        {/* Fixed navbar on laptops/desktops */}
        <div className="top-0 z-50 w-full border-b-2 border-b-violet-200 bg-white md:fixed">
          <nav className="bg-white w-auto border-none">
            <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center space-x-3 rtl:space-x-reverse"
              >
                <img src={logo} className="h-10 sm:h-12 md:h-20" alt="Logo" />
              </Link>

              {/* Right side: Watch Live + Menu Button */}
              <div className="flex shrink-0 items-center gap-2 bg-white md:order-2 md:gap-3">
                <a
                  href="https://www.youtube.com/@1847Liberty"
                  className="bg-violet-900 px-3 py-2 font-sans text-sm font-semibold capitalize text-white sm:px-5 sm:py-3 sm:text-base"
                >
                  Watch Live
                </a>
                <button
                  onClick={this.toggleMenu}
                  type="button"
                  className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body md:hidden bg-white focus:outline-none focus:ring-0 active:outline-none active:ring-0"
                  aria-controls="navbar-sticky"
                  aria-expanded={this.state.isOpen}
                >
                  <span className="sr-only">Open main menu</span>
                  <svg
                    className="w-6 h-6"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeWidth="2"
                      d="M5 7h14M5 12h14M5 17h14"
                    />
                  </svg>
                </button>
              </div>

              {/* Collapsible menu */}
              <div
                className={`absolute left-0 top-full w-full border-b-2 border-violet-200 bg-white md:static md:flex md:w-auto md:order-1 md:border-0 transition-all duration-300 ${
                  this.state.isOpen ? "block" : "hidden"
                }`}
                id="navbar-sticky"
              >
                <ul className="flex capitalize text-violet-900 flex-col p-4 md:p-0 font-medium text-lg md:text-xl lg:text-xl rounded-none bg-white md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0">
                  <li>
                    <a
                      href="https://www.youtube.com/@1847Liberty"
                      className="block py-2 px-3 text-violet-900 hover:text-violet-700 md:p-0"
                    >
                      YouTube
                    </a>
                  </li>
                  <li>
                    <Link
                      to="/podcast"
                      className="block py-2 px-3 text-heading hover:text-violet-700 md:p-0"
                    >
                      Podcasts
                    </Link>
                  </li>
                  <li>
                    
                    <Link
                      to="mailto:editor@thomas.com?subject=Advertise%20with%20the%20Thomas.com%20Daily%20Newsletter!"
                      className="block py-2 px-3 text-heading hover:text-violet-700 md:p-0"
                    >
                      Advertising
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/playlist"
                      className="block py-2 px-3 text-heading hover:text-violet-700 md:p-0"
                    >
                      Playlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      className="block py-2 px-3 text-heading hover:text-violet-700 md:p-0"
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="block py-2 px-3 text-heading hover:text-violet-700 md:p-0"
                    >
                      Contact
                    </Link>
                  </li>
                </ul>
              </div>
            </div>
          </nav>
        </div>
      </>
    );
  }
}

export default Nav;
