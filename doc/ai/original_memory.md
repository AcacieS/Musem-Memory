# Codex Task: Toggle Between Exhibit Description and Original Memory

## 1. Project Context

Life Museum lets users write personal memories and turns them into museum-style exhibits.

The application uses:

- Frontend: React + Vite (JavaScript / JSX, not TypeScript)
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- AI: Google Gemini (`@google/genai`)
- Authentication: bcrypt + express-session
- Session storage: PostgreSQL using connect-pg-simple

The project has two main folders: `client/` and `server/`.

The Prisma `Exhibit` model has an `originalText` field. Inspect the actual code before making changes; do not assume the current behavior matches this description exactly.

---

## 2. Feature: Toggle the Exhibit Description

Each exhibit card should let the user switch the card's description area between:

1. The AI-generated exhibit description.
2. The exact original memory submitted by the user.

This is an inline card toggle. Do not open a modal or navigate to another page.

When the original memory is displayed:

- Keep the exhibit title and subtitle unchanged.
- Keep the tags, date, palette, font, border, decoration, and layout unchanged.
- Replace only the description text with `originalText`.
- Show a clear `ORIGINAL` marker so the user can tell which view is active.
- Change the button label to `Show AI Description` (or similarly clear wording) so the user can switch back.

When the AI description is displayed, use the preferred button label **Read Original Memory**.

The original text must be displayed as submitted. Do not rewrite, summarize, spell-correct, trim for display, or send it through Gemini again.

---

## 3. Frontend Requirements

Add the toggle to each `ExhibitCard`.

The control should:

- Fit the existing Life Museum design and remain secondary to the artwork.
- Have visible hover and keyboard focus states.
- Be operable with a keyboard and use a descriptive accessible label.
- Not trigger other card actions when activated.
- Toggle back and forth repeatedly without changing the exhibit's other fields.

Preserve original formatting:

- Keep line breaks and repeated spaces visible, such as with `white-space: pre-wrap`.
- Wrap long words so they do not overflow the card.
- Make the full original text readable even when it is longer than the normal AI description. Use an appropriate scrollable description area or card expansion consistent with the existing card dimensions.
- Keep the card usable on mobile.

If an exhibit has missing or empty original text, handle it without crashing. Disable the toggle or show a clear unavailable state.

---

## 4. Data and Backend Requirements

Inspect the existing exhibit GET routes first.

If the authenticated gallery response already returns `originalText`, use that field directly. Do not add an API endpoint or database migration unnecessarily.

Retrieval must continue to enforce authentication with `requireAuth` and ownership through `req.session.userId`. Do not add an unauthenticated endpoint or trust a user ID supplied by the frontend.

The original memory must remain exact. Inspect the create route to confirm it stores the raw submitted text. Validation may use `.trim()` to reject whitespace-only input, and Gemini may receive a trimmed copy, but persistence must save the original request string unchanged. Existing records whose leading or trailing whitespace was already trimmed cannot be reconstructed.

---

## 5. Component Organization

Inspect the actual React structure and reuse its existing design system.

Likely files:

- `client/src/components/ExhibitCard.jsx`
- `client/src/components/ExhibitCard.css`
- `server/src/routes/exhibits.js` if the create route changes the submitted text before saving

The toggle state should live with the individual `ExhibitCard` unless repository inspection identifies a concrete need for parent state. There should be no modal component for this feature.

Keep the AI exhibit description and original memory as separate values. Do not overwrite either value when toggling.

---

## 6. Preserve Existing Features

Do not break:

- Registration, login, logout, and session persistence.
- Exhibit generation and saved exhibit retrieval.
- AI visual identities and card layout.
- Exhibit deletion and ownership checks.

Deleting a card removes it from the gallery as it does now; because the original-memory view is local to the card, deleting the card must not leave stale original text elsewhere.

---

## 7. Testing Requirements

Verify:

### Toggle behavior

- `Read Original Memory` displays the original text in place of the AI description.
- The `ORIGINAL` marker appears only while original text is shown.
- `Show AI Description` restores the AI description.
- Toggling repeatedly does not change title, subtitle, tags, date, or visual style.
- The button works by mouse and keyboard and does not activate other card actions.

### Exact text and formatting

- Test multiple paragraphs, line breaks, punctuation, repeated spaces, and leading/trailing whitespace on newly created records.
- Confirm the original text is not sent through Gemini again or modified for display.
- Confirm long text remains fully readable and does not overflow the card on desktop or mobile.

### Persistence and safety

- Refresh the gallery and verify the original memory is still available.
- Verify authenticated ownership remains enforced and no new public endpoint was added.
- Verify empty or missing original text produces a safe unavailable state.
- Verify deleting an exhibit removes its card and therefore its toggle state.

---

## 8. Implementation Workflow

### Step 1: Inspect

Inspect the Prisma model, exhibit GET and POST routes, auth middleware, React gallery, `ExhibitCard`, and its styles. Determine whether `originalText` already reaches the frontend and whether the create route preserves it exactly.

### Step 2: Present a plan

Explain the existing data flow, the files to change, any required persistence fix, how the per-card toggle works, and relevant ownership safeguards. Do not modify application files before plan approval.

### Step 3: Implement in small stages

After approval:

1. Ensure the authenticated gallery data contains the original text; make only the necessary create-route persistence adjustment if submitted text is currently trimmed before saving.
2. Add per-card toggle state and switch only the description area.
3. Add the `ORIGINAL` marker, accessible button labels, and styling for exact text and long content.
4. Verify toggle, formatting, persistence, deletion compatibility, and responsive behavior.

After each stage, summarize the changes and what to check, then wait for confirmation before continuing.

### Step 4: Review

Review exact text preservation, line breaks and spaces, accessible keyboard operation, responsive overflow, user ownership, and compatibility with exhibit deletion and visual styles.

---

## 9. Development Constraints

- Use JavaScript and JSX, not TypeScript.
- Reuse existing dependencies; do not add a UI framework.
- Do not rewrite authentication or modify Gemini generation logic.
- Do not create an unnecessary endpoint or migration.
- Do not modify, regenerate, or summarize original memories.
- Keep the implementation beginner-friendly and preserve the Life Museum visual identity.

If existing behavior conflicts with these requirements, explain the smallest safe change before implementing it.

## Final Goal

Each gallery card keeps its AI-created title and subtitle while letting the user switch its description area between the AI interpretation and the exact original words. A visible `ORIGINAL` marker identifies the original-memory view, and the user can switch back at any time.

**Start with Step 1: inspect the repository and present the implementation plan. Do not modify application files until I approve the plan.**
