const express = require('express');
const axios = require('axios');
const fs = require('fs');
const csv = require('csv-parser');
const app = express();
const port = process.env.PORT || 3000;
const cors = require('cors');
app.use(cors());
// Middleware to parse JSON requests
app.use(express.json());

// Declare arrays to hold data from CSV
let neighborhoods = [];
let substances = [];
let ageRanges = [];

// Function to load the CSV file and extract necessary columns
const loadDataset = () => {
  fs.createReadStream('Substance_Use_20250301.csv') // Path to your dataset CSV
    .pipe(csv())
    .on('data', (row) => {
      // Assuming columns are 'Age', 'Substance', and 'Neighbourhood' in your CSV
      neighborhoods.push(row.Neighbourhood.toLowerCase());
      substances.push(row.Substance.toLowerCase());
      ageRanges.push(row.Age);  // Store age ranges as-is (e.g., '35 to 39')
    })
    .on('end', () => {
      console.log('Dataset loaded successfully');
    });
};

// Call the loadDataset function when the server starts
loadDataset();

// Function to check if an extracted value exists in the dataset
const isValidValue = (value, dataset) => {
  return dataset.some(item => item.toLowerCase() === value.toLowerCase());
};

// Function to extract keywords like Age, Gender, Neighborhood, and Substance
const extractKeywords = (query) => {
  const doc = require('compromise')(query);

  // Extract age using a regex (looking for phrases like '25 years old' or '25 yrs old')
  const agePattern = /(\d{1,3})\s?(?:years? old|yrs?)/i;
  const ageMatch = query.match(agePattern);
  const age = ageMatch ? ageMatch[1] : null;

  // Extract gender using a regex (looking for 'male' or 'female')
  const genderPattern = /\b(male|female)\b/i;
  const genderMatch = query.match(genderPattern);
  const gender = genderMatch ? genderMatch[1] : null;

  // Extract neighborhood using compromise
  const neighborhood = doc.match('#Place').text().toLowerCase() || null;

  // Extract substance using a simple list and compromise to match words like 'alcohol', 'drug', 'nicotine'
  const substancesFound = substances.filter(sub => doc.has(sub)); // Match the substances from dataset
  const substance = substancesFound.length > 0 ? substancesFound[0] : null;

  // Check if extracted neighborhood and substance are valid from dataset
  if (neighborhood && !isValidValue(neighborhood, neighborhoods)) {
    console.log('Invalid neighborhood detected:', neighborhood);
    return { error: 'Invalid neighborhood' };
  }

  if (substance && !isValidValue(substance, substances)) {
    console.log('Invalid substance detected:', substance);
    return { error: 'Invalid substance' };
  }

  // If the extracted age is within the valid age ranges, return it; otherwise, return an error
  if (age && !ageRanges.includes(age)) {
    console.log('Invalid age range detected:', age);
    return { error: 'Invalid age range' };
  }

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

  // If any of the required data is missing or invalid, return an error
  if (!age || !gender || !neighborhood || !substance) {
    return res.status(400).json({ error: 'Missing or invalid data (Age, Gender, Neighborhood, Substance)' });
  }

  // Format the data according to the required structure
  const payload = {
    Age: age,
    Gender: gender,
    Neighborhood: neighborhood,
    Substance: substance
  };

  try {
    // Send the formatted data to the external API
    const response = await axios.post('http://98.83.145.159:6000/predict_expanded', payload);

    // Return the response data from the external API back to the client
    return res.status(200).json(response.data);
  } catch (error) {
    console.error('Error calling external API:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
