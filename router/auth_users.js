const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
let books = require("./booksdb.js");
let users = require("./registeredUsers.js");

const regd_users = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || "fingerprint_customer";

const isValid = (username) => {
  return users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// ---------- Task 7 (login): Log in as a registered user ----------
regd_users.post("/login", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: "Username and password are required." });
  }

  if (!authenticatedUser(username, password)) {
    return res.status(208).json({ message: "Invalid Login. Check username and password." });
  }

  const accessToken = jwt.sign({ username }, JWT_SECRET, { expiresIn: '1h' });

  req.session.authorization = { accessToken, username };

  return res.status(200).json({ message: "User successfully logged in", accessToken });
});

/* --------------------------------------------------------------------------
 * Concurrency handling: reviews are read-modify-write operations on a shared
 * in-memory object (books[isbn].reviews). Under concurrent requests for the
 * same ISBN, two writes could interleave and clobber each other. A tiny
 * per-ISBN promise-chain mutex serializes writes to the same book's reviews
 * while still letting writes to *different* books proceed in parallel.
 * ------------------------------------------------------------------------ */
const isbnLocks = new Map();

function withIsbnLock(isbn, task) {
  const previous = isbnLocks.get(isbn) || Promise.resolve();
  const current = previous
    .catch(() => {}) // don't let a prior failure block future work
    .then(() => task());
  isbnLocks.set(isbn, current);
  // clean up the map once this is the tail of the chain
  current.finally(() => {
    if (isbnLocks.get(isbn) === current) {
      isbnLocks.delete(isbn);
    }
  });
  return current;
}

// ---------- Task 8 (reviewadded): Add or modify a book review ----------
regd_users.put("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session?.authorization?.username;
  const review = req.query.review || req.body.review;

  if (!username) {
    return res.status(401).json({ message: "User not logged in." });
  }
  if (!books[isbn]) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }
  if (!review) {
    return res.status(400).json({ message: "Review text is required as a query parameter, e.g. ?review=..." });
  }

  return withIsbnLock(isbn, () => {
    books[isbn].reviews[username] = review;
    return res.status(200).json({
      message: `The review for the book with ISBN ${isbn} has been added/updated`,
      reviews: books[isbn].reviews
    });
  });
});

// ---------- Task 9 (deletereview): Delete a book review ----------
regd_users.delete("/auth/review/:isbn", (req, res) => {
  const isbn = req.params.isbn;
  const username = req.session?.authorization?.username;

  if (!username) {
    return res.status(401).json({ message: "User not logged in." });
  }
  if (!books[isbn]) {
    return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
  }

  return withIsbnLock(isbn, () => {
    if (books[isbn].reviews[username] === undefined) {
      return res.status(404).json({ message: `No review by user "${username}" found for ISBN ${isbn}` });
    }
    delete books[isbn].reviews[username];
    return res.status(200).json({
      message: `The review for the book with ISBN ${isbn} by "${username}" has been deleted`,
      reviews: books[isbn].reviews
    });
  });
});

module.exports.authenticated = regd_users;
module.exports.isValid = isValid;
module.exports.users = users;
