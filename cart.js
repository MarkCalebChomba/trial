import { getAuth, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import { getFirestore, collection, doc, getDocs, deleteDoc } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { app } from '../src/js/firebase.js';

// Initialize Firebase services using the app instance
const auth = getAuth(app);
const firestore = getFirestore(app);

// Get references to the DOM elements
const cartItemsContainer = document.getElementById('cart-items');
const totalPriceElement = document.getElementById('total-price');
const checkoutButton = document.getElementById('checkout-button');

// Function to load cart items from Firestore
const loadCartItems = async (user) => {
    if (!user) {
        alert('Please log in to view your cart.');
        return;
    }

    try {
        const cartItemsSnapshot = await getDocs(collection(firestore, `Cart/${user.uid}/Items`));
        let total = 0;
        cartItemsContainer.innerHTML = ''; // Clear previous items

        if (cartItemsSnapshot.empty) {
            cartItemsContainer.innerHTML = '<p>Your cart is empty.</p>';
            totalPriceElement.textContent = '$0.00';
            return;
        }

        cartItemsSnapshot.forEach(doc => {
            const item = doc.data();
            total += item.price;

            const cartItemElement = document.createElement('div');
            cartItemElement.className = 'cart-item';
            cartItemElement.innerHTML = `
                <img src="${item.imageUrl}" alt="${item.name}" class="cart-item-image">
                <div class="cart-item-details">
                    <p><strong>${item.name}</strong></p>
                    <p>Price: $${item.price.toFixed(2)}</p>
                    <button class="remove-button" data-id="${doc.id}">Remove</button>
                </div>
            `;
            cartItemsContainer.appendChild(cartItemElement);
        });

        totalPriceElement.textContent = `$${total.toFixed(2)}`;
    } catch (error) {
        console.error('Error loading cart items:', error);
    }
};

// Add an auth state observer to check user login status
onAuthStateChanged(auth, (user) => {
    if (user) {
        // Load cart items when the user is logged in
        loadCartItems(user);
    } else {
        // Redirect to login page if not logged in
        alert('You must be logged in to view your cart.');
        window.location.href = 'login.html';
    }
});

// Function to remove an item from the cart
cartItemsContainer.addEventListener('click', async (event) => {
    if (event.target.classList.contains('remove-button')) {
        const itemId = event.target.getAttribute('data-id');
        const user = auth.currentUser;
        if (user) {
            try {
                await deleteDoc(doc(firestore, `Cart/${user.uid}/Items/${itemId}`));
                loadCartItems(user); // Reload cart items after removal
            } catch (error) {
                console.error('Error removing cart item:', error);
            }
        }
    }
});

// Event listener for checkout button
checkoutButton.addEventListener('click', () => {
    const user = auth.currentUser;
    if (user) {
        window.location.href = 'checkout.html'; // Redirect to checkout page
    } else {
        alert('Please log in to proceed with checkout.');
    }
});
