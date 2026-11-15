# Codex Task: Delete Exhibits in Life Museum

## 1. Project Context

I am building a full-stack web application called **Life Museum**.

The application allows users to:
- Register and log in.
- Write personal memories.
- Generate museum-style exhibits using Google Gemini.
- Save their exhibits in PostgreSQL.
- View their personal exhibit gallery.

The application uses:

- Frontend: React + Vite (JavaScript / JSX, NOT TypeScript)
- Backend: Node.js + Express
- Database: PostgreSQL
- ORM: Prisma
- AI: Google Gemini (`@google/genai`)
- Authentication: bcrypt + express-session
- Session storage: PostgreSQL using connect-pg-simple

The project has two main folders:
- `client/`
- `server/`

The application already has user authentication and exhibits associated with individual users.

It also has an AI-generated exhibit visual identity feature, which gives each exhibit its own visual style based on the original memory.

**Before making changes, inspect the actual repository. Do not assume the current implementation exactly matches this description.**

---

## 2. New Feature: Delete an Exhibit

I want users to be able to delete their own exhibits from their Life Museum gallery.

Each exhibit should have a delete option.

When a user deletes an exhibit:
- It should be permanently removed from the database.
- It should disappear from the gallery immediately after successful deletion.
- The user should receive appropriate feedback.
- The user must not be able to delete another user's exhibit.

The deletion should also remove the exhibit's associated visual configuration and other exhibit-specific data, since these belong to the deleted exhibit.

---

## 3. Frontend Requirements

Add a delete button or delete icon to each exhibit card.

The button should:
- Be visually consistent with the existing Life Museum design.
- Be easy to find but not distract from the exhibit artwork.
- Have an appropriate hover state.
- Have an accessible label, such as `Delete exhibit`.
- Avoid triggering other card interactions when clicked.

### Confirmation

Deleting an exhibit is permanent, so I want a confirmation step.

Before deletion, show a confirmation dialog.

Suggested wording:

**Delete this exhibit?**

"This memory will be permanently removed from your museum. This action cannot be undone."

Buttons:
- Cancel
- Delete exhibit

The dialog should:
- Clearly distinguish the destructive action.
- Close without deleting when Cancel is selected.
- Prevent accidental repeated submissions while deletion is in progress.
- Be accessible using keyboard navigation.
- Support Escape to close when appropriate.

Do not use `window.confirm()` unless there is a strong reason. Prefer a confirmation dialog that fits the existing application design.

### Gallery behavior

After a successful deletion:
- Remove the deleted exhibit from React state.
- Update the gallery immediately.
- Do not require a full page refresh.
- If the deleted exhibit is currently selected or displayed separately, clear that selection.
- If no exhibits remain, display a friendly empty-gallery message.

If the deletion request fails:
- Keep the exhibit in the gallery.
- Display a meaningful error message.
- Allow the user to retry.

---

## 4. Backend Requirements

Add a DELETE endpoint to the existing exhibits router.

Suggested endpoint:

`DELETE /api/exhibits/:id`

The endpoint should:

1. Require authentication.
2. Validate that the exhibit ID is a valid positive integer.
3. Verify that the exhibit belongs to the currently authenticated user.
4. Delete only that exhibit.
5. Return an appropriate success response.
6. Handle missing exhibits and database errors appropriately.

### Security requirement

This is especially important.

Never trust an exhibit ID provided by the frontend as proof of ownership.

Use the authenticated session:

`req.session.userId`

The deletion query must check both:
- The exhibit ID.
- The authenticated user's ID.

For example, consider using Prisma's `deleteMany` with both conditions:

```js
const result = await prisma.exhibit.deleteMany({
  where: {
    id: exhibitId,
    userId: req.session.userId
  }
})
```

Then check whether `result.count` is zero.

This prevents users from deleting exhibits belonging to other accounts.

Do not remove or weaken the existing `requireAuth` middleware.

Suggested responses:

**Success: HTTP 200**
```json
{
  "message": "Exhibit deleted successfully."
}
```

**Not found or not owned: HTTP 404**
```json
{
  "error": "Exhibit not found."
}
```

**Not authenticated: HTTP 401**
Use the existing authentication middleware behavior.

**Invalid ID: HTTP 400**
```json
{
  "error": "Invalid exhibit ID."
}
```

