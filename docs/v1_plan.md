# Personal Relationship Manager

## Complete Development Handover and Implementation Plan

---

# 1. Project Overview

Build a private-first **Personal Relationship Manager** using Next.js.

The application is similar to a personal CRM, but focused on remembering and managing information about people and relationships.

The application should allow a user to:

* Maintain detailed profiles of people.
* Record notes.
* Associate notes with multiple people.
* Record interactions.
* Track relationships between people.
* Track important dates and life events.
* Create reminders.
* Track interaction frequency.
* Visualize a connection graph.
* Search and filter information.
* Import/export data.
* Maintain complete user data isolation.

---

# 2. Core Product Principles

The application must follow these principles.

## 2.1 Private by default

All user data must be private.

A user must never be able to:

* Read another user's people.
* Read another user's notes.
* Read another user's reminders.
* Read another user's interactions.
* Read another user's relationships.
* Guess IDs and access another user's data.
* Import data into another user's account.
* Export another user's data.

Even though the initial deployment has only one user, the architecture must support multiple users securely.

---

## 2.2 Authentication is not authorization

Authentication answers:

> Who is this user?

Authorization answers:

> Is this user allowed to access this data?

Every data access must verify ownership.

Never rely only on:

* Hidden UI.
* Route protection.
* Client-side checks.
* Public IDs.

All sensitive operations must enforce ownership on the server.

---

## 2.3 Single-user launch, multi-user-ready architecture

Initially:

* Only the application owner can log in.
* Public signup is disabled.

Later, it should be possible to:

* Enable registration.
* Allow additional users.
* Give every user an isolated dataset.

Do not require a major schema redesign to support this.

---

## 2.4 No encryption at rest in V1

Application-level encryption is not required initially.

However, architecture should not make future encryption impossible.

For now:

* Use HTTPS.
* Use authenticated sessions.
* Keep database credentials secret.
* Scope all data by `userId`.
* Never expose database credentials to the client.

---

## 2.5 Stable visible IDs

Every major entity must have:

1. MongoDB `_id`
2. A human-readable `publicId`

Example:

```text
PER_A7K29X
NOTE_B82K1P
REM_C91Q7A
INT_D28M4X
REL_E71P9K
EVT_F62A8B
```

Public IDs must:

* Be unique.
* Never change.
* Be visible in the UI.
* Be usable in imports.
* Be preserved during exports.
* Be preserved when importing backups where possible.

---

# 3. Technology Stack

Use:

```text
Framework:
Next.js

Router:
App Router

Language:
TypeScript

Database:
MongoDB Atlas

ODM:
Mongoose

Authentication:
Better Auth

Authentication Provider:
Google OAuth

Styling:
Tailwind CSS

UI:
shadcn/ui

Theme:
next-themes

Forms:
React Hook Form

Validation:
Zod

Rich Text / Markdown Editor:
MDXEditor

Connection Graph:
React Flow

Date Utilities:
date-fns

Icons:
Lucide React
```

---

# 4. Authentication Architecture

## 4.1 Initial login behavior

Initially:

* Google OAuth login.
* No public signup.
* Only allowed email addresses can access the application.

Use an environment variable:

```env
ALLOWED_EMAILS=your-email@gmail.com
```

Support multiple emails using comma separation.

Example:

```env
ALLOWED_EMAILS=email1@gmail.com,email2@gmail.com
```

The application should parse this into an allowlist.

---

## 4.2 Authentication flow

```text
User
  │
  ▼
Google Login
  │
  ▼
Google verifies identity
  │
  ▼
Better Auth receives user
  │
  ▼
Check ALLOWED_EMAILS
  │
  ├── Not allowed
  │       │
  │       ▼
  │    Reject access
  │
  ▼
Allowed
  │
  ▼
Create / validate session
  │
  ▼
Access application
```

---

## 4.3 Future public mode

Do not hardcode the application around one user.

Instead, use a configuration concept.

Example:

```env
ALLOW_PUBLIC_REGISTRATION=false
```

Initial behavior:

```text
false
```

Future:

```text
true
```

When enabled, new users may register through supported authentication providers.

---

# 5. Data Ownership Architecture

Every user-owned document must contain:

```ts
userId: string
```

Example:

```ts
{
  _id: ObjectId,

  publicId: "PER_A7K29X",

  userId: "authenticated-user-id",

  fullName: "John Doe"
}
```

The following collections must include `userId`:

```text
people
notes
reminders
interactions
relationships
events
savedViews
settings
```

---

# 6. Critical Authorization Rule

Never query data like:

```ts
Person.findById(personId);
```

Instead:

```ts
Person.findOne({
  _id: personId,
  userId: currentUser.id,
});
```

