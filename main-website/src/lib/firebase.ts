import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCWjvW51PTfjPavl5Wiofv9V8PE2BXVQio",
  authDomain: "healthpix-3c036.firebaseapp.com",
  projectId: "healthpix-3c036",
  storageBucket: "healthpix-3c036.appspot.com",
  messagingSenderId: "703024409643",
  appId: "1:703024409643:web:91be4c5ecbbe4f556b97d7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Auth and get a reference to the service
export const auth = getAuth(app);
export default app;
