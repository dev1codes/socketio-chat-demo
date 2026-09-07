# DMHSPWD Design System

Visual style used on the `dmhspwd.org` landing page. Reuse this so other apps
under the domain (classroom chat, student site index, games) feel like part
of the same site.

## Look & feel

Dark, minimal, "techy/terminal" aesthetic — monospace type, low-contrast
grays with a bright neon accent, subtle motion (blinking cursor, animated
background grid), thin hairline borders instead of heavy chrome.

## Font

Google Fonts, loaded via `<link>`:

```html
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&display=swap" rel="stylesheet" />
```

```css
font-family: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
```

Everything is monospace — headings, body, UI chrome. Don't mix in a sans-serif font.

## Color tokens

Drop this `:root` block into any app's global CSS as the single source of truth:

```css
:root {
  --bg: #090b10;       /* page background */
  --bg-2: #0d0f16;      /* secondary surface */
  --fg: #d7dee8;        /* primary text */
  --dim: #6b7685;        /* secondary/muted text, borders' text labels */
  --accent: #4dffb4;     /* primary accent — green, used for status/success/links */
  --accent-2: #5ec8ff;    /* secondary accent — blue, used in gradients */
  --line: rgba(255, 255, 255, 0.08); /* hairline borders/dividers */
}
```

Usage rules:
- Backgrounds are always near-black (`--bg`), never pure `#000`.
- Body text is `--fg` (off-white, not pure white).
- Anything secondary — labels, timestamps, placeholders, disabled states — uses `--dim`.
- `--accent` (green) marks live/active/success state (e.g. an online indicator,
  a sent message, a "connected" status). `--accent-2` (blue) pairs with it in
  gradients or as a secondary highlight — don't use either as a body text color.
- Borders are `1px solid var(--line)` — thin and barely visible, not heavy card outlines.

## Shape & surfaces

- Border radius: `8px`–`10px` for cards/containers, `999px` (pill) for chips/badges.
- Card surface: semi-transparent dark background + hairline border + blur, e.g.:

```css
.card {
  background: rgba(9, 11, 16, 0.72);
  border: 1px solid var(--line);
  border-radius: 10px;
  backdrop-filter: blur(6px);
  box-shadow: 0 0 0 1px rgba(255, 255, 255, 0.02), 0 30px 80px -30px rgba(0, 0, 0, 0.8);
}
```

- Disabled/placeholder elements: `border: 1px dashed var(--line)` + `opacity: 0.55` + `cursor: not-allowed`.

## Motion (use sparingly, not on every element)

**Blinking cursor** (terminal feel), good for a "typing…" indicator in chat:

```css
.cursor {
  display: inline-block;
  color: var(--accent);
  animation: blink 1s steps(1) infinite;
}
@keyframes blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
```

**Pulsing status dot** (good for "user online" in a chat app):

```css
.dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--accent);
  box-shadow: 0 0 8px var(--accent);
  animation: pulse 1.6s ease-in-out infinite;
}
@keyframes pulse {
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(1.3); opacity: 0.6; }
}
```

**Scanline overlay** (optional, whole-page texture):

```css
.scanline {
  position: fixed;
  inset: 0;
  pointer-events: none;
  background: repeating-linear-gradient(
    to bottom,
    rgba(255, 255, 255, 0.015) 0px,
    rgba(255, 255, 255, 0.015) 1px,
    transparent 1px,
    transparent 3px
  );
  mix-blend-mode: overlay;
}
```

## Components

- **Chips/badges** (e.g. a class period, a tag, a username pill): pill-shaped,
  `--dim` text, `1px solid var(--line)` border, small `12px` font, `5px 12px` padding.
- **Kicker text** (small label above a heading): `12px`, uppercase, `letter-spacing: 0.18em`, `--dim` color.
- **Prompt/branding line**: styled like a shell prompt, e.g. `dmhs@pwd:~$`, using
  `--accent-2` for the "user@host" part and `--dim` for punctuation — a nice
  motif to reuse as a header/logo mark across apps (e.g. `dmhs@chat:~$`).

## Applying this to the Node.js chat app

The chat app doesn't need to share any files with this repo — just replicate
the tokens and rules above in its own stylesheet:

1. Load the same JetBrains Mono font.
2. Copy the `:root` color block verbatim.
3. Use `--bg`/`--fg`/`--dim`/`--line` for base layout, `--accent` for online/sent-message
   state, `--accent-2` as the secondary/gradient color.
4. Reuse the blinking cursor for a "typing…" indicator and the pulsing dot for online presence — both map naturally onto chat UI.
5. Keep borders hairline and surfaces dark-glass (`rgba` + `backdrop-filter: blur()`) rather than solid panels, to match the landing page's depth.
