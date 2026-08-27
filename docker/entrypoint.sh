#!/bin/sh
set -e

# Basic auth optionnelle — pattern Mazanoke : si USERNAME ET PASSWORD sont renseignés,
# le shell SPA est protégé. Les assets restent publics : l'app est 100% client-side,
# aucune donnée utilisateur ne transite par le serveur (PLAN §1).
#
# Note : la protection s'applique au shell /index.html, qui est aussi la cible des
# redirections SPA (try_files) → toutes les navigations passent par l'auth.

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