import { logoutUser, onAuthChange } from "../src/js/auth.js";
import { app } from "../src/js/firebase.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getStorage } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  setDoc,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Initialize Firebase services using the app instance
const auth = getAuth(app);
const storage = getStorage(app);
const firestore = getFirestore(app);

// DOM elements
const profilePic = document.getElementById("profile-pic");
const userEmail = document.getElementById("user-email");
const userName = document.getElementById("user-name");
const userPhone = document.getElementById("user-phone");

// Toggle menu dropdown
export function toggleMenu() {
  const dropdown = document.getElementById("dropdown");
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
}

// Close dropdown if clicked outside
window.onclick = function (event) {
  if (
    !event.target.matches(".menu-icon") &&
    !event.target.matches(".menu-icon *")
  ) {
    const dropdown = document.getElementById("dropdown");
    if (dropdown.style.display === "block") {
      dropdown.style.display = "none";
    }
  }
};

// Function to display user status and logout button
const displayAuthStatus = (user) => {
  const authStatusDiv = document.getElementById("auth-status");
  authStatusDiv.innerHTML = ""; // Clear the current content

  if (user) {
    const logoutButton = document.createElement("button");
    logoutButton.innerText = "Logout";
    logoutButton.addEventListener("click", async () => {
      await logoutUser();
      window.location.reload(); // Reload the page after logout
    });

    const welcomeMessage = document.createElement("span");
    welcomeMessage.innerText = `Welcome, ${user.email}`;

    authStatusDiv.appendChild(welcomeMessage);
    authStatusDiv.appendChild(logoutButton);
  } else {
    authStatusDiv.innerHTML =
      '<a href="login.html">Login</a> | <a href="signup.html">Sign Up</a>';
  }
};

// Listen to authentication state changes
onAuthChange(displayAuthStatus);

// Function to load and display featured listings with gallery dropdown
const loadFeaturedListings = async () => {
  try {
    const listingsSnapshot = await getDocs(collection(firestore, "Listings"));
    const listingsContainer = document.getElementById("listings-container");

    listingsContainer.innerHTML = ""; // Clear previous content

    for (const listingDoc of listingsSnapshot.docs) {
      const listing = listingDoc.data();

      // Check if uploaderId exists, or fallback to userId
      const uploaderId = listing.uploaderId || listing.userId;

      let userData = {};
      if (uploaderId) {
        const userDoc = await getDoc(doc(firestore, "Users", uploaderId));
        userData = userDoc.exists() ? userDoc.data() : {};
      } else {
        console.warn("Listing missing uploaderId and userId:", listingDoc.id);
      }

      function toggleDropdown(element) {
        const dropdown = element.nextElementSibling;
        dropdown.classList.toggle("visible");
      }

      function changeImage(direction) {
        // Your logic to change the image goes here
      }

      const listingElement = document.createElement("div");
      listingElement.className = "listing-item";

      // Your existing code to set innerHTML
      document.getElementById("listings-container").appendChild(listingElement);
      listingElement.innerHTML = `
        <div class="product-item">
          <div class="profile">
            <img src="${
              userData.profilePicUrl || "images/profile-placeholder.png"
            }" alt="${userData.name || "Unknown User"}">
            <div>
              <p><strong>${userData.name || "Unknown User"}</strong></p>
              <p>${listing.name}</p>
            </div>
          </div>
          <div class="product-image-container">
            <img src="${
              listing.imageUrl
            }" alt="Product Image" class="product-image" onclick="toggleDropdown(this)">
            <div class="image-dropdown">
              <div class="image-navigation">
                <button class="prev" onclick="changeImage(-1)">&#10094;</button>
                <img id="galleryImage" src="${
                  listing.imageUrl
                }" alt="Gallery Image">
                <button class="next" onclick="changeImage(1)">&#10095;</button>
              </div>
              <div class="description">
                <p>${listing.description}</p>
              </div>
            </div>
          </div>
          <p class="product-price"><strong>KES ${listing.price}</strong></p>
          <div class="product-actions">
            <div>
              <i class="fas fa-cart-plus" onclick="addToCart('${
                listingDoc.id
              }')"></i>
              <p>Cart</p>
            </div>
            <div>
              <i class="fas fa-bolt" onclick="buyNow('${listingDoc.id}')"></i>
              <p>Buy Now</p>
            </div>
            <div>
              <i class="fas fa-heart" onclick="addToWishlist('${
                listingDoc.id
              }')"></i>
              <p>Wishlist</p>
            </div>
          </div>
        </div>
      `;

      listingsContainer.appendChild(listingElement);
    }
  } catch (error) {
    console.error("Error loading featured listings:", error);
  }
};

