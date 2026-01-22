import { auth, db } from './firebaseConfig.js';
import {
    createUserWithEmailAndPassword,
    signInWithEmailAndPassword,
    signOut,
    updateProfile,
    updatePassword
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp, updateDoc } from 'firebase/firestore';

/**
 * Sign Up - Create new user account
 */
export async function signUp(email, password, displayName) {
    try {
        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        if (displayName) {
            await updateProfile(user, { displayName });
        }

        // Store user data in Firestore
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName || '',
            role: 'user', // default role
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isActive: true
        });

        return {
            success: true,
            message: 'User created successfully',
            user: {
                uid: user.uid,
                email: user.email,
                displayName: displayName || '',
                role: 'user'
            }
        };
    } catch (error) {
        console.error('Sign up error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Sign In - Login existing user
 */
export async function signIn(email, password) {
    try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Get user data from Firestore
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        let userData = {
            uid: user.uid,
            email: user.email,
            displayName: user.displayName || '',
            role: 'user'
        };

        if (userDoc.exists()) {
            userData = { ...userData, ...userDoc.data() };

            // Update last login time
            await setDoc(userDocRef, {
                ...userDoc.data(),
                lastLogin: serverTimestamp()
            }, { merge: true });
        } else {
            // Create user document if it doesn't exist
            await setDoc(userDocRef, {
                uid: user.uid,
                email: user.email,
                displayName: user.displayName || '',
                role: 'user',
                createdAt: serverTimestamp(),
                lastLogin: serverTimestamp(),
                isActive: true
            });
        }

        return {
            success: true,
            message: 'Login successful',
            user: userData
        };
    } catch (error) {
        console.error('Sign in error:', error);
        return {
            success: false,
            error: error.message,
            code: error.code
        };
    }
}

/**
 * Sign Out - Logout user
 */
export async function signOutUser() {
    try {
        await signOut(auth);
        return {
            success: true,
            message: 'Signed out successfully'
        };
    } catch (error) {
        console.error('Sign out error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Get user data from Firestore
 */
export async function getUserData(uid) {
    try {
        const userDocRef = doc(db, 'users', uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
            return {
                success: true,
                user: userDoc.data()
            };
        } else {
            return {
                success: false,
                error: 'User not found'
            };
        }
    } catch (error) {
        console.error('Get user data error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Update user profile (displayName, phone, etc.)
 */
export async function updateUserProfile(uid, updates) {
    try {
        const userDocRef = doc(db, 'users', uid);

        // Update Firestore document
        await updateDoc(userDocRef, {
            ...updates,
            updatedAt: serverTimestamp()
        });

        // Get updated user data
        const userDoc = await getDoc(userDocRef);

        return {
            success: true,
            message: 'Profile updated successfully',
            user: userDoc.data()
        };
    } catch (error) {
        console.error('Update profile error:', error);
        return {
            success: false,
            error: error.message
        };
    }
}

/**
 * Change user password
 */
export async function changeUserPassword(email, currentPassword, newPassword) {
    try {
        // First, sign in the user with current password to verify it
        const userCredential = await signInWithEmailAndPassword(auth, email, currentPassword);
        const user = userCredential.user;

        // Update password
        await updatePassword(user, newPassword);

        // Sign out after changing password
        await signOut(auth);

        return {
            success: true,
            message: 'Password changed successfully'
        };
    } catch (error) {
        console.error('Change password error:', error);

        // Provide more user-friendly error messages
        let errorMessage = error.message;
        if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
            errorMessage = 'Current password is incorrect';
        } else if (error.code === 'auth/weak-password') {
            errorMessage = 'New password is too weak. Please use at least 6 characters';
        } else if (error.code === 'auth/user-not-found') {
            errorMessage = 'User not found';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage = 'Too many failed attempts. Please try again later';
        }

        return {
            success: false,
            error: errorMessage,
            code: error.code
        };
    }
}
