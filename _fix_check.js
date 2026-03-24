const fs = require("fs");
const c = fs.readFileSync("js/ui/windows/WindowSetting.js", "utf8");
const lines = c.split("\n");
let out = "";
for (let i = 434; i < 441; i++) {
  out += "L" + (i + 1) + ": " + JSON.stringify(lines[i]) + "\n";
}
fs.writeFileSync("_fix_output.txt", out, "utf8");
