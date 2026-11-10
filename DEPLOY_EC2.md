# Deploy CodeArena to EC2

This setup runs the Next.js app in Docker on an Ubuntu EC2 instance. Firebase,
Resend, and Gemini remain external services; this does not migrate their data
or accounts to AWS.

## 1. Prepare the EC2 instance

Use a supported Ubuntu LTS AMI. Choose an instance size appropriate for your
traffic and build process. Attach an Elastic IP if you want a stable public IP.

In the instance security group, allow:

- TCP 80 and 443 from the internet.
- TCP 22 only from your own IP address (or use AWS Systems Manager Session
  Manager instead of public SSH).

Do not expose port 3000 publicly. The Compose configuration binds it to
localhost for Nginx.

Install Docker Engine, the Docker Compose plugin, and Nginx using the current
official instructions for your Ubuntu release. Then clone the repository onto
the instance and enter its project directory.

## 2. Configure runtime values and Firebase credentials

Create `.env.production` from `.env.production.example`, then fill in the
Firebase web configuration and any keys needed by enabled Gemini or email
features. Treat this file as sensitive and do not commit it. The Firebase web
API key is included in client-side code; it is not a server secret.

Place the Firebase Admin service-account JSON outside the repository at:

`/opt/codearena/secrets/firebase-service-account.json`

Restrict access to the key and make it readable by the container's `node`
group (GID 1000):

```bash
sudo install -d -o root -g 1000 -m 0750 /opt/codearena/secrets
sudo install -o root -g 1000 -m 0440 /path/to/firebase-service-account.json \
  /opt/codearena/secrets/firebase-service-account.json
```

Transfer the JSON over a secure channel. Never bake it into the Docker image or
put it in the repository. Compose mounts the file as a BuildKit secret for the
Next.js build and read-only at runtime; it is not copied into an image layer.

## 3. Build and start the app

From the project directory, after `.env.production` and the credential file are
in place:

```bash
sudo docker compose --env-file .env.production up -d --build
sudo docker compose ps
curl -I http://127.0.0.1:3000
```

The public Firebase configuration is passed to the image build because Next.js
embeds `NEXT_PUBLIC_*` values in browser bundles. Changing those values later
requires rebuilding the image. Server-only keys are loaded at container
runtime.

## 4. Configure Nginx and HTTPS

Create an Nginx site for your domain and proxy requests to `http://127.0.0.1:3000`.
Preserve the `Host`, `X-Forwarded-For`, and `X-Forwarded-Proto` headers, and
enable HTTP/1.1 upgrade headers for WebSocket-compatible requests. Validate and
reload Nginx, then issue a TLS certificate with Certbot (or use an AWS-managed
load balancer and certificate instead). Point your DNS A/AAAA records to the
instance's Elastic IP when using EC2-hosted Nginx.

## 5. Verify the deployment

Test sign-in, session persistence, Firestore-backed pages and APIs, email, AI
features, and code-run flows as applicable. Check application logs with:

```bash
sudo docker compose logs --tail=100 app
```

The current code runner executes submitted JavaScript on the app host. A
non-root Docker container is useful defense-in-depth, but is not a dedicated
sandbox for hostile code. Before accepting public submissions, move execution
to a separately isolated worker service and restrict its network and resource
access.
