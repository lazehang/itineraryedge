# Versioning and releases

ItineraryEdge uses [Changesets](https://github.com/changesets/changesets) to manage semver and changelog entries. **Packages are not published to npm**; releases are [GitHub Releases](https://docs.github.com/en/repositories/releasing-projects-on-github/about-releases) created when a `v*` tag is pushed.

## Version model

- **Starting version:** `0.1.0` (single public version for the whole repo).
- **Fixed group:** these packages always share one version:
  - `itineraryedge` (repo root)
  - `@itineraryedge/web`
  - `@itineraryedge/shared`
  - `@itineraryedge/core-worker`

Configuration lives in [`.changeset/config.json`](../.changeset/config.json).

## Adding a changeset

Include a changeset in PRs that should appear in the next release notes (features, fixes, breaking changes, notable docs, etc.).

From the repository root:

```bash
pnpm install
pnpm changeset
```

Choose **patch**, **minor**, or **major**, then write a short summary for the changelog. Commit the new file under `.changeset/` with your PR.

You do not need a changeset for internal refactors or CI-only changes unless you want them called out in release notes.

## Version Packages pull request

When changesets land on `main`, the [Version Packages](../.github/workflows/changesets-version.yml) workflow opens or updates a pull request titled **Version Packages**. That PR:

1. Runs `pnpm version-packages` (`changeset version`).
2. Bumps all fixed-group package versions together.
3. Updates `CHANGELOG.md` at the repo root and removes consumed changeset files.

Review and merge the Version Packages PR when you are ready to prepare a release. **Merging it does not create a GitHub Release by itself.**

## GitHub Releases (tags only)

After the Version Packages PR is merged, create and push an annotated or lightweight tag matching the new version, for example:

```bash
git tag v0.1.1
git push origin v0.1.1
```

The [GitHub Release](../.github/workflows/github-release.yml) workflow runs on pushes to tags matching `v*`. It creates a GitHub Release whose body is the matching section from root `CHANGELOG.md` (if present).

There is **no** npm publish step.

## First release (`v0.1.0`)

The first public GitHub Release **`v0.1.0`** is planned **after Audit-4** is complete. Do not tag `v0.1.0` until that milestone; this repo may already show `0.1.0` in `package.json` files as the initial development version.
