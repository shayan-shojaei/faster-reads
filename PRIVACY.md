# Privacy Policy

Effective August 9, 2026

Faster Reads is designed to work without collecting your browsing activity or page content. It has no accounts, advertising, analytics, crash reporting, or remote code.

## Data stored by the extension

Faster Reads uses Chrome Sync to store:

- The origins and path patterns where you saved reading sections.
- CSS selectors and labels needed to find those sections again.
- Whether each rule is enabled and when it was created or updated.
- Reading intensity and whether optional update checks are enabled.

Chrome, not the Faster Reads maintainer, operates the sync service. Local Chrome storage holds only update-check timestamps and the latest version you acknowledged.

## Network activity

Page text, browsing history, saved selectors, and settings are never sent to the maintainer or an analytics provider.

Optional update checks are disabled by default. If you explicitly enable them, Chrome asks for access to `https://shayan-shojaei.github.io/*`. Once per day, Faster Reads requests the public `version.json` file from that site. The request reveals ordinary connection information such as your IP address and user agent to GitHub Pages under GitHub’s privacy terms, but contains no Faster Reads settings or page data.

## Permissions

- **activeTab** and **scripting:** run the picker on the page where you click the extension.
- **storage:** save settings and selected sections.
- **alarms:** schedule an opted-in daily update check.
- **Optional site access:** reapply saved formatting only on origins you approve.

Faster Reads does not run on Chrome internal pages or other unsupported URLs.

## Control and deletion

You can disable or delete rules, revoke individual site permissions, or disable update checks from the Options page. Uninstalling Faster Reads removes local extension data. Synced data can also be managed through your Chrome profile’s sync controls.

## Changes and contact

Material policy changes will be documented in a GitHub release. Questions can be opened in the project’s [issue tracker](https://github.com/shayan-shojaei/faster-reads/issues).
