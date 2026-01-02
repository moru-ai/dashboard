# Moru Dashboard

> When you make changes to this file, sync to CLAUDE.md.

Next.js dashboard for Moru (moru.io) - cloud platform for secure code execution.

## Package Management

**Always use frozen lockfile when installing packages:**

```bash
bun install --frozen-lockfile
```

This prevents accidental package upgrades that can cause type errors or breaking changes.

**When adding/removing packages:**

```bash
bun add <package>          # Add a package
bun remove <package>       # Remove a package
```

**Do NOT use:**
- `bun install` without `--frozen-lockfile` (can upgrade packages)
- `rm bun.lock && bun install` (will upgrade all packages)

## Development

```bash
bun run dev       # Start dev server
bun run build     # Production build (run outside sandbox)
bun run lint      # Run ESLint
bun run lint:fix  # Run ESLint with auto-fix
bun run format    # Run Prettier
bun run typecheck # Type check without building
```

**Important:** Run `lint`, `format`, and `typecheck` regularly during code changes, not in bulk at the end. Fix issues as you go.

## Testing

```bash
bun run test:unit         # Unit tests
bun run test:integration  # Integration tests
bun run test:e2e          # End-to-end tests
```

## Project Structure

- `src/app/` - Next.js app router pages
- `src/features/` - Feature modules
- `src/server/` - Server actions and API logic
- `src/lib/` - Shared utilities and clients
- `src/ui/` - UI components
