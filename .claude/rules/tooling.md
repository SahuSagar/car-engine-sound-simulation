# Tooling Rules

## ESLint Config (.eslintrc.json)

```json
{
  "extends": [
    "next/core-web-vitals",
    "plugin:@typescript-eslint/recommended-type-checked",
    "plugin:@typescript-eslint/stylistic-type-checked"
  ],
  "parser": "@typescript-eslint/parser",
  "parserOptions": {
    "project": true
  },
  "rules": {
    "@typescript-eslint/no-explicit-any": "error",
    "@typescript-eslint/no-non-null-assertion": "error",
    "@typescript-eslint/explicit-function-return-type": "error",
    "@typescript-eslint/consistent-type-imports": ["error", { "prefer": "type-imports" }],
    "@typescript-eslint/no-unused-vars": ["error", { "argsIgnorePattern": "^_" }],
    "no-console": ["error", { "allow": ["warn", "error"] }],
    "prefer-const": "error"
  }
}
```

## Prettier Config (.prettierrc)

```json
{
  "semi": true,
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

No debates. This is the config. `pnpm lint --fix` resolves all auto-fixable issues.

## package.json Scripts

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build",
    "start": "next start",
    "typecheck": "tsc --noEmit",
    "lint": "next lint",
    "lint:fix": "next lint --fix",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "test": "vitest",
    "test:run": "vitest run",
    "test:coverage": "vitest run --coverage",
    "test:ui": "vitest --ui"
  }
}
```

## Dev Dependencies

```json
{
  "devDependencies": {
    "@testing-library/jest-dom": "^6.x",
    "@testing-library/react": "^15.x",
    "@testing-library/user-event": "^14.x",
    "@types/node": "^20.x",
    "@types/react": "^19.x",
    "@typescript-eslint/eslint-plugin": "^7.x",
    "@typescript-eslint/parser": "^7.x",
    "@vitejs/plugin-react": "^4.x",
    "@vitest/coverage-v8": "^1.x",
    "@vitest/ui": "^1.x",
    "eslint": "^8.x",
    "eslint-config-next": "^15.x",
    "jsdom": "^24.x",
    "prettier": "^3.x",
    "typescript": "^5.x",
    "vite-tsconfig-paths": "^4.x",
    "vitest": "^1.x",
    "worker-loader": "^3.x"
  }
}
```

## Pre-commit Hook (via simple-git-hooks + lint-staged)

```json
{
  "simple-git-hooks": {
    "pre-commit": "pnpm lint-staged"
  },
  "lint-staged": {
    "*.{ts,tsx}": ["eslint --fix", "prettier --write"],
    "*.{css,json,md}": ["prettier --write"]
  }
}
```

Install: `pnpm add -D simple-git-hooks lint-staged` then `pnpm simple-git-hooks`.

## CI Pipeline (GitHub Actions)

`.github/workflows/ci.yml`:

```yaml
name: CI

on: [push, pull_request]

jobs:
  check:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
        with: { version: 9 }
      - uses: actions/setup-node@v4
        with: { node-version: 20, cache: 'pnpm' }
      - run: pnpm install --frozen-lockfile
      - run: pnpm typecheck
      - run: pnpm lint
      - run: pnpm test:run
      - run: pnpm build
```

All 5 steps must pass before merge. No exceptions.

## Node / pnpm Versions

Pin versions in `.nvmrc` and `package.json#engines`:

```json
{
  "engines": {
    "node": ">=20.0.0",
    "pnpm": ">=9.0.0"
  }
}
```

`.nvmrc`:

```
20
```
