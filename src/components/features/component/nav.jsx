import React from "react";
import { Link } from "react-router-dom";
import logo from "../../../images/Copilot_20260816_124825.png";

class Nav extends React.Component {
  render() {
    return (
      <>
        <div className="md:h-24 lg:h-24 h-20 bg-white border-b border-b-violet-200">
          <nav className="bg-white  w-auto z-20 top-0 inset-s-0 border-b border-none border-default">
            <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto p-4">
              <Link
                to="/"
                className="flex items-center space-x-3 rtl:space-x-reverse"
              >
                <img
                  src={logo}
                  className="md:h-20 lg:h-20 h-12"
                  alt="Flowbite Logo"
                />
              </Link>

              <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
                <Link
                  to="/youtube"
                  className="bg-violet-900 text-white font-sans font-semibold capitalize py-3 px-5"
                >
                  Watch Live
                </Link>
                <button
                  data-collapse-toggle="navbar-sticky"
                  type="button"
                  className="inline-flex items-center p-2 w-10 h-10 justify-center text-sm text-body rounded-base md:hidden hover:bg-neutral-secondary-soft hover:text-heading focus:outline-none focus:ring-2 focus:ring-neutral-tertiary"
                  aria-controls="navbar-sticky"
                  aria-expanded="false"
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

              <div
                className="items-center justify-between hidden w-full md:flex md:w-auto md:order-1"
                id="navbar-sticky"
              >
                <ul className="flex capitalize text-violet-900 flex-col p-4 md:p-0 mt-4 font-medium border border-default text-lg md:text-xl lg:text-xl rounded-base bg-neutral-secondary-soft md:space-x-8 rtl:space-x-reverse md:flex-row md:mt-0 md:border-0 md:bg-neutral-primary">
                  <li>
                    <Link
                      to="/youtube"
                      className="block py-2 px-3 text-violet-900 bg-brand rounded-sm md:bg-transparent md:text-fg-brand md:p-0"
                    >
                      YouTube
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/podcast"
                      className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0"
                    >
                      podcasts
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/advertising"
                      className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0"
                    >
                      advertising
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/podcast"
                      className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0"
                    >
                      playlist
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/about"
                      className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0"
                    >
                      about
                    </Link>
                  </li>
                  <li>
                    <Link
                      to="/contact"
                      className="block py-2 px-3 text-heading rounded hover:bg-neutral-tertiary md:hover:bg-transparent md:border-0 md:hover:text-fg-brand md:p-0"
                    >
                      contact
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
