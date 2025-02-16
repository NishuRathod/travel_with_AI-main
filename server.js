const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require("child_process");
const multer = require("multer");
const dotenv = require('dotenv');
const axios = require('axios');

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const upload = multer({ dest: "uploads/" });

const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY;
const PORT = process.env.PORT || 5001;

// Define place types for Google API
const types = ["restaurant", "lodging", "cafe", "shopping_mall", "tourist_attraction", "landmark", "hindu_temple", "stadium", "amusement_park"];

// Fetch places from Google Places API
const fetchPlaces = async (lat, lng, type) => {
    const url = `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=50000&type=${type}&key=${GOOGLE_API_KEY}`;

    try {
        console.log(`Fetching places: ${url}`);
        const response = await fetch(url);
        const data = await response.json();

        if (data.status !== "OK" || !data.results) {
            console.error(`Google API error: ${JSON.stringify(data)}`);
            return [];
        }

        return data.results.filter(place => place.rating > 4.0 && place.photos)
        .map(place => ({
            place_id: place.place_id,
            name: place.name,
            rating: place.rating,
            address: place.vicinity || "No address available",
            photos: place.photos ? place.photos.map(photo => 
                `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${photo.photo_reference}&key=${GOOGLE_API_KEY}`
            ) : [],
            reviews: place.user_ratings_total || 0,
            type: type
        }));
    } catch (error) {
        console.error(`Error fetching ${type}:`, error);
        return [];
    }
};


// Image Translation Endpoint
app.post("/api/translate-image", upload.single("image"), (req, res) => {
    if (!req.file) return res.status(400).json({ error: "No image uploaded" });
    
    const targetLang = req.body.targetLang || "en";
    
    const pythonProcess = spawn('C:\\Users\\ashwa\\AppData\\Local\\Programs\\Python\\Python39\\python.exe', ['translate.py', req.file.path, targetLang]);
    
    let result = "";
    pythonProcess.stdout.on("data", (data) => {
        result += data.toString();
    });
    
    pythonProcess.stderr.on("data", (data) => {
        console.error(`Python Error: ${data}`);
    });
    
    pythonProcess.on("close", (code) => {
        if (code === 0) {
            res.json({ translatedText: result.trim() });
        } else {
            res.status(500).json({ error: "Translation failed" });
        }
    });
});

// 📍 Get places from Google API
app.get("/api/places", async (req, res) => {
    const { lat, lng } = req.query;
    if (!lat || !lng) return res.status(400).json({ error: "Latitude and longitude are required" });

    try {
        const places = (await Promise.all(types.map(type => fetchPlaces(lat, lng, type)))).flat();
        res.json(places);
    } catch (error) {
        console.error("Error fetching places:", error);
        res.status(500).json({ error: "Failed to fetch places" });
    }
});

app.post("/api/generate-itinerary", async (req, res) => {
    try {
        console.log("Received request body:", req.body);

        // Validate request data
        const { destination, Numberofperson, duration, selectedPlaces } = req.body;
        if (!destination || !Numberofperson || !duration || !selectedPlaces) {
            return res.status(400).json({ error: "Missing required fields in request body." });
        }

        // 🔍 Ensure selectedPlaces is not empty
        const placesList = selectedPlaces.length > 0 ? selectedPlaces.join(", ") : "major attractions in the area";

        // 🌟 Construct AI Prompt
        const prompt = `Create a well-structured ${duration}-day travel itinerary for ${destination} that offers an engaging, thoughtful experience. 

**Important Guidelines:**  
- **Make it immersive** by describing what the traveler might **see, feel, and experience** at each location.  
- **Explain why each place is special** (its history, significance, or unique qualities).  
- **Use natural storytelling** to connect activities throughout the day.  
- Format the output clearly in markdown:  
  - **Day 1: Breakfast**  
    - *Restaurant Name* (INR 100) - Description with sensory details.  
  - **Morning:** What the traveler experiences at each location.  
  - **Lunch:** Suggestions with ambiance and taste details.  
  - **Afternoon:** Highlight must-see aspects of each place.  
  - **Evening:** Unique experiences to end the day.  
  - **Dinner:** Describe food, setting, and why it’s a great choice.  
  - **Accommodation:** Explain why the hotel is a good pick.  

**Traveler Profile:**  
- Traveling in a group of ${Numberofperson}.  
- Interested in: ${selectedPlaces.length > 0 ? selectedPlaces.join(", ") : "cultural landmarks, food experiences, and nature escapes"}.  

Make the itinerary exciting, engaging, and **thoughtfully written** as if it's a personal travel recommendation.`;


        console.log("AI Prompt:", prompt);

        // 🛠️ Send request to Gemini API
        const response = await axios.post(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent",
            {
                contents: [{ role: "user", parts: [{ text: prompt }] }]
            },
            {
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": GOOGLE_GEMINI_API_KEY
                }
            }
        );

        console.log("🔍 RAW AI RESPONSE:", JSON.stringify(response.data, null, 2)); // Debugging

        // ✅ Extract generated text safely
        let fullResponse = response.data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        if (!fullResponse) {
            throw new Error("Empty response from AI.");
        }

        // 🚀 Improved Cleanup Function
        let cleanedItinerary = fullResponse
            .replace(/([a-z])([A-Z])/g, "$1 $2")  // Fix missing spaces between words
            .replace(/\*\s+/g, "** ")             // Fix bold formatting
            .replace(/\s+\*/g, " *")              // Fix misplaced asterisks
            .replace(/(\w)-(\w)/g, "$1 - $2")     // Fix dashes between words
            .replace(/\n{2,}/g, "\n")             // Remove excessive newlines
            .replace(/\s{2,}/g, " ")              // Remove extra spaces
            .trim();

        console.log("✅ CLEANED ITINERARY:", cleanedItinerary);
        res.json({ itinerary: cleanedItinerary });

    } catch (error) {
        console.error("❌ Error generating AI itinerary:", error);
        res.status(500).json({ error: "Failed to generate AI itinerary." });
    }
});

// ✅ Test if Server is Running
app.get('/', (req, res) => {
    res.send("Server is running. API endpoints are available.");
});

// 🚀 Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
