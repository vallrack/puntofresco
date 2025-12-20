// Replace this with your own Firebase config object.
// See: https://firebase.google.com/docs/web/learn-more#config-object
export const firebaseConfig = {
  apiKey: "AIzaSyDrz-67scpfn0iGGocWOTgASJmcCdfp4c4",
  authDomain: "punto-fresco-f0c35.firebaseapp.com",
  projectId: "punto-fresco-f0c35",
  storageBucket: "punto-fresco-f0c35.appspot.com",
  messagingSenderId: "657652328756",
  appId: "1:657652328756:web:4f6de2023eac26b2ce9d61",
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