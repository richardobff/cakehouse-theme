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
| Opening options | section 249:2676 |
| Header and home info component (page 05 design playground) | 250:779 |
| Home v2, block system (desktop and mobile) | section 276:2765 |

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
- Colour splits are half text, half image: 720 + 720 on desktop, stacked on mobile.
- Product card image ratio 4:5.

### Spacing (block system)

Applies to every section on every page.

- Sections butt together. No gaps between sections.
- Colour changes separate sections. A 1px rule appears only where a white section follows another white section, at the top of the lower one, at content width. Never a rule against a colour or image edge.
- Section padding: title on the top line at 24, 64 below the content. Mobile 16 and 40. Content sets the height; no fixed section heights.
- Titles sit inside their section (for example, the order pies title, the "not sure what to get?" prompt and the grid are one section).
- Images run edge to edge.
- In code: each section's schema class marks its surface (`block--white`, `block--colour` or `block--image`), and `assets/sections.css` draws the rule between white blocks. Padding tokens are `--block-top` and `--block-bottom`.

### Components

- Button: pill (full radius), height 43, padding 12.5 22 15.5 22, Button text style. Solid is a black fill with white text. Outline is a 1.5px black stroke with black text. On hover, outline fills black.
- Field: pill, height 48, 1.5px black stroke, padding 20. Message field radius 24.
- Rule: 1px black, full content width.

## Navigation

- Desktop home header (masthead): wordmark on columns 1 to 8; the details block (status line, address with a pin that links to Google Maps directions) starts on column 9 and is 3 columns wide; the cart sits alone, right-aligned in column 12, top aligned with the status line; nav row below at Medium 40.
- Desktop other pages: compact header, wordmark left, nav and cart right. On every desktop page a compact bar slides in once the header scrolls away.
- Mobile header, every page: wordmark, status line, address with pin, then order, menu, visit, about and the cart button.
- Status line: from Opening hours in theme settings, Australia/Sydney time, rechecked every minute. Open: green dot, "now baking, open now" (Now baking on in the header settings) or "open now". Closed: orange dot, "closed, opens tomorrow at 8am" and so on. Hidden until hours are set.
- "order" opens the order panel. The panel lists help me order, pick up, pre order and wholesale as large blocks, each with a button. On desktop it is a centred panel, 6 columns wide, under the header. On mobile it is a full-screen sheet. Delivery is not shown.
- Pre order is reached through the order panel; it is not in the header.
- Footer group, every page: sign up band directly on top of follow us (no gap, no rule), then the footer with links to ordering and pick up, allergens, wholesale, contact, instagram, tiktok and policies. The footer has no email field.

## Sections

Build each as an Online Store 2.0 section with settings so Suzie can edit content in the theme editor.

- Now baking: an on/off switch in the header settings that sets the open status wording. The ticker bar was removed in header-info (in git history if it comes back).
- Header: masthead variant for home, compact variant for other pages.
- Full-bleed image, with an option to fill the window under the header (home hero: 100svh minus the header, at least 480).
- Section spacer: title and copy on the top line, optional button under the copy.
- Help me order entry block: colour, image, title, copy, button.
- Product grid: title, copy and an optional prompt with a button on the top line, then the products from a collection picker, all one section.
- Colour split: colour, title, copy, image, button, image side.
- Photo pair.
- About (Suzie): title and intro on the top line, portrait left, copy and a solid button at the foot of the right column, level with the bottom of the portrait. On mobile the copy and button sit under the portrait.
- Two-column text.
- Sign up: a pink band in the footer group on every page, directly on top of follow us: title, copy, email field and button on one line (Shopify customer form at launch; Klaviyo can replace it later).
- Visit: a colour split (blue on home). Title on the top line; address, hours (from Opening hours in theme settings, consecutive days grouped) and a solid "directions" button (Google Maps) at the foot of the colour side; photo on the other side.
- Follow us: curated posts from a metaobject (image, link, platform). No feed app at launch. Title left, instagram, tiktok and substack buttons right (each shows once its link is set in the section); then a horizontal strip of rounded tiles (24 radius desktop, 16 mobile), top aligned, mixed heights cycling 4:5, 2:3, 1:1, 3:4, 250 wide desktop (scaled) and 160 mobile, gap 24 and 12, starting at the left margin and running off the right edge. Each tile links to its post. The strip drifts left on a loop (about 30 seconds per cycle), pauses on hover, touch or focus, can be scrolled or dragged by hand, has no visible scrollbar and stays still with reduced motion.
- Menu list: groups (pies, drinks) driven by a metaobject so Suzie can edit items and prices without touching products.
- Question and answer list: used for ordering and pick up, and for ingredients and allergens.
- Footer.

