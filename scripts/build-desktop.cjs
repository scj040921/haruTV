const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const result = spawnSync(
  process.execPath,
  [require.resolve("next/dist/bin/next"), "build"],
  { stdio: "inherit", env: { ...process.env, DESKTOP_BUILD: "1" } },
);
if (result.status !== 0) process.exit(result.status || 1);
const root = path.join(__dirname, "..");
const output = path.join(root, ".next/standalone");
fs.cpSync(path.join(root, "public"), path.join(output, "public"), {
  recursive: true,
});
fs.cpSync(path.join(root, ".next/static"), path.join(output, ".next/static"), {
  recursive: true,
});
// Never include local deployment credentials in a desktop bundle.
for (const name of fs.readdirSync(output)) {
  if (name.startsWith(".env"))
    fs.rmSync(path.join(output, name), { force: true });
}
console.log("haruTV desktop server ready.");
