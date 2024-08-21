import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  doc,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  getDocs,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-storage.js";
import { app } from "../src/js/firebase.js";
import { onAuthChange } from '../src/js/auth.js';

// Initialize Firebase services
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Function to set user profile picture
async function setUserProfilePicture(user) {
  try {
    const userDoc = await getDoc(doc(db, 'Users', user.uid));
    const userData = userDoc.exists() ? userDoc.data() : {};
    const profilePicElement = document.getElementById('profile-pic');

    if (profilePicElement) {
      profilePicElement.src = userData.profilePicUrl || 'default-profile.png';
    } else {
      console.warn('Profile picture element not found.');
    }
  } catch (error) {
    console.error('Error setting user profile picture:', error);
  }
}

// Handle form submission for listing an item
document
  .getElementById("submit-items-button")
  .addEventListener("click", async (e) => {
    e.preventDefault();

    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to list an item.");
      return;
    }

    const forms = document.querySelectorAll('.item-listing-form form');

    for (const form of forms) {
      const itemName = form.querySelector('input[name="item-name"]').value;
      const itemPrice = form.querySelector('input[name="item-price"]').value;
      const itemCategory = form.querySelector('select[name="item-category"]').value;
      const itemDescription = form.querySelector('textarea[name="item-description"]').value;
      const itemImage = form.querySelector('input[name="item-image"]').files[0];

      let imageUrl = '';

      if (itemImage) {
        const imageRef = storageRef(storage, `listings/${user.uid}/${itemImage.name}`);
        const snapshot = await uploadBytes(imageRef, itemImage);
        imageUrl = await getDownloadURL(snapshot.ref);
      }

      try {
        await addDoc(collection(db, "Listings"), {
          uploaderId: user.uid,
          name: itemName,
          price: parseFloat(itemPrice),
          category: itemCategory,
          description: itemDescription,
          imageUrl: imageUrl,
          createdAt: new Date().toISOString(),
        });

        alert("Item listed successfully!");
        form.reset();
      } catch (error) {
        console.error("Error listing item:", error);
        alert("There was an error listing the item. Please try again.");
      }
    }
  });

// Load and display user listings
let lastVisible = null;

async function loadMoreListings() {
  try {
    let listingsQuery = query(
      collection(db, 'Listings'),
      where('uploaderId', '==', auth.currentUser.uid),
      orderBy('createdAt'),
      limit(10)
    );

    if (lastVisible) {
      listingsQuery = startAfter(lastVisible);
    }

    const snapshot = await getDocs(listingsQuery);
    lastVisible = snapshot.docs[snapshot.docs.length - 1];

    const listingsContainer = document.getElementById('listings-container');
    snapshot.forEach((doc) => {
      const listing = doc.data();
      const listingElement = document.createElement('div');
      listingElement.className = 'listing';
      listingElement.innerHTML = `
        <img src="${listing.imageUrl}" alt="${listing.name}">
        <h4>${listing.name}</h4>
        <p>${listing.description}</p>
        <p><strong>Price:</strong> $${listing.price}</p>
        <p><strong>Category:</strong> ${listing.category}</p>
      `;
      listingsContainer.appendChild(listingElement);
    });
  } catch (error) {
    console.error('Error loading listings:', error);
  }
}

document.getElementById('load-more-button').addEventListener('click', loadMoreListings);

// Handle authentication state changes
document.addEventListener('DOMContentLoaded', () => {
  onAuthChange(async (user) => {
    if (user) {
      await setUserProfilePicture(user); // Set user profile picture
      loadMoreListings(); // Load the initial listings
    } else {
      window.location.href = 'login.html'; // Redirect to login if not authenticated
    }
  });

  // Handle adding more item forms
  document.getElementById('add-item-button').addEventListener('click', () => {
    const container = document.getElementById('items-container');
    const itemForms = container.getElementsByClassName('item-listing-form');
    const newItemNumber = itemForms.length + 1;
    const newItemForm = itemForms[0].cloneNode(true);

    newItemForm.querySelector('h3').textContent = `Item ${newItemNumber}`;
    const inputs = newItemForm.getElementsByTagName('input');
    for (let input of inputs) {
      if (input.type !== 'file') {
        input.value = '';
      }
    }
    newItemForm.querySelector('textarea').value = '';
    container.appendChild(newItemForm);
  });
});