Or preferably use a central Data Access Layer.

Example:

```ts
getPerson({
  personId,
  userId,
});
```

Internally:

```ts
Person.findOne({
  _id: personId,
  userId,
});
```

This must apply everywhere.

---

# 7. Data Access Layer

Create a dedicated server-side data access layer.

Suggested location:

```text
src/lib/dal/
```

Example:

```text
src/lib/dal/
├── auth.ts
├── people.ts
├── notes.ts
├── reminders.ts
├── interactions.ts
├── relationships.ts
├── events.ts
├── saved-views.ts
└── settings.ts
```

Each DAL function must:

1. Verify the current session.
2. Obtain the authenticated user.
3. Scope database queries to that user.
4. Return only required data.

Example:

```ts
export async function getPerson(personId: string) {
  const user = await requireUser();

  return Person.findOne({
    _id: personId,
    userId: user.id,
  });
}
```

Do not trust `userId` coming from the client.

The server determines the user.

---

# 8. Core Entities

The application contains the following primary entities.

```text
User
 │
 ├── People
 │
 ├── Notes
 │
 ├── Interactions
 │
 ├── Reminders
 │
 ├── Relationships
 │
 ├── Events
 │
 ├── Saved Views
 │
 └── Settings
```

---

# 9. Person Entity

Collection:

```text
people
```

Every person belongs to exactly one user.

---

## 9.1 Person Fields

### Identity

```text
MongoDB ID
Public ID

Full Name

Aliases
```

Aliases support multiple values.

Example:

```text
John Doe

Aliases:
Johnny
JD
Johnathan
```

---

### Relationship to Current User

Each person has a relationship to the application owner.

Examples:

```text
Friend
Relative
Professional
Romantic
School
College
Gaming
Online Friend
Community
Other
Custom
```

Support:

```text
Predefined relationship
OR
Custom relationship
```

Example:

```text
Relationship to Me:

College Friend
```

---

## 9.2 Circles / Closeness

Multi-select.

Initial options:

```text
Friend
Professional
Close
Extended
Acquaintance
Relative
```

The implementation should allow future custom circles.

Example:

```text
Circles:

✓ Friend
✓ Close
✓ Gaming
```

Circles are filterable.

---

## 9.3 Date of Birth

Store:

```text
dateOfBirth
```

Age should be calculated dynamically.

Do not store:

```text
age
```

because age changes.

Support birthdays without a known birth year if desired.

Consider a structure that can represent:

```text
October 15, 2001
```

and:

```text
October 15
```

without forcing an incorrect year.

---

## 9.4 Location

Support:

```text
Lives In
From
```

Use structured locations.

```ts
type Location = {
  displayName: string;

  city?: string;
  state?: string;
  country?: string;
};
```

Example:

```text
Lives In:

Bangalore, Karnataka, India
```

```text
From:

Kolkata, West Bengal, India
```

Locations should be filterable later.

---

## 9.5 How Met

Free-form text.

Example:

```text
Met through college in 2019.
```

---

## 9.6 Interests and Hobbies

Multiple values.

Example:

```text
Gaming
Anime
Movies
Programming
Football
Travel
```

Should support:

* Creation.
* Removal.
* Filtering.
* Searching.

---

## 9.7 Phone Numbers

Multiple phone numbers.

Structure:

```ts
{
  id: string,
  label?: string,
  value: string,
}
```

Example:

```text
Personal
+91 XXXXX

Work
+91 XXXXX
```

---

## 9.8 Emails

Multiple values.

Structure:

```ts
{
  id: string,
  label?: string,
  value: string,
}
```

Example:

```text
Personal
john@gmail.com

Work
john@company.com
```

---

## 9.9 Tags

Multiple tags.

Example:

```text
gaming
college
important
work
```

Tags must be filterable.

---

# 10. Contact Preferences

Store information such as:

```text
Preferred communication methods

Best time to contact

Things to avoid
```

Example:

```text
Preferred:

WhatsApp
Discord

Best time:

Evening

Notes:

Doesn't usually answer phone calls.
```

---

# 11. Persistent Facts / Things to Remember

Every person can contain multiple persistent facts.

UI name:

```text
Things to Remember
```

Examples:

```text
Favourite Pokémon is Gengar.

Has a dog named Bruno.

Doesn't like surprise parties.

Loves dark chocolate.
```

Each fact must have an ID.

Structure:

```ts
{
  id: string,

  publicId: "FACT_A7K29X",

  content: string,

  category?: string,

  createdAt: Date,

  updatedAt: Date,
}
```

Suggested categories:

```text
General
Preference
Food
Gaming
Work
Family
Travel
Important
Other
```

Facts are embedded inside the Person document.

---

# 12. Important Dates

