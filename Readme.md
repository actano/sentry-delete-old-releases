# Delete old sentry releases

This module deletes releases older than a number of days. It is meant to be run periodically on a server.

## Environment

The following variables need to be exported in the environment. We recommend [Vault](https://www.vaultproject.io/) by HashiCorp to manage your secrets.

* `SENTRY_BASE_URL`, usually `https://sentry.yourdomain.com`
* `SENTRY_TOKEN`, needs `org:write` scope
* `SENTRY_ORGANIZATION`

