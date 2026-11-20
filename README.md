# Dönerrat Marburg

Döner reviews, ratings, and photos from Marburg and Mittelhessen.

## Development

Use Node.js 22.22 or newer (Node.js 24 is used in CI).

```bash
npm ci
npm run dev
```

Open the local URL printed by Astro. Changes to pages and styles reload automatically.

```bash
npm run check    # Check Astro templates and TypeScript
npm run build    # Generate the static site in dist/
npm run preview  # Serve the production build locally
```

`npm run watch` is an alias for the development server.

## Project structure

```text
src/
  pages/          # Ranking, shop details, statistics, and legal pages
  layouts/        # HTML document, page metadata, and stylesheet
  components/     # Shared background and footer
  styles/         # Tailwind source and the existing custom styles
public/
  data/           # doener.json: official shop information and ratings
  stories/        # Markdown reviews
  images/         # Original photos, backgrounds, and graphics
  js/             # Existing ranking and Firebase browser scripts
  background/     # Asset license information
```

Astro generates static HTML. Tailwind builds the styles through Vite. The existing browser JavaScript still handles sorting, search, the image carousel, and Firebase community interactions. The shared templates use TypeScript for their props.

The ranking has mobile sorting controls, visible prices and visit dates, and filters for reviewed, upcoming, and closed restaurants. Official ranks stay fixed across search and sorting, with tied overall scores sharing a rank. `public/js/ranking.js` contains the shared status, date, and sorting logic; `npm run test:ranking` checks it.

For step-by-step instructions to add a review, edit ratings, add or delete a restaurant, and publish changes, read **[the review and restaurant guide](docs/REVIEWS.md)**. It includes a complete example, photo rules, a pre-publication checklist, and troubleshooting.

Run `npm run check:content` after content changes. It checks the JSON, field names, scores, duplicate restaurant names, exact review filenames, and photo numbering. `npm run check` includes this check, and CI runs it too.

## Hosting

The production output is `dist/`. The build keeps the current URLs, including `index.html`, `laden.html?name=…`, `stats.html`, `impressum.html`, and `datenschutz.html`. Static assets keep their existing URLs too.

The original repository currently publishes `main` from the repository root through GitHub Pages. **Before merging the Astro migration, switch Pages → Source to GitHub Actions.** Keeping the old source setting could publish an incomplete site because the HTML now needs to be built. After merging and passing checks, manually run **Deploy site** on `main`. This workflow is restricted to the original repository and never runs automatically, including for subsequent content updates. The check workflow validates changes without publishing them. Follow the [first-deployment and rollback guide](docs/DEPLOYMENT.md) for the full sequence. See also [Astro's GitHub Pages guide](https://docs.astro.build/en/guides/deploy/github/).

For a Pages preview under a repository subpath, build with the corresponding base:

```bash
ASTRO_BASE_PATH=/doener-rat/ npm run build
```

`public/CNAME` contains the existing production domain. Use that file only for the production deployment; omit it from a fork's Pages deployment.

## Migration scope

The initial Astro migration preserved the published site's layout, wording, photos, review files, and Firebase integration while adding shared templates, a development server, a production build, TypeScript checks, and CI. Subsequent feature branches remove the scrolling background reveal and add ranking controls, visit dates, and restaurant statuses.
