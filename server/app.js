const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
const nlp = require('compromise');
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Simple function to extract keywords from the query using NLP
const extractKeywords = (query) => {
  const doc = nlp(query);

  // Extract age using compromise (age might be treated as numbers)
  const age = doc.match('#Age').text() || null;

  // Extract gender (look for words like male/female)
  const gender = doc.match('#Gender').text() || null;

  // Extract neighborhood (for simplicity, we'll capture neighborhood names as nouns)
  const neighborhood = doc.match('#Place').text() || null;

  // Extract substance
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

  // Extract keywords from the user query using NLP
  const { age, gender, neighborhood, substance } = extractKeywords(query);

  return res.status(200).json({ age, gender, neighborhood, substance });

  // Example of how to send the data to another API (uncomment if needed)
//   const apiPayload = { age, gender, neighborhood, substance };

//   try {
//     const response = await axios.post('https://mock-api-endpoint.com', apiPayload);
//     return res.json({ responseData: response.data });
//   } catch (error) {
//     console.error('Error calling external API:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
