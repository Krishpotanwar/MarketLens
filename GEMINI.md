# MarketLens Workspace Guidelines

## Frontend Design & Polish
- For all frontend UI development, styling, and refactoring, strictly follow the rules in `.agents/rules/frontend-design.md`:
  - **`apple-ui-design`**: Apple Human Interface Guidelines, SF Pro typography hierarchy, translucent dark frosted glass (`rgba(14, 20, 32, 0.65)` with `backdrop-filter: blur(16px)`), 4/8/16/24/48px spacing rhythm, pill buttons, tactile press feedback.
  - **`responsive-design`**: Mobile-first responsive layouts, 44×44px minimum touch targets, zero horizontal overflow, fluid `clamp()` typography, and dynamic viewport height (`100dvh`).

## Development & Git Standards
- **Commit Authorship**: Always preserve all git commit authorship as `Krish Potanwar <kpotanwar@gmail.com>`.
- **Verification**: Always run `cd web && pnpm test && pnpm build` and verify cross-viewport fidelity with `node web/real_user_audit.mjs` before concluding tasks.
