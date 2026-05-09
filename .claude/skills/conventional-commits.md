---
name: Conventional Commits Helper
description: Format and validate commit messages following https://www.conventionalcommits.org/en/v1.0.0/
---

# Conventional Commits Helper

Use this when preparing commit messages to ensure they follow the standard format.

## Format

```
type(scope): subject

optional body

optional footer
```

### Types
- **feat** — A new feature
- **fix** — A bug fix
- **docs** — Documentation only
- **style** — Code style (formatting, semicolons, etc., no logic change)
- **refactor** — Code refactor (no feature or bug fix)
- **perf** — Performance improvement
- **test** — Add or update tests
- **chore** — Build, deps, tooling (no production code change)
- **ci** — CI/CD configuration

### Rules
1. Type is **required**, scope is optional (use when change is localized)
2. Subject is **required** — imperative mood ("add" not "added"), lowercase, no period, under 50 chars
3. Body is optional — wrap at 72 chars, explain WHY not WHAT
4. Footer is optional — reference issues ("Fixes #123"), breaking changes ("BREAKING CHANGE:")
5. Blank line between subject and body; blank line before footer

## Examples

**Simple fix:**
```
fix: prevent racing condition in request handler
```

**Feature with scope:**
```
feat(auth): add JWT token refresh mechanism
```

**With body:**
```
feat(payments): add Stripe webhook support

Integrates Stripe's webhook system for real-time payment status updates.
Allows customers to receive instant confirmation of successful transactions.

Fixes #456
```

**Breaking change:**
```
feat!: redesign API response structure

BREAKING CHANGE: response envelope changed from { data, meta } to { result, metadata }
```

## How to use

1. Before asking the user to commit, I'll draft a message using this format
2. Check subject is under 50 chars, lowercase, imperative
3. If there's a body, explain the WHY (motivation, context, trade-offs)
4. If the change is breaking, use `!` after type or add BREAKING CHANGE footer
5. Present to user for approval

## Scope guidelines

- **Use scope if:** the change is isolated to one subsystem (auth, payments, api, etc.)
- **Skip scope if:** the change touches multiple areas or is a global refactor

## Invalid examples (don't do these)

- ❌ `add new feature` — missing type
- ❌ `Fix: uppercase F and colon` — capitalize only subject
- ❌ `feat(everything): refactored the codebase` — scope too broad
- ❌ `feat: Added JWT support.` — past tense, has period
- ❌ `feat: This is a very long subject line that exceeds fifty characters` — too long
