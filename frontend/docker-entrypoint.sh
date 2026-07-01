#!/bin/sh
set -e

# Start from the bundled Nginx config template so this script is idempotent.
cp /etc/nginx/conf.d/default.template /etc/nginx/conf.d/default.conf

# Runtime frontend config: expose the configured password to the UI.
# This is used by the app to gate add/edit/delete/config actions.
CONFIG_JS=/usr/share/nginx/html/config.js

if [ -n "$PASSWORD" ]; then
  printf 'window.__APP_CONFIG__ = %s;\n' "$(jq -n --arg password "$PASSWORD" '{password: $password}')" > "$CONFIG_JS"
else
  printf 'window.__APP_CONFIG__ = {};\n' > "$CONFIG_JS"
fi

exec nginx -g 'daemon off;'
