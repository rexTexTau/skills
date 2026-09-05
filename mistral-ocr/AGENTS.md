# AGENTS.md (mistral-ocr)

## Knowledge & Conventions

### Operating Principles

- `scripts/ocr.mjs` is canonical: standalone Node.js, no curl/Python.
- `scripts/ocr.sh` delegates to `ocr.mjs`.
- Output only recognized text on stdout. Errors to stderr.
- Never print `MISTRAL_API_KEY` or request headers.

### CLI Design

- Positional args: `file [lang] [model]`.
- Flags: `--meta/-M` (boolean), `--format/-F` (txt|md), `--file/-f`, `--lang/-l`, `--model/-m`, `--help/-h`.
- Boolean flags don't consume next arg.

### Prompt Logic

- Default (txt, no cite): extract ALL text as-is, no formatting.
- `--meta`: Extract metadata and write on top surrouded by `---`.
- `--format md`: headings as `##`/`###`, tables as markdown tables etc.
- `--metadata --format md`: markdown structure + metadata on top.

### Discovered Constraints

- Pixtral accepts `image_url` as a plain string with `data:mime;base64,...` (not nested object).
- Endpoint: `https://api.mistral.ai/v1/chat/completions`.
- Parse `choices[0].message.content` from JSON response.
- Models: `pixtral-12b-latest` (default), `pixtral-12b-2409`, `pixtral-large-2411` (may require paid plan).