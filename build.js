const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const isWatch = process.argv.includes("--watch");

// Ensure dist dir exists
if (!fs.existsSync("dist")) fs.mkdirSync("dist");

// Build plugin code
const buildCode = async () => {
  const ctx = await esbuild.context({
    entryPoints: ["src/code.ts"],
    bundle: true,
    outfile: "dist/code.js",
    platform: "browser",
    target: "es2017",
    format: "iife",
    plugins: [
      {
        name: "logger",
        setup(build) {
          build.onEnd(() => {
            console.log(`[${new Date().toLocaleTimeString()}] ✅ code.js built`);
          });
        },
      },
    ],
  });

  if (isWatch) {
    await ctx.watch();
    console.log("Watching for changes...");
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log("✅ code.js built");
  }
};

// Copy UI file to dist
const copyUI = () => {
  const src = path.join(__dirname, "src", "ui.html");
  const dest = path.join(__dirname, "dist", "ui.html");
  fs.copyFileSync(src, dest);
  console.log(`[${new Date().toLocaleTimeString()}] ✅ ui.html copied`);
};

const getUIHash = () => {
  try {
    return crypto.createHash("md5").update(fs.readFileSync("src/ui.html")).digest("hex");
  } catch (e) {
    return "";
  }
};

let lastUIHash = getUIHash();

const build = async () => {
  await buildCode();
  copyUI();

  if (isWatch) {
    // Watch for UI changes too
    let timer;
    fs.watch("src/ui.html", () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        const currentHash = getUIHash();
        if (currentHash !== lastUIHash) {
          lastUIHash = currentHash;
          copyUI();
        }
      }, 100);
    });
  }
};

build().catch((e) => {
  console.error(e);
  process.exit(1);
});
