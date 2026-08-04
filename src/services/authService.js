// authService.js
// Firebase Authentication + Firestore user profile helpers
// Expects ../firebase/firebase to export: `auth` (Firebase Auth) and `db` (Firestore)

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut
} from "firebase/auth";

import { doc, setDoc, serverTimestamp } from "firebase/firestore";

import { auth, db } from "../firebase/firebase";

/**
 * Register a new user with email & password and store additional profile data in Firestore.
 * @param {Object} userData
 * @param {string} userData.fullName
 * @param {string} userData.email
 * @param {string} userData.password
 * @param {number|string} [userData.age]
 * @param {string} [userData.gender]
 * @param {number|string} [userData.height]
 * @param {number|string} [userData.weight]
 * @param {string} [userData.fitnessGoal]
 * @returns {Promise<import("firebase/auth").UserCredential>} user credential on success
 * @throws FirebaseError on failure
 */
export async function registerUser(userData) {
  try {
    const {
      fullName,
      email,
      password,
      age = null,
      gender = null,
      height = null,
      weight = null,
      fitnessGoal = null
    } = userData;

    if (!email || !password) {
      throw new Error("Email and password are required for registration.");
    }

    // Create auth user
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const { user } = userCredential;

    // Prepare Firestore document payload
    const userDoc = {
      fullName: fullName ?? null,
      email: email,
      age: age,
      gender: gender,
      height: height,
      weight: weight,
      fitnessGoal: fitnessGoal,
      createdAt: serverTimestamp()
    };

    // Store additional user data under "users" collection with uid as doc id
    const userRef = doc(db, "users", user.uid);
    await setDoc(userRef, userDoc);

    return userCredential;
  } catch (error) {
    // Bubble up error for caller to handle; log for debugging
    console.error("registerUser error:", error);
    throw error;
  }
}

/**
 * Sign in a user with email and password.
 * @param {string} email
 * @param {string} password
 * @returns {Promise<import("firebase/auth").UserCredential>} user credential on success
 * @throws FirebaseError on failure
 */
export async function loginUser(email, password) {
  try {
    if (!email || !password) {
      throw new Error("Email and password are required to login.");
    }

    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return userCredential;
  } catch (error) {
    console.error("loginUser error:", error);
    throw error;
  }
}

/**
 * Sign out the current user.
 * @returns {Promise<void>}
 * @throws FirebaseError on failure
 */
export async function logoutUser() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error("logoutUser error:", error);
    throw error;
  }
}