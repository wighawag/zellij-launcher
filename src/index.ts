#! /usr/bin/env node

import { exec, execFileSync } from "child_process";
import { promisify } from "util";
import { Command } from "commander";

const execAsync = promisify(exec);

const stripAnsi = (str: string) => str.replace(/\x1B[[(?);]{0,2}(;?\d)*./g, "");

// not supported yet
// import pkg from "../package.json" with { type: "json" };
// so use the following instead:
import { createRequire } from "module";
import { stderr } from "process";
const require = createRequire(import.meta.url);
const pkg = require("../package.json");

async function main() {
  const program = new Command();

  program
    .version(pkg.version)
    .name(pkg.name)
    .description(pkg.description)
    .argument("<session>", "specify session to use")
    .parse(process.argv);

  const options = program.opts();
  const args = program.args;
  const sessionToLaunch = args[0];

  try {
    const { stdout, stderr } = await execAsync("zellij list-sessions");
    const lines = stdout.trim().split("\n");
    for (const lineWithAnsi of lines) {
      const line = stripAnsi(lineWithAnsi);
      const firstSpaceIndex = line.indexOf(" ");
      const session = line.substring(0, firstSpaceIndex);
      if (session == sessionToLaunch) {
        console.log(session);
        if (line.indexOf("(EXITED") >= 0) {
          console.log(`deleting session named "${session}"...`);
          await execAsync(`zellij delete-session ${session}`);
        }
      }
    }
  } catch (err: any) {
    if (
      err.stderr &&
      stripAnsi(err.stderr.trim()) == "No active zellij sessions found."
    ) {
      //   console.log(JSON.stringify(err));
    } else {
      throw err;
    }
  }

  try {
    const result = execFileSync("zellij", [], {
      stdio: "inherit",
    });
    console.log(result);
  } catch (err) {
    console.error(`failed to execute 'zellij'`);
  }
}

main();
