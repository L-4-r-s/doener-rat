# Adding reviews and maintaining the restaurant list

This guide is for the Astro version of Dönerrat with the ranking controls and status fields. Until these updates are merged into the shared project, the complete version is on `feat/ranking-usability`; use that branch or a branch based on it. The original version keeps `data/`, `stories/`, and `images/` at the repository root.

## Where each change goes

| You want to… | Edit these files |
| --- | --- |
| Add a reviewed restaurant | `public/data/doener.json`, one review in `public/stories/`, and optional photos in `public/images/` |
| Add a restaurant you have not reviewed yet | `public/data/doener.json` only |
| Change prices, scores, or the map | That restaurant's object in `public/data/doener.json` |
| Mark a restaurant reviewed, upcoming, or closed | Its `status` field in `public/data/doener.json`; keep `name` unchanged |
| Edit a written review | That restaurant's `.md` file in `public/stories/` |
| Add, replace, or remove photos | That restaurant's numbered `.jpg` files in `public/images/` |
| Review an existing restaurant again | Update its existing JSON object and review file; do not add a second object |
| Remove a restaurant from the site | Remove its JSON object; optionally remove its review and photos too |

**A restaurant's `name` currently connects everything.** It must match the review filename and photo prefix exactly, including capital letters, spaces, apostrophes, accents, and umlauts. It also identifies that restaurant's Firebase comments and user ratings. Keep it unchanged during ordinary edits.

For example:

```text
JSON name:    Beispiel Döner
Review:       public/stories/Beispiel Döner.md
First photo:  public/images/Beispiel Döner_1.jpg
Second photo: public/images/Beispiel Döner_2.jpg
```

Use real spaces and umlauts in filenames. Do not replace them with URL escapes such as `%20` or `%C3%B6`. The site encodes the URLs itself.

## 1. Start a content branch

### One-time setup for each contributor

