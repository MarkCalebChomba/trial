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

// Function to load and display filtered listings based on category
const loadFeaturedListings = async () => {
    try {
        const listingsSnapshot = await getDocs(collection(firestore, 'Listings'));
        const galleryContainer = document.querySelector('.gallery-container');
        const category = galleryContainer.dataset.category; // Get the category for the current page

        galleryContainer.innerHTML = ''; // Clear previous content

        for (const listingDoc of listingsSnapshot.docs) {
            const listing = listingDoc.data();

            // Check if the listing belongs to the current category
            if (listing.category === category) {
                // Check if uploaderId exists, or fallback to userId
                const uploaderId = listing.uploaderId || listing.userId;

                let userData = {};
                if (uploaderId) {
                    const userDoc = await getDoc(doc(firestore, 'Users', uploaderId));
                    userData = userDoc.exists() ? userDoc.data() : {};
                } else {
                    console.warn('Listing missing uploaderId and userId:', listingDoc.id);
                }

                const listingElement = document.createElement('div');
                listingElement.className = 'gallery-item'; // Updated class name for gallery items
                listingElement.innerHTML = `
                    <div class="profile">
                        <img src="${userData.profilePicUrl || 'images/profile-placeholder.png'}" alt="${userData.name || 'Unknown User'}">
                        <div>
                            <p><strong>${userData.name || 'Unknown User'}</strong></p>
                            <p>${listing.name}</p> <!-- Display item name as the title -->
                        </div>
                    </div>
                    <div class="product-image-container">
                        <img src="${listing.imageUrl}" alt="Product Image" class="product-image" onclick="toggleDropdown(this)">
                        <div class="image-dropdown">
                            <div class="image-navigation">
                                <button class="prev" onclick="changeImage(-1)">&#10094;</button>
                                <img id="galleryImage" src="${listing.imageUrl}" alt="Gallery Image">
                                <button class="next" onclick="changeImage(1)">&#10095;</button>
                            </div>
                            <div class="description">
                                <p>${listing.description}</p>
                            </div>
                        </div>
                    </div>
                    <p class="product-price"><strong>KES ${listing.price}</strong></p>
                    <div class="product-actions">
                        <div class="product-actions-button">
                            <button class="fas fa-cart-plus" onclick="addToCart('${listingDoc.id}')"></button>
                            <p>Cart</p>
                        </div>
                        <div>
                            <i class="fas fa-bolt" onclick="buyNow('${listingDoc.id}')"></i>
                            <p>Buy Now</p>
                        </div>
                        <div>
                            <i class="fas fa-heart" onclick="addToWishlist('${listingDoc.id}')"></i>
                            <p>Wishlist</p>
                        </div>
                    </div>
                `;
                galleryContainer.appendChild(listingElement);
            }
        }
    } catch (error) {
        console.error('Error loading featured listings:', error);
    }
};

// Function to toggle dropdown gallery
window.toggleDropdown = function (element) {
    const dropdown = element.nextElementSibling;
    dropdown.style.display = dropdown.style.display === 'block' ? 'none' : 'block';
};

// Function to change images in the gallery
window.changeImage = function (direction) {
    const galleryImage = document.getElementById('galleryImage');
    const currentImage = galleryImage.src;
    const images = Array.from(document.querySelectorAll('.product-image')).map(img => img.src);
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
        alert('Item added to cart!');
    } else {
        alert('Please log in to add items to the cart.');
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
        alert('Item added to wishlist!');
    } else {
        alert('Please log in to add items to the wishlist.');
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
        window.location.href = 'checkout.html';
    } else {
        alert('Please log in to proceed with the purchase.');
    }
};

// Load filtered listings on page load
window.onload = loadFeaturedListings;

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
