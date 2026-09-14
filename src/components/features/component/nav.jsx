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

  closeMenu = () => {
    if (this.state.isOpen) this.setState({ isOpen: false });
  };

  render() {
    return (
      <>
        {/* Fixed navbar on laptops/desktops */}
        <div className="top-0 z-50 w-full border-b-2 border-b-violet-200 bg-white md:fixed">
          <nav className="bg-white w-auto border-none">
            <div className="relative mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-2 p-3 sm:p-4">
              {/* Logo */}
              <Link
                to="/"
                className="flex items-center space-x-3 rtl:space-x-reverse"
                onClick={this.closeMenu}
              >
                <img src={logo} className="h-10 sm:h-12 md:h-20" alt="Logo" />
              </Link>

              {/* Right side: Watch Live + Menu Button */}
              <div className="flex shrink-0 items-center gap-2 bg-white lg:order-3 lg:gap-3">
                <a
                  href="https://www.youtube.com/@1847Liberty"
                  className="bg-violet-900 px-3 py-2 font-sans text-sm font-semibold capitalize text-white sm:px-5 sm:py-3 sm:text-base"
                >
                  Watch Live
                </a>
                <button
                  onClick={this.toggleMenu}
                  type="button"
                  className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-violet-900 lg:hidden bg-white focus:outline-none focus:ring-0 active:outline-none active:ring-0"
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
                className={`absolute left-0 top-full w-full border-b-2 border-violet-200 bg-white shadow-lg lg:static lg:order-2 lg:flex lg:w-auto lg:border-0 lg:shadow-none lg:bg-transparent ${
                  this.state.isOpen ? "block" : "hidden"
                }`}
                id="navbar-sticky"
              >
                <ul className="flex capitalize text-violet-900 flex-col p-3 font-medium text-lg lg:p-0 lg:flex-row lg:items-center lg:gap-6 lg:text-xl xl:gap-8 lg:mt-0">
                  <li>
                    <a
                      href="https://www.youtube.com/@1847Liberty"
                      className="block py-2 px-3 text-violet-900 hover:text-violet-700 lg:p-0"
                      onClick={this.closeMenu}
                    >
                      YouTube
                    </a>
                  </li>
                  <li>
                    <Link
                      to="/podcast"
                      className="block py-2 px-3 text-heading hover:text-violet-700 lg:p-0"
                      onClick={this.closeMenu}
                    >
                      Podcasts
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/advertising"
                      className="block py-2 px-3 text-heading hover:text-violet-700 lg:p-0"
                      onClick={this.closeMenu}
                    >
                      Advertising
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/playlist"
                      className="block py-2 px-3 text-heading hover:text-violet-700 lg:p-0"
                      onClick={this.closeMenu}
                    >
                      Playlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      className="block py-2 px-3 text-heading hover:text-violet-700 lg:p-0"
                      onClick={this.closeMenu}
                    >
                      About
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="block py-2 px-3 text-heading hover:text-violet-700 lg:p-0"
                      onClick={this.closeMenu}
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