# CSS Tracing Demo

## Setup & Running

```bash
# Install dependencies
pnpm install

# Start the development server (http://localhost:3000)
pnpm dev

# Create a production build
pnpm build

# Serve the production build
pnpm start
```

## How Authored CSS Is Transformed

This project uses [CSS Modules](https://nextjs.org/docs/app/getting-started/css#css-modules) via Next.js. The transformation pipeline works as follows:

1. **Authoring** – CSS is written in `*.module.css` files (e.g. `src/components/DiceRoller.module.css`). Class names are plain, human-readable identifiers (`.container`, `.dice`, `.button`).

2. **CSS Modules scoping** – At build time, Next.js (via Turbopack) processes each `.module.css` file. Every local class name is replaced with a scoped identifier that includes the file name, original class name, and a content hash (`.DiceRoller_container__aB3xQ`). This prevents naming collisions between components without requiring a global namespace.

3. **Bundling** – All CSS chunks that belong to the same page are concatenated into a single `.css` file per route. Global styles (`globals.css`) are included first, followed by component-level modules.

4. **PostCSS processing** – Next.js runs PostCSS on every CSS file. By default it applies [autoprefixer](https://github.com/postcss/autoprefixer), which adds vendor prefixes where needed (e.g. `-webkit-backdrop-filter` alongside `backdrop-filter`).

5. **Minification (production only)** – In production builds (`pnpm build`) the output CSS is minified: whitespace, comments, and redundant declarations are removed.

### What changes between source and browser

| Source (authored)            | Browser (generated)                                              |
| ---------------------------- | ---------------------------------------------------------------- |
| `.container`                 | `.DiceRoller_container__<hash>`                                  |
| `.dice.rolling`              | `.DiceRoller_dice__<hash>.DiceRoller_rolling__<hash>`            |
| Multiple `.module.css` files | Few bundled `.css` chunks                                        |
| Comments & whitespace        | Stripped in production                                           |
| `backdrop-filter`            | `backdrop-filter` + `-webkit-backdrop-filter` (via autoprefixer) |

## Generated CSS & Source Maps

After running `pnpm build` the compiled output lives inside the `.next/` directory (not committed to the repository):

```
.next/
└── static/
    └── css/
        ├── <hash>.css          # Minified, bundled CSS
        └── <hash>.css.map      # Corresponding source map
```
