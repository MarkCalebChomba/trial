// /src/js/notifications.js

import { db } from './firebase.js';
import { collection, addDoc, onSnapshot, query, where } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";

// Function to send a broadcast notification
const sendBroadcastNotification = async (message) => {
  try {
    const notificationData = {
      message: message,
      timestamp: new Date(),
      type: 'broadcast'
    };
    await addDoc(collection(db, 'Notifications'), notificationData);
    console.log('Broadcast notification sent');
  } catch (error) {
    console.error('Error sending broadcast notification: ', error);
  }
};

// Function to listen to real-time notifications for a specific user
const listenToUserNotifications = (userId, callback) => {
  const notificationsRef = collection(db, 'Notifications');
  const q = query(notificationsRef, where('userId', '==', userId));

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const notifications = [];
    snapshot.forEach((doc) => {
      notifications.push({ id: doc.id, ...doc.data() });
    });
    callback(notifications);
  });

  return unsubscribe; // To stop listening later if needed
};

// Export the functions to use them in other parts of the app
export { sendBroadcastNotification, listenToUserNotifications };
