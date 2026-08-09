import { defineConfig } from 'wxt';

export default defineConfig({
  manifest: {
    name: 'Faster Reads',
    short_name: 'Faster Reads',
    description:
      'Bold word beginnings in selected sections of webpages to create visual reading anchors.',
    version_name: '0.9.0 beta',
    homepage_url: 'https://shayan-shojaei.github.io/faster-reads/',
    key: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA3akNSoHU7QT4n4PU6PW8GIpcY3j8gz5FAcrI/coz+f7BO+mjPluT/b1U/sZ6RhpuRpNlg0+QYHlWxPYynTARKqZ3QTUWMTLcS5BKusGCD30lEWOuAmEhESCrIU2WOhDmLenY3iyXDVZBc04Te935P0z7z4iGYsvmn/TqEq0KLt9/sD35KCxvdCrs/cjtc4L/uftW4IsVEn3VE3QxYbUJA0OcPP+b2UWiqL7E597TTnhwXc9H9ePvbv3q8WOBxX6K9u6OKbUCu9s4SiTlEbMqkvqzyoWSCnCrE1shl405J3fJo01553geh7azqAHOOMGtW7Eb8xPXyZyW+7ZLKNwr8QIDAQAB',
    minimum_chrome_version: '133',
    permissions: ['activeTab', 'alarms', 'scripting', 'storage'],
    optional_host_permissions: ['http://*/*', 'https://*/*'],
    action: {
      default_title: 'Select a section for Faster Reads',
    },
    commands: {
      _execute_action: {
        suggested_key: {
          default: 'Alt+Shift+B',
          mac: 'Alt+Shift+B',
        },
        description: 'Select a section for Faster Reads',
      },
    },
  },
  hooks: {
    'build:manifestGenerated': (_wxt, manifest) => {
      // Runtime content scripts are registered only after the matching optional
      // origin permission is granted. WXT otherwise promotes their match list
      // to required host permissions.
      delete manifest.host_permissions;
    },
  },
});
