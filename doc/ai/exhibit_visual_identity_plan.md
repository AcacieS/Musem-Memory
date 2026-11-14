# Exhibit Visual Identity: Implementation Plan

## Repository findings

- The app is split into `client/` (React 19 + Vite, JavaScript/JSX) and `server/` (Express 5, Prisma, PostgreSQL). Vite proxies `/api` to the server on port 3000.
- `server/src/services/ai.js` calls Gemini with an existing `responseSchema` for `title`, `subtitle`, `description`, and `tags`. It parses JSON and validates those content fields, but parsing/malformed or incomplete responses currently become an error; visual identity fields and validation do not exist.
- `server/src/routes/exhibits.js` requires authentication for all exhibit endpoints, filters retrieval by the session's `userId`, and creates exhibits using the generated object plus `userId`. Preserve these ownership checks and the existing content fields.
- `server/prisma/schema.prisma` defines `Exhibit` with `originalText`, content fields, tags, timestamps, and user relation. It has no mood or JSON style field. Existing migrations create exhibits and later add authentication/user ownership.
- `client/src/App.jsx` handles login state, exhibit creation, refresh/retrieval, and both the newly generated exhibit and saved gallery. Gallery cards are currently inline markup using `.exhibit-card` rules in `client/src/App.css`. There is no component folder or separate exhibit style system yet.
- `client/src/index.css` sets the global typography and page background. The existing visual identity is restrained, warm, and museum-like; keep the page layout and shared gallery structure intact.
- Prisma configuration is in `server/prisma.config.ts`; the migration history is under `server/prisma/migrations/`. A migration should add nullable fields so existing records remain valid.

## Proposed implementation

1. Add a frontend design-system module with the approved palette, font, border, decoration, layout identifiers, and a safe default. Use a single validation/mapping path so saved identifiers only select predefined CSS classes or variables.
2. Extend the Gemini response schema and prompt with `mood`, `themes`, and `styleConfig`. Validate and normalize the generated response on the server, including each style identifier; preserve valid exhibit content and substitute a safe visual default when visual fields are absent or invalid. Keep the API key and Gemini call server-side.
3. Add optional `mood` and `styleConfig` fields to Prisma's `Exhibit` model and create a migration that adds nullable database columns without changing existing records. Save only the normalized identifiers, not CSS.
4. Add `ExhibitCard.jsx` and its CSS for shared card content, fallback styling, subtle decorations, constrained text/tags, and responsive sizing. Keep the existing gallery framing and card behavior.
5. Replace the inline saved-gallery card markup in `App.jsx` with the reusable component. The newly acquired exhibit display can remain as-is unless implementation inspection shows reuse is straightforward without altering its layout.
6. Verify generation, persistence/retrieval, old-record fallback, invalid-style fallback, responsive/long-content behavior, and unchanged authentication/ownership paths.

## Files expected to change in implementation

- Modify: `server/src/services/ai.js`
- Modify: `server/src/routes/exhibits.js`
- Modify: `server/prisma/schema.prisma`
- Create: a new migration under `server/prisma/migrations/`
- Create: `client/src/styles/exhibitStyles.js`
- Create: `client/src/components/ExhibitCard.jsx`
- Create: `client/src/components/ExhibitCard.css`
- Modify: `client/src/App.jsx`
- Modify: `client/src/App.css` (remove or adjust gallery card rules after component styling is integrated)

## Issues to account for

- `generateExhibit()` currently uses `JSON.parse()` without a local malformed-response fallback, and its validation rejects incomplete content. The visual fallback should be narrow: it should protect style rendering without silently replacing required exhibit text.
- The route spreads the AI response into Prisma create data. Once the new schema fields exist, the server should pass a deliberately normalized object so arbitrary extra model keys cannot be persisted.
- Existing exhibits will have null visual fields after migration; the frontend must apply its default theme when fields are null, malformed, or contain unknown identifiers.
- The route stores `originalText` as submitted after checking a trimmed copy; implementation should consistently save the validated trimmed memory while preserving the current request contract.
- The existing card CSS is global to `App.css`; moving its visual rules into the component stylesheet must avoid changing the overall grid, gallery spacing, or hover interaction.

## Implementation sequence and checkpoints

Work one stage at a time: (1) design system, (2) Gemini structure and server validation, (3) schema and migration, (4) reusable card, (5) gallery integration, then (6) verification. After each stage, summarize the change and what to check, then wait for approval before continuing.
