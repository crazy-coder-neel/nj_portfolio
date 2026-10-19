# Deploy to Vercel

This is a prerendered Next.js portfolio. It has no API routes, database, authentication service, contact-form backend, or required environment variables. Contact buttons open email, phone, or external profiles. Vercel handles hosting and HTTPS.

1. Push this project to your Git provider and import the repository into Vercel.
2. Select the repository root as the Root Directory and Next.js as the framework.
3. Use Node.js 22.x. The committed `vercel.json` sets `npm ci` and `npm run build`. Leave Output Directory at the framework default.
4. Deploy. Optionally enable Vercel Web Analytics in the project dashboard; the portfolio does not require it to work.
5. Check the deployed URL on desktop and mobile, then attach your domain in Vercel's project settings.

Do not upload `node_modules`, `.next`, private credentials, or `.env` files. The ignore files exclude these. The source media folders are not needed for hosting; all displayed images and the résumé are in `public/`.

## Local production check

```sh
npm ci
npm run typecheck
npm audit
npm run build
npm start
```

The build uses webpack, verified with this Next.js version, and fails on TypeScript errors. Commit `package-lock.json` with dependency changes; npm is the single package manager for this project.

For the automated browser regression check, run `npm start -- --port 3002`, then `node scripts/check-deployment.mjs` in another terminal. It requires local Google Chrome; override `CHROME_PATH` or `CHECK_URL` if needed. It checks production headers, local scene images, the résumé, mobile project expansion and filtering, card content in both scroll directions, and reduced motion. Screenshots are saved in a temporary directory.

## Security and maintenance

Security headers are defined in `next.config.mjs`, so local production checks and Vercel use the same policy. They disable framing, MIME sniffing, camera, microphone, and geolocation; restrict referrers; and limit loaded resources with Content Security Policy. Vercel manages transport security.

The static page requires inline Next.js hydration scripts, and GSAP requires inline styles, so the policy permits these. It does not permit production `eval` or arbitrary third-party scripts. If user-generated HTML, forms, authentication, or backend routes are added, revisit the threat model and CSP; this is not an assurance against all future vulnerabilities.

The dependency audit reported zero known vulnerabilities after removing the unused shadcn CLI dependency. Run `npm audit` periodically and review updates. Scene artwork is stored locally as optimized WebP files, avoiding reliance on the original remote image host.

## Behavior to verify after deployment

- Mobile: five projects initially; View more expands the current category; Show fewer and changing categories restore the short list. Desktop displays all projects.
- Cinematic cards: headings and descriptions reveal with incoming cards and contract with outgoing cards, including when scrolling backward.
- Reduced motion: all three journal panels display in normal flow with visible content.
- Navigation, project links, achievement previews, gallery controls, résumé download, and contact links remain usable.

## Final review — 20 October 2026

- Added the supplied NJ artwork as browser and Apple touch icons, including `/favicon.ico`.
- Applied reversible expansion/contraction to the main sections using stable scroll tracks; long sections retain normal scrolling.
- Moved achievement previews to a document-level portal so animated sections cannot clip them. Opening a preview locks page scrolling, focuses its close button, and makes the background inert; closing restores focus.
- Fresh npm audit: zero known vulnerabilities. Production build and TypeScript checks pass.
- Browser regression checks cover the favicon, every public asset, blocked private-file URLs, production headers, section readability, mobile project limits, filters, journal transitions, reduced motion, achievement previews, gallery controls, and mobile navigation.

The source review found no API endpoints, user-controlled HTML injection, or credential patterns in the shipped source/public assets. This review cannot guarantee immunity to every attack. Keep dependencies updated and protect your Vercel/Git accounts with MFA. After publishing, verify HTTPS and the response headers on your actual domain; platform settings and account access are outside the local build checks.