Install Git and Node.js 22.22 or newer; the project CI uses Node.js 24. Sign in to your own GitHub account. For the fork workflow below, create a fork of [L-4-r-s/doener-rat](https://github.com/L-4-r-s/doener-rat) under that account if you do not already have one.

**Replace `YOUR_GITHUB_USERNAME` in every example with your own GitHub username.** In this workflow, contributors clone and push to their own forks. The shared project stays at `L-4-r-s/doener-rat`.

If you own the shared repository or already have write access, you can use it directly instead of creating a fork. In that case, replace `YOUR_GITHUB_USERNAME` with `L-4-r-s` in the clone command, push command, and pull request's head repository below. Still create a content branch and submit a pull request.

In a terminal, go to the folder where you want to keep projects, then clone your fork:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/doener-rat.git
cd doener-rat
```

You choose the parent folder; there is no required location on your computer. These commands work in a terminal on Windows, macOS, or Linux with Git and Node.js installed.

If you already have a checkout, skip cloning and open a terminal in that checkout's project root: the folder containing `package.json` and `README.md`. Its folder name may be different. You can confirm the root with:

```bash
git rev-parse --show-toplevel
```

All remaining commands run from that project root. All file paths in this guide, such as `public/data/doener.json`, are relative to that root.

### Start each content change

Check the current branch and whether there are unfinished changes:

```bash
git status --short --branch
```

If changed or untracked files appear, finish or save that work before switching branches. Do not discard changes to get a clean status.

**While the Astro and ranking updates are still being reviewed**, start from their complete feature branch. `JeremiaHenkel/doener-rat` is the temporary shared location of that branch; it is the same source for every contributor:

```bash
git fetch https://github.com/JeremiaHenkel/doener-rat.git feat/ranking-usability
git switch -c content/review-beispiel FETCH_HEAD
```

**After the Astro and ranking updates have been merged into the shared project's `main`**, use this instead:

```bash
git fetch https://github.com/L-4-r-s/doener-rat.git main
git switch -c content/review-beispiel FETCH_HEAD
```

Choose a new branch name for each change, for example `content/update-crunchy-price` or `content/remove-beispiel`. Run one of the two alternatives above, according to whether these updates have been merged.

Install dependencies when setting up a new checkout or after pulling a changed lockfile:

```bash
npm ci
```

Use your own GitHub account when Git asks you to authenticate. If you cannot push, check that the destination belongs to your account and that Git is authenticated as that account.

## 2. Add a new reviewed restaurant

### A. Add the restaurant to the list

Open `public/data/doener.json`. It is one array of restaurant objects:

```json
[
  { "name": "First restaurant" },
  { "name": "Second restaurant" }
]
```

Add one object inside the outer `[` and `]`. Separate objects with a comma. There must be no comma after the last object.

Here is a complete **fictional example** to copy and fill in. Replace the name, scores, visit date, and notes with your actual review before publishing:

```json
{
  "name": "Beispiel Döner",
  "status": "reviewed",
  "preis": "7.50",
  "geschmack": 7.5,
  "präsentation": 7,
  "übereinstimmung bestellung": 10,
  "menge": "500",
  "service": 8,
  "ambiente": 6.5,
  "layering": 7,
  "zeit": 8,
  "fleisch": 7.5,
  "brot": 7,
  "gemüse": 8,
  "sauce": 7,
  "gesamt": 7.4,
  "besonderheiten": {
    "positiv": ["Frisches Gemüse"],
    "negativ": [],
    "neutral": ["Nur Barzahlung"]
  },
  "subtitle": "",
  "datum": "18.10.2026",
  "mapsUrl": ""
}
```

Keep the field names exactly as shown, including `präsentation`, `gemüse`, and the space in `übereinstimmung bestellung`.

| Field | What to enter |
| --- | --- |
| `name` | Unique restaurant name in double quotes. Avoid changing it after publication. |
| `status` | `"reviewed"` = reviewed and active, `"pending"` = not reviewed yet, `"closed"` = closed. This controls the badge, filter, and ranking eligibility. |
| `preis` | Price in euros, e.g. `"7.50"`. No `€`, currency name, or decimal comma. |
| `menge` | Weight in grams, e.g. `"500"`. No `g` or `kg`. |
| All score fields | Numbers from 1 to 10, e.g. `7.5`, **without quotes**. Use a decimal point. Time and service also allow an explicitly awarded `0`. |
| `gesamt` | The Rat's overall score. Enter it yourself; the site does not calculate an average. A numeric `gesamt` makes the restaurant name clickable. |
| `zeit` | The waiting-time **score from 0 to 10**, not a number of minutes. Keep an explicitly awarded `0`; it is a real score, not a missing value. |
| `service` | The service score, including an explicitly awarded `0`. Include zeros when averaging; do not discard them as missing. |
| `besonderheiten` | Three lists: `positiv`, `negativ`, and `neutral`. Each item is text in double quotes. Use `[]` for an empty list. |
| `subtitle` | Optional short text below the restaurant name; `""` leaves it blank. |
| `datum` | Visit date as `"DD.MM.YYYY"`. Shown as “Besucht am …” in the list and on the detail page. |
| `mapsUrl` | Google Maps embed URL; use `""` if you do not have one. |

For an unmeasured category, price, or weight, use `"-"`. Do not invent a score. A restaurant without an overall score belongs in the unreviewed workflow below.

When combining the Rat's raw notes, average the available ratings within each category, giving each tester equal weight. Leave missing or unscored entries out of that category's denominator. Use actual euro prices and gram measurements instead of any additional price/quantity scores. The overall `gesamt` is the mean of the testers' personal overall scores, not the mean of the category scores. Store category means to one decimal, overall means to up to two decimals, and average weights rounded to whole grams. Keep the notes and calculation decisions in `docs/review-sources/`; the [Uni Döner calculation](review-sources/uni-doener-2026-07-24.md) is a worked example.

Do not guess unreadable measurements such as `42x g`; leave them out of the gram average until confirmed and record the omission in the source notes. A bare price score such as `10/10` is not a euro amount. Map an explicit “Bestellung: ja” to 10 for order accuracy. Use a tester's final corrected overall score when the notes contain a revision.

An actual wait such as “7 min 30 s for four orders” is not itself a time score. Ask for the score or omit that entry from the time-score average. Keep the measured wait separately in the notes. Likewise, someone who ordered without meat has no meat/filling score; a blank entry is not zero.

JSON rules:

- Use ordinary double quotes `"`, not single quotes or Word-style curly quotes.
- Write decimal numbers with `.`: `7.5`, not `7,5`.
- A quote inside text needs a backslash: `"Der Besitzer sagte \"Hallo Chef!\""`.
- Do not add comments, duplicate field names, or trailing commas.
- Put short notes in `subtitle` or `besonderheiten`; the old `kommentar` field is not the written review displayed on the current detail page.

The JSON object's position does not set its rank. Official positions come from all `"reviewed"` restaurants, ordered by `gesamt`, highest first. Equal full scores share a position (for example 1, 2, 2, 4). Searching, filtering, and sorting do not change these positions. Pending and closed restaurants have no official rank; closed restaurants sort last in the combined list.

The displayed overall score is rounded to one decimal; ranking and sorting use the full stored number. Prices and weights sort numerically even if they are stored in quotes. The sorting dropdown works on phones too; desktop column headings also work with a click, Enter, or Space. Use the restaurant filter to show all, reviewed, upcoming, or closed entries. The compact mobile view always shows name, price, and overall score.

### B. Add the written review

Create `public/stories/Beispiel Döner.md`, using the **exact** `name` from the JSON. Make sure your editor does not add `.txt` after `.md`.

Write the review in Markdown. The following is a structure you can fill in in your own voice; none of the headings are required:

```markdown
Our visit, the restaurant, and what we ordered.

### Der Döner im Detail

- **Brot:** Our impressions.
- **Fleisch:** Our impressions.
- **Gemüse und Sauce:** Our impressions.

### Menge und Preis-Leistung

Our impressions.

### Fazit

Our verdict.
```

Use blank lines between paragraphs. `**text**` makes text bold, `###` creates a section heading, and `- ` starts a list. Save as UTF-8 so umlauts display correctly. Write the actual review in your usual language and style.

If you revisit an existing restaurant, edit its existing review file. You can keep the earlier review and add a dated section such as `### Erneuter Besuch am 18.10.2026`. The list currently stores one set of scores and one `datum` per restaurant; decide together which visit those values represent.

### C. Add photos, if available

Export the photos as actual JPEG images, then save them in `public/images/`:

```text
Beispiel Döner_1.jpg
Beispiel Döner_2.jpg
Beispiel Döner_3.jpg
```

The carousel loads photos in number order. Follow all of these rules:

- Start at `_1.jpg` and use consecutive numbers without gaps.
- Use lowercase `.jpg`, not `.jpeg`, `.png`, or `.JPG`.
- Use `_1`, not `_01`.
- The prefix must exactly match the JSON `name`.
- Use at most 20 photos per restaurant.
- Changing `.png` to `.jpg` in a filename does not convert the image; export or convert it to JPEG.

If `_2.jpg` is missing, `_3.jpg` and everything after it will not appear. If you remove the second of three photos, rename `_3.jpg` to `_2.jpg`. If you have no photos, the site uses its existing placeholder.

### D. Add the map, if wanted

In Google Maps on a computer, open the restaurant, choose **Share → Embed a map → Copy HTML**. From the copied HTML, take only the URL inside `src="..."` and put that URL in `mapsUrl`. Google's [sharing and embedding instructions](https://support.google.com/maps/answer/7101463?hl=en) describe this flow.

Use the `https://www.google.com/maps/embed?...` URL, with normal `&` query separators. Do not paste the whole `<iframe>`, a short `maps.app.goo.gl` link, or your browser's normal Maps address. Leave `mapsUrl` as `""` to show the existing “Keine Kartenansicht verfügbar” message.

### E. Update the displayed freshness label

The header's `Stand …` text in `src/pages/index.astro` is manual. Update it if this review changes the date you want the site to advertise. Changing `datum` in the JSON does not update that header automatically.

## 3. Add a restaurant you have not reviewed yet

Add a name and pending status to the JSON array:

```json
{
  "name": "Beispiel Döner",
  "status": "pending"
}
```

It appears with a “Demnächst” badge, missing values, no rank, and no clickable review link. You do not need a story or photos yet. Omit `gesamt` entirely rather than setting it to `0` or `"0"`.

When the review is ready, set `status` to `"reviewed"`, expand that same object using the full example above, and add the matching review and photos. Keep its `name` unchanged. Do not leave both the pending and complete object in the list.

Some older stored names contain `(demnächst)` or `(geschlossen)`. Keep these stored names unchanged: the site hides those suffixes in the displayed name and uses the separate `status` for the badge. Review filenames, photo prefixes, detail links, and Firebase still use the complete stored `name`, including its legacy suffix. For example, publishing a review for `Mr. King (demnächst)` means setting its status to `"reviewed"` and creating `Mr. King (demnächst).md`; visitors see “Mr. King” with a “Bewertet” badge.

## 4. Edit an existing restaurant

1. Search `public/data/doener.json` for its exact `name`.
2. Edit that object. Keep `name` unchanged for price, score, note, date, and map updates.
3. Edit its matching `.md` file if the written review changes.
4. Replace/add photos using the same prefix and consecutive numbering.
5. Run the checks and preview below.

For a price correction, change only `preis`. For a new visit, update the relevant scores, the review text, and `datum` together. Do not change the visit date merely because you corrected a typo.

**Renaming needs a coordinated change.** Updating `name` requires renaming the review and all numbered photos, updating old links where you control them, and deciding how to preserve the old Firebase comments and ratings. Renaming files does not migrate Firebase data. Do not treat a spelling correction in `name` as an ordinary text edit.

To mark a place closed, change only `status` to `"closed"`. It moves to the closed filter, loses its active rank, and keeps its existing review, photos, comments, and ratings. To reopen a reviewed place, set `status` back to `"reviewed"`. Do not append or remove words in `name` to change its status.

All current entries have an explicit status. Older name-only entries are still accepted as pending; older scored entries without status are inferred as reviewed (or closed if the name ends with `(geschlossen)`). Add an explicit status when editing them. A pending restaurant cannot have a numeric `gesamt`; change its status when publishing its review.

## 5. Delete a restaurant from the list

1. Find its complete object in `public/data/doener.json`.
2. Remove that object, from its opening `{` to its matching closing `}`. Do not stop at the closing brace of the nested `besonderheiten` object.
3. Fix the separating comma: keep one comma between the remaining objects, with no comma after the last object.
4. If the public review and photos should also disappear, delete its exact `.md` file and numbered photos. Leave shared images such as `placeholder.jpg`, `bg_mb.jpg`, and `kebab_icon.png` alone.
5. Run the checks and confirm the name is absent from search.

Removing the JSON object removes the restaurant from the list. A previous detail link will no longer find a restaurant entry. Leftover story/photo files are still public static files until removed, even if the list no longer links to them.

**This does not delete its Firebase comments or ratings.** Those records are separate and require a separate database operation if removal is intended. Keeping an existing name also allows those records to be associated again if the restaurant is later restored. Committed files remain recoverable through Git history.

## 6. Check before publishing

Run these commands from the project folder:

```bash
npm run check:content
npm run check
npm run build
```

`check:content` should print `Content check passed`. It checks JSON syntax and duplicate fields, known field names, duplicate stored/display names, valid statuses, score types/ranges, date format, embed URL shape, exact review filenames, nonempty reviews, and photo numbering. It accepts optional photos and older unreviewed name-only entries.

`check` also checks the Astro templates. `build` should finish successfully and generate the site in `dist/`. Never edit `dist/` to change content: it is regenerated on the next build.

Preview using:

```bash
npm run dev
```

Open the URL printed by Astro, usually `http://localhost:4321`. If the server is already running, use that URL and refresh after saving JSON, reviews, or photos. Static content edits can need a manual refresh even when template edits reload automatically.

For a final production-build check, run `npm run preview` after `npm run build` and open the URL it prints.

Check these items in the browser:

- [ ] Search finds the restaurant exactly once, or not at all after deletion.
- [ ] The displayed price, overall score, and detailed scores are correct.
- [ ] The status badge is right and the restaurant appears in its intended filter.
- [ ] Searching or changing the sort keeps the official rank; pending/closed entries have no rank.
- [ ] The visit date appears correctly in the list and on the review page.
- [ ] A reviewed restaurant's name opens its detail page.
- [ ] The actual review appears, rather than “keine Story verfügbar”.
- [ ] All intended photos appear and the carousel arrows work when there are multiple photos.
- [ ] The map points to the correct restaurant, or the no-map message is intentional.
- [ ] The page works at a narrow phone width as well as on desktop.
- [ ] Existing comments/ratings still belong to the intended restaurant if its name changed.
- [ ] The header's “Stand …” date is appropriate.
- [ ] Example names, sample scores, and placeholder review text have been replaced.

The automatic check cannot confirm that a score is factually correct, a map pin is in the right place, a `.jpg` contains a genuine JPEG, or Firebase data was migrated. It also does not flag unreferenced leftover review/photo files. These need the browser/file review above.

## 7. Submit the change for review

Inspect the changes before committing:

```bash
git status --short
git diff
git add public/data/doener.json public/stories public/images src/pages/index.astro
git diff --cached --stat
git diff --cached
git commit -m "Add Beispiel Döner review"
git push https://github.com/YOUR_GITHUB_USERNAME/doener-rat.git HEAD
```

Use a commit message that describes the actual change. The `git add` command records additions, edits, and deletions under the listed paths. Check the staged diff for unrelated edits before committing. If Git says `Author identity unknown`, configure your own Git name and your verified or GitHub-provided no-reply email for this checkout, then repeat the commit.

Replace `YOUR_GITHUB_USERNAME` before running the push command. It sends the current content branch to your fork (or to the shared repository if you chose the write-access workflow above). Using the full URL avoids depending on local remote names such as `origin`, `upstream`, or `fork`, which can differ between contributors. To inspect your checkout's configured remotes, run `git remote -v`.

Open a pull request on GitHub with the correct target:

| Project state | Base repository / branch | Head repository / branch |
| --- | --- | --- |
| Astro/ranking updates still being reviewed | `JeremiaHenkel/doener-rat` / `feat/ranking-usability` | `YOUR_GITHUB_USERNAME/doener-rat` / your `content/...` branch |
| Astro/ranking updates merged upstream | `L-4-r-s/doener-rat` / `main` | `YOUR_GITHUB_USERNAME/doener-rat` / your `content/...` branch |

For the upstream pull request, use **compare across forks** if needed and check both repository and branch selectors. [GitHub's fork pull request guide](https://docs.github.com/en/pull-requests/how-tos/create-pull-requests/creating-a-pull-request-from-a-fork) covers these selectors.

In the description, say which restaurant changed, what changed, and that you ran the checks and previewed it. For a content-only change after these updates merge, the PR should contain the content edits, not the entire Astro migration. If the diff is unexpectedly large, recheck the base branch before creating it.

Wait for the checks and another contributor's review. A successful push or merge into your fork does not publish to `www.doener-rat.de`. **Before the first upstream merge of the Astro migration, the maintainer must switch Pages from branch publishing to GitHub Actions.** Otherwise, the existing configuration could publish the source tree without its built HTML. Follow the [first-deployment and rollback guide](DEPLOYMENT.md). After merging and passing checks, the maintainer manually runs **Deploy site** on upstream `main`. Later content merges also require that manual deployment, but no further Pages source change. Then check the live site too.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| “Daten konnten nicht geladen werden” / entire list missing | Run `npm run check:content`; JSON commas/quotes or a non-array root are likely causes. |
| Restaurant missing | Correct branch and project folder? Did you save the JSON? Refresh the browser. Make sure your search is not filtering it out. |
| Name appears twice | Remove the duplicate JSON object; edit the existing one when publishing a first review or revisiting. |
| Restaurant name is not clickable | `gesamt` must be a number, e.g. `7.4`, not `"7.4"`. No overall score means no review link. |
| Wrong or missing rank | Check numeric `gesamt` and `status: "reviewed"`. Ranks are fixed across search/sorting, ties share a place, and pending/closed entries have no rank. The full score determines rank while display is rounded. |
| Wrong status badge/filter | Check `status` is exactly `"reviewed"`, `"pending"`, or `"closed"`. Do not rename the restaurant to change its status. |
| Price/weight sorting looks odd | Use positive numbers or numeric text with a decimal point and no units. Missing values stay last in either direction; closed restaurants remain at the bottom of the combined list. |
| No visit date displayed | Check `datum` is a real date in `DD.MM.YYYY` format. Pending entries without a visit date show none. |
| “Für diesen Dönerladen ist keine Story verfügbar” | Exact review filename, capital letters, umlauts, `.md` extension, and saved file location. |
| Only some photos appear | Missing `_1.jpg`, a numbering gap, wrong capitalization, or a filename prefix that differs from `name`. |
| Photo has the right name but is broken | Open it as an image and export to actual JPEG; changing an extension is insufficient. |
| Map absent or refuses to load | Correct embed URL in `mapsUrl`, not a short/normal Maps link or copied iframe HTML. Check network access too. |
| Comments or user ratings disappeared after renaming | The name is also their Firebase identifier. Coordinate a migration or restore the old name; do not assume the records were deleted. |
| Changes visible locally but absent online | Content needs to be committed, pushed, reviewed, merged upstream, and deployed. Confirm the deployed commit, then hard-refresh the live page. |
