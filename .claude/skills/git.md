# Git Rules

## Branch Naming

```
feat/rpm-gauge-svg
feat/v8-preset
fix/oscillator-gain-spike
fix/mobile-throttle-touch
refactor/audio-engine-cleanup
chore/upgrade-next-15
docs/update-audio-engine-rules
```

Format: `type/short-kebab-description`  
Max length: 50 characters.  
Never: `my-branch`, `fix-stuff`, `test`, `wip`.

## Commit Format (Conventional Commits)

```
<type>(<scope>): <short description>

[optional body]

[optional footer]
```

**Types:**
| Type | When |
|------|------|
| `feat` | New feature or capability |
| `fix` | Bug fix |
| `refactor` | Code change with no behavior change |
| `perf` | Performance improvement |
| `test` | Adding or fixing tests |
| `chore` | Tooling, deps, config |
| `docs` | Documentation only |
| `style` | Formatting, no logic change |

**Scopes** (use these exactly):
`engine`, `oscillator`, `noise`, `filter`, `preset`, `gauge`, `throttle`, `oscilloscope`, `spectrum`, `hooks`, `store`, `ui`, `tooling`, `ci`, `deps`

**Examples:**
```
feat(engine): add V12 harmonic preset with 6-cylinder pairing
fix(oscillator): prevent gain spike on AudioContext cold start
perf(spectrum): reduce AnalyserNode FFT size from 4096 to 2048
refactor(hooks): extract RPM interpolation to dsp.utils
test(engine): add coverage for redline limiter clamping
chore(deps): upgrade next to 15.2.0
```

**Rules:**
- Subject line max **72 characters**.
- No period at the end of subject.
- Use imperative mood: "add", "fix", "remove" — not "added", "fixed", "removed".
- Body explains *why*, not *what*. The diff shows what.

## Workflow

```
main              ← protected, always deployable
  └── feat/xyz    ← feature branch from main
  └── fix/abc     ← bug fix branch from main
```

- Branch from `main`. Always.
- Open a PR to merge back to `main`.
- Squash commits on merge for feature branches. Merge commit for releases.
- Delete branch after merge.

## PR Rules

- PR title must follow commit format: `feat(gauge): add spring-physics needle animation`
- PR description must include:
  - What changed and why
  - How to test locally
  - Screenshots/recordings for any UI changes
- All CI checks must be green before merge.
- No self-merging. At least one review (even if solo project — use review as a checklist pass).

## What Never Goes in a Commit

- `.env.local` or any file with secrets
- `node_modules/`
- `*.log` files
- Build output (`/.next/`, `/out/`)
- OS files (`.DS_Store`, `Thumbs.db`)
- IDE config (`.vscode/settings.json`, `.idea/`) — unless team agrees to track shared settings

`.gitignore` must cover all of the above from day one.