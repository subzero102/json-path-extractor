#!/bin/sh
set -e

domains="extractjsonpath.com www.extractjsonpath.com"
rsa_key_size=4096
data_path="./certbot"
email="subhankar102@gmail.com" # change this
staging=0 # set to 1 while testing to avoid rate limits

if [ -d "$data_path/conf/live/extractjsonpath.com" ]; then
  echo "Existing certificate found. Skipping bootstrap."
  exit 0
fi

if [ ! -f "$data_path/conf/options-ssl-nginx.conf" ] || [ ! -f "$data_path/conf/ssl-dhparams.pem" ]; then
  echo "Downloading recommended TLS parameters..."
  mkdir -p "$data_path/conf"
  curl -sSL https://raw.githubusercontent.com/certbot/certbot/master/certbot-nginx/certbot_nginx/_internal/tls_configs/options-ssl-nginx.conf > "$data_path/conf/options-ssl-nginx.conf"
  curl -sSL https://raw.githubusercontent.com/certbot/certbot/master/certbot/certbot/ssl-dhparams.pem > "$data_path/conf/ssl-dhparams.pem"
  echo
fi

echo "Creating dummy certificate for $domains..."
path="/etc/letsencrypt/live/extractjsonpath.com"
docker compose run --rm --entrypoint "\
  mkdir -p '$path' && \
  openssl req -x509 -nodes -newkey rsa:$rsa_key_size -days 1 \
    -keyout '$path/privkey.pem' \
    -out '$path/fullchain.pem' \
    -subj '/CN=localhost'" certbot
echo

echo "Starting nginx..."
docker compose up --force-recreate -d web
echo

echo "Deleting dummy certificate..."
docker compose run --rm --entrypoint "\
  rm -Rf /etc/letsencrypt/live/extractjsonpath.com; \
  rm -Rf /etc/letsencrypt/archive/extractjsonpath.com; \
  rm -Rf /etc/letsencrypt/renewal/extractjsonpath.com.conf; \
  true" certbot
echo

echo "Requesting Let's Encrypt certificate for $domains..."
domain_args=""
for domain in $domains; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

if [ $staging != "0" ]; then staging_arg="--staging"; fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $staging_arg \
    $email_arg \
    $domain_args \
    --rsa-key-size $rsa_key_size \
    --agree-tos \
    --force-renewal" certbot
echo

echo "Reloading nginx..."
docker compose exec web nginx -s reload
