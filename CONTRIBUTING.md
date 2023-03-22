# Contributing to gira-de/svelte-undo

## Bugs

For bug tracking we use [GitHub Issues](https://docs.github.com/en/issues). When creating a new bug entry, please abide by the following:

- First check if an issue has already been created by someone else for the bug.
- One issue, one bug.
- Provide steps on how to reproduce the bug.

## RFC

If you plan on making major changes to the project or to add new features, please create an RFC (request for comment) to discuss this in advance.

## Release Workflow

0. (Optional CS) During development generate changesets with `npx changeset`
1. (Optional PR) Checkout a new branch from main: `x.x.x-release`
2. (Optional CS) Apply changesets `pnpm changeset version`
3. Review/Update [package.json](): version should be incremented
4. Review/Update [CHANGELOG.md](): shall contain meaningful not too technical descriptions
5. Commit changes with commit message: `chore: release package`
6. Push
7. (Optional PR) Create a pull request for the new release.

Once the commit is on the main branch a new release is created.