// Function to toggle dropdown gallery
window.toggleDropdown = function (element) {
  const dropdown = element.nextElementSibling;
  dropdown.style.display =
    dropdown.style.display === "block" ? "none" : "block";
};

// Function to change images in the gallery
window.changeImage = function (direction) {
  const galleryImage = document.getElementById("galleryImage");
  const currentImage = galleryImage.src;
  const images = Array.from(document.querySelectorAll(".product-image")).map(
    (img) => img.src
  );
  let currentIndex = images.indexOf(currentImage);

  currentIndex = (currentIndex + direction + images.length) % images.length;
  galleryImage.src = images[currentIndex];
};

// Function to add item to cart
window.addToCart = async function (listingId) {
  const user = auth.currentUser;
  if (user) {
    const listingRef = doc(firestore, `Listings/${listingId}`);
    const snapshot = await getDoc(listingRef);
    const listing = snapshot.data();

    const cartRef = doc(firestore, `Cart/${user.uid}/${listingId}`);
    await setDoc(cartRef, { userId: user.uid, ...listing });
    alert("Item added to cart!");
  } else {
    alert("Please log in to add items to the cart.");
  }
};

// Function to add item to wishlist
window.addToWishlist = async function (listingId) {
  const user = auth.currentUser;
  if (user) {
    const listingRef = doc(firestore, `Listings/${listingId}`);
    const snapshot = await getDoc(listingRef);
    const listing = snapshot.data();

    const wishlistRef = doc(firestore, `Wishlist/${user.uid}/${listingId}`);
    await setDoc(wishlistRef, { userId: user.uid, ...listing });
    alert("Item added to wishlist!");
  } else {
    alert("Please log in to add items to the wishlist.");
  }
};

// Function to buy now (add to checkout and redirect)
window.buyNow = async function (listingId) {
  const user = auth.currentUser;
  if (user) {
    const listingRef = doc(firestore, `Listings/${listingId}`);
    const snapshot = await getDoc(listingRef);
    const listing = snapshot.data();

    const checkoutRef = doc(firestore, `Checkout/${user.uid}/${listingId}`);
    await setDoc(checkoutRef, { userId: user.uid, ...listing });
    window.location.href = "checkout.html";
  } else {
    alert("Please log in to proceed with the purchase.");
  }
};

// Load featured listings on page load
window.onload = loadFeaturedListings;

// Search bar functionality
const searchInput = document.getElementById("searchInput");
const searchSuggestions = document.getElementById("searchSuggestions");
const searchForm = document.getElementById("searchForm");

const categories = [
  "Electronics",
  "Kitchenware",
  "Furniture",
  "Fashion",
  "Beauty",
  "Rentals",
  "Service Men",
  "Foodstuffs",
  "Phones",
  "Accessories",
  "Pharmaceutical",
  "Wigs",
  // Add more categories as needed
];

// Mock data for suggestions
const suggestions = [
  "Profile Name 1",
  "Profile Name 2",
  "Product Description 1",
  "Product Description 2",
  "Category 1",
  "Category 2",
  "Category 3",
  // Add more suggestions as needed
];

// Function to filter suggestions based on search input
function filterSuggestions(input) {
  return suggestions.filter((suggestion) =>
    suggestion.toLowerCase().includes(input.toLowerCase())
  );
}

// Function to display suggestions
function displaySuggestions(filteredSuggestions) {
  searchSuggestions.innerHTML = "";
  filteredSuggestions.forEach((suggestion) => {
    const suggestionItem = document.createElement("div");
    suggestionItem.classList.add("suggestion-item");
    suggestionItem.textContent = suggestion;
    searchSuggestions.appendChild(suggestionItem);
  });
}

// Event listener for search input
searchInput.addEventListener("input", () => {
  const inputValue = searchInput.value.trim();
  if (inputValue) {
    const filteredSuggestions = filterSuggestions(inputValue);
    displaySuggestions(filteredSuggestions);
    searchSuggestions.style.display = "block";
  } else {
    searchSuggestions.style.display = "none";
  }
});

// Hide suggestions when clicking outside the search bar
document.addEventListener("click", (e) => {
  if (!searchForm.contains(e.target)) {
    searchSuggestions.style.display = "none";
  }
});

// Function to fetch and display data by ID
async function fetchAndDisplayData(collection, documentId) {
  try {
    const data = await getDocumentById(collection, documentId);
    if (data) {
      // Display the data in the UI
    } else {
      console.error("No document found with ID:", documentId);
    }
  } catch (error) {
    console.error("Error fetching document:", error);
    alert("Failed to retrieve data. Please try again.");
  }
}
