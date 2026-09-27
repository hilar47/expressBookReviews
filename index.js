const express = require('express');
const jwt = require('jsonwebtoken');
const session = require('express-session');
const customer_routes = require('./router/auth_users.js').authenticated;
const genl_routes = require('./router/general.js').general;

const app = express();

app.use(express.json());

const JWT_SECRET = "fingerprint_customer";

app.use("/customer", session({
  secret: JWT_SECRET,
  resave: true,
  saveUninitialized: true
}));

// Auth middleware: protects every /customer/auth/* route, requiring a valid
// session token issued at login before review add/update/delete can proceed.
app.use("/customer/auth/*", function auth(req, res, next) {
  if (req.session.authorization) {
    const token = req.session.authorization['accessToken'];
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ message: "User not authenticated" });
      }
      req.user = user;
      next();
    });
  } else {
    return res.status(403).json({ message: "User not logged in" });
  }
});

const PORT = process.env.PORT || 5000;

app.use("/customer", customer_routes);
app.use("/", genl_routes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
