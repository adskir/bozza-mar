import { eleventyImageTransformPlugin } from "@11ty/eleventy-img";

export default function (cfg) {
  // Foto: ogni <img src="/foto/..."> diventa automaticamente <picture> con AVIF/WebP/JPEG in più misure.
  // Gli originali stanno in src/foto/ (max 2000 px, senza EXIF/GPS); le versioni ottimizzate escono in _site/img/.
  cfg.addPlugin(eleventyImageTransformPlugin, {
    formats: ["webp", "jpeg"],
    widths: [480, 800, 1200, 1600],
    failOnError: true,
    htmlOptions: { imgAttributes: { loading: "lazy", decoding: "async", sizes: "(max-width: 860px) 100vw, 50vw" } },
  });
  cfg.addPassthroughCopy({ "src/assets": "assets" });
  cfg.addPassthroughCopy({ "src/_headers": "_headers" });
  cfg.addFilter("waText", (t) => encodeURIComponent(t));
  cfg.addFilter("year", () => new Date().getFullYear());
  cfg.addCollection("posts", (c) => c.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date));
  return { dir: { input: "src", output: "_site", includes: "_includes", data: "_data" }, markdownTemplateEngine: "njk", htmlTemplateEngine: "njk" };
}
