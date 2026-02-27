# Bitespeed Identity Reconciliation

A REST API service that reconciles customer identities across multiple purchases using shared email or phone number data.

---

### Tech Stack

- **Node.js** — Runtime
- **TypeScript** — Type safety
- **Express** — Web framework
- **Prisma** — ORM
- **SQLite** — Database

---

### Setup

```bash
npm install
npx prisma migrate dev --name init
```

---

### Running

```bash
# Development
npm run dev

# Production
npm run build
npm start
```

---

### Environment Variables

| Variable | Default | Description |
|---|---|---|
| `PORT` | `3000` | Server port |
| `DATABASE_URL` | `file:./dev.db` | SQLite database path |

---

### API Reference

**GET /**  — Health check

```json
{ "status": "ok" }
```

---

**POST /identify**

Reconciles a contact by email and/or phone number. At least one field is required.

**Request body:**
```json
{
  "email": "a@b.com",
  "phoneNumber": "1234"
}
```

**Response:**
```json
{
  "contact": {
    "primaryContatctId": 1,
    "emails": ["primary@email.com", "secondary@email.com"],
    "phoneNumbers": ["1234567890"],
    "secondaryContactIds": [2, 3]
  }
}
```