People may have multiple important dates.

Examples:

```text
Birthday

Wedding Anniversary

Friendship Anniversary

Graduation

Custom Event
```

Structure:

```ts
{
  id: string,

  publicId: string,

  title: string,

  date: Date,

  recurring: boolean,
}
```

Important dates may later connect to reminders.

---

# 13. Social Profiles and Links

A person may have multiple links.

Examples:

```text
Instagram
LinkedIn
GitHub
Discord
Website
Twitter/X
Other
```

Structure:

```ts
{
  id: string,

  publicId: string,

  type: string,

  label?: string,

  url: string,
}
```

---

# 14. Person Status

Initial statuses:

```text
ACTIVE
LOST_CONTACT
ARCHIVED
DECEASED
```

Default:

```text
ACTIVE
```

Archived people should not be deleted automatically.

---

# 15. Notes

Collection:

```text
notes
```

Notes are independent entities.

Do not embed notes inside people.

A note may:

* Have no people.
* Have one person.
* Have multiple people.

---

# 16. Note Fields

```text
MongoDB ID
Public ID

Title

Content

Associated People

Tags

Created Date

Updated Date

Optional Reminder

Archived Status
```

---

# 17. Note Content

Use MDXEditor.

However:

## Do not store executable MDX.

Store the content as Markdown.

```ts
content: string;
```

Benefits:

* Portable.
* Easy to export.
* Easy to import.
* AI-friendly.
* Easy to search.
* Safer.

---

# 18. Note Creation Modes

A note can be created from:

## A. Person Profile

Example:

```text
John Doe

Notes

[ + New Note ]
```

When created:

```text
John is automatically associated.
```

The user can:

* Remove John.
* Add other people.

---

## B. Global Notes Page

Create a note with:

```text
No associated person.
```

or:

```text
One or more associated people.
```

---

# 19. Note Editor Requirements

The editor should support:

```text
Title

Markdown Editor

Associated People

Tags

Optional Reminder

Created Date
```

Buttons:

```text
Copy

Clear

Cancel

Save
```

---

## 19.1 No Autosave

There must be no automatic database save.

Saving occurs only when:

```text
Save
```

is explicitly clicked.

---

## 19.2 Unsaved Changes Protection

If the user modifies a note and attempts to:

* Navigate away.
* Close the page.
* Change to another note.

Show:

```text
You have unsaved changes.

Stay
Discard Changes
```

---

# 20. Note Import

Notes must be extremely easy to import.

This is important because AI may be used to generate structured data.

The application must support importing notes from JSON.

---

## 20.1 AI-Friendly Note Import

Support simple JSON.

Example:

```json
{
  "notes": [
    {
      "title": "College Reunion Discussion",
      "content": "# Discussion\n\nWe discussed meeting in December.",
      "people": [
        "John Doe",
        "Sarah Smith"
      ],
      "tags": [
        "college",
        "reunion"
      ],
      "createdAt": "2026-09-06"
    }
  ]
}
```

The importer should support identifying people by:

1. `publicId`
2. Full name
3. Alias

Priority:

```text
publicId
↓
exact full name
↓
exact alias
```

---

# 21. Ambiguous Person Matching

If an import references:

```text
John
```

and multiple people match:

```text
John Doe
John Smith
```

Do not silently choose one.

Report:

```text
Ambiguous Person

"John"

Possible Matches:

John Doe
PER_A7K29

John Smith
PER_B9P12
```

Allow:

```text
Select Person

Skip

Create New Person
```

---

# 22. Importing Notes Inside a Person Profile

When importing notes from inside:

```text
/people/PER_A7K29
```

The current person should automatically be associated with every imported note.

Example imported data:

```json
{
  "notes": [
    {
      "title": "Conversation",
      "content": "..."
    }
  ]
}
```

Result:

```text
Associated People:

John Doe
```

---

## 22.1 Explicit People in Imported Notes

If the imported note also contains:

```json
{
  "people": [
    "Sarah Smith"
  ]
}
```

Result:

```text
John Doe
Sarah Smith
```

---

# 23. Note Import Outside a Person Profile

If importing globally:

```text
/notes/import
```

Only people that can be resolved should be associated.

Unresolved people should be reported.

Do not automatically create people unless the user explicitly chooses that behavior.

---

# 24. AI Import Philosophy

The importer must be designed for AI-generated structured data.

Goals:

* Simple schema.
* Human-readable.
* JSON-based.
* Validation before import.
* Preview before commit.
* Clear errors.
* Partial import support.
* Dry run capability.

The user should be able to paste:

```json
{
  "people": []
}
```

or upload a file.

---

# 25. AI Import Validation Flow

