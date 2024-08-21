import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { app } from '../src/js/firebase.js';

// Initialize Firebase services using the app instance
const auth = getAuth(app);
const firestore = getFirestore(app);

// Get references to the DOM elements
const wishlistItemsContainer = document.getElementById('wishlist-items');
const clearWishlistButton = document.getElementById('clear-wishlist-button');

// Function to load wishlist items from Firestore
const loadWishlistItems = async (user) => {
    if (!user) {
        alert('Please log in to view your wishlist.');
        return;
    }

    try {
        const wishlistSnapshot = await getDocs(collection(firestore, `Wishlist/${user.uid}/Items`));
        wishlistItemsContainer.innerHTML = ''; // Clear previous items

        if (wishlistSnapshot.empty) {
            wishlistItemsContainer.innerHTML = '<p>Your wishlist is empty.</p>';
            return;
        }

        wishlistSnapshot.forEach(doc => {
            const item = doc.data();

            const wishlistItemElement = document.createElement('div');
            wishlistItemElement.className = 'wishlist-item';
            wishlistItemElement.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}" class="wishlist-item-image">
                <div class="wishlist-item-details">
                    <p><strong>${item.name}</strong></p>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <button class="remove-button" data-id="${doc.id}">Remove</button>
                    <button class="add-to-cart-button" data-id="${doc.id}">Add to Cart</button>
                </div>
            `;
            wishlistItemsContainer.appendChild(wishlistItemElement);
        });
    } catch (error) {
        console.error('Error loading wishlist items:', error);
    }
};

// Add an auth state observer to check user login status
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Load wishlist items when the user is logged in
        loadWishlistItems(user);
    } else {
        // Redirect to login page if not logged in
        alert('You must be logged in to view your wishlist.');
        window.location.href = 'login.html';
    }
});

// Function to remove an item from the wishlist
wishlistItemsContainer.addEventListener('click', async (event) => {
    if (event.target.classList.contains('remove-button')) {
        const itemId = event.target.getAttribute('data-id');
        const user = auth.currentUser;
        if (user) {
            try {
                await deleteDoc(doc(firestore, `Wishlist/${user.uid}/Items/${itemId}`));
                loadWishlistItems(user); // Reload wishlist items after removal
            } catch (error) {
                console.error('Error removing wishlist item:', error);
            }
        }
    }

    // Function to add a wishlist item to the cart
    if (event.target.classList.contains('add-to-cart-button')) {
        const itemId = event.target.getAttribute('data-id');
        const user = auth.currentUser;
        if (user) {
            try {
                const wishlistItemRef = doc(firestore, `Wishlist/${user.uid}/Items/${itemId}`);
                const wishlistItemSnapshot = await getDoc(wishlistItemRef);
                const wishlistItem = wishlistItemSnapshot.data();

                const cartRef = doc(firestore, `Cart/${user.uid}/Items/${itemId}`);
                await setDoc(cartRef, { userId: user.uid, ...wishlistItem });
                await deleteDoc(wishlistItemRef); // Remove item from wishlist after adding to cart

                alert('Item added to cart!');
                loadWishlistItems(user); // Reload wishlist items after adding to cart
            } catch (error) {
                console.error('Error adding item to cart:', error);
            }
        } else {
            alert('Please log in to add items to the cart.');
        }
    }
});

// Function to clear the wishlist
clearWishlistButton.addEventListener('click', async () => {
    const user = auth.currentUser;
    if (user) {
        try {
            const wishlistItemsSnapshot = await getDocs(collection(firestore, `Wishlist/${user.uid}/Items`));
            const batch = writeBatch(firestore);
            wishlistItemsSnapshot.forEach(doc => {
                batch.delete(doc.ref);
            });

            await batch.commit();
            loadWishlistItems(user); // Reload wishlist items after clearing
            alert('Wishlist cleared.');
        } catch (error) {
            console.error('Error clearing wishlist:', error);
        }
    } else {
        alert('Please log in to clear your wishlist.');
    }
});
