// Shared in-memory list of registered users.
// Exported as an array (mutated in place) so both router files see the same data.
let users = [];

module.exports = users;