```text
Paste JSON / Upload File
          │
          ▼
Validate Schema
          │
          ▼
Show Errors
          │
          ▼
Resolve References
          │
          ▼
Detect Conflicts
          │
          ▼
Preview Changes
          │
          ▼
Confirm Import
          │
          ▼
Import
```

Never immediately write imported data to the database.

---

# 26. Import Result

Show:

```text
Import Complete

People:
Created: 10
Updated: 2
Skipped: 1

Notes:
Created: 25
Skipped: 2

Warnings:
3 unresolved people references.
```

---

# 27. Interactions

Collection:

```text
interactions
```

Interactions represent actual contact or communication.

Examples:

```text
Call

Text

In Person

Video Call

Social Media

Gaming

Other
```

---

# 28. Interaction Fields

```text
MongoDB ID

Public ID

People

Type

Date

Optional Time

Duration

Summary

Detailed Notes

Tags

Created At

Updated At
```

Example:

```text
INT_A7K29X

September 6, 2026

Video Call

People:

John
Sarah

Summary:

Discussed John's new job.
```

---

# 29. Interaction Goals

A person can have an optional interaction goal.

Example:

```text
Contact every:

30 days
```

The system calculates:

```text
Last Interaction:

42 days ago

Status:

Overdue
```

Later, reminders can be connected.

Do not build notification delivery in the initial implementation.

---

# 30. Relationships

Collection:

```text
relationships
```

Relationships represent connections between two stored people.

Example:

```text
John Doe
     │
     │ College Friend
     │
     ▼
Mike Smith
```

---

# 31. Relationship to Me vs Relationship Between People

These are separate concepts.

---

## 31.1 Relationship to Me

Stored in the Person document.

Example:

```text
John

Relationship to Me:

Friend
```

---

## 31.2 Relationship Between Two People

Stored in the `relationships` collection.

Example:

```text
John
    │
    │ Brother
    │
    ▼
Mike
```

---

# 32. Relationship Fields

```ts
{
  publicId: string,

  userId: string,

  personAId: ObjectId,

  personBId: ObjectId,

  relationshipType: string,

  customRelationship?: string,

  notes?: string,

  createdAt: Date,

  updatedAt: Date,
}
```

Prevent:

```text
Person A = Person B
```

Prevent duplicate relationships.

Consider an unordered pair strategy.

For duplicate detection:

```text
A → B
```

and:

```text
B → A
```

must be treated as the same connection.

---

# 33. Life Events

Collection:

```text
events
```

An event may involve one or multiple people.

Examples:

```text
Started a new job

Moved to Bangalore

College Reunion

Graduated

Got Married
```

---

# 34. Event Fields

```text
Public ID

Title

Date

People

Description

Tags

Created At

Updated At
```

---

# 35. Reminders

Collection:

```text
reminders
```

A reminder may be associated with:

* No people.
* One person.
* Multiple people.
* A note.
* An event.

---

# 36. Reminder Fields

```text
Public ID

User ID

Title

Description

Date

Time

Recurrence

Associated People

Associated Note

Enabled

Created At

Updated At
```

---

# 37. Reminder Time

If no time is specified:

```text
12:00 AM
```

should be the default.

The system should still explicitly store the intended time.

---

# 38. Reminder Recurrence

Initial recurrence options:

```text
Once

Weekly

Monthly

Yearly
```

Examples:

```text
Every Monday

Every 15th

Every October 15th
```

Do not implement arbitrary RRULE complexity initially.

However, the schema should allow future extension.

---

# 39. Reminder Edge Cases

Examples:

```text
February 29

30th

31st
```

The user should eventually choose behavior:

```text
Skip

Previous Valid Day

Next Valid Day
```

Store this behavior explicitly.

---

# 40. Notifications

Do not implement email notification delivery immediately.

However, reminder architecture must not prevent it later.

Future architecture:

```text
Reminder
     │
     ▼
Reminder Occurrence
     │
     ▼
Notification Schedule
     │
     ▼
Email Notification
```

Notification offsets may include:

```text
On the day

1 day before

2 days before

7 days before

Custom
```

---

# 41. Dashboard

Route:

```text
/
```

Dashboard sections:

```text
Upcoming Reminders

Upcoming Birthdays

People to Reach Out To

Recent Notes

Recent Interactions

Quick Add
```

---

# 42. People to Reach Out To

Calculate based on:

```text
Last Interaction

Interaction Goal
```

Example:

```text
John Doe

Last interaction:

42 days ago

Target:

30 days

Status:

Overdue
```

---

# 43. Global Search

Implement global search.

Keyboard shortcut:

```text
Ctrl + K
```

Search:

```text
People

Notes

Interactions

Events

Reminders
```

Initial implementation can use MongoDB queries.

