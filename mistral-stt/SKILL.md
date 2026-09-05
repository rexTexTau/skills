---
name: mistral-stt
description: Transcribe audio files using Mistral AI Voxtral.
---

# Mistral STT Skill

Standalone direct Node.js client for Mistral's Voxtral transcription API. The canonical client is `scripts/transcribe.mjs`; `scripts/transcribe.sh` is the shell entrypoint wrapper. There are no curl fallbacks or Python parser dependencies.

## Usage

```bash
MISTRAL_API_KEY=xxx ./scripts/transcribe.sh audio.ogg [language] [model] [diarize]
MISTRAL_API_KEY=xxx ./scripts/transcribe.sh --file audio.ogg --lang ru --model voxtral-mini-latest --diarize true
```

- Outputs plain transcription text, or timestamped speaker segments when diarization is enabled.
- Fails fast when the file or `MISTRAL_API_KEY` is missing.

## CLI Options

- `--file`, `-f` — audio file path.
- `--lang`, `--language`, `-l` — optional language code; omitted means provider auto-detection.
- `--model`, `-m` — Mistral transcription model; default: `voxtral-mini-latest`.
- `--diarize`, `-d` — `true` to label speaker segments; default: `false`.
- `--help`, `-h` — usage.

## Dependencies

- Node.js 18+ with built-in `fetch`, `FormData`, and `Blob`.
- Internet access.

## Notes

- Default model: `voxtral-mini-latest`. Diarization works for this model only, so if diarization is on, model will always be `voxtral-mini-latest`.
- Parses Mistral JSON response and prints only the `text` field.
- Preserves positional invocation used by `transcribe_mistral`: `transcribe.sh {file} {lang} {model}`.
- Diarization preserves Mistral's `speaker_id` values without guessing or merging speakers.
