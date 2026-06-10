// Simple validation middleware for contact and newsletter endpoints

function isEmail(v) {
  if (!v) return false;
  return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
}

function validateContact(req, res, next) {
  const { name, email, subject, message } = req.body || {};
  const errors = [];
  if (!name || String(name).trim().length < 2) errors.push('Name is required (min 2 chars).');
  if (!email || !isEmail(String(email))) errors.push('A valid email is required.');
  if (!subject || String(subject).trim().length < 3) errors.push('Subject is required (min 3 chars).');
  if (!message || String(message).trim().length < 10) errors.push('Message is required (min 10 chars).');
  if (errors.length) return res.status(400).json({ errors });
  next();
}

function validateNewsletter(req, res, next) {
  const { email } = req.body || {};
  if (!email || !isEmail(String(email))) return res.status(400).json({ error: 'A valid email is required.' });
  next();
}

module.exports = {
  validateContact,
  validateNewsletter,
};
