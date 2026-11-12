const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
module.exports = async function afterPack(context) {
  // electron-builder's module exclusion can omit traced dependencies from extraResources.
  // Copy the traced runtime explicitly after normal packaging, then verify local resolution.
  const from = path.join(
    context.packager.projectDir,
    ".next",
    "standalone",
    "node_modules",
  );
  const server = path.join(context.appOutDir, "resources", "server");
  const to = path.join(server, "node_modules");
  fs.cpSync(from, to, { recursive: true, dereference: true });
  const resolve = createRequire(path.join(server, "server.js"));
  for (const name of ["next", "react", "react-dom"]) {
    const resolved = resolve.resolve(name);
    if (!path.resolve(resolved).startsWith(path.resolve(to) + path.sep)) {
      throw new Error("Packaged server dependency is missing: " + name);
    }
  }
  console.log("Verified packaged server runtime dependencies.");
};
