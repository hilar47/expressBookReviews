# Express Book Review — Online Bookstore API

Server-side application for an online bookstore: user authentication (JWT + session),
book search (by ISBN / author / title), and review management (add / update / delete),
with concurrency-safe review writes (per-ISBN locking, see `router/auth_users.js`).

## Project layout
```
.
├── index.js                  # App entry point, wires routers + session/JWT auth middleware
├── package.json
└── router/
    ├── booksdb.js            # Book data (replace with the provided books.json for grading)
    ├── registeredUsers.js    # Shared in-memory user store
    ├── general.js            # Public routes + Task 11 Axios promise/async functions
    └── auth_users.js         # Login + authenticated review add/update/delete
```

## Setup
```bash
npm install
npm start          # or: node index.js
# Server listens on http://localhost:5000
```

If the grader supplies a `books.json`, drop it in and change `booksdb.js` to
`module.exports = require('../books.json');` (or paste its contents in directly) —
the route logic doesn't change since it just indexes by ISBN key.

## cURL commands for each task

### Task 1 — getallbooks
```bash
curl -s http://localhost:5000/
```

### Task 2 — getbooksbyISBN
```bash
curl -s http://localhost:5000/isbn/1
```

### Task 3 — getbooksbyauthor
```bash
curl -s http://localhost:5000/author/Jane%20Austen
```

### Task 4 — getbooksbytitle
```bash
curl -s http://localhost:5000/title/Fairy%20tales
```

### Task 5 — getbookreview
```bash
curl -s http://localhost:5000/review/1
```

### Task 6 — register
```bash
curl -s -X POST http://localhost:5000/register \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass123"}'
```

### Task 7 — login
```bash
curl -s -c cookies.txt -X POST http://localhost:5000/customer/login \
  -H "Content-Type: application/json" \
  -d '{"username":"alice","password":"pass123"}'
```
(`-c cookies.txt` saves the session cookie needed for the authenticated calls below.)

### Task 8 — reviewadded (add or modify a review)
```bash
curl -s -b cookies.txt -X PUT \
  "http://localhost:5000/customer/auth/review/1?review=Amazing%20read!"
```

### Task 9 — deletereview
```bash
curl -s -b cookies.txt -X DELETE \
  "http://localhost:5000/customer/auth/review/1"
```

## Task 11 — general.js Axios functions
`router/general.js` includes `getAllBooks()`, `getBookByISBN(isbn)`,
`getBooksByAuthor(author)`, and `getBooksByTitle(title)`, implemented with
Axios using both Promise `.then/.catch` and `async/await` styles, calling this
app's own REST endpoints above.

## Notes on concurrency
Adding/updating/deleting a review is a read-modify-write on shared in-memory
state (`books[isbn].reviews`). `auth_users.js` serializes writes per ISBN with
a lightweight promise-chain lock (`withIsbnLock`) so two simultaneous review
submissions for the *same* book can't race and clobber each other, while
requests for *different* books still run concurrently.
