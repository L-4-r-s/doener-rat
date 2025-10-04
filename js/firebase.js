// Step 1: Import the new functions we need
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.1.0/firebase-app.js";
import { 
  getFirestore, collection, addDoc, getDocs, query, 
  Timestamp, orderBy, limit, startAfter, getCountFromServer, 
  doc, setDoc, updateDoc, increment
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

/**
 * NEW: Formats a Firestore Timestamp into a relative time string (e.g., "vor 2 Tagen").
 * @param {Timestamp} timestamp - The Firestore Timestamp object.
 * @returns {string} A human-readable relative time.
 */
function formatTimeAgo(timestamp) {
  if (!timestamp || !timestamp.toDate) return '';
  const now = new Date();
  const secondsPast = (now.getTime() - timestamp.toDate().getTime()) / 1000;

  if (secondsPast < 60) return 'vor wenigen Sekunden';
  if (secondsPast < 3600) return `vor ${Math.round(secondsPast / 60)} Minuten`;
  if (secondsPast < 86400) return `vor ${Math.round(secondsPast / 3600)} Stunden`;
  
  const daysPast = secondsPast / 86400;
  if (daysPast < 30) return `vor ${Math.round(daysPast)} Tagen`;
  if (daysPast < 365) return `vor ${Math.round(daysPast / 30)} Monaten`;
  
  return `vor ${Math.round(daysPast / 365)} Jahren`;
}

/**
 * NEW: Increments the upvote count for a specific comment.
 * @param {string} ladenName - The ID of the Dönerladen document.
 * @param {string} commentId - The ID of the comment document to upvote.
 */
async function upvoteComment(ladenName, commentId) {
    const commentDocRef = doc(db, "doenerlaeden", ladenName, "kommentare", commentId);
    try {
        // Atomically increment the 'upvotes' field by 1
        await updateDoc(commentDocRef, {
            upvotes: increment(1)
        });
    } catch (error) {
        console.error("Error upvoting comment:", error);
    }
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


async function postComment(ladenName, commentText, userName) {
  try {
    const commentsCollectionRef = collection(db, "doenerlaeden", ladenName, "kommentare");
    // Add the 'upvotes' field with an initial value of 0
    await addDoc(commentsCollectionRef, {
      name: userName,
      comment: commentText,
      timestamp: Timestamp.now(),
      upvotes: 0 
    });
    console.log("Comment added successfully!");
  } catch (error) {
    console.error("Error adding comment: ", error);
  }
}

/**
 * Toggles an upvote for a comment.
 * @param {string} ladenName - The shop name.
 * @param {string} commentId - The comment ID.
 * @param {boolean} isUpvoting - True if adding an upvote, false if removing.
 */
async function toggleUpvote(ladenName, commentId, isUpvoting) {
  const commentDocRef = doc(db, "doenerlaeden", ladenName, "kommentare", commentId);
  try {
    await updateDoc(commentDocRef, {
      upvotes: increment(isUpvoting ? 1 : -1)
    });
  } catch (error) {
    console.error("Error toggling upvote:", error);
  }
}

function renderComment(commentId, commentData, prepend = false) {
  const commentsList = document.getElementById("comments-list");
  if (!commentsList) return;

  const displayName = commentData.name ? `@${commentData.name}` : '@Anonymer Döner Connaisseur';
  const relativeTime = formatTimeAgo(commentData.timestamp);
  const upvoteCount = commentData.upvotes || 0;

  const commentContainer = document.createElement("div");
  commentContainer.className = "py-2";

  const header = document.createElement("div");
  header.className = "flex items-center space-x-2 text-xs text-gray-600";
  header.innerHTML = `
    <strong class="font-semibold text-gray-800">${displayName}</strong>
    <span>${relativeTime}</span>
  `;

  const commentText = document.createElement("p");
  commentText.className = "text-sm text-gray-800 py-1";
  commentText.textContent = commentData.comment;

  const footer = document.createElement("div");
  footer.className = "flex items-center space-x-1 mt-1";

  // --- PRETTIER ICON: Heroicon Thumbs Up ---
  const upvoteButton = document.createElement("button");
  upvoteButton.className = "rounded-full hover:bg-gray-200";
  upvoteButton.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-4">
      <path stroke-linecap="round" stroke-linejoin="round" d="M6.633 10.25c.806 0 1.533-.446 2.031-1.08a9.041 9.041 0 0 1 2.861-2.4c.723-.384 1.35-.956 1.653-1.715a4.498 4.498 0 0 0 .322-1.672V2.75a.75.75 0 0 1 .75-.75 2.25 2.25 0 0 1 2.25 2.25c0 1.152-.26 2.243-.723 3.218-.266.558.107 1.282.725 1.282m0 0h3.126c1.026 0 1.945.694 2.054 1.715.045.422.068.85.068 1.285a11.95 11.95 0 0 1-2.649 7.521c-.388.482-.987.729-1.605.729H13.48c-.483 0-.964-.078-1.423-.23l-3.114-1.04a4.501 4.501 0 0 0-1.423-.23H5.904m10.598-9.75H14.25M5.904 18.5c.083.205.173.405.27.602.197.4-.078.898-.523.898h-.908c-.889 0-1.713-.518-1.972-1.368a12 12 0 0 1-.521-3.507c0-1.553.295-3.036.831-4.398C3.387 9.953 4.167 9.5 5 9.5h1.053c.472 0 .745.556.5.96a8.958 8.958 0 0 0-1.302 4.665c0 1.194.232 2.333.654 3.375Z" />
    </svg>
  `;

  const upvoteCountSpan = document.createElement("span");
  upvoteCountSpan.className = "text-xs text-gray-600 font-medium ml-0.5"; // closer to icon
  upvoteCountSpan.textContent = upvoteCount;

  footer.appendChild(upvoteButton);
  footer.appendChild(upvoteCountSpan);

  // --- LOCALSTORAGE TOGGLE ---
  const upvotedKey = `upvoted_${commentId}`;
  let isUpvoted = localStorage.getItem(upvotedKey) === 'true';

  function updateButtonStyle() {
    upvoteButton.classList.toggle("text-blue-500", isUpvoted);
    upvoteButton.classList.toggle("text-gray-500", !isUpvoted);
  }
  updateButtonStyle();

  upvoteButton.addEventListener("click", () => {
    isUpvoted = !isUpvoted;
    localStorage.setItem(upvotedKey, isUpvoted ? "true" : "");
    upvoteCountSpan.textContent = parseInt(upvoteCountSpan.textContent) + (isUpvoted ? 1 : -1);
    updateButtonStyle();
    toggleUpvote(window.ladenName, commentId, isUpvoted);
  });

  commentContainer.appendChild(header);
  commentContainer.appendChild(commentText);
  commentContainer.appendChild(footer);

  if (prepend) {
    commentsList.prepend(commentContainer);
  } else {
    commentsList.appendChild(commentContainer);
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

    const q = query(collection(db, "doenerlaeden", ladenName, "kommentare"), orderBy("timestamp", "desc"), limit(INITIAL_COMMENTS_TO_LOAD));
    const querySnapshot = await getDocs(q);

    // Pass both the document ID and the data to the render function
    querySnapshot.forEach((doc) => renderComment(doc.id, doc.data(), false));

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
        const q = query(collection(db, "doenerlaeden", ladenName, "kommentare"), orderBy("timestamp", "desc"), startAfter(lastVisibleComment));
        const querySnapshot = await getDocs(q);
        querySnapshot.forEach((doc) => renderComment(doc.id, doc.data(), false));

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