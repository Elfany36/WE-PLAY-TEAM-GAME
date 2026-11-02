# Desktop online follow-up

Continues the published v20 source c4fb580. The follow-up fixes four concrete client issues:

- Snake's separate prediction budget still stopped at one second, and its cached simulation stopped after twelve cells. It now uses the bounded shared network budget and up to forty predicted cells, while retaining collision checks and server authority.
- A thrown canvas paint exception could leave the shared animation loop with no next frame. It now resets drawing state and disposable caches, schedules the next frame in a finally block, and preserves the original error for diagnostics. Kart uses that same loop. This handles transient failures; persistent rendering errors still need investigation.
- Remote playback could replay a long backlog after a tab stopped painting. It now resumes near the latest confirmed snapshot after a rendering gap longer than one second, without extrapolating unseen opponent turns.
- Snakes & Ladders start positions used palette colors as seat indices. They now use the actual player order, keeping nonconsecutive colors inside the board.

The injected canvas-error/context-restoration browser checks passed for Snake, Sumo and Kart: each painted 30–31 frames after the error and continued painting after context restoration. These deliberately injected local rendering faults exercise the same renderer used online; they do not prove the cause of the user's particular black screen.

Online Snake at 400 ms RTT passed the turn replay with no blank snakes or large jumps. At 1400 ms RTT, it painted at 60 FPS with no blank snakes, but one authoritative route correction moved the own snake about 1.33 cells. That limitation remains recorded in snake-1400.json rather than disguising it by drawing through an unconfirmed route. A slow connection still delays server-confirmed turns.

Automated regressions cover long Snake prediction, return-from-background playback, and animation-loop survival after a drawing exception. The previous published client assets are retained for already-open tabs. No room authority, game rules, or server deployment changes are required for this client release.

Validation: 476 automated tests and TypeScript checking passed. Hosted and Pages production builds passed, retaining 327 prior immutable assets.