Do not require MongoDB Atlas Search initially.

---

# 44. People Filters

People should be filterable by:

```text
Circle

Relationship

Location

Age

Tags

Interests

Status
```

---

# 45. Sorting

Support:

```text
Name

Age

Birthday

Last Interaction

Recently Added

Recently Updated
```

---

# 46. Saved Views

Collection:

```text
savedViews
```

Examples:

```text
Close Friends

Professional

Gaming Friends

Upcoming Birthdays

Need to Reach Out
```

Store the filter configuration.

Example:

```json
{
  "name": "Gaming Friends",
  "filters": {
    "circles": ["FRIEND"],
    "tags": ["gaming"]
  }
}
```

---

# 47. Quick Add

Provide a globally accessible quick add.

Options:

```text
Add Person

Add Note

Add Interaction

Add Reminder

Add Event
```

---

# 48. Connection Graph

Route:

```text
/connections
```

Use React Flow.

---

# 49. Graph Nodes

Nodes represent:

```text
People
```

---

# 50. Graph Edges

Edges represent:

```text
Relationships
```

Example:

```text
John ───── Friend ───── Mike
```

---

# 51. Graph Features

Support:

```text
Pan

Zoom

Search

Focus Person

Relationship Filters

Connection Depth
```

Connection depth:

```text
Direct Connections

2 Degrees

Entire Network
```

---

# 52. Theme

Support:

```text
System

Light

Dark
```

Default:

```text
System
```

Use:

```text
next-themes
```

The implementation must avoid theme flashing during refresh.

---

# 53. Settings

Route:

```text
/settings
```

Sections:

```text
Appearance

Data

Reminder Preferences

Import / Export

Account

Danger Zone
```

---

# 54. Import and Export

The application must support:

```text
Full Export

Full Import

People Import

People Export

Notes Import

Notes Export
```

Future entity-specific import/export should be easy to add.

---

# 55. Full Backup Format

Use ZIP.

Example:

```text
relationship-manager-backup.zip
│
├── manifest.json
│
├── people.json
├── notes.json
├── interactions.json
├── reminders.json
├── relationships.json
├── events.json
├── saved-views.json
│
└── settings.json
```

---

# 56. Manifest

Example:

```json
{
  "app": "Personal Relationship Manager",
  "schemaVersion": 1,
  "exportedAt": "2026-09-06T00:00:00.000Z"
}
```

---

# 57. Schema Versioning

Every import/export format must contain:

```text
schemaVersion
```

Example:

```json
{
  "schemaVersion": 1
}
```

Future:

```json
{
  "schemaVersion": 2
}
```

Create migration infrastructure.

Example:

```text
src/lib/import-export/migrations/
├── v1.ts
├── v2.ts
└── index.ts
```

---

# 58. Export Requirements

Exports must:

* Preserve public IDs.
* Preserve relationships.
* Preserve references.
* Preserve dates.
* Preserve Markdown.
* Preserve tags.
* Preserve associations.

Exported data must be understandable by humans and AI.

---

# 59. Import Formats

Support two levels.

---

## 59.1 Simple Import

Designed for humans and AI.

Example:

```json
{
  "people": [
    {
      "fullName": "John Doe",
      "aliases": ["Johnny"],
      "relationshipToMe": "Friend",
      "circles": ["Friend", "Close"],
      "interests": ["Gaming", "Anime"],
      "tags": ["college"]
    }
  ]
}
```

---

## 59.2 Full Backup Import

Preserves:

```text
Public IDs

References

Metadata

Dates

Relationships
```

---

# 60. AI-Friendly Person Import

The application should accept simple person data.

Example:

```json
{
  "people": [
    {
      "fullName": "John Doe",
      "aliases": [
        "Johnny"
      ],
      "relationshipToMe": {
        "type": "Friend"
      },
      "circles": [
        "Friend",
        "Close"
      ],
      "dateOfBirth": "2001-10-15",
      "livesIn": {
        "displayName": "Bangalore, India"
      },
      "from": {
        "displayName": "Kolkata, India"
      },
      "howMet": "Met in college.",
      "interests": [
        "Gaming",
        "Anime"
      ],
      "phones": [
        {
          "label": "Personal",
          "value": "+91 XXXXX"
        }
      ],
      "emails": [
        {
          "label": "Personal",
          "value": "john@example.com"
        }
      ],
      "tags": [
        "college",
        "gaming"
      ],
      "facts": [
        {
          "content": "Favourite Pokémon is Gengar."
        }
      ]
    }
  ]
}
```

Do not require:

```text
MongoDB _id

userId

internal timestamps
```

from AI-generated imports.

The server generates those.

---

# 61. AI Import Requirements

Import schemas must:

