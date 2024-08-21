import { getAuth } from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";
import {
    getFirestore,
    collection,
    addDoc,
    doc,
    getDoc,
    getDocs,
    query,
    where,
    orderBy,
    onSnapshot,
    serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-firestore.js";
import { app } from "../src/js/firebase.js";; // Adjust path as per your project structure

const auth = getAuth(app);
const db = getFirestore(app);

// Load official notifications
async function loadNotifications() {
    const notificationList = document.getElementById('notification-list');
    const notificationsQuery = query(collection(db, "Notifications"), orderBy("timestamp", "desc"));
    const querySnapshot = await getDocs(notificationsQuery);

    querySnapshot.forEach((doc) => {
        const notificationData = doc.data();
        const notificationElement = document.createElement('div');
        notificationElement.classList.add('notification');
        notificationElement.innerHTML = `
            <h3>${notificationData.title}</h3>
            <p>${notificationData.message}</p>
            <span class="timestamp">${new Date(notificationData.timestamp.seconds * 1000).toLocaleString()}</span>
        `;
        notificationList.appendChild(notificationElement);
    });
}

// Load chat list
async function loadChatList() {
    const user = auth.currentUser;
    if (!user) {
        alert("You must be logged in to view your chats.");
        return;
    }

    const chatList = document.getElementById('chat-list');
    const chatsQuery = query(collection(db, "Chats"), where("participants", "array-contains", user.uid));
    const querySnapshot = await getDocs(chatsQuery);

    querySnapshot.forEach((doc) => {
        const chatData = doc.data();
        const chatElement = document.createElement('div');
        chatElement.classList.add('chat-item');
        chatElement.innerHTML = `
            <img src="images/seller.jpg" alt="${chatData.sellerName}" class="chat-avatar">
            <div class="chat-info">
                <h4>${chatData.sellerName}</h4>
                <p>${chatData.lastMessage}</p>
                <span class="chat-timestamp">${new Date(chatData.timestamp.seconds * 1000).toLocaleString()}</span>
            </div>
        `;
        chatElement.addEventListener('click', () => openChat(doc.id));
        chatList.appendChild(chatElement);
    });
}

// Open chat window
function openChat(chatId) {
    const chatWindow = document.getElementById('chat-window');
    const chatMessages = document.getElementById('chat-messages');
    chatWindow.style.display = 'block';
    chatMessages.innerHTML = ''; // Clear previous messages

    const chatRef = doc(db, "Chats", chatId);
    onSnapshot(chatRef, (doc) => {
        const chatData = doc.data();
        document.getElementById('chat-with').textContent = `Chat with ${chatData.sellerName}`;

        chatData.messages.forEach((message) => {
            const messageElement = document.createElement('div');
            messageElement.classList.add('message', message.sender === auth.currentUser.uid ? 'sent' : 'received');
            messageElement.innerHTML = `
                <p>${message.text}</p>
                <span class="message-timestamp">${new Date(message.timestamp.seconds * 1000).toLocaleTimeString()}</span>
            `;
            chatMessages.appendChild(messageElement);
        });

        chatMessages.scrollTop = chatMessages.scrollHeight; // Scroll to the bottom
    });
}

// Send message
async function sendMessage() {
    const chatInput = document.getElementById('chat-input');
    const chatId = document.getElementById('chat-window').getAttribute('data-chat-id');
    const messageText = chatInput.value.trim();
    if (messageText === '') return;

    const chatRef = doc(db, "Chats", chatId);
    const chatDoc = await getDoc(chatRef);
    const chatData = chatDoc.data();

    const newMessage = {
        text: messageText,
        sender: auth.currentUser.uid,
        timestamp: serverTimestamp()
    };

    chatData.messages.push(newMessage);
    await updateDoc(chatRef, {
        messages: chatData.messages,
        lastMessage: messageText,
        timestamp: serverTimestamp()
    });

    chatInput.value = ''; // Clear the input field
}

// Close chat window
function closeChatWindow() {
    document.getElementById('chat-window').style.display = 'none';
}

// Initialize page
auth.onAuthStateChanged((user) => {
    if (user) {
        loadNotifications();
        loadChatList();
    } else {
        alert("You must be logged in to view notifications and chats.");
    }
});
