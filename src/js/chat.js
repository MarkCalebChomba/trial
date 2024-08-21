// /src/js/chat.js

import { db } from './firebase.js';
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from "firebase/firestore";

// Function to send a chat message
const sendMessage = async (senderId, receiverId, messageContent) => {
  try {
    const messagesRef = collection(db, 'Messages');
    const newMessage = {
      senderId: senderId,
      receiverId: receiverId,
      message: messageContent,
      timestamp: serverTimestamp()
    };
    await addDoc(messagesRef, newMessage);
    console.log('Message sent');
  } catch (error) {
    console.error('Error sending message: ', error);
  }
};

// Function to listen to real-time chat messages between two users
const listenToChatMessages = (userId1, userId2, callback) => {
  const messagesRef = collection(db, 'Messages');
  const q = query(
    messagesRef,
    where('senderId', 'in', [userId1, userId2]),
    where('receiverId', 'in', [userId1, userId2]),
    orderBy('timestamp')
  );

  const unsubscribe = onSnapshot(q, (snapshot) => {
    const messages = [];
    snapshot.forEach((doc) => {
      messages.push({ id: doc.id, ...doc.data() });
    });
    callback(messages);
  });

  return unsubscribe; // To stop listening later if needed
};

// Export the functions to use them in other files
export { sendMessage, listenToChatMessages };
