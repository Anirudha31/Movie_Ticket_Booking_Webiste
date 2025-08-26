// ---- DOM Elements ----
const loginForm = document.getElementById("loginForm");
const signupForm = document.getElementById("signupForm");
const logoutBtn = document.getElementById("logoutBtn");
const userNameDisplay = document.getElementById("userNameDisplay");

const moviesGrid = document.getElementById("moviesGrid");
const searchInput = document.getElementById("searchInput");
const sortFilter = document.getElementById("sortFilter");

const bookingModal = document.getElementById("bookingModal");
const modalTitle = document.getElementById("modalTitle");
const showtimeSelect = document.getElementById("showtimeSelect");
const seatGrid = document.getElementById("seatGrid");
const confirmBooking = document.getElementById("confirmBooking");
const closeModal = document.getElementById("closeModal");

const bookingsList = document.getElementById("bookingsList");

let movies = [];
let currentMovie = null;
let selectedSeats = new Set();

// ---- Current User ----
let currentUser = JSON.parse(localStorage.getItem("currentUser"));

// ---- Login Page ----
if (loginForm) {
  loginForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const email = loginForm.email.value;
    const password = loginForm.password.value;

    const res = await fetch("http://localhost:5000/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password })
    });
    const data = await res.json();
    if (data.success) {
      localStorage.setItem("currentUser", JSON.stringify(data.user));
      window.location.href = "index.html";
    } else {
      alert(data.message);
    }
  });
}

// ---- Signup Page ----
if (signupForm) {
  signupForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const name = signupForm.fullname.value; // fixed: fullname
    const email = signupForm.email.value;
    const password = signupForm.password.value;

    const res = await fetch("http://localhost:5000/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password })
    });
    const data = await res.json();
    if (data.success) {
      alert("Signup successful! Please login.");
      signupForm.reset();
      window.location.href = "login.html";
    } else {
      alert(data.message);
    }
  });
}

// ---- Index Page: Check login ----
if (userNameDisplay) {
  if (!currentUser) {
    window.location.href = "login.html";
  } else {
    userNameDisplay.textContent = currentUser.name;
    loadMovies();
    renderBookings();
  }
}

// ---- Logout ----
if (logoutBtn) {
  logoutBtn.addEventListener("click", () => {
    localStorage.removeItem("currentUser");
    window.location.href = "login.html";
  });
}

// ---- Load Movies ----
async function loadMovies() {
  try {
    const res = await fetch("http://localhost:5000/movies");
    movies = await res.json();
    applyFiltersAndSearch();
  } catch (err) {
    console.error("Failed to load movies:", err);
  }
}

// ---- Render Movies ----
function renderMovies(moviesToRender) {
  moviesGrid.innerHTML = "";
  moviesToRender.forEach(movie => {
    const card = document.createElement("div");
    card.className = "p-3 bg-white rounded-lg shadow overflow-hidden flex flex-col";

    // Movie Poster
    const poster = document.createElement("img");
    poster.src = movie.poster || movie.image; // try both keys
    poster.alt = movie.title;
    poster.className = "w-full h-64 object-cover mb-2 rounded-lg shadow-md transition-transform hover:scale-105";

    // Movie Title
    const title = document.createElement("h2");
    title.textContent = movie.title;
    title.className = "text-lg font-bold text-gray-800 mb-1";

    // Description
    const desc = document.createElement("p");
    desc.textContent = movie.description;
    desc.className = "text-sm text-gray-600 mb-1";

    // Price
    const price = document.createElement("p");
    price.textContent = `₹${movie.price}`;
    price.className = "text-sm font-semibold mb-2";

    // Book Button
    const btn = document.createElement("button");
    btn.textContent = "Book";
    btn.className = "mt-auto px-3 py-1 bg-blue-600 text-white rounded";
    btn.addEventListener("click", () => openBookingModal(movie));

    card.append(poster, title, desc, price, btn);
    moviesGrid.appendChild(card);
  });
}

// ---- Filter & Sort ----
function applyFiltersAndSearch() {
  if (!moviesGrid) return;
  let filtered = [...movies];
  const search = searchInput?.value.toLowerCase();
  if (search) filtered = filtered.filter(m => m.title.toLowerCase().includes(search));

  const sort = sortFilter?.value;
  if (sort === "price-asc") filtered.sort((a, b) => a.price - b.price);
  if (sort === "price-desc") filtered.sort((a, b) => b.price - a.price);

  renderMovies(filtered);
}

searchInput?.addEventListener("input", applyFiltersAndSearch);
sortFilter?.addEventListener("change", applyFiltersAndSearch);

// ---- Booking Modal ----
function openBookingModal(movie) {
  currentMovie = movie;
  bookingModal.classList.remove("hidden");
  modalTitle.textContent = movie.title;
  selectedSeats.clear();
  renderSeats();
}

function closeBookingModal() {
  bookingModal.classList.add("hidden");
}

function renderSeats() {
  seatGrid.innerHTML = "";
  for (let i = 0; i < 48; i++) {
    const seat = document.createElement("div");
    seat.className = "w-8 h-8 flex items-center justify-center border rounded cursor-pointer text-xs";
    seat.textContent = String.fromCharCode(65 + Math.floor(i / 8)) + (i % 8 + 1);
    seat.addEventListener("click", () => toggleSeat(i, seat));
    seatGrid.appendChild(seat);
  }
}

function toggleSeat(i, el) {
  if (selectedSeats.has(i)) {
    selectedSeats.delete(i);
    el.classList.remove("bg-green-400", "text-white");
  } else {
    selectedSeats.add(i);
    el.classList.add("bg-green-400", "text-white");
  }
}

confirmBooking?.addEventListener("click", async () => {
  if (selectedSeats.size === 0) return alert("Select at least one seat.");
  if (!currentUser) return alert("You must login to book.");

  const booking = {
    movieId: currentMovie.id,
    title: currentMovie.title,
    showtime: showtimeSelect.value,
    seats: Array.from(selectedSeats).map(i => String.fromCharCode(65 + Math.floor(i / 8)) + (i % 8 + 1)),
    price: selectedSeats.size * currentMovie.price,
    date: new Date().toISOString()
  };

  await fetch("http://localhost:5000/bookings", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(booking)
  });

  alert("Booking Confirmed!");
  closeBookingModal();
  renderBookings();
});

closeModal?.addEventListener("click", closeBookingModal);

// ---- Booking History ----
async function renderBookings() {
  if (!bookingsList) return;
  try {
    const res = await fetch("http://localhost:5000/bookings");
    const bookings = await res.json();

    bookingsList.innerHTML = "";
    if (bookings.length === 0) {
      bookingsList.innerHTML = "<p class='text-sm text-gray-500'>No bookings yet.</p>";
      return;
    }

    bookings.forEach(b => {
      const el = document.createElement("div");
      el.className = "p-3 rounded bg-gray-50";
      el.innerHTML = `
        <div class="flex justify-between">
          <div>
            <div class="font-semibold">${b.title}</div>
            <div class="text-xs text-gray-600">${b.showtime} • ${new Date(b.date).toLocaleString()}</div>
          </div>
          <div class="text-sm font-semibold">₹${b.price}</div>
        </div>
        <div class="text-xs text-gray-600 mt-2">Seats: ${b.seats.join(", ")}</div>
      `;
      bookingsList.appendChild(el);
    });
  } catch (err) {
    console.error("Failed to load bookings:", err);
  }
}
