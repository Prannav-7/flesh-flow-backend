import express from 'express';
import cors from 'cors';
import { db, auth, storage } from './firebaseConfig.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' })); // Increased limit for base64 images
app.use(express.urlencoded({ limit: '50mb', extended: true }));

import { updateDocument, deleteDocument } from './firebaseOperations.js';

// ============================================
// SPECIFIC ORDER ROUTES (must come before /api/data/:collection)
// ============================================

// Update order (including status)
app.put('/api/orders/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('========== ORDER UPDATE REQUEST ==========');
        console.log('Order ID:', id);
        console.log('Update Data:', JSON.stringify(updateData, null, 2));

        const result = await updateDocument('orders', id, updateData);

        console.log('Update Result:', result);
        console.log('==========================================');

        if (result.success) {
            res.json({ success: true, message: 'Order updated successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error updating order:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Test route
app.get('/', (req, res) => {
    res.json({ message: 'Backend server is running with Firebase!' });
});

// Health check endpoint for mobile testing
app.get('/health', (req, res) => {
    res.json({ status: 'Backend working 🚀' });
});

// ============================================
// GENERIC DATA ROUTES
// ============================================

// Example Firebase Firestore route - Get all documents from a collection
app.get('/api/data/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const { getDocs, collection: firestoreCollection } = await import('firebase/firestore');

        const querySnapshot = await getDocs(firestoreCollection(db, collection));
        const data = [];

        querySnapshot.forEach((doc) => {
            // Store Firestore document ID separately to avoid conflicts with product's numeric id
            const docData = doc.data();
            data.push({
                ...docData,
                docId: doc.id, // Firestore document ID for updates/deletes
                // Keep the product's numeric id if it exists, otherwise use doc.id
                id: docData.id !== undefined ? docData.id : doc.id
            });
        });

        res.json({ success: true, data });
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Example Firebase Firestore route - Add document to a collection
app.post('/api/data/:collection', async (req, res) => {
    try {
        const { collection } = req.params;
        const data = req.body;
        const { addDoc, collection: firestoreCollection } = await import('firebase/firestore');

        const docRef = await addDoc(firestoreCollection(db, collection), data);

        res.json({
            success: true,
            message: 'Document added successfully',
            id: docRef.id
        });
    } catch (error) {
        console.error('Error adding document:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// AUTHENTICATION ROUTES
// ============================================

import { signUp, signIn, signOutUser, getUserData } from './authRoutes.js';

// Sign Up - Create new user
app.post('/api/auth/signup', async (req, res) => {
    try {
        const { email, password, displayName } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const result = await signUp(email, password, displayName);

        if (result.success) {
            res.status(201).json(result);
        } else {
            res.status(400).json(result);
        }
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sign In - Login user
app.post('/api/auth/signin', async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({
                success: false,
                error: 'Email and password are required'
            });
        }

        const result = await signIn(email, password);

        if (result.success) {
            res.json(result);
        } else {
            res.status(401).json(result);
        }
    } catch (error) {
        console.error('Signin error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Sign Out - Logout user
app.post('/api/auth/signout', async (req, res) => {
    try {
        const result = await signOutUser();
        res.json(result);
    } catch (error) {
        console.error('Signout error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get User Data
app.get('/api/auth/user/:uid', async (req, res) => {
    try {
        const { uid } = req.params;
        const result = await getUserData(uid);

        if (result.success) {
            res.json(result);
        } else {
            res.status(404).json(result);
        }
    } catch (error) {
        console.error('Get user error:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// ============================================
// PRODUCT MANAGEMENT ROUTES
// ============================================

import { getDocumentById } from './firebaseOperations.js';
import { uploadFile } from './firebaseOperations.js';
import multer from 'multer';

// Setup multer for file uploads
const upload = multer({ storage: multer.memoryStorage() });

// Update product (including stock)
app.put('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updateData = req.body;

        console.log('========== PRODUCT UPDATE REQUEST ==========');
        console.log('Product ID:', id);
        console.log('Update Data:', JSON.stringify(updateData, null, 2));

        const result = await updateDocument('products', id, updateData);

        console.log('Update Result:', result);
        console.log('===========================================');

        if (result.success) {
            res.json({ success: true, message: 'Product updated successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Delete product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const { id } = req.params;

        console.log('========== PRODUCT DELETE REQUEST ==========');
        console.log('Product ID:', id);

        const result = await deleteDocument('products', id);

        console.log('Delete Result:', result);
        console.log('===========================================');

        if (result.success) {
            res.json({ success: true, message: 'Product deleted successfully' });
        } else {
            res.status(500).json({ success: false, error: result.error });
        }
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Reduce stock after order
app.post('/api/products/reduce-stock', async (req, res) => {
    try {
        const { items } = req.body; // Array of {id, quantity}

        const { getDocs, collection: firestoreCollection, query, where, updateDoc, doc: docFunc } = await import('firebase/firestore');

        for (const item of items) {
            // Query products by the numeric id field, not the Firestore document ID
            const productsQuery = query(
                firestoreCollection(db, 'products'),
                where('id', '==', parseInt(item.id))
            );

            const querySnapshot = await getDocs(productsQuery);

            if (!querySnapshot.empty) {
                // Get the first matching product
                const productDoc = querySnapshot.docs[0];
                const productData = productDoc.data();
                const currentStock = productData.available || 0;
                const newStock = Math.max(0, currentStock - item.quantity);

                // Update using the Firestore document ID
                const productRef = docFunc(db, 'products', productDoc.id);
                await updateDoc(productRef, {
                    available: newStock,
                    inStock: newStock > 0,
                    updatedAt: new Date().toISOString()
                });

                console.log(`Updated stock for product ID ${item.id}: ${currentStock} -> ${newStock}`);
            } else {
                console.warn(`Product with ID ${item.id} not found in Firestore`);
            }
        }

        res.json({ success: true, message: 'Stock updated successfully' });
    } catch (error) {
        console.error('Error reducing stock:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Upload image to Firebase Storage
app.post('/api/upload/image', upload.single('image'), async (req, res) => {
    try {
        console.log('Image upload request received');

        if (!req.file) {
            console.error('No file in request');
            return res.status(400).json({ success: false, error: 'No file uploaded' });
        }

        console.log('File details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        // Validate file type
        const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
        if (!allowedTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid file type. Only JPEG, PNG, GIF, and WebP images are allowed.'
            });
        }

        // Validate file size (max 5MB)
        const maxSize = 5 * 1024 * 1024; // 5MB
        if (req.file.size > maxSize) {
            return res.status(400).json({
                success: false,
                error: 'File too large. Maximum size is 5MB.'
            });
        }

        const timestamp = Date.now();
        const sanitizedFilename = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `products/${timestamp}_${sanitizedFilename}`;

        console.log('Converting image to data URL (temporary solution)');

        // TEMPORARY SOLUTION: Convert image to base64 data URL
        // This works immediately without Firebase Storage
        // Images will be stored as part of the product document
        const base64Image = req.file.buffer.toString('base64');
        const dataUrl = `data:${req.file.mimetype};base64,${base64Image}`;

        const result = {
            success: true,
            url: dataUrl,
            path: filename
        };

        if (result.success) {
            console.log('Upload successful:', result.url);
            res.json({ success: true, url: result.url, path: result.path });
        } else {
            console.error('Upload failed:', result.error);
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to upload image to storage'
            });
        }
    } catch (error) {
        console.error('Error uploading image:', error);
        res.status(500).json({
            success: false,
            error: error.message || 'Internal server error during image upload',
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// ============================================
// REVIEW ROUTES
// ============================================

// Add a review (with purchase verification)
app.post('/api/reviews', async (req, res) => {
    try {
        const { productId, userId, userName, rating, comment } = req.body;

        // Verify user has purchased this product
        const { getDocs, collection: firestoreCollection, query, where, addDoc, doc: docFunc, getDoc, updateDoc } = await import('firebase/firestore');

        const ordersQuery = query(
            firestoreCollection(db, 'orders'),
            where('userId', '==', userId)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        let hasPurchased = false;
        const productIdStr = String(productId);
        const productIdNum = parseInt(productId);

        console.log('Checking purchase history for productId:', productId, 'userId:', userId);

        ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            console.log('Order items:', orderData.items?.map(i => ({ id: i.id, type: typeof i.id })));
            if (orderData.items && orderData.items.some(item => {
                const itemIdStr = String(item.id);
                const itemIdNum = parseInt(item.id);
                return itemIdStr === productIdStr || itemIdNum === productIdNum;
            })) {
                hasPurchased = true;
            }
        });

        if (!hasPurchased) {
            return res.status(403).json({
                success: false,
                error: 'You must purchase this product before reviewing it'
            });
        }

        // Check if user already reviewed this product
        const reviewsQuery = query(
            firestoreCollection(db, 'reviews'),
            where('productId', '==', productId),
            where('userId', '==', userId)
        );

        const reviewsSnapshot = await getDocs(reviewsQuery);

        if (!reviewsSnapshot.empty) {
            return res.status(400).json({
                success: false,
                error: 'You have already reviewed this product'
            });
        }


        // Add the review
        const reviewData = {
            productId,
            userId,
            userName,
            rating: Number(rating),
            comment,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };


        const docRef = await addDoc(firestoreCollection(db, 'reviews'), reviewData);

        // Update product rating and review count - query by numeric id
        const productQuery = query(
            firestoreCollection(db, 'products'),
            where('id', '==', parseInt(productId))
        );
        const productSnapshot = await getDocs(productQuery);

        if (!productSnapshot.empty) {
            const productDoc = productSnapshot.docs[0];
            const productData = productDoc.data();
            const currentRating = productData.rating || 0;
            const currentReviews = productData.reviews || 0;

            const newReviewCount = currentReviews + 1;
            const newRating = ((currentRating * currentReviews) + Number(rating)) / newReviewCount;

            const productRef = docFunc(db, 'products', productDoc.id);
            await updateDoc(productRef, {
                rating: parseFloat(newRating.toFixed(1)),
                reviews: newReviewCount,
                updatedAt: new Date().toISOString()
            });
        }

        res.json({ success: true, id: docRef.id, message: 'Review added successfully' });
    } catch (error) {
        console.error('Error adding review:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Get reviews for a product
app.get('/api/reviews/:productId', async (req, res) => {
    try {
        const { productId } = req.params;
        const { getDocs, collection: firestoreCollection, query, where } = await import('firebase/firestore');

        const reviewsQuery = query(
            firestoreCollection(db, 'reviews'),
            where('productId', '==', productId)
            // Note: orderBy('createdAt', 'desc') removed to avoid index requirement
            // To enable sorting, create the Firebase index using the link in the error message
        );

        const querySnapshot = await getDocs(reviewsQuery);
        const reviews = [];

        querySnapshot.forEach((doc) => {
            reviews.push({ id: doc.id, ...doc.data() });
        });

        // Sort in JavaScript instead (temporary solution)
        reviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

        res.json({ success: true, data: reviews });
    } catch (error) {
        console.error('Error fetching reviews:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Check if user can review a product
app.get('/api/reviews/can-review/:productId/:userId', async (req, res) => {
    try {
        const { productId, userId } = req.params;
        const { getDocs, collection: firestoreCollection, query, where } = await import('firebase/firestore');

        // Check if user purchased the product
        const ordersQuery = query(
            firestoreCollection(db, 'orders'),
            where('userId', '==', userId)
        );

        const ordersSnapshot = await getDocs(ordersQuery);
        let hasPurchased = false;
        const productIdStr = String(productId);
        const productIdNum = parseInt(productId);

        console.log('Checking review eligibility - productId:', productId, 'userId:', userId);
        console.log('Found orders:', ordersSnapshot.size);

        ordersSnapshot.forEach((doc) => {
            const orderData = doc.data();
            console.log('Checking order items:', orderData.items?.map(i => ({ id: i.id, type: typeof i.id })));
            if (orderData.items && orderData.items.some(item => {
                const itemIdStr = String(item.id);
                const itemIdNum = parseInt(item.id);
                const match = itemIdStr === productIdStr || itemIdNum === productIdNum;
                console.log(`Comparing item.id ${item.id} (${typeof item.id}) with productId ${productId}: ${match}`);
                return match;
            })) {
                hasPurchased = true;
            }
        });

        if (!hasPurchased) {
            return res.json({ success: true, canReview: false, reason: 'not_purchased' });
        }

        // Check if user already reviewed
        const reviewsQuery = query(
            firestoreCollection(db, 'reviews'),
            where('productId', '==', productId),
            where('userId', '==', userId)
        );

        const reviewsSnapshot = await getDocs(reviewsQuery);

        if (!reviewsSnapshot.empty) {
            return res.json({ success: true, canReview: false, reason: 'already_reviewed' });
        }

        res.json({ success: true, canReview: true });
    } catch (error) {
        console.error('Error checking review eligibility:', error);
        res.status(500).json({ success: false, error: error.message });
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
    console.log(`🔥 Firebase connected successfully!`);
});
