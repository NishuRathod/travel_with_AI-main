import React, { useState } from "react";
import axios from "axios";
import PlacesAutocomplete, { geocodeByAddress, getLatLng } from "react-places-autocomplete";

const TravelPlanner = () => {
  const [destination, setDestination] = useState("");
  const [coordinates, setCoordinates] = useState(null);
  const [Numberofperson, setNumberofperson] = useState(1);
  const [duration, setDuration] = useState(1);
  const [selectedPlaces, setSelectedPlaces] = useState([]);
  const [itinerary, setItinerary] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Handle location selection
  const handleSelect = async (address) => {
    try {
      const results = await geocodeByAddress(address);
      const latLng = await getLatLng(results[0]);
      setDestination(address);
      setCoordinates(latLng);
    } catch (error) {
      console.error("Error fetching location details:", error);
    }
  };

  // Fix itinerary formatting issues
  const fixItineraryFormatting = (rawText) => {
    return rawText
      .replace(/\*{2,}/g, " ") // Fix excessive bolding
      .replace(/\*{3,}/g, " ") // Fix excessive italics
      .replace(/([a-z])([A-Z])/g, "$1 $2") // Fix missing spaces between words
      .replace(/(\w)([A-Z])/g, "$1 $2") // Ensure proper capitalization spacing
      .replace(/\n/g, "<br/>") // Convert new lines to <br/> for display
      .replace(/- \*/g, "- ") // Remove unwanted bullet formatting
      .replace(/\s?([,.])/g, "$1") // Remove spaces before punctuation
      .replace(/(\d)([A-Z])/g, "$1 $2") // Fix spacing between numbers and words
      .replace(/\s+/g, " ") // Remove multiple spaces
      .trim();
  };

  // Generate itinerary
  const handleGeneratePlan = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await axios.post("http://localhost:5001/api/generate-itinerary", {
        destination,
        coordinates,
        Numberofperson,
        duration,
        selectedPlaces,
      });

      if (!response.data || !response.data.itinerary) {
        throw new Error("Invalid itinerary response.");
      }

      setItinerary(fixItineraryFormatting(response.data.itinerary));
    } catch (error) {
      setError("Failed to generate itinerary. Please try again.");
      console.error("Error fetching itinerary:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Plan Your Trip</h2>

      {/* Destination Search */}
      <PlacesAutocomplete value={destination} onChange={setDestination} onSelect={handleSelect}>
        {({ getInputProps, suggestions, getSuggestionItemProps }) => (
          <div>
            <input {...getInputProps({ placeholder: "Enter a Place" })} />
            <div>
              {suggestions.map((suggestion) => (
                <div {...getSuggestionItemProps(suggestion)} key={suggestion.id || suggestion.placeId}>
                  {suggestion.description}
                </div>
              ))}
            </div>
          </div>
        )}
      </PlacesAutocomplete>

      {/* Trip Settings */}
      <label>Numberofperson:</label>
      <input type="number" value={Numberofperson} min="1" onChange={(e) => setNumberofperson(Number(e.target.value))} />

      <label>Duration (days):</label>
      <input type="number" value={duration} min="1" onChange={(e) => setDuration(Number(e.target.value))} />

      <button onClick={handleGeneratePlan} disabled={loading}>
        {loading ? "Generating..." : "Generate Plan"}
      </button>

      {/* Generated Itinerary */}
      {itinerary && (
        <div>
          <h3>Generated Itinerary</h3>
          <div
            style={{
              whiteSpace: "pre-wrap",
              fontFamily: "Arial, sans-serif",
              lineHeight: "1.5",
            }}
            dangerouslySetInnerHTML={{ __html: itinerary }}
          />
        </div>
      )}

      {/* Error Message */}
      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
};

export default TravelPlanner;



