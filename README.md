# satiricalguru — portfolio v2

Pixel-art portfolio for Jatin Pandey. Next.js 16 (Cache Components), Tailwind 4, Motion, Lenis.

- Interactive pixel name, a photo that sharpens around the cursor, a reactive dot grid, a custom cursor
- An original pixel cat that follows you, sleeps, grooms, pounces and purrs
- Live GitHub data: contributions, stars, merged upstream PRs, a year-of-commits river with koi
- LeetCode stats
- GitHub Sponsors wall in pixel art, refreshed instantly by webhook

## Env

| Variable | Purpose |
| --- | --- |
| `GITHUB_TOKEN` | Fine-grained or classic token with `read:user` (sponsors, contributions) |
| `SPONSORS_WEBHOOK_SECRET` | Secret shared with the GitHub Sponsors webhook |

Webhook URL: `https://<domain>/api/sponsors/webhook` (content type `application/json`, sponsorship events).

Pixel avatar: drop the image at `public/img/avatar.png`; the portrait falls back to `public/img/me.jpg`.
