# Data Export API

## Endpoint
GET /api/users/export

## Description
Exports all user account data (email, role, created date) in JSON format for GDPR/data portability compliance.

## Example Response
[
  {
    "email": "user@example.com",
    "role": "user",
    "createdAt": "2025-12-30T12:00:00Z"
  },
  ...
]

- Only accessible to users with `user:manage` permission.
- Does not include password hashes or sensitive internal fields.
- Can be extended for project/content export as needed.
