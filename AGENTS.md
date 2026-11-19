# Working on Fieldwork

- **Authorization:** Commit only when explicitly requested. Publishing and other remote changes require explicit user instructions.
- **Collaboration:** Follow the user's direction. If a local `STATUS.md` exists, use its collaboration guidance and current work notes. For substantial changes, record the agreed scope and verification, and preserve unfinished work across handoffs.
- **Product:** Follow the [product priorities](library/index.md#product-priorities): rich, understandable internal desktop workflows. Responsive polish and dedicated assistive-technology work are optional unless requested.
- **Architecture:** Preserve semantic HTML, native/server-rendered use and optional JavaScript enhancement.
- **Boundaries:** Keep application behavior outside `library/`. Maintain reusable demonstrations in `examples/`. Keep application scenarios out of test harnesses.
- **Browser automation:** Run Playwright and other browser automation headlessly by default, including when capturing screenshots for visual review. Use headed mode only when diagnosis depends on a live visible window or interactive behavior that cannot be understood headlessly, and state the reason before starting it.
- **Validation:** Follow [DEVELOPMENT.md](DEVELOPMENT.md). Cover important failure modes once; add another layer only for a distinct integration boundary. Review desktop task completion, keyboard efficiency, recovery, Turbo and native fallback; follow the review scope in DEVELOPMENT.md.
