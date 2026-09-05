#!/usr/bin/env node
import { realpathSync } from "node:fs";
import { readFileSync } from "node:fs";
import { stat } from "node:fs/promises";
import { extname } from "node:path";
import { argv, env, exit, stderr, stdout } from "node:process";
import { fileURLToPath, pathToFileURL } from "node:url";

// --- Constants ---

const DEFAULTS = {
  model: "pixtral-12b-latest",
  endpoint: "https://api.mistral.ai/v1/chat/completions",
  maxTokens: 8192,
};

const CLI_FLAGS = new Map([
  ["--help", "help"],
  ["-h", "help"],
  ["--meta", "meta"],
  ["-M", "meta"],
]);

const CLI_VALUES = new Map([
  ["--file", "file"],
  ["-f", "file"],
  ["--lang", "language"],
  ["--language", "language"],
  ["-l", "language"],
  ["--model", "model"],
  ["-m", "model"],
  ["--format", "format"],
  ["-F", "format"],
]);

// --- CLI ---

function usage() {
  return [
    "Usage:",
    `  MISTRAL_API_KEY=xxx node ocr.mjs image.jpg [lang] [model] [options]`,
    "",
    "Options:",
    "  --meta, -M       Metadata extraction",
    "  --format, -F     Output format: txt (default) or md (markdown)",
    "  --file, -f       Image file path",
    "  --lang, -l       Language hint (ru, en)",
    "  --model, -m      Mistral vision model (default: pixtral-12b-latest)",
    "  --help, -h       This help",
    "",
    "Outputs only recognized text on stdout.",
  ].join("\n");
}

function parseArgs(args) {
  const options = {
    file: "",
    language: "",
    model: DEFAULTS.model,
    meta: false,
    format: "txt",
    help: false,
  };
  const positional = [];
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (CLI_FLAGS.has(arg)) {
      options[CLI_FLAGS.get(arg)] = true;
      continue;
    }
    if (CLI_VALUES.has(arg)) {
      const key = CLI_VALUES.get(arg);
      const value = args[i + 1];
      if (!value || value.startsWith("--"))
        throw new Error(`Missing value for ${arg}`);
      options[key] = value;
      i++;
      continue;
    }
    if (arg.startsWith("--")) throw new Error(`Unknown option: ${arg}`);
    positional.push(arg);
  }
  options.file ||= positional[0] ?? "";
  options.language ||= positional[1] ?? "";
  options.model = positional[2] ?? options.model;

  if (options.format !== "txt" && options.format !== "md")
    throw new Error(`Invalid format: ${options.format}. Use 'txt' or 'md'.`);

  return options;
}

async function assertReadableFile(file) {
  try {
    const info = await stat(file);
    if (!info.isFile()) throw new Error("not a file");
  } catch {
    throw new Error(`Image file not found: ${file}`);
  }
}

function guessMimeType(file) {
  const ext = extname(file).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".webp") return "image/webp";
  if (ext === ".gif") return "image/gif";
  if (ext === ".bmp") return "image/bmp";
  return "image/jpeg";
}

// --- Prompt builder ---

function buildOcrPrompt({ language, meta, format }) {
  const langHint = language
    ? `The text is primarily in ${language.toLowerCase()}. `
    : "";

  if (meta && format === "md") {
    return (
      langHint +
      `Extract ALL text from this image, including page headers, footers, page numbers, and running titles.

First, output the page metadata (page numbers, running titles, library stamps, handwritten notes) as a plain list of key:value pairs, surrounded by "---" separators. Use the language most common on this page for the labels for key names. Do not use any markdown code blocks (no \`\`\`yaml, no \`\`\`, no fenced blocks). Format each item on its own line as Label: value.

Then output the main body text:
- Format headings as markdown headings (##, ###, ####) preserving their hierarchy.
- Format lists as markdown ordered (1. 2. 3.) or unordered (-) lists.
- Format tables as markdown pipe tables with header row.
- Format blockquotes as markdown blockquotes (>).
- Format emphasis: **bold** and *italic* where the source uses bold or italic.
- Escape any literal Markdown special characters in the extracted text by prefixing them with a backslash to prevent unintended formatting.
- Preserve paragraph structure, line breaks, and reading order.

No commentary, no explanations.`
    );
  }

  if (meta && format === "txt") {
    return (
      langHint +
      `Extract ALL text from this image, including page headers, footers, page numbers, and running titles.

First, output the page metadata (page numbers, running titles, library stamps, handwritten notes) as a plain list of key:value pairs, surrounded by "---" separators. Use the language most common on this page for the labels for key names. Do not use any markdown code blocks (no \`\`\`yaml, no \`\`\`, no fenced blocks). Format each item on its own line as Label: value.

Then output the main body text:
- Preserve paragraph structure and line breaks.

No commentary, no markdown, no explanations.`
    );
  }

  if (!meta && format === "md") {
    return (
      langHint +
      `Extract ALL text from this image, including page headers, footers, page numbers, and running titles.

Format the output as structured markdown:
- Headings as markdown headings (##, ###, ####) preserving their hierarchy.
- Lists as markdown ordered (1. 2. 3.) or unordered (-) lists.
- Tables as markdown pipe tables with header row.
- Blockquotes as markdown blockquotes (>).
- Emphasis: **bold** and *italic* where the source uses bold or italic.
- Escape any literal Markdown special characters in the extracted text by prefixing them with a backslash to prevent unintended formatting.
- Preserve paragraph structure, line breaks, and reading order.

No commentary, no explanations.`
    );
  }

  // Default: txt, no meta extraction
  return (
    langHint +
    `Extract ALL text from this image, including page headers, footers, page numbers, and running titles. Output the recognized text preserving paragraph structure, line breaks, and reading order. No commentary, no markdown formatting.`
  );
}

// --- API ---

async function recognize({ file, language, model, meta, format }) {
  await assertReadableFile(file);
  if (!env.MISTRAL_API_KEY) throw new Error("MISTRAL_API_KEY is required");

  const buffer = readFileSync(file);
  const base64 = buffer.toString("base64");
  const mime = guessMimeType(file);
  const dataUrl = `data:${mime};base64,${base64}`;

  const body = {
    model,
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: buildOcrPrompt({ language, meta, format }) },
          { type: "image_url", image_url: dataUrl },
        ],
      },
    ],
    temperature: 0,
    max_tokens: DEFAULTS.maxTokens,
    stream: false,
  };

  const res = await fetch(DEFAULTS.endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.MISTRAL_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "Unknown API Error");
    throw new Error(`Mistral API error: ${res.status} - ${text}`);
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";
  return content.trim();
}

// --- Main ---

function isDirectCliEntrypoint(metaUrl, entryPath) {
  if (!entryPath) return false;
  try {
    return realpathSync(fileURLToPath(metaUrl)) === realpathSync(entryPath);
  } catch {
    return metaUrl === pathToFileURL(entryPath).href;
  }
}

async function main() {
  try {
    const options = parseArgs(argv.slice(2));
    if (options.help) {
      stdout.write(`${usage()}\n`);
      exit(0);
    }
    if (!options.file) throw new Error(usage());
    const text = await recognize(options);
    stdout.write(text.endsWith("\n") ? text : `${text}\n`);
  } catch (error) {
    stderr.write(`${error.message}\n`);
    exit(2);
  }
}

if (isDirectCliEntrypoint(import.meta.url, argv[1])) main();
