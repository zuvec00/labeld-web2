#!/usr/bin/env node
// Fails when a tracked source file hides code the way the postcss.config.mjs
// malware did: a very long line, code pushed off-screen behind a wall of
// spaces, or known loader markers. Run with --staged to check only what is
// about to be committed (used by the pre-commit hook).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

const MAX_LINE = 1000;
const MAX_CONFIG_LINE = 200;
const SPACE_RUN = 80;

const CHECKED = /\.(c|m)?(j|t)sx?$|\.json$|\.css$|\.sh$|\.ya?ml$/;
const SKIPPED =
	/(^|\/)(node_modules|\.next|\.vercel|\.VSCodeCounter|public)\/|(^|\/)package-lock\.json$|\.min\.|\.tsbuildinfo$|^scripts\/check-hidden-code\.mjs$/;
const CONFIG_FILE =
	/(^|\/)(postcss|tailwind|next|eslint|babel|vite|jest|webpack|prettier)\.config\.[cm]?[jt]s$|(^|\/)next-sitemap\.config\.js$/;

const MARKERS = [
	[/global\.o\s*=\s*['"]/, "global.o = '<campaign id>' loader marker"],
	[/global\[\s*['"]_V['"]\s*\]/, "global['_V'] loader marker"],
	[/global\s*\[[^\]]+\]\s*=\s*require\b/, "global[...] = require (exposes require to hidden code)"],
	[/var\s+_\$_[0-9a-f]{3,6}\s*=\s*\(function/, "obfuscator string-shuffle prelude"],
];

const staged = process.argv.includes("--staged");
const git = (args) => execFileSync("git", args, { encoding: "utf8", maxBuffer: 1 << 28 });

const files = (staged
	? git(["diff", "--cached", "--name-only", "--diff-filter=ACM"])
	: git(["ls-files"])
)
	.split("\n")
	.filter((f) => f && CHECKED.test(f) && !SKIPPED.test(f));

const problems = [];

for (const file of files) {
	let text;
	try {
		text = staged ? git(["show", `:${file}`]) : readFileSync(file, "utf8");
	} catch {
		continue;
	}
	const limit = CONFIG_FILE.test(file) ? MAX_CONFIG_LINE : MAX_LINE;
	text.split("\n").forEach((line, i) => {
		const at = `${file}:${i + 1}`;
		if (line.length > limit) {
			problems.push(`${at}  line is ${line.length} chars (limit ${limit})`);
		}
		if (new RegExp(`\\S[ \\t]{${SPACE_RUN},}\\S`).test(line)) {
			problems.push(`${at}  code hidden after ${SPACE_RUN}+ spaces`);
		}
		for (const [re, label] of MARKERS) {
			if (re.test(line)) problems.push(`${at}  ${label}`);
		}
	});
}

if (problems.length) {
	console.error("Hidden-code check failed:\n");
	for (const p of problems) console.error(`  ${p}`);
	console.error(
		"\nIf this is legitimate (generated data, a long string), shorten it or add the file to SKIPPED in scripts/check-hidden-code.mjs. If you did not write it, do NOT run the app: it may be malware.",
	);
	process.exit(1);
}
console.log(`Hidden-code check passed (${files.length} files).`);