* Be documented.
* Be simple.
* Be JSON.
* Accept optional fields.
* Generate missing IDs.
* Validate all fields.
* Reject dangerous/internal fields.
* Ignore `userId` supplied by imports.
* Never allow imported data to select a different user.

---

# 62. Import Preview

Before import:

```text
People to Create: 10

People to Update: 2

People with Conflicts: 3

Notes to Create: 15

Relationships to Create: 4
```

The user must explicitly confirm.

---

# 63. Import Conflict Handling

For conflicts:

```text
Create New

Update Existing

Skip

Merge
```

Do not silently overwrite existing data.

---

# 64. Conflict Detection

Prefer:

```text
publicId
```

If no public ID exists:

```text
Full Name + additional matching information
```

Do not aggressively assume two people with the same name are the same person.

---

# 65. MongoDB Collections

Initial collections:

```text
people

notes

interactions

reminders

relationships

events

savedViews

settings
```

Authentication collections are managed separately by Better Auth.

---

# 66. Suggested MongoDB Indexes

## People

```text
userId + publicId
```

Unique.

Also:

```text
userId + fullName
```

Non-unique.

Indexes for:

```text
userId

tags

circles

status
```

---

## Notes

Indexes:

```text
userId

publicId

personIds

createdAt
```

---

## Interactions

Indexes:

```text
userId

publicId

personIds

date
```

---

## Relationships

Indexes:

```text
userId

publicId

personAId

personBId
```

Also enforce uniqueness of the normalized person pair.

---

# 67. Public ID Generation

Create a central utility.

Example:

```text
src/lib/ids/
├── generate-public-id.ts
└── prefixes.ts
```

Prefixes:

```ts
PER
NOTE
REM
INT
REL
EVT
FACT
DATE
LINK
```

Example:

```text
PER_A7K29X
```

Do not generate IDs independently in random components.

All generation must use one central system.

---

# 68. Public ID Requirements

Public IDs must:

* Be unique.
* Be generated server-side.
* Be immutable.
* Be indexed.
* Be preserved during export/import where possible.

---

# 69. Folder Structure

Recommended structure:

```text
src/
│
├── app/
│   │
│   ├── (auth)/
│   │   └── sign-in/
│   │
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   │
│   │   ├── page.tsx
│   │   │
│   │   ├── people/
│   │   │   ├── page.tsx
│   │   │   ├── new/
│   │   │   └── [personId]/
│   │   │
│   │   ├── notes/
│   │   │
│   │   ├── interactions/
│   │   │
│   │   ├── reminders/
│   │   │
│   │   ├── events/
│   │   │
│   │   ├── connections/
│   │   │
│   │   ├── import/
│   │   │
│   │   ├── export/
│   │   │
│   │   └── settings/
│   │
│   └── api/
│       └── auth/
│
├── components/
│   │
│   ├── ui/
│   │
│   ├── people/
│   ├── notes/
│   ├── interactions/
│   ├── reminders/
│   ├── events/
│   ├── connections/
│   └── shared/
│
├── actions/
│   │
│   ├── people.ts
│   ├── notes.ts
│   ├── interactions.ts
│   ├── reminders.ts
│   └── events.ts
│
├── lib/
│   │
│   ├── auth/
│   │
│   ├── db/
│   │
│   ├── dal/
│   │
│   ├── ids/
│   │
│   ├── validation/
│   │
│   ├── import-export/
│   │
│   └── utils/
│
├── models/
│   │
│   ├── person.ts
│   ├── note.ts
│   ├── interaction.ts
│   ├── reminder.ts
│   ├── relationship.ts
│   ├── event.ts
│   ├── saved-view.ts
│   └── settings.ts
│
└── types/
```

---

# 70. Database Connection

Create:

```text
src/lib/db/
```

Example:

```text
src/lib/db/
├── mongodb.ts
└── mongoose.ts
```

Ensure MongoDB connections are reused correctly.

Do not create a new database connection for every request.

Use a cached connection pattern appropriate for Next.js development and serverless execution.

---

# 71. Validation

Use Zod.

Create schemas for:

```text
Person

Note

Interaction

Reminder

Relationship

Event

Import Data
```

Suggested structure:

```text
src/lib/validation/
├── person.ts
├── note.ts
├── interaction.ts
├── reminder.ts
├── relationship.ts
├── event.ts
└── import.ts
```

---

# 72. Server Actions

Use Server Actions for mutations.

Examples:

```text
createPerson

updatePerson

archivePerson

createNote

updateNote

deleteNote

createInteraction

createReminder
```

Every Server Action must:

1. Authenticate.
2. Validate input with Zod.
3. Authorize ownership.
4. Perform the database operation.
5. Revalidate affected routes.

---

