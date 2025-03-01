const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Simple function to extract keywords from the query
const extractKeywords = (query) => {
  // You can expand this regex logic to match actual text patterns for age, gender, etc.
  const agePattern = /(\d{1,3})\s?(?:years? old|yrs?)/i;
  const genderPattern = /\b(male|female)\b/i;
  const neighborhoodPattern = /\b([A-Za-z]+(?:\s[A-Za-z]+)*)\b/i; // simplistic neighborhood capture
  const substancePattern = /\b(alcohol|drug|nicotine)\b/i;

  const age = query.match(agePattern)?.[1] || null;
  const gender = query.match(genderPattern)?.[1] || null;
  const neighborhood = query.match(neighborhoodPattern)?.[1] || null;
  const substance = query.match(substancePattern)?.[1] || null;

  return { age, gender, neighborhood, substance };
};

app.get("/", (req, res)=> {
    res.json({message: "working"})
})

// Endpoint to process user query
app.post('/process-query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Extract keywords from the user query
  const { age, gender, neighborhood, substance } = extractKeywords(query);



  return res.status(200).json({age,gender,neighborhood,substance})

  // Prepare data to send to another API (replace URL with your real endpoint)
//   const apiPayload = { age, gender, neighborhood, substance };

//   try {
//     // Send the extracted data to another API (mocked here with axios)
//     const response = await axios.post('https://mock-api-endpoint.com', apiPayload);

//     // Return the response from the external API to the frontend
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
