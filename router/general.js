const express = require('express');
const axios = require('axios');
let books = require("./booksdb.js");
let users = require("./registeredUsers.js");
let public_users = express.Router();

// ---------- Helpers ----------
const isUsernameValid = (username) => {
  return users.some((user) => user.username === username);
};

const authenticatedUser = (username, password) => {
  return users.some((user) => user.username === username && user.password === password);
};

// ---------- Task 6 (register): Register a new user ----------
public_users.post("/register", (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(404).json({ message: "Unable to register user. Username and password are required." });
  }

  if (isUsernameValid(username)) {
    return res.status(404).json({ message: "User already exists!" });
  }

  users.push({ username, password });
  return res.status(200).json({ message: "User successfully registered. Now you can login." });
});

// ---------- Task 1 (getallbooks): Get the book list available in the shop ----------
public_users.get('/', function (req, res) {
  return res.status(200).send(JSON.stringify(books, null, 4));
});

// ---------- Task 2 (getbooksbyISBN): Get book details based on ISBN ----------
public_users.get('/isbn/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    return res.status(200).send(JSON.stringify(book, null, 4));
  }
  return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
});

// ---------- Task 3 (getbooksbyauthor): Get book details based on author ----------
public_users.get('/author/:author', function (req, res) {
  const author = req.params.author.toLowerCase();
  const matches = Object.keys(books)
    .filter((isbn) => books[isbn].author.toLowerCase() === author)
    .reduce((acc, isbn) => {
      acc[isbn] = books[isbn];
      return acc;
    }, {});

  if (Object.keys(matches).length > 0) {
    return res.status(200).send(JSON.stringify(matches, null, 4));
  }
  return res.status(404).json({ message: `No books found for author "${req.params.author}"` });
});

// ---------- Task 4 (getbooksbytitle): Get book details based on title ----------
public_users.get('/title/:title', function (req, res) {
  const title = req.params.title.toLowerCase();
  const matches = Object.keys(books)
    .filter((isbn) => books[isbn].title.toLowerCase() === title)
    .reduce((acc, isbn) => {
      acc[isbn] = books[isbn];
      return acc;
    }, {});

  if (Object.keys(matches).length > 0) {
    return res.status(200).send(JSON.stringify(matches, null, 4));
  }
  return res.status(404).json({ message: `No books found for title "${req.params.title}"` });
});

// ---------- Task 5 (getbookreview): Get book review ----------
public_users.get('/review/:isbn', function (req, res) {
  const isbn = req.params.isbn;
  const book = books[isbn];

  if (book) {
    return res.status(200).send(JSON.stringify(book.reviews, null, 4));
  }
  return res.status(404).json({ message: `No book found for ISBN ${isbn}` });
});

module.exports.general = public_users;

/* ============================================================================
 * Task 10-13: Client-side style functions using Axios with Promises / async-await.
 * These call the app's own REST endpoints above and are the implementations
 * required for the "general.js" grading task (retrieve all books / by ISBN /
 * by author / by title using Axios promise callbacks or async/await).
 * BASE_URL should point at wherever this server is running.
 * ========================================================================== */

const BASE_URL = process.env.BASE_URL || "http://localhost:5000";

// Task 10: Get the book list available in the shop (Promise callback style)
function getAllBooks() {
  return axios
    .get(`${BASE_URL}/`)
    .then((response) => {
      console.log("All books:", response.data);
      return response.data;
    })
    .catch((error) => {
      console.error("Error fetching all books:", error.message);
      throw error;
    });
}

// Task 11: Search by ISBN (async/await style)
async function getBookByISBN(isbn) {
  try {
    const response = await axios.get(`${BASE_URL}/isbn/${isbn}`);
    console.log(`Book with ISBN ${isbn}:`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching book with ISBN ${isbn}:`, error.message);
    throw error;
  }
}

// Task 12: Search by Author (async/await style)
async function getBooksByAuthor(author) {
  try {
    const response = await axios.get(`${BASE_URL}/author/${encodeURIComponent(author)}`);
    console.log(`Books by author "${author}":`, response.data);
    return response.data;
  } catch (error) {
    console.error(`Error fetching books by author "${author}":`, error.message);
    throw error;
  }
}

// Task 13: Search by Title (Promise callback style)
function getBooksByTitle(title) {
  return axios
    .get(`${BASE_URL}/title/${encodeURIComponent(title)}`)
    .then((response) => {
      console.log(`Books with title "${title}":`, response.data);
      return response.data;
    })
    .catch((error) => {
      console.error(`Error fetching books with title "${title}":`, error.message);
      throw error;
    });
}

module.exports.getAllBooks = getAllBooks;
module.exports.getBookByISBN = getBookByISBN;
module.exports.getBooksByAuthor = getBooksByAuthor;
module.exports.getBooksByTitle = getBooksByTitle;
