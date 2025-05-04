# API Design Documentation

## Overview
This document outlines the API design for the cert-vote system, which provides a secure and anonymous voting mechanism using cryptographic techniques.

## Authentication Flow
The voting system uses a multi-step process to ensure both security and anonymity:

1. **Verification Token**: User requests a verification token by providing their national ID
2. **Key Pair Generation**: User generates a cryptographic key pair and a random ID
3. **Vote Key Registration**: User registers their public key and random ID
4. **Vote Casting**: User signs their vote with their private key and submits it
5. **Signature Verification**: Server verifies the signature using the public key
6. **Vote Recording**: Server adds the vote as a block to the blockchain

## API Endpoints

### Polls

#### GET /api/polls
Retrieves a list of polls with optional filtering.

**Query Parameters:**
- `limit` (optional): Maximum number of polls to return
- `pollId`, `title`, `description`, `creator` (optional): Filter by these fields
- `startTimeAfter`, `startTimeBefore`, `endTimeAfter`, `endTimeBefore` (optional): Filter by date ranges

**Response:**
```json
[
  {
    "pollId": "string",
    "title": "string",
    "description": "string",
    "creator": "string",
    "startTime": "date",
    "endTime": "date",
    "allowedNationalIds": ["string"]
  }
]
```

#### POST /api/polls
Creates a new poll.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "date",
  "endTime": "date",
  "allowedNationalIds": ["string"]
}
```

**Response:**
```json
{
  "pollId": "string",
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "date",
  "endTime": "date",
  "allowedNationalIds": ["string"]
}
```

### Poll Operations

#### GET /api/polls/[pollId]
Retrieves a specific poll by ID.

**Response:**
```json
{
  "pollId": "string",
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "date",
  "endTime": "date",
  "allowedNationalIds": ["string"]
}
```

#### PUT /api/polls/[pollId]
Updates a specific poll.

**Request Body:**
```json
{
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "date",
  "endTime": "date",
  "allowedNationalIds": ["string"]
}
```

**Response:**
```json
{
  "pollId": "string",
  "title": "string",
  "description": "string",
  "creator": "string",
  "startTime": "date",
  "endTime": "date",
  "allowedNationalIds": ["string"]
}
```

#### DELETE /api/polls/[pollId]
Deletes a specific poll.

**Response:**
```json
{
  "message": "Poll deleted successfully"
}
```

### Voting Process

#### POST /api/polls/[pollId]/verification-token
Requests a verification token for voting in a specific poll.

**Request Body:**
```json
{
  "nationalId": "string"
}
```

**Response:**
```json
{
  "verificationToken": "string"
}
```

#### POST /api/polls/[pollId]/vote-key
Registers a user's public key and random ID for voting.

**Request Body:**
```json
{
  "userPublicKey": "string",
  "voteRandomId": "string",
  "verificationToken": "string",
  "userId": "string"
}
```

**Response:**
```json
{
  "createdVoteKey": {
    "pollId": "string",
    "userPublicKey": "string",
    "voteRandomId": "string"
  }
}
```

#### GET /api/polls/[pollId]/vote-blocks
Retrieves vote blocks for a specific poll.

**Query Parameters:**
- `limit` (optional): Maximum number of vote blocks to return

**Response:**
```json
[
  {
    "previousBlockHash": "string",
    "index": "number",
    "pollId": "string",
    "userPublicKey": "string",
    "voteRandomId": "string",
    "selectedOption": "agree|disagree|abstain",
    "userSignature": "string",
    "hash": "string"
  }
]
```

#### POST /api/polls/[pollId]/vote-blocks
Casts a vote in a specific poll.

**Request Body:**
```json
{
  "voteRandomId": "string",
  "selectedOption": "agree|disagree|abstain",
  "userSignature": "string"
}
```

**Response:**
```json
{
  "createdVoteBlock": {
    "previousBlockHash": "string",
    "index": "number",
    "pollId": "string",
    "userPublicKey": "string",
    "voteRandomId": "string",
    "selectedOption": "agree|disagree|abstain",
    "userSignature": "string",
    "hash": "string"
  }
}
```

## Detailed Voting Flow

1. **Request Verification Token**
   - User sends their national ID to `POST /api/polls/[pollId]/verification-token`
   - Server verifies the user is allowed to vote in this poll
   - Server issues a JWT token that will be used in the next step

2. **Generate Key Pair and Random ID**
   - User generates a PKCS8 key pair (public and private keys)
   - User generates a random string (randomId) to maintain anonymity
   - The randomId will be used to search for the public key while keeping the vote anonymous

3. **Register Vote Key**
   - User sends their public key, random ID, verification token, and user ID to `POST /api/polls/[pollId]/vote-key`
   - Server verifies the token and stores the public key and random ID

4. **Cast Vote**
   - User selects an option (agree, disagree, or abstain)
   - User signs the data (random ID + selected option) with their private key
   - User sends the random ID, selected option, and signature to `POST /api/polls/[pollId]/vote-blocks`

5. **Verify and Record Vote**
   - Server searches for the public key using the random ID
   - Server verifies the signature using the public key
   - If valid, server adds a new block to the blockchain with the vote information

## FAQ

### How do I count the votes for a poll?
The vote count is not directly included in the poll object. To count votes, you need to:

1. Retrieve all vote blocks for the poll using `GET /api/polls/[pollId]/vote-blocks`
2. Count the occurrences of each `selectedOption` value (agree, disagree, abstain)

Example code:
```javascript
const voteBlocks = await fetch(`/api/polls/${pollId}/vote-blocks`).then(res => res.json());
const voteCounts = {
  agree: 0,
  disagree: 0,
  abstain: 0
};

voteBlocks.forEach(block => {
  if (block.selectedOption in voteCounts) {
    voteCounts[block.selectedOption]++;
  }
});

console.log(`Agree: ${voteCounts.agree}, Disagree: ${voteCounts.disagree}, Abstain: ${voteCounts.abstain}`);
```

### How is anonymity maintained in the voting process?
The system uses a random ID (voteRandomId) to decouple the user's identity from their vote. When a user registers their public key, it's associated with this random ID rather than their personal information. When voting, the server only knows that a valid key was used, but doesn't know which user it belongs to.

### Can a user vote multiple times?
The system is designed to prevent multiple votes from the same user. Each public key can only be registered once per poll, and the verification token system ensures that only eligible users can register a key.

### How secure is the voting process?
The voting process uses cryptographic signatures to ensure that votes cannot be forged. Each vote is signed with the user's private key and verified using their public key. Additionally, votes are stored in a blockchain-like structure where each block contains the hash of the previous block, making it difficult to tamper with the voting history.