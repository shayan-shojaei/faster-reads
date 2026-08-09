<p align="center">
  <img src="public/icon/128.png" width="96" height="96" alt="Faster Reads logo">
</p>

<h1 align="center">Faster Reads</h1>

<p align="center">Visual reading anchors for the parts of webpages you choose.</p>

<p align="center">
  <a href="https://github.com/shayan-shojaei/faster-reads/actions/workflows/ci.yml"><img alt="CI" src="https://github.com/shayan-shojaei/faster-reads/actions/workflows/ci.yml/badge.svg"></a>
  <a href="LICENSE"><img alt="MIT License" src="https://img.shields.io/badge/license-MIT-7c3aed"></a>
  <a href="https://shayan-shojaei.github.io/faster-reads/"><img alt="Website" src="https://img.shields.io/badge/website-install-7c3aed"></a>
</p>

Faster Reads is a privacy-conscious Chrome extension that bolds the beginning of words in selected page sections. Saved sections can reappear on future visits after you grant access to that specific site.

## Install the beta

1. Download the latest ready-built ZIP from the [Faster Reads website](https://shayan-shojaei.github.io/faster-reads/#install).
2. Unzip it into a permanent folder.
3. Open `chrome://extensions`, enable **Developer mode**, and click **Load unpacked**.
4. Select the extracted folder containing `manifest.json`, then pin Faster Reads.

Chrome 133 or newer is required. GitHub builds include SHA-256 checksums and build-provenance attestations.

## Use it

1. Open a regular `http` or `https` webpage.
2. Click the toolbar icon or press `Alt+Shift+B`.
3. Hover over a readable section and click it. Press Escape to cancel.
4. Allow access to that site if you want the selection to reapply on future visits.

The Options page lets you change emphasis intensity, edit path patterns, enable or disable saved rules, revoke site access, opt into update checks, and reopen the welcome guide.

## Privacy

There are no ads, accounts, analytics, crash reports, or remote code. Page content is never collected. Rules and preferences are stored using Chrome Sync; update checks are optional and disabled by default. See [PRIVACY.md](PRIVACY.md) for the complete data and permission disclosure.

## Development

Requirements: Node.js 24+ and npm 11+.

```sh
npm ci
npm run dev
```

Load `.output/chrome-mv3-dev` as an unpacked extension. Run the complete release gate with:

```sh
npm run check
```

The project uses [WXT](https://wxt.dev/) and Manifest V3. The background service worker manages the picker, runtime site access, registered content scripts, and update checks. Shared modules under `utils/` handle selectors, path rules, storage, text segmentation, DOM transformation, and version metadata.

See [CONTRIBUTING.md](CONTRIBUTING.md) before opening a pull request. Please report security problems through [GitHub private vulnerability reporting](https://github.com/shayan-shojaei/faster-reads/security/advisories/new).

## Trademark notice

“Bionic Reading” is a trademark of its respective owner. Faster Reads is an independent project and is not affiliated with, sponsored by, or endorsed by Bionic Reading.

## License

[MIT](LICENSE) © 2026 Shayan Shojaei