# 73. Never Trust Client IDs Alone

Example:

The client sends:

```text
personId = 123
```

Do not assume it belongs to the user.

Always verify:

```ts
{
  _id: personId,
  userId: authenticatedUser.id
}
```

---

# 74. Page Architecture

Routes:

```text
/
```

Dashboard.

```text
/people
```

People directory.

```text
/people/new
```

Create person.

```text
/people/[personId]
```

Person profile.

```text
/notes
```

Notes.

```text
/notes/[noteId]
```

Note editor.

```text
/interactions
```

Interactions.

```text
/reminders
```

Reminders.

```text
/events
```

Events.

```text
/connections
```

Graph.

```text
/import
```

Import center.

```text
/export
```

Export center.

```text
/settings
```

Settings.

---

# 75. Person Profile Layout

Suggested tabs:

```text
Overview

Notes

Interactions

Timeline

Connections
```

---

## Overview

Show:

```text
Full Name

Aliases

Relationship to Me

Circles

Age

Birthday

Location

Contact Information

Interests

Tags

Things to Remember

Important Dates

Links

Contact Preferences
```

---

## Notes

Show associated notes.

Provide:

```text
New Note
```

Automatically associate the current person.

---

## Interactions

Show interaction history.

Provide:

```text
New Interaction
```

Automatically associate the current person.

---

## Timeline

Combine:

```text
Interactions

Notes

Events

Important Dates
```

Order chronologically.

---

## Connections

Show:

```text
Linked People

Relationship Graph
```

---

# 76. Theme Implementation

Use:

```text
next-themes
```

Settings:

```text
System

Light

Dark
```

Persist user preference.

Default:

```text
System
```

Avoid theme flashing.

---

# 77. Search Architecture

Initial search should support:

```text
People

Notes

Interactions

Events
```

Search by:

```text
Name

Alias

Tag

Interest

Content

Title
```

Do not introduce AI semantic search initially.

Do not require MongoDB Atlas Search initially.

---

# 78. Command Palette

Keyboard shortcut:

```text
Ctrl + K
```

Actions:

```text
Search People

Search Notes

Add Person

Add Note

Add Interaction

Add Reminder

Open Connections

Open Settings
```

---

# 79. Error Handling

All operations must have clear errors.

Examples:

```text
Unable to save person.

Unable to import data.

This person does not exist.

You do not have access to this resource.
```

Do not expose:

```text
MongoDB connection strings

Stack traces

Internal database errors
```

to users.

---

# 80. Delete Strategy

Do not immediately permanently delete important data.

Prefer:

```text
Archive
```

for people.

For other entities, deletion can initially be direct if appropriate.

Future:

```text
Trash
```

can be added.

---

# 81. Settings Data

User settings should contain:

```text
Theme Preference

Timezone

Reminder Preferences

Invalid Date Behavior

Import Preferences
```

Structure:

```ts
{
  userId: string,

  theme: "system",

  timezone: "Asia/Kolkata",

  reminderSettings: {},
}
```

Do not hardcode the timezone globally.

Each user should eventually have their own timezone.

---

# 82. Initial Implementation Phases

Implement incrementally.

Do not attempt the entire application simultaneously.

---

# Phase 1 — Foundation

Implement:

```text
Next.js

TypeScript

Tailwind

shadcn/ui

MongoDB

Mongoose

Environment validation

Project structure
```

Deliverable:

```text
Application runs locally.
MongoDB connects successfully.
```

---

# Phase 2 — Authentication

Implement:

```text
Better Auth

Google OAuth

MongoDB Adapter

Allowed Email Check

Protected Routes

Server-side Authorization
```

Deliverable:

```text
Only allowed email can access the application.
```

---

# Phase 3 — Security Foundation

Implement:

```text
requireUser()

Data Access Layer

Ownership Verification

Server Action Authorization
```

Deliverable:

```text
All future database operations have a secure foundation.
```

---

# Phase 4 — Person Model

Implement:

```text
Person Mongoose Model

Public IDs

Zod Validation

Create Person

Edit Person

Person List

Person Profile
```

Deliverable:

```text
Full CRUD for People.
```

---

# Phase 5 — People Search and Filters

Implement:

```text
Search

Tags

Circles

Relationship

Status

Sorting
```

Deliverable:

```text
Usable people directory.
```

---

# Phase 6 — Notes

Implement:

```text
Note Model

Markdown Storage

MDXEditor

Person Associations

Note CRUD

No Autosave

Unsaved Changes Detection
```

Deliverable:

```text
Notes fully work.
```

---

# Phase 7 — Interactions

Implement:

```text
Interaction Model

Interaction CRUD

Person Association

Last Interaction Calculation
```

Deliverable:

