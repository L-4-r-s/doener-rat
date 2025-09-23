// Step 1: Import the new functions we need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  Timestamp, orderBy, limit, startAfter, getCountFromServer, 
  doc, setDoc // NEW: doc and setDoc for ratings
} from "https://www.gstatic.com/firebasejs/12.1.0/firebase-firestore.js";
import { v4 as uuidv4 } from 'https://jspm.dev/uuid'; // NEW: For generating unique IDs

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

// --- Helper to get a unique anonymous user ID ---
/**
 * Gets a unique, anonymous user ID from localStorage or generates a new one.
 * @returns {string} A unique user ID.
 */
function getAnonymousUserId() {
  let userId = localStorage.getItem('doenerAnonUserId');
  if (!userId) {
    userId = uuidv4(); // Generate a new UUID
    localStorage.setItem('doenerAnonUserId', userId);
  }
  return userId;
}

// --- Function to post/update a user's rating ---
/**
 * Posts or updates a user's rating for a specific Dönerladen.
 * @param {string} ladenName - The ID of the Dönerladen document.
 * @param {number} rating - The user's rating (1-10).
 * @returns {Promise<void>}
 */
async function postRating(ladenName, rating) {
  const userId = getAnonymousUserId(); // Get the current user's ID
  const ratingDocRef = doc(db, "doenerlaeden", ladenName, "ratings", userId); // Path: .../doenerlaeden/ladenName/ratings/userId

  try {
    // Use setDoc with merge: true to create or update the document for this user
    await setDoc(ratingDocRef, {
      rating: rating,
      timestamp: Timestamp.now()
    }, { merge: true }); // Merge ensures other fields (if any) are preserved during update
    console.log(`Rating for ${ladenName} by ${userId} saved/updated successfully: ${rating}`);
  } catch (error) {
    console.error("Error posting rating: ", error);
    throw error; // Re-throw to handle in UI
  }
}

// --- Function to load ratings and calculate average ---
/**
 * Loads all ratings for a Dönerladen, calculates the average, and updates the UI.
 * Also pre-fills the user's existing rating if available.
 * @param {string} ladenName - The ID of the Dönerladen document.
 */
async function loadRatingsAndCalculateAverage(ladenName) {
  const avgRatingSpan = document.getElementById("avg-rating");
  const userRatingInput = document.getElementById("user-rating");
  const submitRatingButton = document.getElementById("submit-rating");

  if (!avgRatingSpan || !userRatingInput || !submitRatingButton) return;

  try {
    const ratingsCollectionRef = collection(db, "doenerlaeden", ladenName, "ratings");
    const querySnapshot = await getDocs(ratingsCollectionRef);

    let totalRatings = 0;
    let sumRatings = 0;
    let currentUserRating = null;

    const userId = getAnonymousUserId(); // Get the current user's ID

    querySnapshot.forEach((doc) => {
      const data = doc.data();
      if (typeof data.rating === 'number') {
        sumRatings += data.rating;
        totalRatings++;
        // Check if this is the current user's rating
        if (doc.id === userId) {
          currentUserRating = data.rating;
        }
      }
    });

    if (totalRatings > 0) {
      const average = (sumRatings / totalRatings).toFixed(1); // One decimal place
      avgRatingSpan.textContent = average;
    } else {
      avgRatingSpan.textContent = "–"; // No ratings yet
    }

    // Pre-fill user's rating and disable button if they've already rated
    if (currentUserRating !== null) {
      userRatingInput.value = currentUserRating;
      // submitRatingButton.disabled = true; // Optionally disable if you want them to explicitly re-enable to change
      // submitRatingButton.textContent = "Bewertung ändern"; // Change button text
    } else {
        userRatingInput.value = ''; // Clear input if no previous rating
        submitRatingButton.disabled = false;
        // submitRatingButton.textContent = "Abschicken"; // Reset button text
    }

  } catch (error) {
    console.error("Error loading ratings: ", error);
    avgRatingSpan.textContent = "Fehler";
  }
}

async function postComment(ladenName, commentText, userName) { // Add userName parameter
  try {
    const commentsCollectionRef = collection(db, "doenerlaeden", ladenName, "kommentare");
    await addDoc(commentsCollectionRef, {
      name: userName, // Add the name field
      comment: commentText,
      timestamp: Timestamp.now()
    });
    console.log("Comment added successfully!");
  } catch (error) {
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
  
  // --- NEW: Logic to display the name ---
  const displayName = commentData.name || "Anonymer Döner Connaisseur";
  
  const nameElement = document.createElement("strong");
  nameElement.className = "text-sm font-semibold text-gray-800";
  nameElement.textContent = displayName;
  // --- END NEW ---

  const commentText = document.createElement('p');
  commentText.className = "mt-1"; // Add a little space below the name
  commentText.textContent = commentData.comment;
  
  const date = commentData.timestamp.toDate();
  const dateString = date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const timeElement = document.createElement('time');
  timeElement.className = "text-xs text-gray-500 mt-2 block";
  timeElement.textContent = dateString;

  // Add the new elements in order
  commentElement.appendChild(nameElement);
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


export { 
  postComment, loadInitialComments, loadAllRemainingComments, renderComment,
  getAnonymousUserId, postRating, loadRatingsAndCalculateAverage 
};