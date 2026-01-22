/**
 * Admin User Creation Script
 * 
 * This script helps create admin users in Firebase Authentication
 * Run this to create your admin accounts
 */

import { auth, db } from './firebaseConfig.js';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

const ADMIN_USERS = [
    {
        email: 'psujeeth02@gmail.com',
        password: 'Admin@123',  // CHANGE THIS PASSWORD
        displayName: 'Sujeeth P'
    },
    {
        email: 'prannavp803@gmail.com',
        password: 'Admin@123',  // CHANGE THIS PASSWORD
        displayName: 'Prannav P'
    }
];

async function createAdminUser(email, password, displayName) {
    try {
        console.log(`\n📝 Creating admin user: ${email}`);

        // Create user in Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Update display name
        if (displayName) {
            await updateProfile(user, { displayName });
        }

        // Store user data in Firestore with admin role
        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            displayName: displayName || '',
            role: 'admin', // Set as admin
            createdAt: serverTimestamp(),
            lastLogin: serverTimestamp(),
            isActive: true
        });

        console.log(`✅ Admin user created successfully!`);
        console.log(`   Email: ${email}`);
        console.log(`   UID: ${user.uid}`);
        console.log(`   Display Name: ${displayName}`);

        return { success: true, user };
    } catch (error) {
        if (error.code === 'auth/email-already-in-use') {
            console.log(`⚠️  User already exists: ${email}`);
            return { success: false, error: 'User already exists' };
        } else {
            console.error(`❌ Error creating user ${email}:`, error.message);
            return { success: false, error: error.message };
        }
    }
}

async function createAllAdmins() {
    console.log('🚀 Starting admin user creation...\n');
    console.log('⚠️  IMPORTANT: Make sure to change the default passwords in this file!\n');

    for (const adminUser of ADMIN_USERS) {
        await createAdminUser(
            adminUser.email,
            adminUser.password,
            adminUser.displayName
        );

        // Wait a bit between creations
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    console.log('\n✅ Admin user creation complete!');
    console.log('\n📋 Next steps:');
    console.log('1. Go to your app login page');
    console.log('2. Sign in with one of the admin emails');
    console.log('3. Navigate to /admin/dashboard');
    console.log('4. Start managing your e-commerce platform!\n');

    process.exit(0);
}

// Run the script
createAllAdmins().catch(error => {
    console.error('💥 Fatal error:', error);
    process.exit(1);
});
