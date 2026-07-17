import { readFile, writeFile } from "node:fs/promises";

const indexPath = "dist/index.html";
const html = await readFile(indexPath, "utf8");

const headMarkup = `
  <link rel="manifest" href="/manifest.json" />
  <link rel="icon" href="/favicon.ico" sizes="any" />
  <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32.png" />
  <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />`;

if (!html.includes('rel="manifest"')) {
  await writeFile(indexPath, html.replace("</head>", `${headMarkup}\n</head>`));
}
