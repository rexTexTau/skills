# AGENTS.md (edge-tts)

[SKILL.md](./SKILL.md) owns the client architecture, invocation, output modes, and platform playback behavior.

### Operating Principles

- Preserve the Skill's client architecture; keep the Bash entrypoint a delegation-only wrapper.
- In playback mode, print only the spoken text to stdout; send diagnostics to stderr.
- Preserve the Skill's stdin and positional interfaces for piped responses and existing `say_edge` callers.

### Playback Policy

- Auto-detect blocking players in this order: `ffplay`, `mpv`, `vlc`, `cvlc`, `mpg123`, `afplay`, before the Skill's Windows fallback.
- Keep media, subtitle, metadata, and voice-list operations independent of player availability.

### Discovered Constraints

- Direct Edge binary websocket payload data begins immediately after the declared header bytes; do not skip an extra CRLF after the binary header.
- MP3 output should start with a valid frame sync such as `ff f3`; missing sync means audio chunks were sliced incorrectly.
