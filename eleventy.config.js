export default function (cfg) {
  cfg.addPassthroughCopy({ "src/assets": "assets" });
  cfg.addPassthroughCopy({ "src/_headers": "_headers" });
  cfg.addFilter("waText", (t) => encodeURIComponent(t));
  cfg.addFilter("year", () => new Date().getFullYear());
  cfg.addCollection("posts", (c) => c.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date));
  return { dir: { input: "src", output: "_site", includes: "_includes", data: "_data" }, markdownTemplateEngine: "njk", htmlTemplateEngine: "njk" };
}
