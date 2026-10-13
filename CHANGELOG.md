# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

## [0.3.0] - 2026-10-13

### Added

- Themes: Default, GitHub, Paper and Dracula. Readers pick one from the sidebar and the choice is remembered in their browser.
- `--theme <name>` sets the theme a reader starts with.
- ADRs without frontmatter get their status and date from the body, as written by adr-tools (`## Status` section, `Date:` line), MADR 2 and log4brains (`* Status:` and `* Date:` bullets).
- Linked decisions: `Supersedes` / `Superseded by` (and adr-tools' `Amends` and `Clarifies`) show as links at the top of each ADR, from frontmatter or the Status section, and are linked both ways. The index shows what replaced a superseded decision.

## [0.2.0] - 2026-10-13

### Added

- `--help` and `--version` flags.
- If the default port 4321 is taken, the reader moves on to the next free port.

### Fixed

- An ADR with invalid YAML frontmatter no longer crashes the server. It's shown with a warning instead.
- Unknown options are reported instead of silently starting a server.
- The usage hint now says `npx adr-reader` instead of `npx adr`.
- Symlinks that point outside the ADR folder are no longer served.

### Changed

- Rewritten in TypeScript. The package now ships compiled JavaScript from `dist/`.

## [0.1.0]

- First release.

[Unreleased]: https://github.com/jmscarpa/adr-reader/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/jmscarpa/adr-reader/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/jmscarpa/adr-reader/compare/c73d47b...v0.2.0
[0.1.0]: https://github.com/jmscarpa/adr-reader/commit/c73d47b
