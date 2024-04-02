# Contributing to gira-de/svelte-undo

## Bugs

For bug tracking we use [GitHub Issues](https://docs.github.com/en/issues). When creating a new bug entry, please abide by the following:

- First check if an issue has already been created by someone else for the bug.
- One issue, one bug.
- Provide steps on how to reproduce the bug.

## RFC

If you plan on making major changes to the project or to add new features, please create an RFC (request for comment) to discuss this in advance.

## Release Workflow

The CI will automatically create a new release when the package version (see [package.json](package.json)) has changed on the main branch.

The package version should be maintained by using [Changesets](https://github.com/changesets/changesets/blob/main/docs/intro-to-using-changesets.md). Although not recommended it is always possible to manually update the changelog und package version.

### Using Changesets (recommended)

1. The developer creates a new changeset for each bug-fix, feature, ... with `npx changeset`. Each changeset shall contain a meaningful not too technical description.
2. Everytime a new changeset appear on the main branch, the Changset-Bot updates the release branch by calling `npx changeset version`
3. To create a new release: review and merge the 'chore: release package' PR

### Manually updating package.json and changelog (NOT recommended)

1. Don't use this method if the main branch already contains changesets or run `npx changeset version` first
2. Update Version in [package.json](package.json)
3. Update [CHANGELOG.md](CHANGELOG.md): shall contain meaningful not too technical descriptions
4. Commit changes with commit message: `chore: release package`
5. To create a new release: review and merged the commit to the main branch
