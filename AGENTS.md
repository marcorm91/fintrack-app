# Fintrack — contribution guidelines

## Git and pull request workflow

- Always start a new task from up-to-date `main`.
- Create one branch and one pull request per change. Never reuse or modify a merged or closed PR.
- Before opening a PR, ensure the branch contains no unrelated commits or changes.
- Every PR must explain what changed, what was validated, and any relevant decisions.
- Run `npm run check` before requesting a PR and fix failures related to the change.
- Review references, imports, hooks, types, translations, and files left unused. Remove residual code in the same PR when it is safe to do so.
- Do not force-push or rewrite history unless explicitly instructed.

## Commit convention

Write every commit message in English. Use a short, descriptive message with a required scope:

```text
Type(scope): lower-case subject
```

Allowed types:

- `Feat`: new functionality.
- `Fix`: bug fix.
- `Refactor`: internal improvement with no functional change.
- `Docs`: documentation.
- `Test`: tests.
- `Chore`: maintenance, configuration, or dependencies.
- `Style`: formatting or styling without logic changes.

Examples:

```text
Feat(monthly-recap): simplify monthly comparison
Fix(settings-dialog): correct nested modal layer
Refactor(insights): remove unused monthly hook
Docs(readme): update release links
Chore(release): prepare version 3.1.0
```

Commitlint and Husky enforce this format on every commit. The scope is mandatory.

## Releases

- Update the version only when the change will be published as a release.
- For a release, keep `package.json`, `package-lock.json`, `src-tauri/Cargo.toml`, `src-tauri/Cargo.lock`, `src-tauri/tauri.conf.json`, and `README.md` aligned.
- Update release links and copy in the README.
- Create and publish the tag only after merging the PR into `main`.
- Never modify or reuse a published tag; prepare a later version instead.

## Product and quality

- Fintrack is a simple, private, local-first app. Avoid complexity that does not add clear value.
- Prioritize mobile, accessibility, and a clear interface over adding more data or cards.
- Use clear, human language. Avoid technical jargon, percentages, and redundant metrics in the main view.
- Keep detailed information available on demand when useful.
- If a change is visual, do not alter financial logic, saved data, or import/export flows.
- Check empty states, error flows, and dialogs, especially on mobile.
