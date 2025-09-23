// Step 1: Import the new functions we need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  Timestamp, orderBy, limit, startAfter, getCountFromServer 
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";

// Your Firebase config remains the same
const firebaseConfig = {
    apiKey: "AIzaSyAZi5q7_LFp32QzaKUNMfM2ShHCA9eDnas",
    authDomain: "doener-rangliste.firebaseapp.com",
    projectId: "doener-rangliste",
    storageBucket: "doener-rangliste.firebasestorage.app",
    messagingSenderId: "121723660190",
    appId: "1:121723660190:web:5c6e4445b67dfc06be188f",
    measurementId: "G-XFDQWSTSP6"
};

// Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// State variable to keep track of the last loaded comment for pagination
let lastVisibleComment = null;
const INITIAL_COMMENTS_TO_LOAD = 5;

// The postComment function remains unchanged
async function postComment(ladenName, commentText) {
  try {
    const commentsCollectionRef = collection(db, "doenerlaeden", ladenName, "kommentare");
    await addDoc(commentsCollectionRef, {
      comment: commentText,
      timestamp: Timestamp.now()
    });
    console.log("Comment added successfully!");
  } catch (error)
 {
    console.error("Error adding comment: ", error);
  }
}

/**
 * Renders a single comment document to the DOM.
 * @param {object} commentData - The data object for a single comment.
 * @param {boolean} prepend - If true, adds the comment to the top of the list.
 */
function renderComment(commentData, prepend = false) {
  const commentsList = document.getElementById("comments-list");
  const commentElement = document.createElement("div");
  commentElement.className = "bg-gray-100 p-3 rounded-lg shadow-sm";
  
  const commentText = document.createElement('p');
  commentText.textContent = commentData.comment;
  
  const date = commentData.timestamp.toDate();
  const dateString = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const timeElement = document.createElement('time');
  timeElement.className = "text-xs text-gray-500 mt-1 block";
  timeElement.textContent = dateString;

  commentElement.appendChild(commentText);
  commentElement.appendChild(timeElement);
  
  if (prepend) {
    commentsList.prepend(commentElement);
  } else {
    commentsList.appendChild(commentElement);
  }
}

/**
 * Loads the initial batch of comments (the first 5).
 * @param {string} ladenName - The ID of the Dönerladen document.
 */
async function loadInitialComments(ladenName) {
  const commentsList = document.getElementById("comments-list");
  const loadAllButton = document.getElementById("load-all-comments-btn");
  const loadMoreContainer = document.getElementById("load-more-container");

  if (!commentsList || !loadAllButton) return;
  
  commentsList.innerHTML = "";
  lastVisibleComment = null;
  loadMoreContainer.innerHTML = '';
  loadMoreContainer.appendChild(loadAllButton);
  loadAllButton.classList.add("hidden");

  try {
    const commentsCollectionRef = collection(db, "doenerlaeden", ladenName, "kommentare");
    const countSnapshot = await getCountFromServer(commentsCollectionRef);
    const totalCount = countSnapshot.data().count;

    if (totalCount === 0) {
      loadMoreContainer.innerHTML = '<p class="text-gray-500">Noch keine Kommentare. Sei der Erste!</p>';
      return;
    }

    const q = query(commentsCollectionRef, orderBy("timestamp", "desc"), limit(INITIAL_COMMENTS_TO_LOAD));
    const querySnapshot = await getDocs(q);

    querySnapshot.forEach((doc) => renderComment(doc.data(), false)); // Always append on initial load

    if (querySnapshot.docs.length > 0) {
      lastVisibleComment = querySnapshot.docs[querySnapshot.docs.length - 1];
    }

    if (totalCount > INITIAL_COMMENTS_TO_LOAD) {
      loadAllButton.textContent = `Alle ${totalCount} Kommentare anzeigen`;
      loadAllButton.classList.remove("hidden");
    }

  } catch (error) {
    console.error("Error loading initial comments:", error);
    loadMoreContainer.innerHTML = '<p class="text-red-500">Fehler beim Laden der Kommentare.</p>';
  }
}

/**
 * Loads all remaining comments after the initial batch.
 * @param {string} ladenName - The ID of the Dönerladen document.
 */
async function loadAllRemainingComments(ladenName) {
    const loadAllButton = document.getElementById("load-all-comments-btn");
    if (!lastVisibleComment) return;

    try {
        const commentsCollectionRef = collection(db, "doenerlaeden", ladenName, "kommentare");
        const q = query(commentsCollectionRef, orderBy("timestamp", "desc"), startAfter(lastVisibleComment));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => renderComment(doc.data(), false)); // Always append when loading more

        loadAllButton.classList.add("hidden");
        lastVisibleComment = null;

    } catch (error) {
        console.error("Error loading remaining comments:", error);
        loadAllButton.textContent = "Fehler beim Laden";
    }
}

// ★★★ THIS IS THE FIX ★★★
export { postComment, loadInitialComments, loadAllRemainingComments, renderComment };