/**
 * Example Firebase Operations
 * 
 * This file demonstrates how to use Firebase services in your backend
 */

import { db, auth, storage } from './firebaseConfig.js';
import {
    collection,
    doc,
    getDoc,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    orderBy,
    limit
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

// ============================================
// FIRESTORE OPERATIONS
// ============================================

/**
 * Get all documents from a collection
 */
export async function getAllDocuments(collectionName) {
    try {
        const querySnapshot = await getDocs(collection(db, collectionName));
        const documents = [];

        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: documents };
    } catch (error) {
        console.error('Error getting documents:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get a single document by ID
 */
export async function getDocumentById(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
            return { success: true, data: { id: docSnap.id, ...docSnap.data() } };
        } else {
            return { success: false, error: 'Document not found' };
        }
    } catch (error) {
        console.error('Error getting document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Add a new document to a collection
 */
export async function addDocument(collectionName, data) {
    try {
        const docRef = await addDoc(collection(db, collectionName), {
            ...data,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        });

        return { success: true, id: docRef.id };
    } catch (error) {
        console.error('Error adding document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Update an existing document
 */
export async function updateDocument(collectionName, documentId, data) {
    try {
        console.log(`Updating document in ${collectionName} with ID: ${documentId}`);
        console.log('Update data:', JSON.stringify(data, null, 2));

        const docRef = doc(db, collectionName, documentId);

        // First, check if document exists
        const docSnap = await getDoc(docRef);
        if (!docSnap.exists()) {
            console.error(`Document ${documentId} not found in ${collectionName}`);
            return { success: false, error: 'Document not found' };
        }

        console.log('Current document data:', JSON.stringify(docSnap.data(), null, 2));

        await updateDoc(docRef, {
            ...data,
            updatedAt: new Date().toISOString()
        });

        // Verify the update
        const updatedDocSnap = await getDoc(docRef);
        console.log('Updated document data:', JSON.stringify(updatedDocSnap.data(), null, 2));

        return { success: true, message: 'Document updated successfully' };
    } catch (error) {
        console.error('Error updating document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Delete a document
 */
export async function deleteDocument(collectionName, documentId) {
    try {
        const docRef = doc(db, collectionName, documentId);
        await deleteDoc(docRef);

        return { success: true, message: 'Document deleted successfully' };
    } catch (error) {
        console.error('Error deleting document:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Query documents with conditions
 */
export async function queryDocuments(collectionName, conditions = {}) {
    try {
        let q = collection(db, collectionName);

        // Add where clauses
        if (conditions.where) {
            conditions.where.forEach(([field, operator, value]) => {
                q = query(q, where(field, operator, value));
            });
        }

        // Add order by
        if (conditions.orderBy) {
            const [field, direction = 'asc'] = conditions.orderBy;
            q = query(q, orderBy(field, direction));
        }

        // Add limit
        if (conditions.limit) {
            q = query(q, limit(conditions.limit));
        }

        const querySnapshot = await getDocs(q);
        const documents = [];

        querySnapshot.forEach((doc) => {
            documents.push({ id: doc.id, ...doc.data() });
        });

        return { success: true, data: documents };
    } catch (error) {
        console.error('Error querying documents:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// STORAGE OPERATIONS
// ============================================

/**
 * Upload a file to Firebase Storage
 */
export async function uploadFile(file, path) {
    try {
        const storageRef = ref(storage, path);
        const snapshot = await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);

        return {
            success: true,
            url: downloadURL,
            path: snapshot.ref.fullPath
        };
    } catch (error) {
        console.error('Error uploading file:', error);
        return { success: false, error: error.message };
    }
}

/**
 * Get download URL for a file
 */
export async function getFileURL(path) {
    try {
        const storageRef = ref(storage, path);
        const downloadURL = await getDownloadURL(storageRef);

        return { success: true, url: downloadURL };
    } catch (error) {
        console.error('Error getting file URL:', error);
        return { success: false, error: error.message };
    }
}

// ============================================
// EXAMPLE USAGE IN EXPRESS ROUTES
// ============================================

/*
import express from 'express';
import { 
  getAllDocuments, 
  getDocumentById, 
  addDocument, 
  updateDocument, 
  deleteDocument,
  queryDocuments 
} from './firebaseOperations.js';

const router = express.Router();

// Get all users
router.get('/users', async (req, res) => {
  const result = await getAllDocuments('users');
  res.json(result);
});

// Get user by ID
router.get('/users/:id', async (req, res) => {
  const result = await getDocumentById('users', req.params.id);
  res.json(result);
});

// Create new user
router.post('/users', async (req, res) => {
  const result = await addDocument('users', req.body);
  res.json(result);
});

// Update user
router.put('/users/:id', async (req, res) => {
  const result = await updateDocument('users', req.params.id, req.body);
  res.json(result);
});

// Delete user
router.delete('/users/:id', async (req, res) => {
  const result = await deleteDocument('users', req.params.id);
  res.json(result);
});

// Query users with conditions
router.get('/users/search', async (req, res) => {
  const conditions = {
    where: [['status', '==', 'active']],
    orderBy: ['createdAt', 'desc'],
    limit: 10
  };
  const result = await queryDocuments('users', conditions);
  res.json(result);
});

export default router;
*/
