import React, { useState } from "react";
import Autocomplete from "react-google-autocomplete";
import axios from "axios";
import {
  Container,
  Typography,
  Chip,
  Stack,
  CardContent,
  Box,
  CircularProgress,
  Card,
  Grid,
  Button,
  TextField,
} from "@mui/material";
import Place from "./Place";
import TripPlannerForm from "./components/TripPlannerForm";
import ItineraryGenerator from "./components/Itenerary";

// API Keys
const GOOGLE_API_KEY = process.env.REACT_APP_GOOGLE_API_KEY;
const WEATHER_API_KEY = process.env.REACT_APP_WEATHER_API_KEY;

export default function TravelApp() {
  const [places, setPlaces] = useState([]);
  const [weather, setWeather] = useState(null);
  const [tripData, setTripData] = useState(null);
  const [city, setCity] = useState("");
  const [loading, setLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [image, setImage] = useState(null);
  const [translatedText, setTranslatedText] = useState("");
  const [targetLang, setTargetLang] = useState("en");

  // Handle Image Upload for Translation
  const handleImageChange = (e) => {
    setImage(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!image) {
      alert("Please select an image");
      return;
    }
    const formData = new FormData();
    formData.append("image", image);
    formData.append("targetLang", targetLang);
    try {
      const response = await axios.post("http://localhost:5001/api/translate-image", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      setTranslatedText(response.data.translatedText);
    } catch (error) {
      console.error("Error translating image: ", error);
      alert("Translation failed");
    }
  };

  // Fetch Places from Backend
  const fetchPlaces = async (lat, lng, categories) => {
    try {
      setLoading(true);
      const response = await fetch(
        `http://localhost:5001/api/places?lat=${lat}&lng=${lng}&categories=${categories.join(",")}`
      );

      if (!response.ok) throw new Error("Failed to fetch places");

      const data = await response.json();
      setPlaces(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Error fetching places:", error.message);
      setPlaces([]);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Weather from OpenWeather API
  const fetchWeather = async (city) => {
    try {
      const response = await fetch(
        `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${WEATHER_API_KEY}&units=metric`
      );
      if (!response.ok) throw new Error("Failed to fetch weather");
      const data = await response.json();
      setWeather(data);
    } catch (error) {
      console.error("Failed to fetch weather", error);
    }
  };

  return (
    <Container maxWidth={false}>
      <Container className="header" maxWidth={false}>
      <Typography className="heading" variant="h3" textAlign="center" gutterBottom sx={{ color: "primary.main" }}>
        Travel Buddy
      </Typography>

      {/* Destination Search */}
      <Box display="flex" justifyContent="center" my={2}>
        <Autocomplete
          apiKey={GOOGLE_API_KEY}
          onPlaceSelected={(place) => {
            if (place.geometry && place.address_components) {
              const cityName = place.address_components.find((c) => c.types.includes("locality"))?.long_name;
              if (cityName) {
                setCity(cityName);
                fetchWeather(cityName);
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();
                fetchPlaces(lat, lng, ["restaurant", "tourist_attraction"]);
              }
            }
          }}
          options={{
            types: ["geocode"],
            componentRestrictions: { country: "in" },
          }}
          inputProps={{
            onChange: (e) => {
              setInputValue(e.target.value);
              if (!e.target.value.trim()) {
                setCity("");
                setWeather(null);
              }
            },
            value: inputValue,
            placeholder: "Enter a Place",
          }}
        />
      </Box>

      {/* Display Weather Info */}
      {weather && (
        <Card className="weather">
          <Box>
            <Grid container spacing={3}>
              <Grid item xs={8}>
                <CardContent>
                  <Typography variant="h5">Selected City: {city}</Typography>
                  <Typography variant="h6">Weather in {weather.name}</Typography>
                  <Typography>Temperature: {weather.main?.temp}°C</Typography>
                  <Typography>Condition: {weather.weather?.[0]?.description}</Typography>
                </CardContent>
              </Grid>
              <Grid item xs={4}>
                <CardContent>
                  <Typography variant="h5" sx={{ marginBottom: 2 }}>Book your travel</Typography>
                  <Stack useFlexGap sx={{ flexWrap: "wrap" }} direction="row" spacing={1}>
                    <Chip href="https://www.makemytrip.com/flights" component="a" target="_blank" label="Flights" />
                    <Chip href="https://www.irctc.co.in/" component="a" target="_blank" label="Trains" />
                    <Chip href="https://www.olacabs.com/" component="a" target="_blank" label="Ola" />
                    <Chip href="https://www.uber.com/" component="a" target="_blank" label="Uber" />
                    <Chip href="https://www.rapido.bike/" component="a" target="_blank" label="Rapido" />
                    <Chip href="https://www.indrive.com/" component="a" target="_blank" label="Indrive" />
                  </Stack>
                </CardContent>
              </Grid>
            </Grid>
          </Box>
        </Card>
      )}
      </Container>

      {/* Image Translation */}
    <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
      <Card sx={{ width: 400, p: 3, boxShadow: 3, textAlign: "center" }}>
        <CardContent>
          <Typography variant="h5" gutterBottom>
            AI-Powered Image Translation
          </Typography>
          <Grid container spacing={2} justifyContent="center">
            <Grid item xs={12}>
              <Button variant="contained" component="label">
                Choose Image
                <input type="file" accept="image/*" onChange={handleImageChange} />
              </Button>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Target Language"
                variant="outlined"
                size="small"
                fullWidth
                value={targetLang}
                onChange={(e) => setTargetLang(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button variant="contained" color="primary" fullWidth onClick={handleUpload}>
                Translate Image
              </Button>
            </Grid>
          </Grid>
          {translatedText && (
            <Typography variant="h6" mt={2}>
              Translated Text: {translatedText}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Box>

      {/* Display Top Attractions */}
      {city && (
        <>
          <Typography variant="h4" my={2} textAlign="center">
            Top Attractions
          </Typography>

          {loading ? (
            <Box display="flex" justifyContent="center" my={2}>
              <CircularProgress />
            </Box>
          ) : (
            <Grid container spacing={1} justifyContent="center">
              {places.length > 0 ? (
                places.map((place, index) => (
                  <Grid item xs={12} sm={6} md={4} key={`${place.place_id}-${index}`}>
                    <Place place={place} />
                  </Grid>
                ))
              ) : (
                <Typography variant="body1" textAlign="center">
                  No attractions found.
                </Typography>
              )}
            </Grid>
          )}
        </>
      )}

      {/* Trip Planning Form */}
      <TripPlannerForm onGenerate={setTripData} />

      {/* Display Generated Itinerary */}
      {tripData && (
        <>
          <Typography variant="h4" my={8}>Generated Itinerary</Typography>
          <ItineraryGenerator travelDetails={tripData} />
        </>
      )}
    </Container>
  );
}

