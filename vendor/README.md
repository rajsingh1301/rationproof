# Offline package sources

This environment cannot reach the npm registry. These two unchanged TanStack 8.21.3 packages were packed from the existing `~/developer/corsair/node_modules/.pnpm/` installation using `npm pack`. They include upstream licenses and are used through explicit local package references so a clean install does not depend on another project's folder.

- `tanstack-react-table-8.21.3.tgz`: `@tanstack/react-table`.
- `tanstack-table-core-8.21.3.tgz`: its table engine, `@tanstack/table-core`.

Other dependencies use cached registry packages. The lockfile records exact versions and integrity. No third-party implementation was fabricated.
