# CSS Tracing Investigation Report

## Selected Element: the Dice Face (`<div class="DiceRoller-module__<hash>__dice">`)

This `<div>` is the main UI element rendered by `DiceRoller.tsx`. It was chosen because its final computed styles result from the interaction of **four distinct rule sources**:

1. **`.dice` (base)** – `DiceRoller.module.css` lines 1–4 set default custom-property values (`--glow-color`, `--text-color`), and lines 36–66 set all structural and visual properties.
2. **`.dice[data-value="x"]` (override)** – one of six attribute-selector rules (lines 6–34) overrides `--glow-color` and `--text-color` depending on the current roll result.
3. **`body` (globals.css lines 12–18)** – contributes `font-family` `-webkit-font-smoothing` and other values through normal CSS inheritance.
4. **`*` (globals.css lines 20–24)** – the universal selector sets `box-sizing: border-box`, `padding: 0`, and `margin: 0` on every element.

For the examples below the dice is assumed to display **value 6**, which activates the rule:

```css
/* DiceRoller.module.css lines 31-34 */
.dice[data-value="6"] {
  --glow-color: #f48fb1;
  --text-color: #ec407a;
}
```

---

## Property-by-Property Analysis

### 1. `color`

| Step | Detail |
|------|--------|
| **Computed value** | `rgb(255, 171, 145)` |
| **Styles panel rule** | `color: var(--text-color)` |
| **Generated CSS location** | `/_next/static/css/<hash>.css` |
| **Source map trace** | `src/components/DiceRoller.module.css` **line 49** |
| **Variable resolution** | `--text-color` resolves to `#ec407a` because `.dice[data-value="6"]` (source line 33) overrides the `#ffd700` default set at line 3. The Computed panel expands the fully resolved color as an RGBA value. |

---

### 2. `margin`

| Step | Detail |
|------|--------|
| **Computed value** | `32px` (reported as four individual longhands: `margin-bottom`, `margin-left`, `margin-right`, `margin-top`, each `32px`) |
| **Styles panel rule** | `margin: 32px` |
| **Generated CSS location** | `/_next/static/css/<hash>.css` |
| **Source map trace** | `src/components/DiceRoller.module.css` **line 40**  |
| **Globals override** | `margin: 0` from `*` rule in `globals.css` is overridden by the `.dice` rule. |

---

### 3. `font-size`

| Step | Detail |
|------|--------|
| **Computed value** | `120px` |
| **Styles panel rule** | `font-size: 120px` |
| **Generated CSS location** | `/_next/static/css/<hash>.css` |
| **Source map trace** |  `src/components/DiceRoller.module.css` **line 55** |

---

### 4. `border-radius`

| Step | Detail |
|------|--------|
| **Computed value** | `24px` (reported as four individual longhands: `border-top-left-radius`, `border-top-right-radius`, `border-bottom-right-radius`, `border-bottom-left-radius`, each `24px`) |
| **Styles panel rule** | `border-radius: 24px` |
| **Generated CSS location** | `/_next/static/css/<hash>.css` |
| **Source map trace** | `border-radius: 24px` links to `src/components/DiceRoller.module.css` **line 59**, but the longhand values from Computed panel aren't traceable |

---

### 5. `-webkit-font-smoothing`

| Step | Detail |
|------|--------|
| **Computed value** | `antialiased` |
| **Styles panel rule** | `-webkit-font-smoothing: antialiased`, shown in the "Inherited from body" section |
| **Generated CSS location** | `/_next/static/css/<hash>.css`, served as a global stylesheet |
| **Source map trace** | `src/app/globals.css` **line 16** |

---

## Three Breakdown Cases

### Breakdown 1 - Custom Property Chains Are Opaque in the Computed Panel

When inspecting `color` or `box-shadow` in the **Computed** tab, DevTools shows only the final resolved value (e.g. `rgb(236, 64, 122)`). There is no indication that this value originates from `--text-color`, let alone that `--text-color` was set by a `data-value` attribute rule rather than the base `.dice` rule.

To trace the chain, the developer must:

1. Spot the `var(--text-color)` reference in the Styles panel.
2. Search upward through the matched rules to find which selector last assigned `--text-color`.
3. Realise that `.dice[data-value="6"]` wins because attribute selectors have higher specificity than plain class selectors.

The source map only links the `color: var(--text-color)` declaration to line 48, and the `--text-color: #ec407a` override to line 33. The **chain connecting them** (specificity calculation, cascade order, the runtime `data-value` attribute) is never surfaced as a single traceable path. Changing the dice value changes the resolved `--text-color` without any change to the authored lines that the source map points to, which makes it impossible to determine the active color from source maps without also knowing the runtime DOM state.

---

### Breakdown 2 - CSS Modules Class Name Mangling Obscures the Source

In the authored source the rule is written as `.dice { ... }`. After the build, the generated selector becomes `.DiceRoller-module__<hash>__dice`. Likewise, `.dice[data-value="6"]` becomes `.DiceRoller-module__<hash>__dice[data-value="6"]`.

When a developer sees the mangled selector in the Styles panel and clicks the source-map link, DevTools correctly opens `DiceRoller.module.css` at the right line. However:

- **Without source maps** (e.g. in a production build where `productionBrowserSourceMaps` is disabled, or when the `.map` file is missing), the selector name in the Styles panel bears no obvious resemblance to any class in the source code.
- **Searching the repository** for `.DiceRoller-module__<hash>__dice` yields zero results; the developer must know to look for `.dice` inside `DiceRoller.module.css`.
- The hash changes on every build, so any documentation, screenshot, or bug report that records the exact generated class name becomes stale.

This means that source maps are _required_ to understand the stylesheet; the generated CSS is not human-readable without them.

---

### Breakdown 3 - Inherited Properties with Non-Authored Values Are Difficult to Trace

The `font-family` property on the dice element is **not declared on the element itself**. It is inherited from `body`, which sets `font-family: var(--font-geist-sans)` in `globals.css`. The `--font-geist-sans` variable is injected at runtime as an **inline style** by Next.js's `next/font` integration - there is no authored CSS file that contains the actual font-family string.

The tracing chain therefore has three distinct hops, each with a different source:

1. `font-family` computed value → inherited from `body` (Styles panel "Inherited" section)
2. `body` rule → `globals.css` line 15 (source map link available)
3. `var(--font-geist-sans)` value → inline style injected by the framework at runtime (no source map, no authored file)

DevTools cannot link from the computed `font-family` value all the way back to the `Geist({ ... })` call in `layout.tsx`. The inline-style injection point has no source map entry, and clicking the "Inline styles" link in the Styles panel opens the element's own style attribute rather than any TypeScript or configuration file.
