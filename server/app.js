const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

const cors = require('cors');
const nlp = require('compromise');
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Custom function to extract age, gender, neighborhood, and substance
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
  const substances = ['alcohol', 'drug', 'nicotine', 'fentanyl'];
  const substance = substances.find(sub => doc.has(sub)) || null;

  return { age, gender, neighborhood, substance };
};

app.get("/", (req, res) => {
  res.json({ message: "working" });
});

// Endpoint to process user query and send data to the external prediction API
app.post('/process-query', async (req, res) => {
  const { query } = req.body;

  if (!query) {
    return res.status(400).json({ error: 'Query is required' });
  }

  // Extract keywords from the user query using NLP and regex
  const { age, gender, neighborhood, substance } = extractKeywords(query);

  // If any of the required data is missing, return an error
  if (!age || !gender || !neighborhood || !substance) {
    return res.status(400).json({ error: 'Missing required information (Age, Gender, Neighborhood, Substance)' });
  }

  // Format the data according to the required structure
  const payload = {
    Age: age,
    Gender: gender,
    Neighborhood: neighborhood.toLowerCase(),
    Substance: substance.toLowerCase()
  };


  res.status(200).json(payload)

//   try {
//     // Send the formatted data to the external API
//     const response = await axios.post('http://98.83.145.159:6000/predict_expanded', payload);

//     // Return the response data from the external API back to the client
//     return res.status(200).json(response.data);
//   } catch (error) {
//     console.error('Error calling external API:', error);
//     return res.status(500).json({ error: 'Internal Server Error' });
//   }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
