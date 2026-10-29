# CLAUDE.md - Project Guidelines for Claude Code

## Project Overview
- **Project Name**: DualBear Games
- **Tech Stack**: HTML5, CSS3, Modern JavaScript (ES6+), Canvas / WebGL, RWD (Mobile and Desktop Responsive)

## Core Rules & Principles
1. **Language**: Always respond and write comments/documentation in **Traditional Chinese (繁體中文)**.
2. **KISS Principle**: Keep code minimal, clean, and avoid over-engineering.
3. **Strict CSS Separation**:
   - No inline styles (`style="..."`).
   - No direct style manipulation in JS (`element.style.xxx = ...`).
   - Use CSS classes and toggle via `classList.add/remove/toggle`.
4. **Documentation Sync**:
   - Keep `docs/HANDOVER.md`, `CHANGELOG.md`, and `.agent_task_state.md` updated after each major milestone.
