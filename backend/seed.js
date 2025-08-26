import db from "./db.js";
import { nanoid } from "nanoid";

function seedMovies() {
  const count = db.prepare("SELECT COUNT(*) as c FROM movies").get().c;
  if (count > 0) {
    console.log("Movies already seeded.");
    return;
  }

  const movies = [
    {
      title: "Demon Slayer: Infinity Castle",
      lang: "Japanese",
      genre: JSON.stringify(["Animation","Action"]),
      rating: "8.9",
      poster: "https://preview.redd.it/new-poster-for-demon-slayer-kimetsu-no-yaiba-infinity-v0-jnccimdxdo9f1.jpeg",
      duration: "1h 54m",
      price: 220,
      showtimes: JSON.stringify(["10:00 AM","1:00 PM","4:00 PM","7:30 PM"])
    },
    {
      title: "Avengers: Endgame",
      lang: "English",
      genre: JSON.stringify(["Action","Drama"]),
      rating: "9.2",
      poster: "https://filmartgallery.com/cdn/shop/files/Avengers-Endgame-Official-Movie-Poster-295-Vintage-Movie-Poster-Original.jpg",
      duration: "3h 1m",
      price: 300,
      showtimes: JSON.stringify(["11:30 AM","2:30 PM","6:30 PM","9:30 PM"])
    },
    {
      title: "Local Comedy Hit",
      lang: "Hindi",
      genre: JSON.stringify(["Comedy"]),
      rating: "7.8",
      poster: "https://images.unsplash.com/photo-1524985069026-dd778a71c7b4",
      duration: "2h 10m",
      price: 180,
      showtimes: JSON.stringify(["12:00 PM","3:00 PM","6:00 PM","9:00 PM"])
    }
  ];

  const insert = db.prepare(`INSERT INTO movies (id, title, lang, genre, rating, poster, duration, price, showtimes)
    VALUES (@id, @title, @lang, @genre, @rating, @poster, @duration, @price, @showtimes)`);

  const tx = db.transaction((arr) => {
    for (const m of arr) {
      insert.run({
        id: nanoid(),
        ...m
      });
    }
  });

  tx(movies);
  console.log("Seeded movies.");
}

seedMovies();
