
const { initializeApp } = require("firebase/app");
const { getFirestore, collection, query, where, getDocs } = require("firebase/firestore");

// Paste your Firebase config here
const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function testFetch(shareCode) {
    console.log(`Testing fetch for code: ${shareCode}`);
    try {
        const q = query(
            collection(db, "playbooks"),
            where("shareCode", "==", shareCode)
        );
        const snapshot = await getDocs(q);
        if (snapshot.empty) {
            console.log("No playbook found!");
        } else {
            console.log("Playbook found:", snapshot.docs[0].data());
        }
    } catch (e) {
        console.error("Error fetching:", e);
    }
}

// Replace with a known shareCode you expect to work
testFetch("YOUR_TEST_CODE");
