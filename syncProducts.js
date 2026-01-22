/**
 * Upload products from products.js to Firebase
 * Run this once to sync local products to Firestore
 */

import { db } from './firebaseConfig.js';
import { collection, getDocs, addDoc, query, where } from 'firebase/firestore';

// Import products from frontend
const products = [
    {
        id: 1,
        name: "நல்லெண்ணெய் (Gingelly Oil)",
        category: "Oil",
        price: 220,
        originalPrice: 250,
        rating: 4.8,
        reviews: 234,
        image: "/assets/images/gingerlly.jpg",
        description: "Cold-pressed gingelly oil, rich in nutrients and antioxidants. Multiple sizes available.",
        inStock: true,
        available: 54,
        discount: 12,
        brand: "Valari",
        sizes: ["250ml", "500ml", "1L"]
    },
    {
        id: 2,
        name: "சீரக சம்பா (Seeraga Samba Rice)",
        category: "Rice",
        price: 130,
        originalPrice: 150,
        rating: 4.6,
        reviews: 189,
        image: "https://images.unsplash.com/photo-1586201375761-83865001e31c?w=400",
        description: "Premium quality Seeraga Samba rice, aromatic and perfect for biryani.",
        inStock: true,
        available: 46,
        discount: 13,
        brand: "Valari",
        sizes: ["1kg", "5kg", "10kg"]
    },
    {
        id: 3,
        name: "சிவன் சம்பா (Sivan Samba Rice)",
        category: "Rice",
        price: 100,
        originalPrice: 120,
        rating: 4.5,
        reviews: 312,
        image: "/assets/images/samba.jpg",
        description: "Traditional Sivan Samba rice variety, nutritious and tasty.",
        inStock: true,
        available: 199,
        discount: 17,
        brand: "Valari",
        sizes: ["1kg", "5kg", "10kg"]
    },
    {
        id: 4,
        name: "நாட்டு சர்க்கரை (Nattu Sakkarai - Palm Jaggery)",
        category: "Sweeteners",
        price: 80,
        originalPrice: 100,
        rating: 4.7,
        reviews: 156,
        image: "/assets/images/sugar.jpg",
        description: "Natural palm jaggery, healthy alternative to sugar.",
        inStock: true,
        available: 140,
        discount: 20,
        brand: "Valari",
        sizes: ["250g", "500g", "1kg"]
    },
    {
        id: 5,
        name: "தேங்காய் எண்ணெய் (Coconut Oil)",
        category: "Oil",
        price: 160,
        originalPrice: 180,
        rating: 4.8,
        reviews: 203,
        image: "/assets/images/coconut.jpg",
        description: "Pure cold-pressed coconut oil for cooking and hair care.",
        inStock: true,
        available: 104,
        discount: 11,
        brand: "Valari",
        sizes: ["250ml", "500ml", "1L"]
    },
    {
        id: 7,
        name: "விரலி மஞ்சள் தூள் (Turmeric Powder)",
        category: "Powder",
        price: 50,
        originalPrice: 60,
        rating: 4.6,
        reviews: 267,
        image: "/assets/images/turmeric.jpg",
        description: "Pure organic turmeric powder, anti-inflammatory and antiseptic.",
        inStock: true,
        available: 103,
        discount: 17,
        brand: "Valari",
        sizes: ["100g", "250g", "500g"]
    },
    {
        id: 8,
        name: "மாப்பிளை சம்பா (Mappillai Samba Rice)",
        category: "Rice",
        price: 120,
        originalPrice: 140,
        rating: 4.7,
        reviews: 198,
        image: "/assets/images/mappilai.jpg",
        description: "Traditional red rice variety, boosts stamina and strength.",
        inStock: true,
        available: 248,
        discount: 14,
        brand: "Valari",
        sizes: ["1kg", "5kg", "10kg"]
    },
    {
        id: 10,
        name: "சீக்கைக்காய் தூள் (Shikakai Powder)",
        category: "Powder",
        price: 50,
        originalPrice: 60,
        rating: 4.6,
        reviews: 412,
        image: "/assets/images/shikakai.jpg",
        description: "Natural shikakai powder for healthy hair growth and care.",
        inStock: true,
        available: 203,
        discount: 17,
        brand: "Valari",
        sizes: ["100g", "250g", "500g"]
    },
    {
        id: 11,
        name: "கடலை எண்ணெய் (Groundnut Oil)",
        category: "Oil",
        price: 180,
        originalPrice: 200,
        rating: 4.7,
        reviews: 678,
        image: "assets/images/groundnut.jpg",
        description: "Cold-pressed groundnut oil, ideal for all types of cooking.",
        inStock: true,
        available: 87,
        discount: 10,
        brand: "Valari",
        sizes: ["500ml", "1L", "2L"]
    },
    {
        id: 12,
        name: "கொள்ளு (Horse Gram)",
        category: "Grains",
        price: 90,
        originalPrice: 110,
        rating: 4.5,
        reviews: 345,
        image: "/assets/images/kolu.jpg",
        description: "Nutritious horse gram, excellent for weight loss and health.",
        inStock: true,
        available: 156,
        discount: 18,
        brand: "Valari",
        sizes: ["500g", "1kg"]
    },
    {
        id: 18,
        name: "கம்பு (Pearl Millet)",
        category: "Grains",
        price: 65,
        originalPrice: 80,
        rating: 4.5,
        reviews: 178,
        image: "/assets/images/kambu.jpg",
        description: "Nutritious pearl millet, high in iron and calcium.",
        inStock: true,
        available: 234,
        discount: 19,
        brand: "Valari",
        sizes: ["500g", "1kg", "5kg"]
    },
    {
        id: 20,
        name: "நாட்டு கருப்பட்டி (Country Jaggery)",
        category: "Sweeteners",
        price: 90,
        originalPrice: 110,
        rating: 4.7,
        reviews: 234,
        image: "/assets/images/karuppatti.jpg",
        description: "Traditional country jaggery, natural and healthy sweetener.",
        inStock: true,
        available: 167,
        discount: 18,
        brand: "Valari",
        sizes: ["250g", "500g", "1kg"]
    }
];

async function uploadProducts() {
    console.log('🔄 Starting product upload...');

    let uploaded = 0;
    let updated = 0;
    let skipped = 0;

    for (const product of products) {
        try {
            // Check if product with this ID already exists
            const productsRef = collection(db, 'products');
            const q = query(productsRef, where('id', '==', product.id));
            const querySnapshot = await getDocs(q);

            if (querySnapshot.empty) {
                // Product doesn't exist, add it
                await addDoc(productsRef, {
                    ...product,
                    createdAt: new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                });
                console.log(`✅ Uploaded product ${product.id}: ${product.name}`);
                uploaded++;
            } else {
                console.log(`⏭️  Product ${product.id} already exists, skipping`);
                skipped++;
            }
        } catch (error) {
            console.error(`❌ Error uploading product ${product.id}:`, error.message);
        }
    }

    console.log('\n📊 Upload Summary:');
    console.log(`   ✅ Uploaded: ${uploaded}`);
    console.log(`   ⏭️  Skipped: ${skipped}`);
    console.log(`   📦 Total: ${products.length}`);
    console.log('\n✨ Product upload complete!');
    process.exit(0);
}

// Run the upload
uploadProducts().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
});
