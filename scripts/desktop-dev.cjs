// Use the exact bundled runtime so desktop development matches the packaged app.
const { spawnSync } = require("node:child_process");
const result = spawnSync(require("electron"), ["."], {
  stdio: "inherit",
  windowsHide: true,
});
process.exit(result.status || 0);
