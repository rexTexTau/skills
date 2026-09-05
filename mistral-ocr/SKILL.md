---
name: mistral-ocr
description: Recognize text in images using Pixtral on Mistral AI.
---

# Mistral OCR Skill

Standalone Node.js client for Mistral AI Pixtral vision model.
Canonical client: scripts/ocr.mjs. Shell wrapper: scripts/ocr.sh.
No curl, no Python, no external dependencies beyond Node.js 18+.

## Usage

```bash
MISTRAL_API_KEY=xxx ./scripts/ocr.sh photo.jpg [lang] [model] [options]
MISTRAL_API_KEY=xxx ./scripts/ocr.sh --file photo.jpg --lang ru --model pixtral-12b-latest --meta --format md
```

## Positional arguments

1. file — image path (required)
2. lang — language hint, e.g. ru, en (optional, default: auto)
3. model — Mistral vision model (optional, default: pixtral-12b-latest)

## Flags

--meta, -M       Metadata extraction. Page numbers, library stamps, 
				handwritten notes and running titles gathered on top 
				inside --- separators.

--format, -F     Output format: txt (default) or md. In md mode headings
                  become markdown headings (##, ###), tables become
                  markdown tables.

--file, -f       Image file path (alternative to positional arg).

--lang, -l       Language hint (ru, en, etc).

--model, -m      Mistral vision model. Options:
                  pixtral-12b-latest (default, free tier)
                  pixtral-12b-2409 (pinned version)
                  pixtral-large-2411 (may require paid plan)

--help, -h       Show usage.

## Output

Only recognized text on stdout. Errors go to stderr.
Exit code 0 on success, 2 on error.

## Metadata extraction mode (--meta)

Extracts page numbers, running titles, library stamps, handwritten notes etc. as a plain list of key:value pairs, surrounded by "---" separators and writes this block on top of resulting document.

## Markdown mode (--format md)

Headings rendered as ## or ###. Tables rendered as markdown
pipe tables. Everything else is plain text. No quotes around
paragraphs unless --cite is also set.

## Dependencies

- Node.js 18+ (uses global fetch)
- Internet access.

## Notes

- Pixtral accepts image_url as a plain string with
  data:mime;base64,... data URL format (not a nested object).
- API endpoint: https://api.mistral.ai/v1/chat/completions
- Parse choices[0].message.content from JSON response.
