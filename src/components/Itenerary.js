import React, { useState } from "react";
import axios from "axios";
import { Box, Button, Typography, CircularProgress, Card, CardContent } from "@mui/material";

const ItineraryGenerator = ({ travelDetails }) => {
  const [itinerary, setItinerary] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateItinerary = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post("http://localhost:5001/generate-itinerary", travelDetails);
      
      if (response.data.itinerary) {
        const formattedItinerary = response.data.itinerary.split("\n\n").map((dayPlan, index) => {
          const parts = dayPlan.split("\n");
          return {
            day: `Day ${index + 1}: ${parts[0]}`, // Title of the day
            morning: parts.find(line => line.startsWith("Morning:")) || "",
            afternoon: parts.find(line => line.startsWith("Afternoon:")) || "",
            evening: parts.find(line => line.startsWith("Evening:")) || ""
          };
        });
        setItinerary(formattedItinerary);
      } else {
        throw new Error("Invalid response format");
      }
    } catch (error) {
      console.error("Error generating itinerary:", error);
      setError("Failed to generate itinerary. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Button onClick={generateItinerary} disabled={loading} variant="contained" color="primary">
        {loading ? "Generating..." : "Generate Itinerary"}
      </Button>
      {loading && <CircularProgress sx={{ mt: 2 }} />}
      {error && <Typography color="error">{error}</Typography>}
      <Box sx={{ mt: 2 }}>
        {itinerary.map((dayPlan, index) => (
          <Card key={index} sx={{ my: 1, p: 2 }}>
            <CardContent>
              <Typography variant="h5" sx={{ fontWeight: "bold" }}>{dayPlan.day}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Morning:</strong> {dayPlan.morning.replace("Morning:", "").trim()}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Afternoon:</strong> {dayPlan.afternoon.replace("Afternoon:", "").trim()}</Typography>
              <Typography sx={{ mt: 1 }}><strong>Evening:</strong> {dayPlan.evening.replace("Evening:", "").trim()}</Typography>
            </CardContent>
          </Card>
        ))}
      </Box>
    </Box>
  );
};

export default ItineraryGenerator;