## Home order

Header, hero, opening soon, order pies, help me order (orange split), pre order (pink split), photo pair, Suzie, visit (blue split), then the footer group: sign up (pink band), follow us, footer.

## Templates

index, product, collection (pies), cart, page.menu, page.about, page.pre-order, page.wholesale (contact form), page.info (question and answer list), page.contact, page.visit, policy pages (styled through the policy template), 404, password (opening soon), gift_card.

## Products

- One product per pie.
- Option "Format" with values "Whole pie" and "By the slice".
- By the slice is pick up only and has no handwritten note.
- The product page shows format as two buttons (whole pie, by the slice), then pick up date, handwritten message (whole pie only), and a help me order prompt.

## Ordering rules

Decided: theme only, no pick up app.

Store these as theme settings with defaults marked "to confirm". Suzie fills them in and changes them later. Do not hard-code values.

- Lead time for whole pies, in business days. Business days are the days the shop is open: not a closed weekday and not a blackout date.
- Daily cut-off time for the next available day.
- Closed days (weekdays) and blackout dates.
- Pre order windows, each with its own pick up dates.
- Slices: available from the counter's stock, pick up only.

Starting defaults (confirmed as defaults; Suzie can change them): whole pie lead time 2 business days, slice lead time 0 (same day), no cut-off, orders up to 63 days ahead, note up to 60 characters.

The date picker only offers valid dates: it applies the lead time, cut-off, closed days, blackout dates and pre order windows, and greys out days that are sold out.

Daily caps:

- A hidden "pick up" product has one variant per pick up date. Each variant's option value is the date as YYYY-MM-DD, and its inventory is the day's cap.
- The chosen date's variant is added to the cart as a $0 line, so Shopify's checkout blocks a day once it is sold out.
- The pick up product is hidden from search, collections and the storefront grid, and its line is shown in the cart as the pick up date, not as a product.
- Confirmed: the pick up line's quantity is one per whole pie in the cart. Slices do not count toward the cap. A cart with only slices still carries the pick up date attribute but no pick up line.

Cart rules:

- An order has a single pick up date, stored as a cart attribute and matched by the pick up line. If an item is added with a different date, ask the customer which date to keep.
- Each line keeps its format and any note as line item properties.
- Lead times, cut-offs, closed days and blackout dates are enforced in the theme (date picker and cart). Caps are enforced by Shopify inventory at checkout.
- The store timezone is Australia/Sydney (AEDT, the same as Melbourne). Check Settings › General before writing any date logic.

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
- Status: the green open dot pulses slowly. The compact header bar slides in over about 200ms.
- Follow us: the strip drifts slowly to the left and pauses on hover, touch or focus.
- Respect `prefers-reduced-motion`: no pulse, no slides, no strip drift, fades only.

## Performance and quality

- Keep apps to a minimum. Each app needs Rich's sign-off.
- Responsive images through `image_url` with widths and `sizes`. Preload the first hero image.
- Accessibility: visible focus states, keyboard access to every panel, focus trapped in open panels, labels on every field, alt text from Shopify media.
- Test on desktop 1440 and mobile 390 before merging.

## Copy

- Content comes from Suzie. Use the holding copy in Figma until it is supplied.
- Do not invent prices, lead times, hours, ingredients or allergen information.
- Keep interface copy short and lowercase on buttons, as in Figma.

