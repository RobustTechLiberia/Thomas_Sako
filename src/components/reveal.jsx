import React from "react";

class Reveal extends React.Component {
  constructor(props) {
    super(props);
    this.ref = React.createRef();
    this.state = { visible: false };
  }

  componentDidMount() {
    const el = this.ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      this.setState({ visible: true });
      return;
    }
    this.observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            this.setState({ visible: true });
            this.observer.disconnect();
          }
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -40px 0px" },
    );
    this.observer.observe(el);
  }

  componentWillUnmount() {
    if (this.observer) this.observer.disconnect();
  }

  render() {
    const { as: Tag = "div", delay = 0, className = "", children } = this.props;
    return (
      <Tag
        ref={this.ref}
        className={`reveal ${this.state.visible ? "is-visible" : ""} ${className}`}
        style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      >
        {children}
      </Tag>
    );
  }
}

export default Reveal;