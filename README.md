# Dönerrat Marburg

A clean, interactive platform for exploring and rating Döner Kebaps in Marburg, Germany. The project features a detailed rating database, written reviews, interactive user ratings, and community comments.

---

## 📁 Repository Structure

Below is an overview of the key folders and files in the repository:

```text
├── .vscode/               # Editor configurations
├── background/           # Dynamic background-related assets
├── css/
│   ├── input.css          # Source Tailwind CSS definitions
│   └── styles.css         # Compiled stylesheet (built via Tailwind CLI)
├── data/
│   └── doener.json        # Main database of kebab shops and official ratings
├── images/                # Site assets, shop photos (formatted as [Name]_[Index].jpg)
├── js/
│   ├── firebase.js        # Firebase Firestore logic (comments, upvotes, ratings)
│   └── script.js          # Core frontend logic (table sorting, filtering, modals)
├── stories/               # Text reviews for individual shops in Markdown (.md) format
├── convert_to_jpg.py      # Helper script for processing/converting review photos
├── datenschutz.html       # GDPR privacy policy page
├── impressum.html         # Legal disclosure (Impressum) page
├── index.html             # Main landing page featuring the interactive leaderboard
├── laden.html             # Dynamic template page for individual shop profiles
├── stats.html             # Statistics dashboard
└── todo.md                # List of planned features and improvements
```

---

## 🛠️ Tech Stack & Integrations

* **Frontend:** Vanilla HTML5, CSS, and modern ES6 JavaScript.
* **Styling:** [Tailwind CSS v4](https://tailwindcss.com/) (using the `@tailwindcss/cli`).
* **Backend Database:** [Google Firebase Firestore](https://firebase.google.com/) for handling:
  * Anonymous unique user ratings (1-10 scale).
  * Community comments and a Firestore-incremented comment upvote system.
* **Libraries:** [Marked.js](https://marked.js.org/) for rendering Markdown stories on-the-fly inside the detail pages.

---

## 🚀 Getting Started

### Prerequisites
Make sure you have [Node.js](https://nodejs.org/) installed to build stylesheet assets.

### Development Setup
1. Clone this repository to your local machine:
   ```bash
   git clone https://github.com/L-4-r-s/doener-rat.git
   cd doener-rat
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run the Tailwind watcher during development:
   ```bash
   npm run watch
   ```

4. Build the minified CSS for production:
   ```bash
   npm run build
   ```

5. Start a local server using Python:
   ```bash
   python -m http.server
   ```
   Once started, navigate to [http://localhost:8000/](http://localhost:8000/) in your web browser to view the application.