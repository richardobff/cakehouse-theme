# Cakehouse theme

Shopify theme for Cakehouse, a pie bakery at 336 Brunswick St, Fitzroy VIC 3065. Built by Office BFF. Client contact is Suzie.

This file is the build brief. Read it at the start of each session. Figma is the source of truth for layout and content; this file covers structure, rules and behaviour.

## Store and repo

- Store: `cakehouse-kjnxd8hc.myshopify.com` (Shopify plan, AUD).
- Repo: `cakehouse-theme`, started from Shopify's skeleton theme.
- The `main` branch is connected to an unpublished theme through the Shopify GitHub integration. Pushes to `main` update that theme. Changes made in the theme editor commit back to `main`, so pull before starting work.
- The live theme is `cakehouse-shopify-theme-2`, a landing page. Do not edit or publish over it. The new theme is published on launch day only.
- Local preview: `shopify theme dev --store cakehouse-kjnxd8hc`.
- Work on feature branches and merge to `main` when a section renders correctly on desktop and mobile.
- Git author: Richard Ellis.

## Scope

In scope now: pies only. Each pie sells as a whole pie or by the slice. Pick up only.

Out of scope for now: cookies, merch and delivery. Designs for cookies and merch are kept in Figma for later (see Figma links). Gift cards: the gift card template is designed; confirm with Rich before enabling gift card products.

## Figma

File: https://www.figma.com/design/Gs3fJVcmH22DRgENyFeB8o/CAKEHOUSE-WEBSITE

All current designs are on the page `06 DESIGN PREVIEW`. Use `get_design_context` or screenshots on these nodes.

| What | Node |
|---|---|
| Home, desktop | 218:908 |
| Home, mobile | 66:666 |
| Product, desktop | 62:820 |
| Product, mobile | 66:777 |
| Order panel, desktop | 62:862 |
| Mobile header and order sheet | section 227:1274 |
| Help me order, desktop and mobile steps | section 140:2464 |
| Help me order as pop out, plus by the slice variants | section 225:1096 |
| Cart drawer, mobile cart, empty cart, sold out | section 233:1329 |
| Visit | 62:883 |
| Contact | 62:951 |
| Menu, about, pre order, wholesale, ordering and pick up, ingredients and allergens, policy, 404, password, gift card (desktop and mobile) | section 238:1507 |
| Later: cookies and merch (not for this build) | section 243:2406 |

The page `05 design playground` holds the source components (button, header, product card, section spacer, footer, cart lines).

## Design tokens

### Colour

| Token | Hex | Use |
|---|---|---|
| clementine | #FF6E1E | colour blocks |
| strawberry | #DD2230 | accent, used sparingly |
| birthday-pink | #F098B2 | colour blocks, panels |
| blue-sky | #409FD7 | colour blocks |
| black | #000000 | text, rules, solid buttons |
| white | #FFFFFF | page background |

Rules are 1px black. The active part of the help me order progress bar is 3px black.

### Type

Brand fonts only. No other families, including in admin-facing UI.

- Display: Futura Condensed ExtraBold, always uppercase. The file `Futura-CondensedExtraBold.woff2` is in the live theme's assets; copy it across.
- Text: Futura Medium. Needs uploading as woff2; the licence is held.
- Self-host both, preload them, and use `font-display: swap`.

| Style | Font | Size | Line height | Letter spacing |
|---|---|---|---|---|
| D1 Masthead | Condensed | 330 | 86% | -3% |
| D2 | Condensed | 200 | 88% | -2% |
| D3 | Condensed | 120 | 90% | -1.5% |
| D4 | Condensed | 64 | 92% | -0.5% |
| H | Condensed | 32 | 100% | 0 |
| Name | Condensed | 20 | 110% | 0.5% |
| Label | Condensed | 14 | 110% | 3% |
| Body XL | Medium | 48 | 112% | -1% |
| Nav XL | Medium | 72 | 100% | -2% |
| Medium 40 | Medium | 40 | 115% | -1% |
| Body L | Medium | 24 | 130% | -0.5% |
| Product | Medium | 20 | 125% | -0.5% |
| Body | Medium | 17 | 140% | 0 |
| Button | Medium | 15 | 100% | 0 |
| Meta | Medium | 12 | 135% | 0 |

Sizes are desktop at 1440. Scale display sizes fluidly down to the mobile sizes in Figma (mobile titles use D4 at 64).

### Layout

- Desktop frame 1440. Margin 24. 12 columns, gutter 24 (column 94).
- Mobile frame 390. Margin 16.
- Section spacing: section spacers have 140 top padding on desktop and 64 on mobile.
- Colour splits are half text, half image: 720 + 720 on desktop, stacked on mobile.
- Product card image ratio 4:5.

### Components

- Button: pill (full radius), height 43, padding 12.5 22 15.5 22, Button text style. Solid is a black fill with white text. Outline is a 1.5px black stroke with black text. On hover, outline fills black.
- Field: pill, height 48, 1.5px black stroke, padding 20. Message field radius 24.
- Rule: 1px black, full content width.

