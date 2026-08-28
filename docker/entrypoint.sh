#!/bin/sh
set -e

# Optional basic auth — Mazanoke pattern: if USERNAME AND PASSWORD are set,
# the SPA shell is protected. Assets stay public: the app is 100% client-side,
# no user data transits through the server.
#
# Note: the protection applies to the /index.html shell, which is also the target
# of the SPA redirects (try_files) → all navigations go through auth.

if [ -n "$USERNAME" ] && [ -n "$PASSWORD" ]; then
  echo "Pictiúr: enabling basic auth for '$USERNAME'"
  htpasswd -bc /etc/nginx/.htpasswd "$USERNAME" "$PASSWORD" >/dev/null
  printf 'auth_basic "Pictiúr";\nauth_basic_user_file /etc/nginx/.htpasswd;\n' > /etc/nginx/auth.conf
else
  echo "Pictiúr: no credentials set, running without auth"
  rm -f /etc/nginx/.htpasswd
  : > /etc/nginx/auth.conf
fi

exec nginx -g 'daemon off;'