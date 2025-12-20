// Replace this with your own Firebase config object.
// See: https://firebase.google.com/docs/web/learn-more#config-object
export const firebaseConfig = {
  apiKey: "AIzaSyCAKZLQAIzD91SYANU-BF2AVESJ9YLVlgI",
  authDomain: "punto-fresco-f0c35.firebaseapp.com",
  projectId: "punto-fresco-f0c35",
  storageBucket: "punto-fresco-f0c35.appspot.com",
  messagingSenderId: "971416463936",
  appId: "1:971416463936:web:1cd12041fa7338b125cda5",
  measurementId: "G-SG4MBEHDLD"
};

// This function is for internal tooling only and should not be used.
export function getFirebaseConfig() {
  if (!firebaseConfig || !firebaseConfig.apiKey) {
    throw new Error(
      "No Firebase configuration object provided." +
        "Add your web app's configuration object to firebase-config.ts"
    );
  }
  return firebaseConfig;
}