## Roadmap

Update this after every branch: move items between lists and add new ones as they come up.

### Done
- Figma: all pages desktop and mobile, order flow (5 steps), cart, states, opening options, header/home info component, later section for cookies and merch.
- Repo connected to the store as an unpublished theme. Live landing page untouched.
- Merged: foundations, home, home-scale (one-unit scaling with floors), order-panel (order panel, help me order pop out, ordering rules in theme settings, pick up line per whole pie; pointed at the test data), header-info (info masthead on the 12-column grid, opening hours and open/closed status, sticky compact header, new mobile header, block system on every section, home v2 order, visit split with hours, pink sign up band, follow us drifting strip with instagram, tiktok and substack).
- Store: pick up address, timezone Australia/Sydney, header and footer menus, follow_us_post metaobject, test data (4 test pies tagged test, Pies collection, hidden Pick up product with dates 2026-11-20 to 2026-12-10, cap 20, 21 and 28 Nov sold out).

### In progress
- product-page: rebuilt and pushed, waiting on Rich's review. Desktop two columns (4:5 photo to column 7, buy column sticky on the right, everything to buy in view on load from 1280), mobile add to cart bar, pre order split, More pies. Suzie's ordering values set as defaults (lead 2, cut-off 12:00, caps off via "Use daily caps"). To confirm with Rich: the buy column is sticky rather than the photo, because a 4:5 photo at 7 columns is taller than the window.
- cart (stacked on product-page): built and pushed, waiting on review. Drawer on every page (pink, 566 on the right; full-screen sheet on mobile), cart page with the same contents, remove per line, empty state, live count, Section Rendering API refresh, newest line highlights. Moving an order to a new date updates the pies already in the cart. No quantity stepper (not in Figma): a pie added twice shows as 2, remove takes the line out.
- pages (stacked on cart): built and pushed, waiting on review. Menu and today's counter from the menu_item metaobject, about, pre order (soon, open and closed states from the theme setting windows; pre order pies get window dates only and a "pre order" button), wholesale and contact (Shopify contact form; not test-submitted), ordering and pick up plus ingredients and allergens (both on the info template, each list limited to its page), policy styling, 404, opening soon password page, gift card. Not previewable yet: the password page (store not password protected) and the gift card (gift cards off).
- meta (stacked on pages): favicon and link previews built and pushed, waiting on review. Favicon legibility at 16 and 32 is for Rich to judge.
- motion (stacked on meta): built and pushed, waiting on review. Nav colour underline (option B) with aria-current, order active on product pages and while the panel is open, button and cart hover fills, focus rings, cross-document view transitions, prefetch on hover, cart count bump. Panels, help me order steps, progress bar, image fades, status pulse, sticky bar and the drawer highlight were already in place.

### Next, in order
1. Review and merge, in order: product-page, cart, pages, meta, motion.
2. QA: 1024, 1280, 1440, 1920, 390, accessibility, speed, test orders, notification emails (order confirmation, ready for pick up), checkout branding.
3. Launch: load follow us posts (follow_us_post entries by hand), real products in, test data removed, photos moved to Shopify Files, domain connected, redirects from the old site, publish theme.

### Backlog (not scheduled)
- How pick up date variants are created and topped up over time, so Suzie doesn't do it by hand.
- Cookies and merch (designs kept in Figma).
- Gift cards: off for now.
- Klaviyo for sign up, later.
- Instagram live sync: a scheduled function (likely on Vercel) reads @cakehousepies posts through the Instagram API (professional account, Suzie authorises once), refreshes its own token and writes the latest posts into follow_us_post. The theme stays unchanged. TikTok stays manual unless we apply for TikTok API access after launch.
- Pre order collection (handle pre-order) to create in the store, and the footer policies link to set (only the privacy policy exists so far).

### Waiting on Suzie
- Pie list, prices and photos.
- Opening times for December (open every day). Daily cap numbers, if caps are switched on.
- Opening hours, about copy, policy wording, wholesale details, drinks for the menu.
