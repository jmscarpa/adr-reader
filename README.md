# adr-reader

**A clean, local reader for your Architecture Decision Records.**

Point it at a folder of Markdown ADRs and get a browsable site on `localhost` in one command. It opens in your browser and reloads as you edit. No config, no build step, and nothing to add to your repo.

```sh
npx adr-reader docs/adr
```

```
ADR reader for /home/you/project/docs/adr
→ http://localhost:4321
```

---

## Why

ADRs are worth writing and hard to read. In a repo they're a pile of numbered `.md` files, and in GitHub's file view they lose any sense of context, status or order. adr-reader turns that folder into something you'd want to read: an index of every decision, its status at a glance, and a comfortable page for each one.

It reads your files as they are. You don't need a template, a static-site generator or a CI step.

## Features

- **Zero config.** Run it on any folder that contains `.md` files.
- **Index page.** Every decision in one table with its title, status and date.
- **Status badges.** `accepted`, `proposed`, `draft`, `rejected`, `deprecated` and `superseded` each get a color, so you can see at a glance what's in force.
- **Sidebar with instant filtering.** Press <kbd>/</kbd> and start typing.
- **Subdirectories.** Nested folders are picked up and grouped in the sidebar.
- **Frontmatter shown as metadata.** Fields such as `date`, `deciders` and `tags` appear as a tidy table above each ADR.
- **Working links and images.** `[ADR-0002](0002-foo.md)` links and `![diagram](arch.svg)` images resolve the same way they do in your repo.
- **Live reload.** Save an ADR in your editor and the open page updates on its own.
- **Opens your browser.** The reader opens as soon as the server starts. Pass `--no-open` to turn this off.
- **Previous/next navigation.** Read your decisions in order, start to finish.
- **Themes.** Pick Default, GitHub, Paper or Dracula from the sidebar. Your choice is remembered in the browser, and `--theme` sets the starting theme for everyone.
- **Light and dark mode.** Every theme follows your system setting, except Dracula, which is always dark. The layout also works on mobile.
- **Local only.** It listens on `127.0.0.1` and never serves files outside the folder you give it.

## Install

Run it on demand:

```sh
npx adr-reader path/to/docs/adr
```

Or add it to your project so the whole team gets a short `adr` command:

```sh
npm install --save-dev adr-reader
```

```json
{
  "scripts": {
    "adr": "adr docs/adr"
  }
}
```

```sh
npm run adr
```

To install it globally:

```sh
npm install -g adr-reader
adr docs/adr
```

> The bare `adr` command is available once the package is installed. With `npx`, use the full package name, `npx adr-reader`, because the `adr` name on npm belongs to a different project.

**Requires Node.js 20.1 or newer.**

## Usage

```sh
adr [directory] [--theme <name>] [--no-open]
```

| Argument / env | Default | Description                         |
| -------------- | ------- | ----------------------------------- |
| `directory`    | `.`     | Folder containing your ADRs         |
| `--theme`      | `default` | Starting theme: `default`, `github`, `paper` or `dracula` |
| `--no-open`    | off     | Don't open the browser on start     |
| `--help`, `-h` |         | Show usage                          |
| `--version`, `-v` |      | Show the installed version          |
| `PORT`         | `4321`  | Port to serve on                    |

If `4321` is taken, adr-reader moves on to the next free port. A port set with `PORT` is used as given.

```sh
PORT=8080 npx adr-reader docs/decisions --theme dracula --no-open
```

## Writing ADRs

adr-reader works with any Markdown file. It understands YAML frontmatter when it's there, but doesn't require it.

```markdown
---
title: Use PostgreSQL as the primary datastore
status: Accepted
date: 2026-01-10
deciders: [Ana, Bruno]
tags: [database, infrastructure]
---

## Context

We need a relational store that…

## Decision

We will use PostgreSQL…

## Consequences

…
```

### How fields are used

| Field          | Effect                                                                           |
| -------------- | -------------------------------------------------------------------------------- |
| `title`        | Page and sidebar title. Falls back to the first `# Heading`, then to the filename. |
| `status`       | Colored badge in the sidebar, index and page header.                             |
| `date`         | Shown in the index table.                                                        |
| anything else  | Listed in the metadata table at the top of the ADR.                              |

Files are ordered by path using natural sorting, so `0002` comes before `0010` and `adr-2` comes before `adr-10`. Number your files and they'll appear in order.

### Folder layout

A flat folder is the common case:

```
docs/adr/
├── 0001-record-architecture-decisions.md
├── 0002-use-postgresql.md
├── 0003-no-orm.md
└── diagrams/
    └── data-flow.svg
```

Nested folders work too, and each one becomes a section in the sidebar:

```
docs/adr/
├── backend/
│   └── 0001-use-postgresql.md
└── frontend/
    └── 0001-use-react.md
```

Hidden folders and `node_modules` are skipped.

### Images and attachments

Files referenced from your ADRs are served from the same folder: `png`, `jpg`, `gif`, `svg`, `webp` and `pdf`.

## Compatibility

adr-reader plays well with ADRs written by hand or generated by tools such as [adr-tools](https://github.com/npryce/adr-tools), [log4brains](https://github.com/thomvaill/log4brains) and the [MADR](https://adr.github.io/madr/) templates. If an ADR has no frontmatter, the title comes from its first heading and the badge is simply omitted.

## Security

adr-reader is a local development tool:

- It binds to `127.0.0.1` only, so it can't be reached from your network.
- Requests can't escape the folder you pass in, including through symlinks.
- Raw HTML inside your Markdown is rendered as-is. Don't point it at Markdown you don't trust.

## Development

```sh
git clone <repo-url> adr-reader
cd adr-reader
npm install          # also compiles src/ into dist/
node dist/cli.js path/to/some/adrs
```

The source is TypeScript in [`src/`](src), compiled with `tsc` into `dist/` (run `npm run build` after changes, or `npm run typecheck` to check types only). Tests use Node's built-in runner: `npm test` builds and runs everything in `test/`. It's built on Node's `http` and `fs.watch` (live reload uses server-sent events), [`gray-matter`](https://github.com/jonschlinkert/gray-matter) and [`marked`](https://github.com/markedjs/marked).

| File               | What it does                                   |
| ------------------ | ---------------------------------------------- |
| `src/cli.ts`       | Argument parsing, `--help`, `--version`        |
| `src/load.ts`      | Finds the Markdown files and reads frontmatter |
| `src/render.ts`    | HTML for the index, ADR and 404 pages          |
| `src/server.ts`    | HTTP server, static files and live reload      |
| `src/style.ts`     | The page's CSS and the themes                  |

To try the `adr` command globally from your checkout:

```sh
npm link
adr path/to/some/adrs
```

## Contributing

Issues and pull requests are welcome. The project aims to stay small: one command, no config, nothing generated in your repo. Please open an issue before starting on anything that would add options or dependencies.

## License

MIT
