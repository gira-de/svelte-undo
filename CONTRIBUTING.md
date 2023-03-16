# Contributing to gira-de/svelte-undo

## Bugs

For Bug tracking we use GitHub Issues. Before creating a new bug entry please notice the following:

- Check if an issues for this bug has already been created by someone else.
- One issue, one bug.
- Provide steps on how the bug can be reproduced.

## RFC

If you plan to make major changes to the project or add new features, please create an RFC to discuss this in advance.

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