Do not expose unnecessary database error details to the frontend.

---

## 5. Database Requirements

Inspect the existing Prisma schema.

The current Exhibit model contains:
- Exhibit content
- User relationship
- Mood and visual style configuration (if implemented)

The deletion should remove the complete exhibit record.

Do not delete the user account.

If the project has additional tables or related records associated with exhibits, inspect their relationships and determine whether they should also be deleted.

Use cascading deletion only when it is appropriate for exhibit-owned records.

**Do not delete unrelated data or change existing user relationships.**

A database migration should not be necessary if the existing schema already supports this operation. Do not create unnecessary migrations.

---

## 6. Code Organization

Reuse the existing project structure.

Likely files to inspect or modify:

- `server/src/routes/exhibits.js`
- `server/src/middleware/requireAuth.js`
- `client/src/App.jsx`
- `client/src/components/ExhibitCard.jsx`
- `client/src/components/ExhibitCard.css`
- Any existing dialog or shared UI components

These are suggestions, not mandatory file paths. Follow the actual repository structure.

Keep deletion logic separate from exhibit generation logic where appropriate.

Do not rewrite the existing application.

---

## 7. Testing Requirements

Test the following scenarios:

### Normal deletion
- Log in.
- Create an exhibit.
- Delete it.
- Confirm deletion.
- Verify it disappears from the gallery.
- Refresh the page.
- Verify it remains deleted.

### Cancel deletion
- Click Delete.
- Select Cancel.
- Verify the exhibit remains in the gallery and database.

### Ownership security
- Create two different user accounts.
- Create exhibits under both accounts.
- Log in as User A.
- Attempt to delete User B's exhibit using its ID.
- Verify that the backend refuses the deletion.
- Verify that User B's exhibit remains intact.

### Invalid requests
- Try an invalid exhibit ID.
- Try deleting an exhibit that does not exist.
- Try deleting without being authenticated.
- Verify appropriate HTTP status codes and error messages.

### UI behavior
- Verify that clicking the delete button does not accidentally trigger other exhibit card actions.
- Verify that repeated clicks cannot create duplicate deletion requests.
- Verify that errors do not incorrectly remove exhibits from the gallery.
- Verify that the empty-gallery state works.

---

## 8. Implementation Workflow

I am still learning full-stack development, so I want the implementation to be understandable and maintainable.

Follow this workflow:

### Step 1: Inspect the existing code

Read the existing:
- Exhibit routes.
- Authentication middleware.
- Prisma schema.
- React gallery.
- ExhibitCard component.
- Existing styling and error-handling patterns.

Identify how the delete feature should fit into the current implementation.

### Step 2: Present a plan

Before changing files:
- Explain which files need to be modified.
- Explain the backend deletion flow.
- Explain the frontend confirmation and state-update flow.
- Identify potential security concerns.

Do not modify files yet.

### Step 3: Implement in stages

After I approve the plan:

1. Implement the backend DELETE endpoint.
2. Test the endpoint.
3. Implement the frontend delete action.
4. Implement the confirmation dialog.
5. Update gallery state and empty-gallery handling.
6. Test the complete feature.

After each stage:
- Explain what changed.
- Explain why.
- Tell me what to test.
- Wait for my confirmation before continuing.

### Step 4: Review

After implementation, review the code for:
- Authentication enforcement.
- Ownership verification.
- Accidental deletion risks.
- React state consistency.
- Error handling.
- Accessibility.
- Compatibility with the existing visual identity feature.

---

## 9. Development Constraints

- Use JavaScript and JSX, not TypeScript.
- Reuse existing dependencies.
- Do not introduce a new UI framework.
- Do not rewrite authentication.
- Do not modify the Gemini generation functionality.
- Do not break the AI-generated visual identity feature.
- Preserve the existing Life Museum design.
- Do not delete database records without a user confirmation action.
- Do not weaken exhibit ownership checks.
- Keep the code beginner-friendly and modular.
- Explain unfamiliar concepts.

If something in the existing code conflicts with these requirements, explain the issue and propose the smallest safe change.

## Final Goal

Users should feel that they own their personal museum.

They can create memories, view their exhibits, and remove exhibits they no longer want to keep.

**Start with Step 1: inspect the repository and present your implementation plan. Do not modify any files until I approve the plan.**