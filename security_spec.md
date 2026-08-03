# Security Specification

## 1. Data Invariants
- An Admin document cannot be modified or roles escalated except by a verified Superadmin.
- Indicator documents require valid fields, and non-superadmins are restricted to editing only progression fields.
- Activities are immutable audit trails; once written, they cannot be updated or deleted.
- Only verified users (`email_verified == true`) are allowed write access to critical collections.
- The user email `banjays@gmail.com` is bootstrapped as the initial Superadmin.

## 2. Dirty Dozen Malicious Payloads
Here are 12 payloads representing malicious writes that must return `PERMISSION_DENIED`:

1. **Privilege Escalation**: Attempt to create an Admin record as a non-authenticated user.
2. **Self-Promotion**: Non-admin user attempts to create themselves in `/admins/{uid}` with `role: "superadmin"`.
3. **Ghost Fields on Indicator**: Admin attempts to update an Indicator with unexpected fields like `{ isHack: true }`.
4. **Unauthorized SDG Changes**: Normal admin attempts to modify SDG code or Indicator Weight (only superadmin should modify weights).
5. **Activity Log Tampering**: User tries to edit a logged activity in `/activities/{activityId}` to hide logs.
6. **Activity Log Deletion**: User tries to delete an activity log to erase historical traces.
7. **Identity Spoofing in Audit**: User writes to `/activities` but sets `userId` to a different user's UID.
8. **Malicious ID injection**: Attempting to write an indicator document with ID containing junk binary characters.
9. **Invalid Data Type in Indicator**: Admin updates `annualProgress` to `"hundred"` (string instead of number).
10. **Timestamp Manipulation**: Admin creates an activity setting `timestamp` to a future/past date instead of `request.time`.
11. **Metadata Manipulation**: Standard logged-in user attempts to overwrite the Sync Metadata records.
12. **Null/Unauthenticated Access**: Unauthenticated visitor attempts to read `/activities` and `/admins` nodes.

## 3. Mock Test Cases
The firebase-blueprint rules are explicitly modeled to block these. Let's verify our `firestore.rules` draft blocks all of them.
