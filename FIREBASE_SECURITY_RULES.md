# Firebase Security Rules

Use `firestore.rules` for the Lagma Village Firebase project.

What it does:

- Public visitors can read approved notes from `visitorNotes`.
- Public visitors cannot directly publish to `visitorNotes`.
- New visitor submissions go to `pendingVisitorNotes` with `status: "pending"`.
- Likes can only update a simple non-negative `count`.

After applying these rules, approve notes manually by copying clean entries from `pendingVisitorNotes` to `visitorNotes`.
