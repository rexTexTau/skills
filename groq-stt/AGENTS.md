# AGENTS.md (groq-stt)

[SKILL.md](./SKILL.md) owns the client architecture, invocation, defaults, output format, and speaker-label semantics.

### Operating Principles

- Preserve the Skill's client architecture; keep the Bash entrypoint a delegation-only wrapper.
- Keep stdout limited to the requested transcript format; diagnostics belong on stderr because attachment handlers insert stdout into user turns.
- Never print `GROQ_API_KEY` or request headers in diagnostics.
- Validate arguments and credentials before invoking the Groq API.
- Preserve the positional interface documented in the Skill for existing `transcribe_groq` callers.

### Discovered Constraints

- Use `response_format=text` for plain output and `verbose_json` only for diarized output.
