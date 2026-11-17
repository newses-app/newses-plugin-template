# Newses plugin template

A repository to start a [Newses](https://newses.app) server plugin from: TypeScript, ESLint, Prettier, Vitest with the plugin API's test kit, the AGPL, and GitHub Actions that check every push and publish each version tag to npm with provenance. [Writing plugins](https://newses.app/guide/plugin-authors) covers hooks, the context, settings, limits, and versioning.

The example in `src/index.ts` counts the articles that arrive for each user and opens their digest with the count. Replace it with yours.

## Start

1. Create a repository from this template ("Use this template" on GitHub), and clone it.
2. In `package.json`, set `name` (the npm package operators install), `description`, and `repository`. In `src/index.ts`, set the plugin's `id`, `scopes`, `hosts`, `settings`, and `messages`, and write its hooks.
3. `npm install`, with Node 24.

| Command          | Does                                                                         |
| ---------------- | ---------------------------------------------------------------------------- |
| `npm test`       | The tests, which run hooks as the server does (`@newses/plugin-api/testing`) |
| `npm run check`  | Lint, typecheck, format check, and the tests                                 |
| `npm run format` | Format with Prettier                                                         |
| `npm run build`  | JavaScript and declarations in `dist/`, which is what npm publishes          |

`@newses/plugin-api` and `zod` are peer dependencies, provided by the server: keep them out of `dependencies`, or servers refuse the plugin. Other packages the plugin needs go in `dependencies`.

## Release

The plugin's `version` in `src/index.ts` and `package.json` must match; a test checks.

The first version is published by hand, as npm configures trusted publishing only for packages that exist:

1. Sign in to npm with two-factor authentication on: `npm login`.
2. `npm publish --access public` (it checks and builds first).
3. On npmjs.com, in the package's settings, add a trusted publisher: GitHub Actions, this repository, workflow `publish.yml`.

Every later version:

1. Raise `version` in `package.json` and `src/index.ts`, and commit.
2. Tag and push: `git tag v1.2.3 && git push origin main v1.2.3`.

The Publish workflow checks the tag is the package's version, then checks, builds, and publishes it with provenance, without a stored token.

## Installing

Operators install the plugin at an exact version: on Docker in `PLUGINS` with the plugins override ([Self-hosting](https://newses.app/guide/self-hosting#plugins)), on AWS in a stage's `plugins` in the deployment config ([Plugins](https://newses.app/guide/plugins)).

## Licence

AGPL-3.0-or-later, as Newses and its plugin API are. A plugin runs inside the server, so keep the AGPL or use a licence compatible with it.
