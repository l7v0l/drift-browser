# Contributing to Drift

Thanks for helping. Drift aims to stay small, fast and easy to read, so please keep changes focused.

## Setup

```bash
git clone https://github.com/l7v0l/drift-browser.git
cd drift-browser
npm install
npm run dev
```

Node.js 22+ is required. Read [ARCHITECTURE.md](ARCHITECTURE.md) first: it explains the layout, the IPC contract and the security model.

## Before you open a pull request

```bash
npm run typecheck
npm run lint
npm test
```

CI runs the same three commands.

## Guidelines

- **One change per PR.** Small PRs get reviewed faster.
- **Put pure logic in testable modules** and add a Vitest test in `tests/`.
- **Both languages.** New UI text goes in `ar.json` and `en.json`. Check the layout in RTL.
- **IPC changes** start in `src/shared/ipc-types.ts`. Do not widen what drift:// pages may call (`PAGE_INVOKE_CHANNELS`) without a reason in the PR description.
- **No new heavy dependencies** without discussing it first. Startup time and memory are features.
- **Never commit secrets** (`.env`, OAuth client secrets, tokens).

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/):

```
feat(tabs): add tab search
fix(find): ignore stale results
docs: update roadmap
```

Types: `feat`, `fix`, `docs`, `refactor`, `test`, `chore`, `perf`, `build`, `ci`.

## Reporting bugs

Open an issue with your OS, Drift version (`drift://about`), steps to reproduce, and what you expected.

## Releasing (maintainers)

```bash
npm version <patch|minor|major>   # updates package.json and creates the v* tag
git push --follow-tags
```

The `release` workflow builds the installer and portable exe and publishes them, with the auto-update metadata, to GitHub Releases.

## License

By contributing you agree that your contributions are licensed under the [MIT License](LICENSE).
