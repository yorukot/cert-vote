# CertVote API Reference

This document provides detailed information about the CertVote API endpoints, their expected inputs, and outputs.

## Table of Contents

- [Polls](#polls)
  - [List Polls](#list-polls)
  - [Create Poll](#create-poll)
  - [Get Poll by ID](#get-poll-by-id)
  - [Update Poll](#update-poll)
  - [Delete Poll](#delete-poll)
  - [Get Verification Token](#get-verification-token)

## Polls

### List Polls

Retrieves a list of polls based on the provided filters.

```
GET /api/polls
```

#### Query Parameters

| Parameter       | Type   | Description                                       |
|-----------------|--------|---------------------------------------------------|
| limit           | number | Maximum number of polls to return                 |
| status          | string | Filter by poll status (ongoing, completed, upcoming) |
| pollId          | string | Filter by poll ID                                 |
| title           | string | Filter by poll title                              |
| description     | string | Filter by poll description                        |
| creator         | string | Filter by poll creator                            |
| startTimeAfter  | string | Filter polls starting after this date (ISO format) |
| startTimeBefore | string | Filter polls starting before this date (ISO format) |
| endTimeAfter    | string | Filter polls ending after this date (ISO format)  |
| endTimeBefore   | string | Filter polls ending before this date (ISO format) |

#### Response

```json
[
  {
    "pollId": "string",
    "title": "string",
    "description": "string",
    "creator": "string",
    "startTime": "2023-01-01T00:00:00.000Z",
    "endTime": "2023-01-01T00:00:00.000Z",
    "status": "ongoing | completed | upcoming",
    "allowedNationalIds": ["string"]
  }
]
```

#### Error Responses

| Status Code | Description        | Response Body                           |
|-------------|--------------------|----------------------------------------|
| 400         | Invalid parameters | `{ "error": "Invalid status value: X" }` |

---

### Create Poll

Creates a new poll.

```
POST /api/polls
```

#### Request Body

```json
{
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-01T00:00:00.000Z",
  "status": "ongoing | completed | upcoming",
  "allowedNationalIds": ["string"]
}
```

#### Response

```json
{
  "pollId": "string",
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-01T00:00:00.000Z",
  "status": "ongoing | completed | upcoming",
  "allowedNationalIds": ["string"]
}
```

#### Error Responses

| Status Code | Description                   | Response Body                                  |
|-------------|-------------------------------|-----------------------------------------------|
| 400         | Missing required fields       | `{ "error": "Title is required" }`            |
| 400         | Invalid date format           | `{ "error": "Invalid startTime format" }`     |
| 400         | End time before start time    | `{ "error": "End time must be after start time" }` |
| 400         | Invalid status                | `{ "error": "Invalid status value" }`         |
| 400         | Invalid allowed national IDs  | `{ "error": "allowedNationalIds must be an array" }` |

---

### Get Poll by ID

Retrieves a specific poll by its ID.

```
GET /api/polls/{pollId}
```

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| pollId    | string | Poll ID     |

#### Response

```json
{
  "pollId": "string",
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-01T00:00:00.000Z",
  "status": "ongoing | completed | upcoming",
  "allowedNationalIds": ["string"]
}
```

#### Error Responses

| Status Code | Description  | Response Body                    |
|-------------|--------------|----------------------------------|
| 404         | Poll not found | `{ "error": "Poll not found" }` |

---

### Update Poll

Updates a specific poll by its ID.

```
PUT /api/polls/{pollId}
```

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| pollId    | string | Poll ID     |

#### Request Body

```json
{
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-01T00:00:00.000Z",
  "status": "ongoing | completed | upcoming",
  "allowedNationalIds": ["string"]
}
```

Only include the fields you want to update. Fields not included will remain unchanged.

#### Response

```json
{
  "pollId": "string",
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "2023-01-01T00:00:00.000Z",
  "endTime": "2023-01-01T00:00:00.000Z",
  "status": "ongoing | completed | upcoming",
  "allowedNationalIds": ["string"]
}
```

#### Error Responses

| Status Code | Description                   | Response Body                                  |
|-------------|-------------------------------|-----------------------------------------------|
| 404         | Poll not found                | `{ "error": "Poll not found" }`               |
| 400         | Invalid date format           | `{ "error": "Invalid startTime format" }`     |
| 400         | Invalid status                | `{ "error": "Invalid status value" }`         |
| 400         | Invalid allowed national IDs  | `{ "error": "allowedNationalIds must be an array" }` |

---

### Delete Poll

Deletes a specific poll by its ID.

```
DELETE /api/polls/{pollId}
```

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| pollId    | string | Poll ID     |

#### Response

```json
{
  "message": "Poll deleted successfully"
}
```

#### Error Responses

| Status Code | Description  | Response Body                    |
|-------------|--------------|----------------------------------|
| 404         | Poll not found | `{ "error": "Poll not found" }` |

---

### Get Verification Token

Issues a verification token for a user to participate in a poll.

```
POST /api/polls/{pollId}/verification-token
```

#### URL Parameters

| Parameter | Type   | Description |
|-----------|--------|-------------|
| pollId    | string | Poll ID     |

#### Request Body

```json
{
  "nationalId": "string"
}
```

#### Response

```json
{
  "verificationToken": "string"
}
```

#### Error Responses

| Status Code | Description                               | Response Body                                           |
|-------------|-------------------------------------------|--------------------------------------------------------|
| 400         | Missing national ID                       | `{ "error": "National ID is required" }`                |
| 403         | User not allowed to participate in poll   | `{ "error": "The national ID is not allowed for this poll." }` |
| 404         | Poll not found                            | `{ "error": "Poll not found" }`                         |
| 404         | User not found                            | `{ "error": "User with the national id not found" }`    |

## Authentication

The authentication endpoints are not fully implemented yet.

## Postman Collection

Below is a ready-to-import Postman collection for the CertVote Polls API. Copy the JSON and import it into Postman (File > Import > Raw Text > Paste JSON).