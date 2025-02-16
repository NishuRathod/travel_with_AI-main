import { Card, CardContent, CardMedia, Typography } from '@mui/material';

export default function Place({ place }) {
  return (
    <Card>
      <CardMedia
        component="img"
        height="200"
        image={place.photos?.[0] || "https://via.placeholder.com/200"}
        alt={place.name}
      />
      <CardContent>
        <Typography variant="h6">{place.name}</Typography>
        <Typography variant="body2">Rating: {place.rating} ⭐</Typography>
        <Typography variant="body2">{place.address}</Typography>
        <Typography variant="body2">Reviews: {place.reviews}</Typography>
      </CardContent>
    </Card>
  );
}

