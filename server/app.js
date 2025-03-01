const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
const nlp = require('compromise');
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Custom function to extract age and gender using regex
const extractKeywords = (query) => {
  const doc = nlp(query);

  // Extract age using a regex (looking for phrases like '25 years old' or '25 yrs old')
  const agePattern = /(\d{1,3})\s?(?:years? old|yrs?)/i;
  const ageMatch = query.match(agePattern);
  const age = ageMatch ? ageMatch[1] : null;

  // Extract gender using a regex (looking for 'male' or 'female')
  const genderPattern = /\b(male|female)\b/i;
  const genderMatch = query.match(genderPattern);
  const gender = genderMatch ? genderMatch[1] : null;

  // Extract neighborhood using compromise (places like 'Winnipeg')
  const neighborhood = doc.match('#Place').text() || null;

  // Extract substance using a simple list and compromise to match words like 'alcohol', 'drug', 'nicotine'
  const substances = ['alcohol', 'drug', 'nicotine'];
  const substance = substances.find(sub => doc.has(sub)) || null;

  return { age, gender, neighborhood, substance };
};

app.get("/", (req, res) => {
  res.json({ message: "working" });
});

// Endpoint to process user query
app.post('/process-query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Extract keywords from the user query using NLP and regex
  const { age, gender, neighborhood, substance } = extractKeywords(query);

  return res.status(200).json({ age, gender, neighborhood, substance });
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
