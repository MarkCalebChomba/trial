// /src/js/cart.js

import { db } from './firebase.js';
import { collection, addDoc, doc, updateDoc, deleteDoc, query, where, getDocs } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Function to add an item to the cart
const addItemToCart = async (userId, item) => {
  try {
    const cartRef = collection(db, 'Carts');
    const newItem = {
      userId: userId,
      itemId: item.id,
      title: item.title,
      price: item.price,
      quantity: 1
    };
    await addDoc(cartRef, newItem);
    console.log('Item added to cart');
  } catch (error) {
    console.error('Error adding item to cart: ', error);
  }
};

// Function to get all items in the user's cart
const getCartItems = async (userId) => {
  try {
    const cartRef = collection(db, 'Carts');
    const q = query(cartRef, where('userId', '==', userId));
    const querySnapshot = await getDocs(q);
    const items = [];
    querySnapshot.forEach((doc) => {
      items.push({ id: doc.id, ...doc.data() });
    });
    return items;
  } catch (error) {
    console.error('Error getting cart items: ', error);
  }
};

// Function to update the quantity of an item in the cart
const updateCartItem = async (cartItemId, newQuantity) => {
  try {
    const itemRef = doc(db, 'Carts', cartItemId);
    await updateDoc(itemRef, { quantity: newQuantity });
    console.log('Cart item updated');
  } catch (error) {
    console.error('Error updating cart item: ', error);
  }
};

// Function to remove an item from the cart
const removeCartItem = async (cartItemId) => {
  try {
    const itemRef = doc(db, 'Carts', cartItemId);
    await deleteDoc(itemRef);
    console.log('Cart item removed');
  } catch (error) {
    console.error('Error removing cart item: ', error);
  }
};

// Export the functions to use them in other files
export { addItemToCart, getCartItems, updateCartItem, removeCartItem };
