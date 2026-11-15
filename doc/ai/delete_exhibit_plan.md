# Delete Exhibit: Implementation Plan

## Repository findings

- `server/src/routes/exhibits.js` applies `requireAuth` to every exhibit endpoint. Existing retrieval checks scope records by `req.session.userId`.
- `server/prisma/schema.prisma` stores each exhibit's content, mood, and visual `styleConfig` on the `Exhibit` row. There are no other exhibit-owned relations, so deleting that row removes its visual configuration without affecting the user. No migration is needed.
- `client/src/App.jsx` owns gallery state and renders the saved gallery through `ExhibitCard`. It separately displays the most recently generated exhibit, so that display should be cleared if it has the same ID as the deleted exhibit.
- `client/src/components/ExhibitCard.jsx` and `.css` define the card but have no delete action or dialog integration. There is no existing confirmation dialog component.
- The exhibit cards currently have no click action. The delete button should still stop event propagation and use `type="button"` to avoid accidental future card/form actions.
- The decoration characters in `ExhibitCard.jsx` appear garbled in source output; this is an existing issue separate from deletion.

## Proposed implementation

1. Add `DELETE /:id` to the authenticated exhibits router. Validate the ID as a positive integer, then delete with both `id` and `req.session.userId` in the Prisma condition. Return 404 when no owned exhibit matches, 200 with a success message on deletion, and a generic 500 error for database failures.
2. Add an accessible delete button to `ExhibitCard`, styled to fit the existing museum card design. Disable it while a deletion is in progress and stop its click from bubbling.
3. Add a confirmation dialog in the app flow with the exhibit-specific title, permanent-deletion explanation, Cancel, and Delete actions. Support keyboard use and Escape to cancel. Prevent repeat submissions while the request is active.
4. On success, remove the exhibit from React gallery state without refetching, clear the separate newly generated exhibit if it has the deleted ID, and let the existing empty-gallery message handle the last-item case. On failure, keep the exhibit visible and display an error that allows retry.
5. Verify valid deletion, cancel behavior, invalid and missing IDs, unauthenticated requests, cross-user ownership protection, error-state retention, duplicate-submit prevention, and the empty-gallery state.

## Files expected to change

- Modify: `server/src/routes/exhibits.js`
- Modify: `client/src/components/ExhibitCard.jsx`
- Modify: `client/src/components/ExhibitCard.css`
- Modify: `client/src/App.jsx`
- Modify: `client/src/App.css`

No database migration or authentication changes are expected.

## Implementation checkpoints

Implement the backend endpoint first and verify its response and ownership behavior. After review, add the card action and confirmation flow, then update gallery state behavior and complete UI and security verification. Pause for approval after each stage as requested in `doc/ai/delete_exhibit.md`.
