# Changelog

All notable changes to this project are documented here. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/), and the project uses [Semantic Versioning](https://semver.org/).

## [Unreleased]

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
