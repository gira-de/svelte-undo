# Contributing to gira-de/svelte-undo

## Bugs

For bug tracking we use [GitHub Issues](https://docs.github.com/en/issues). When creating a new bug entry, please abide by the following:

- First check if an issue has already been created by someone else for the bug.
- One issue, one bug.
- Provide steps on how to reproduce the bug.

## RFC

If you plan on making major changes to the project or to add new features, please create an RFC (request for comment) to discuss this in advance.

## Release Workflow

The CI will automatically create a new release when the [package.json](package.json) has been changed on the main branch.

To update the [package.json](package.json) you have several options.

### Manually updating package.json and changelog

1. Update Version in [package.json](package.json)
2. Update [CHANGELOG.md](CHANGELOG.md): shall contain meaningful not too technical descriptions
3. Commit changes with commit message: `chore: release package`
4. Push

Once the commit is merged on the main branch a new release is created.

### Using Changesets

1. During development generate and push changesets with `npx changeset`
2. Changeset Bot will automatically create a release branch and a PR.
3. The release branch is automatically updated if the changesets changes
4. Review release PR or make changes to the PR
5. Merge PR

Once the PR is accepted a new release is created.
