# Original Memory Toggle: Implementation Plan

## Repository findings

- `Exhibit.originalText` is a required text column in `server/prisma/schema.prisma`.
- The authenticated `GET /api/exhibits` route filters by `req.session.userId` and uses Prisma `findMany` without a restrictive `select`, so `originalText` is already returned with each exhibit. The single-exhibit GET route also checks both exhibit ID and session user ID.
- `client/src/App.jsx` loads full exhibit records into gallery state and passes each record to `ExhibitCard`.
- `ExhibitCard` already renders the AI title, subtitle, description, tags, date, and visual styles. The feature can be implemented locally per card; no parent modal state is needed.
- `App.jsx` has a native dialog for delete confirmation, but the original-memory feature should not use it. The requested interaction only replaces the card's description text.
- The POST route checks non-empty input using `.trim()` and sends a trimmed memory to Gemini, but also saves `originalText.trim()`. That loses leading/trailing whitespace. Preserve raw `originalText` in the database while leaving validation and the Gemini input unchanged.
- Existing rows may already have lost leading or trailing whitespace due to the current save behavior. That cannot be reconstructed. No schema migration is needed.

## Proposed implementation

1. Keep using the existing authenticated gallery response; do not add a route or change retrieval ownership checks.
2. Update exhibit creation to store the original request string unchanged after validation. Continue sending the trimmed copy to Gemini as before.
3. Add local toggle state to each `ExhibitCard`. In AI view, show **Read Original Memory**. In original view, replace only the description area with the exact `originalText`, show an **ORIGINAL** marker, and change the control to **Show AI Description**.
4. Keep title, subtitle, tags, date, and style configuration untouched in either view. Render original text with preserved line breaks/spaces and wrapping; make long text fully readable with a scrollable description region that fits card dimensions.
5. Handle missing/empty original text gracefully by disabling the toggle or showing an unavailable state. The existing card lifecycle handles deletion; no selected modal text can remain stale.

## Files expected to change

- Modify: `server/src/routes/exhibits.js` (save raw submitted text, while keeping validation and Gemini input behavior)
- Modify: `client/src/components/ExhibitCard.jsx`
- Modify: `client/src/components/ExhibitCard.css`

No `App.jsx` changes, modal component, new endpoint, migration, or authentication changes are expected unless implementation reveals a concrete need.

## Risks and safeguards

- Original memory is private content. Continue using the existing authenticated, owner-scoped gallery response.
- Do not trim the value when displaying it. Keep exact text separate from the AI description.
- Keep the toggle state local to its keyed card so one exhibit's view does not alter another exhibit.
- Make the full original memory reachable in the card without overflowing or clipping long content.
- Do not alter the AI description, exhibit style, or deletion flow.

## Implementation checkpoints

1. Preserve raw original text when saving new exhibits and verify the submitted string round-trips exactly.
2. Add the card toggle and `ORIGINAL` marker; verify that title, subtitle, tags, and style remain unchanged while the description switches and switches back.
3. Check whitespace, long content, keyboard operation, empty text, persistence after refresh, and compatibility with deletion.

Pause after each implementation stage for review as required by `doc/ai/original_memory.md`.
