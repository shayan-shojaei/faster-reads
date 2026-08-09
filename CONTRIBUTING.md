# Contributing

Thank you for helping improve Faster Reads.

## Before starting

- Search existing issues before opening a new one.
- Use the bug or feature-request template and keep reports free of private browsing data.
- For substantial behavior or permission changes, open an issue before implementation.
- Report vulnerabilities privately as described in [SECURITY.md](SECURITY.md).

## Development workflow

Use Node.js 24+ and npm 11+.

```sh
npm ci
npm run dev
```

Add or update tests for behavior changes. Before submitting a pull request, run:

```sh
npm run check
```

Use focused [Conventional Commit](https://www.conventionalcommits.org/) messages. Pull requests should explain the user-visible effect, privacy or permission implications, and manual Chrome verification performed.

By participating, you agree to follow [CODE_OF_CONDUCT.md](CODE_OF_CONDUCT.md).
