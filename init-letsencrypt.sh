#!/bin/sh
set -e

domains="extractjsonpath.com www.extractjsonpath.com"
rsa_key_size=4096
email="subhankar102@gmail.com"
staging=0 # Set to 1 while testing to avoid Let's Encrypt rate limits

echo "============================================================"
echo " Let's Encrypt Bootstrap for: $domains"
echo "============================================================"

# Check if certificates already exist in the certs volume
existing_cert=$(docker compose run --rm --entrypoint "sh -c 'if [ -f /etc/letsencrypt/live/extractjsonpath.com/fullchain.pem ]; then echo yes; else echo no; fi'" certbot 2>/dev/null || echo "no")

if [ "$existing_cert" = "yes" ]; then
  echo "Existing certificate found in volume. Ensuring permissions and starting stack..."
  docker compose run --rm --entrypoint "chmod -R a+rX /etc/letsencrypt/live /etc/letsencrypt/archive" certbot
  docker compose up -d
  echo "Stack started successfully."
  exit 0
fi

# Stop any running web container to ensure host port 80 is completely free for standalone validation
echo "Stopping web container to free port 80..."
docker compose stop web 2>/dev/null || true

domain_args=""
for domain in $domains; do
  domain_args="$domain_args -d $domain"
done

case "$email" in
  "") email_arg="--register-unsafely-without-email" ;;
  *) email_arg="--email $email" ;;
esac

staging_arg=""
if [ "$staging" != "0" ]; then
  echo "--> Using Let's Encrypt staging server (dry-run/test mode)"
  staging_arg="--staging"
fi

echo "Requesting certificate from Let's Encrypt using standalone mode on port 80..."
docker compose run --rm -p 80:80 certbot certonly \
  --standalone \
  $staging_arg \
  $email_arg \
  $domain_args \
  --rsa-key-size "$rsa_key_size" \
  --agree-tos \
  --non-interactive

echo "Fixing volume permissions so nginx-unprivileged (UID 101) can read certificates..."
docker compose run --rm --entrypoint "chmod -R a+rX /etc/letsencrypt/live /etc/letsencrypt/archive" certbot

echo "Starting web and certbot services..."
docker compose up -d

echo "============================================================"
echo " Bootstrap complete! Services are up."
echo " Check status with: docker compose ps"
echo " Test with: curl -Iv https://extractjsonpath.com"
echo "============================================================"
