---
name: pull-request
description: |
  Create Pull Request & optionally run review. Creates a PR with a concise description,
  then asks the user if they want to run a review (and at what depth) based on PR size/complexity.
  Use when user asks to "create PR", "open PR", "make PR", "/pull-request", or when ready
  to submit changes for review.
author: Claude Code
version: 2.0.0
allowed-tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Task
  - Skill
---

# Create Pull Request

Create a PR with a concise description, then offer a review proportional to the PR's size.

## Phase 1: Gather Context

Run these commands to understand the PR scope:

```bash
# Determine target branch
TARGET="${CONDUCTOR_TARGET_BRANCH:-main}"

# Get commit history vs base branch
git log --oneline "$TARGET..HEAD"

# Get diff stats
git diff --stat "$TARGET...HEAD"

# Check if PR already exists
gh pr view 2>/dev/null || echo "No PR exists yet"
```

## Phase 2: Assess PR Size & Complexity

Classify the PR before proceeding:

| Size       | Files Changed | Complexity                          | Example                             |
| ---------- | ------------- | ----------------------------------- | ----------------------------------- |
| **Small**  | 1-5 files     | Config, docs, deps, simple fixes    | README update, dependency bump      |
| **Medium** | 5-15 files    | Feature work, refactors with tests  | New API endpoint, component rewrite |
| **Large**  | 15+ files     | Cross-cutting changes, architecture | New system, major refactor          |

**Skip CI checks (Phase 3) for Small PRs.** Only run them for Medium/Large.

## Phase 3: Run CI Checks (Medium/Large PRs only)

```bash
pnpm run typecheck &
pnpm run lint &
pnpm run test &
wait
```

**If any check fails, fix before proceeding.**

## Phase 4: Create/Update PR

### Title Format

Follow Conventional Commits: `<type>(<scope>): <subject>`

- **Allowed types:** `feat`, `fix`, `refactor`, `chore`, `docs`, `style`, `perf`, `test`
- **Scope:** Jira ticket number (e.g., `PH-1234`)
- **Subject:** lowercase, imperative mood (e.g., "add retry logic", "fix race condition")
- **Example:** `feat(PH-1234): add user profile endpoint`

### Body

Keep the description concise. Scale detail with PR size:

- **Small PRs:** 2-4 bullet points + test plan
- **Medium PRs:** Summary section + test plan
- **Large PRs:** Motivation, description, test plan, breaking changes

```markdown
## Summary

- Key change 1
- Key change 2

## Test plan

- [ ] Verification step 1
- [ ] Verification step 2
```

### Create the PR

```bash
# If no PR exists, create one
gh pr create --title "<title>" --body "<body>"

# If PR exists, update it
gh pr edit --title "<title>" --body "<body>"
```

## Phase 5: Offer Review

After creating the PR, **tell the user the PR is created** with the link, then suggest an appropriate review level:

### Small PRs (config, docs, deps)

> PR created: <link>
>
> This is a small config/docs PR. A full review is probably overkill.
> Run `/pr-review` if you want one anyway.

### Medium PRs (features, refactors)

> PR created: <link>
>
> This is a medium-sized PR. I'd recommend a review.
> Run `/pr-review` to kick off the Staff Engineer review.

### Large PRs (architecture, cross-cutting)

> PR created: <link>
>
> This is a large PR. I'd strongly recommend a review before merging.
> Run `/pr-review` to kick off the Staff Engineer review.

**Do NOT auto-run the review.** Let the user decide. They can always run `/pr-review` later.

## Important Rules

- **NEVER add "Generated with Claude Code", "Co-Authored-By: Claude", or AI attribution**
- **Don't auto-run review** — suggest it, let the user decide
- **Scale PR description to PR size** — a 3-file config change doesn't need 5 sections
- **Use `gh` CLI for diffs** — never use workspace diff MCP tools