```text
Interaction history works.
```

---

# Phase 8 — Relationships

Implement:

```text
Relationship Model

Person-to-Person Connections

Relationship CRUD

Duplicate Prevention
```

Deliverable:

```text
People can be connected.
```

---

# Phase 9 — Connection Graph

Implement:

```text
React Flow

Nodes

Edges

Pan

Zoom

Search

Filters
```

Deliverable:

```text
Interactive relationship graph.
```

---

# Phase 10 — Events and Important Dates

Implement:

```text
Life Events

Important Dates

Timeline
```

Deliverable:

```text
Person timeline works.
```

---

# Phase 11 — Reminders

Implement:

```text
Reminder CRUD

Once

Weekly

Monthly

Yearly

Edge Case Handling
```

Do not implement email delivery yet.

---

# Phase 12 — Dashboard

Implement:

```text
Upcoming Dates

Upcoming Reminders

Recent Notes

Recent Interactions

People to Reach Out To
```

---

# Phase 13 — Import / Export

Implement:

```text
People Import

Notes Import

Full Backup Export

Full Backup Import

Schema Versioning

Preview

Conflict Handling
```

This phase must be thoroughly tested.

---

# Phase 14 — Search and Command Palette

Implement:

```text
Global Search

Ctrl + K

Quick Add

Saved Views
```

---

# Phase 15 — Polish

Implement:

```text
Loading States

Error States

Empty States

Responsive Design

Theme Polish

Accessibility

Keyboard Navigation
```

---

# 83. Testing Priorities

The following must be tested carefully.

---

## Authorization

Attempt:

```text
User A accesses User B's Person

User A accesses User B's Note

User A accesses User B's Reminder

User A exports User B's data
```

Expected:

```text
Denied.
```

---

## Import

Test:

```text
Valid JSON

Invalid JSON

Missing fields

Unknown fields

Duplicate IDs

Ambiguous names

Invalid dates

Missing associated people
```

---

## Relationships

Test:

```text
A → B

B → A

Duplicate relationship

Person → Same Person
```

---

## Public IDs

Test:

```text
Uniqueness

Export

Import

Conflict

Preservation
```

---

# 84. Things Not to Build Initially

Do not implement initially:

```text
AI Assistant

Semantic Search

Vector Database

Application-level Encryption

Email Notifications

Push Notifications

Multi-user Collaboration

Sharing

Public Profiles

Profile Images

Maps

Location Coordinates

Complex Arbitrary Recurrence Rules
```

These may be added later.

---

# 85. Future AI Features

Possible future features:

```text
Person Summaries

Relationship Summaries

Semantic Search

Ask Questions About People

Extract Facts From Notes

Suggest Reminders

Detect Important Dates
```

Example:

```text
What did John say about moving to Bangalore?
```

Do not build this until the core data architecture is reliable.

---

# 86. Coding Rules

GitHub Copilot should follow these rules.

---

## Never bypass authorization

Do not create direct database queries from client components.

Do not access the database from the browser.

---

## Never trust userId from client input

The authenticated server session determines the user.

---

## Validate everything

Use Zod.

Client validation improves UX.

Server validation is mandatory.

---

## Keep models clean

Do not put application logic inside random components.

Use:

```text
Models

DAL

Actions

Validation

Utilities
```

---

## Do not over-engineer

This is a personal application initially.

Prefer:

```text
Simple

Readable

Maintainable
```

over unnecessary abstractions.

---

# 87. Initial Success Criteria

Version 1 is successful when a user can:

```text
Sign in securely

Create a person

Edit a person

Add aliases

Add circles

Add contacts

Add interests

Add tags

Add facts

Add important dates

Add links

Create notes

Associate notes with people

Create interactions

Create reminders

Connect people

View the connection graph

Search people

Filter people

Switch themes

Import people

Import notes

Export all data

Import exported data

Have all data securely isolated by user
```

---

# 88. Final Architectural Rule

The most important invariant in the application is:

```text
EVERY USER-OWNED DATABASE QUERY
MUST BE SCOPED TO THE
AUTHENTICATED USER.
```

Conceptually:

```text
Authenticated User
        │
        ▼
     userId
        │
        ▼
All Database Queries
        │
        ▼
Only That User's Data
```

This rule must never be bypassed.

---

# 89. Start Here

GitHub Copilot should begin with:

```text
Phase 1
```

Then continue sequentially.

Before starting a new phase:

1. Review the previous implementation.
2. Identify incomplete functionality.
3. Fix obvious architecture issues.
4. Ensure TypeScript is clean.
5. Ensure authorization is not bypassed.
6. Continue to the next phase.

Do not rewrite working architecture unnecessarily.

Build incrementally.

---

# END OF HANDOVER
