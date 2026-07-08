# Security Specification - Seminar Registration & Tracking System

## 1. Data Invariants

- **Users**: 
  - A user profile must belong to the authenticated owner: `uid == request.auth.uid`.
  - Only authenticated users can register their profiles.
  - The role field is immutable or can only be managed under strict validation or simulation gates.

- **Seminars**:
  - A seminar must contain all required fields.
  - `capacity` must be a positive integer.
  - Non-admins can only create seminars where they are set as the `organizerId`.
  - Non-admins can only update/delete seminars if they are the designated organizer.

- **Sessions**:
  - A session can only exist as a subcollection under a valid seminar.
  - It must have a valid `seminarId` matching the parent document's ID.

- **Registrations**:
  - Any registration must verify `userId == request.auth.uid` (unless the guest flow is used, but for our secure rules we mandate authentication for operations or restrict read/write).
  - A registration must start with `status == "registered"` or `status == "waitlisted"`.
  - Once created, the `userId`, `seminarId`, and `code` are immutable.

- **Attendance**:
  - Can only be logged under a valid session.
  - Registration code or user checking in must be validated.

---

## 2. The "Dirty Dozen" Payloads (Rogue Payloads)

These 12 payloads represent malicious attempts to bypass identity, integrity, and state rules. They must all result in `PERMISSION_DENIED`.

### Payload 1: Role Escalation on Profile Creation
An attacker tries to create a user profile designating themselves as an `Admin` directly.
```json
{
  "uid": "attacker_id",
  "name": "Evil Attacker",
  "email": "attacker@evil.com",
  "role": "Admin",
  "createdAt": "2026-07-08T03:00:00Z"
}
```
*Required Result: PERMISSION_DENIED (Must not be able to self-assign Admin).*

### Payload 2: Profile Identity Spoofing
Attacker tries to overwrite another user's profile.
```json
// Target path: /users/victim_uid
{
  "uid": "victim_uid",
  "name": "Victim",
  "email": "victim@victim.com",
  "role": "Attendee"
}
```
*Required Result: PERMISSION_DENIED (`victim_uid != request.auth.uid`).*

### Payload 3: Unauthenticated Seminar Creation
An unauthenticated user attempts to create a seminar.
```json
{
  "title": "Hack Seminar",
  "description": "Unauth event",
  "startDate": "2026-07-08T10:00:00Z",
  "endDate": "2026-07-08T12:00:00Z",
  "venue": "Internet",
  "capacity": 100,
  "status": "Published",
  "organizerId": "victim_uid",
  "category": "Tech"
}
```
*Required Result: PERMISSION_DENIED (Must be authenticated).*

### Payload 4: Seminar Organizer Hijacking
An authenticated attacker tries to create a seminar with someone else's organizer ID.
```json
{
  "title": "Fake Seminar",
  "description": "Spoofed organizer",
  "startDate": "2026-07-08T10:00:00Z",
  "endDate": "2026-07-08T12:00:00Z",
  "venue": "Room 101",
  "capacity": 50,
  "status": "Published",
  "organizerId": "victim_uid",
  "category": "Tech"
}
```
*Required Result: PERMISSION_DENIED (`incoming().organizerId == request.auth.uid`).*

### Payload 5: Rogue Session Injection
Attacker tries to insert a session into another organizer's seminar subcollection.
```json
// Path: /seminars/victim_seminar_id/sessions/rogue_session
{
  "seminarId": "victim_seminar_id",
  "title": "Secret Backdoor",
  "speakerName": "Loki",
  "startTime": "2026-07-08T10:00:00Z",
  "endTime": "2026-07-08T12:00:00Z"
}
```
*Required Result: PERMISSION_DENIED (Parent seminar must be owned by the sender).*

### Payload 6: Capacity Value Poisoning
Organizer tries to set the seminar capacity to a negative number or extremely large size to crash the app.
```json
{
  "title": "Break Capacity",
  "capacity": -5,
  "status": "Draft"
}
```
*Required Result: PERMISSION_DENIED (Capacity must be > 0).*

### Payload 7: Double-Booking / Ticket Forgery
Attacker registers for a seminar using someone else's identity.
```json
{
  "userId": "victim_uid",
  "userName": "Victim User",
  "userEmail": "victim@victim.com",
  "seminarId": "test_seminar_id",
  "seminarTitle": "Super Tech Talk",
  "code": "FORGEDCODE123",
  "status": "registered"
}
```
*Required Result: PERMISSION_DENIED (`userId == request.auth.uid`).*

### Payload 8: Immutable Registration Bypass
Attacker tries to update their existing registration to point to a different seminar or user.
```json
{
  "userId": "attacker_id",
  "seminarId": "different_seminar_id",
  "code": "TAMPEREDCODE",
  "status": "registered"
}
```
*Required Result: PERMISSION_DENIED (Registrations are immutable for core fields).*

### Payload 9: Terminal State Shortcut
Attacker tries to reactivate or tamper with a cancelled registration.
```json
// Existing registration has status == "cancelled"
{
  "status": "registered"
}
```
*Required Result: PERMISSION_DENIED (Cannot modify cancelled registrations).*

### Payload 10: Rogue Attendance Log
An attendee tries to check themselves in directly without an organizer or admin role.
```json
// Path: /seminars/seminar1/sessions/session1/attendances/rogue_att
{
  "registrationId": "attacker_reg_id",
  "sessionId": "session1",
  "seminarId": "seminar1",
  "checkedInAt": "2026-07-08T03:00:00Z"
}
```
*Required Result: PERMISSION_DENIED (Check-in requires authorized organizer/admin access or verification).*

### Payload 11: SQL/NoSQL Injection in IDs
Attacker uses a 1MB junk ID string to inject rules code or overload memory.
```json
// ID: "a" * 1000000
```
*Required Result: PERMISSION_DENIED (`isValidId()` constraint: size <= 128).*

### Payload 12: Secret Scrape Request (Blanket Read)
Attacker issues a query to list all registration codes of other users.
```json
// Request: getDocs(/registrations) without where clause filtering by userId
```
*Required Result: PERMISSION_DENIED (Rules must enforce list query checks against `resource.data.userId == request.auth.uid`).*

---

## 3. The Test Runner Spec

The testing logic resides in `firestore.rules.test.ts`. This describes how tests assert the above "Dirty Dozen" rules.

```typescript
// firestore.rules.test.ts
import { assertFails, assertSucceeds, initializeTestEnvironment } from '@firebase/rules-unit-testing';

describe("Seminar System Security Rules", () => {
  let testEnv;

  beforeAll(async () => {
    testEnv = await initializeTestEnvironment({
      projectId: "gen-lang-client-0508656666",
      firestore: {
        host: "localhost",
        port: 8080,
      }
    });
  });

  it("denies role escalation (Payload 1)", async () => {
    const unauthDb = testEnv.authenticatedContext("attacker").firestore();
    await assertFails(unauthDb.doc("users/attacker").set({
      uid: "attacker",
      name: "Evil Attacker",
      email: "attacker@evil.com",
      role: "Admin"
    }));
  });

  // ... additional tests for all other Payloads 2 to 12
});
```
