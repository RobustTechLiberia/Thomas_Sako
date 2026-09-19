import { Component } from "react";
import { useLocation } from "react-router-dom";

class AdSenseWidgetClass extends Component {
  componentDidMount() {
    this.loadAd();
  }

  componentDidUpdate(prevProps) {
    if (this.props.location?.key !== prevProps.location?.key) {
      this.loadAd();
    }
  }

  loadAd() {
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (error) {
      console.warn(
        "AdSense script initialization ignored or blocked by browser extensions:",
        error,
      );
    }
  }

  render() {
    const { client, slot, format = "auto", responsive = "true" } = this.props;

    return (
      <div
        className="adsense-container"
        style={{ overflow: "hidden", minHeight: "250px", margin: "20px 0" }}
      >
        <ins
          key={this.props.location?.key || "static-ad"}
          className="adsbygoogle"
          style={{ display: "block" }}
          data-ad-client={client}
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive={responsive}
        />
      </div>
    );
  }
}

export default function AdSenseWidget(props) {
  try {
    const location = useLocation();
    return <AdSenseWidgetClass {...props} location={location} />;
  } catch (e) {
    return <AdSenseWidgetClass {...props} location={null} />;
  }
}