## Navigation

- Desktop header: wordmark, then order, menu, visit, about, and the cart button with count.
- Mobile header: now baking bar, large wordmark, then order, menu, visit, about and the cart button.
- "order" opens the order panel. The panel lists help me order, pick up, pre order and wholesale as large blocks, each with a button. On desktop it is a centred panel, 6 columns wide, under the header. On mobile it is a full-screen sheet. Delivery is not shown.
- Pre order is reached through the order panel; it is not in the header.
- Footer: follow us posts, email sign up, links to ordering and pick up, allergens, wholesale, contact, instagram, tiktok and policies.

## Sections

Build each as an Online Store 2.0 section with settings so Suzie can edit content in the theme editor.

- Now baking bar: on/off toggle, ticker text, dot colour. Turning it off removes the bar entirely.
- Header: masthead variant for home, compact variant for other pages.
- Full-bleed image.
- Section spacer: title and copy.
- Help me order entry block: colour, image, title, copy, button.
- Product grid: collection picker.
- Colour split: colour, title, copy, image, button, image side.
- Photo pair.
- About: portrait, copy, button.
- Two-column text.
- Sign up: title, copy, email form (Shopify customer form at launch; Klaviyo can replace it later).
- Visit: address and hours.
- Follow us: curated posts from a metaobject (image, link, platform). No feed app at launch.
- Menu list: groups (pies, drinks) driven by a metaobject so Suzie can edit items and prices without touching products.
- Question and answer list: used for ordering and pick up, and for ingredients and allergens.
- Footer.

## Templates

index, product, collection (pies), cart, page.menu, page.about, page.pre-order, page.wholesale (contact form), page.info (question and answer list), page.contact, page.visit, policy pages (styled through the policy template), 404, password (opening soon), gift_card.

## Products

- One product per pie.
- Option "Format" with values "Whole pie" and "By the slice".
- By the slice is pick up only and has no handwritten note.
- The product page shows format as two buttons (whole pie, by the slice), then pick up date, handwritten message (whole pie only), and a help me order prompt.

## Ordering rules

Store these as editable settings with defaults marked "to confirm". Suzie fills them in and changes them later. Do not hard-code values.

- Lead time for whole pies, in business days.
- Daily cut-off time for the next available day.
- Daily cap per pie.
- Closed days and blackout dates.
- Pre order windows, each with its own pick up dates.
- Slices: available from the counter's stock, pick up only.

Cart rules:

- An order has a single pick up date, stored as a cart attribute. If an item is added with a different date, ask the customer which date to keep.
- Each line keeps its format and any note as line item properties.
- Enforce cut-offs and caps at checkout with a Shopify Function (cart validation), or with a pick up app if that decision is made instead. Confirm with Rich before choosing.
- The store timezone must be Australia/Melbourne. Check Settings › General before writing any date logic.

## Help me order

A pop out flow with 5 steps: which pie, size, pick up and date, note, your order.

- Desktop: a panel 10 columns wide (1156) over the page, under the header. Mobile: a full-screen sheet.
- Each step has the progress label (for example "2 of 5"), a progress bar, close, back and next.
- Choosing "by the slice" locks step 3 to pick up and skips the note step.
- The last step adds to cart and opens the cart drawer.
- Entry points: order panel, the home entry block, the product page prompt.

## Cart

- Desktop: a drawer 5 columns wide (566) on the right, under the header. Mobile: a full-screen sheet.
- Content: "Cart" title, close, then pick up date, items with format and note, and total, as rows with 1px rules. Then keep shopping and checkout.
- Empty state: "Your cart is empty." with a shop button.
- Update with the Section Rendering API, no page reloads.

## Motion and loading

- No splash or intro loader.
- Page changes: cross-document view transitions, a short crossfade with the header held in place. Browsers without support load normally.
- Prefetch links on hover.
- Images sit on a flat brand colour at their final aspect ratio and fade in when loaded. No layout shift.
- Panels, the help me order flow and the cart slide or scale in from their trigger in about 250ms with ease-out, and the page behind dims slightly. Help me order steps slide sideways and the progress bar animates its width.
- Add to cart: the cart count updates, the drawer opens and the new line highlights briefly.
- Now baking: the dot pulses slowly and the ticker scrolls.
- Respect `prefers-reduced-motion`: no ticker scroll, no pulse, no slides, fades only.

## Performance and quality

- Keep apps to a minimum. Each app needs Rich's sign-off.
- Responsive images through `image_url` with widths and `sizes`. Preload the first hero image.
- Accessibility: visible focus states, keyboard access to every panel, focus trapped in open panels, labels on every field, alt text from Shopify media.
- Test on desktop 1440 and mobile 390 before merging.

## Copy

- Content comes from Suzie. Use the holding copy in Figma until it is supplied.
- Do not invent prices, lead times, hours, ingredients or allergen information.
- Keep interface copy short and lowercase on buttons, as in Figma.
