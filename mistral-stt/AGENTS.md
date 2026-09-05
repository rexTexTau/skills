# AGENTS.md (mistral-stt)

[SKILL.md](./SKILL.md) owns the client architecture, invocation, defaults, output format, and speaker-label semantics.

### Operating Principles

- Preserve the Skill's client architecture; keep the Bash entrypoint a delegation-only wrapper.
- Keep stdout limited to the requested transcript format; diagnostics belong on stderr because attachment handlers insert stdout into user turns.
- Never print `MISTRAL_API_KEY` or request headers in diagnostics.
- Validate arguments and credentials before invoking the Mistral API.
- Preserve positional invocation for `transcribe_mistral`: `transcribe.sh {file} {lang} {model} {diarize}`.
- Preserve the positional interface documented in the Skill for existing `transcribe_mistral` callers.

### Discovered Constraints

- Mistral returns JSON for Voxtral transcriptions; parse `text` for plain output and `segments` for diarization under the Skill's speaker-label contract.
