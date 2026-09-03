import { SitemapStream, streamToPromise } from "sitemap";
import { createWriteStream } from "fs";
import { Readable } from "stream";

const links = [
  { url: "/", changefreq: "daily", priority: 1.0 },
  { url: "/about", changefreq: "monthly", priority: 0.8 },
  { url: "/contact", changefreq: "monthly", priority: 0.5 },
  { url: "/book", changefreq: "monthly", priority: 0.5 },
  { url: "/playlist", changefreq: "monthly", priority: 0.5 },
  { url: "/podcast", changefreq: "monthly", priority: 0.5 },
];

// replace with site domain

const stream = new SitemapStream({
  hostname: "https://your-future-domain.com",
});

streamToPromise(Readable.from(links).pipe(stream))
  .then((data) => {
    createWriteStream("./public/sitemap.xml").write(data);
    console.log("Sitemap built successfully");
  })
  .catch((err) => console.error(err));
