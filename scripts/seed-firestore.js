/**
 * Seed Firestore with collections and sample documents for fid2026.
 * Run from project root: node scripts/seed-firestore.js
 * Requires FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json (or FIREBASE_SERVICE_ACCOUNT_KEY)
 * Copy your service account JSON to firebase-service-account.json first.
 */

const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach((line) => {
    const m = line.match(/^([^#=]+)=(.*)$/);
    if (m) process.env[m[1].trim()] = m[2].trim().replace(/^["']|["']$/g, '');
  });
}

const admin = require('firebase-admin');

function getCredential() {
  const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (key) {
    try {
      const parsed = JSON.parse(key);
      return admin.credential.cert(parsed);
    } catch (e) {
      throw new Error('Invalid FIREBASE_SERVICE_ACCOUNT_KEY: ' + e.message);
    }
  }
  const filePath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;
  if (filePath) {
    const resolved = path.isAbsolute(filePath) ? filePath : path.join(__dirname, '..', filePath);
    if (!fs.existsSync(resolved)) throw new Error('FIREBASE_SERVICE_ACCOUNT_PATH file not found: ' + resolved);
    const content = fs.readFileSync(resolved, 'utf8');
    const parsed = JSON.parse(content);
    return admin.credential.cert(parsed);
  }
  return admin.credential.applicationDefault();
}

if (!admin.apps.length) {
  admin.initializeApp({ credential: getCredential() });
}

const db = admin.firestore();
const Timestamp = admin.firestore.Timestamp;

async function seed() {
  const now = Timestamp.now();
  const nowDate = new Date();

  console.log('Seeding Firestore for fid2026...');

  // 1. Businesses (create first so we can reference in categories and deals)
  const businessesRef = db.collection('businesses');
  const businessIds = [];
  const businessData = [
    { name: 'Sample Store A', imageSrc: '/sample-a.jpg', imageSrcBig: '/sample-a-big.jpg', openingHours: 'Open today 9:00 – 21:00', rating: 4.2, userRatingsTotal: 45, address: '123 Main St', phone: '+972-2-1234567', website: 'https://example.com/a' },
    { name: 'Sample Store B', imageSrc: '/sample-b.jpg', imageSrcBig: '/sample-b-big.jpg', openingHours: 'Open today 8:00 – 20:00', rating: 4.5, userRatingsTotal: 78, address: '456 Oak Ave', phone: '+972-3-7654321', website: 'https://example.com/b' },
    { name: 'Sample Store C', imageSrc: '/sample-c.jpg', imageSrcBig: '/sample-c-big.jpg', openingHours: 'Open today 10:00 – 22:00', rating: 4.0, userRatingsTotal: 32, address: '789 Pine Rd', phone: '+972-4-1112233', website: 'https://example.com/c' },
  ];
  for (const b of businessData) {
    const ref = await businessesRef.add({ ...b, createdAt: now });
    businessIds.push(ref.id);
    console.log('  businesses:', ref.id, b.name);
  }

  // 2. Cards (one per cards-icons combo: providers VISA/Mastercard/Amex + clubs)
  const cardsRef = db.collection('cards');
  const cardIds = [];
  const cardData = [
    { name: 'Sample Card 1', imageSrc: '/card1.png', type: 'credit', issuer: 'regular', provider: 'VISA', club: 'max', bg: '#182957' },
    { name: 'Sample Card 2', imageSrc: '/card2.png', type: 'credit', issuer: 'bank', provider: 'MASTERCARD', club: 'leumi', bg: 'grey' },
    { name: 'Sample Card 3', imageSrc: '/card3.png', type: 'debit', issuer: 'regular', provider: 'AMERICAN EXPRESS', club: 'diners', bg: '#badcf5' },
    { name: 'Cal Card', imageSrc: '/assets/cards-icons/cal.svg', type: 'credit', issuer: 'regular', provider: 'VISA', club: 'cal', bg: '#badcf5' },
    { name: 'Isracard', imageSrc: '/assets/cards-icons/isracard.svg', type: 'credit', issuer: 'bank', provider: 'MASTERCARD', club: 'isracard', bg: '#182957' },
    { name: 'Discount', imageSrc: '/assets/cards-icons/discount.svg', type: 'credit', issuer: 'regular', provider: 'VISA', club: 'discount', bg: '#434342' },
    { name: 'Yoter', imageSrc: '/assets/cards-icons/yoter.svg', type: 'credit', issuer: 'bank', provider: 'MASTERCARD', club: 'yoter', bg: '#434342' },
    { name: 'Hapoalim', imageSrc: '/assets/cards-icons/hapoalim.svg', type: 'credit', issuer: 'bank', provider: 'AMERICAN EXPRESS', club: 'hapoalim', bg: 'grey' },
  ];
  for (const c of cardData) {
    const ref = await cardsRef.add({ ...c, createdAt: now });
    cardIds.push(ref.id);
    console.log('  cards:', ref.id, c.name);
  }

  // 3. Categories (reference businesses) – relevant image seeds per category
  const categoryImage = (seed) => `https://picsum.photos/seed/${seed}/400/280`;
  const categoriesRef = db.collection('categories');
  const categoryData = [
    { name: 'Cinema', imageSrc: categoryImage('cinema-movies'), businessIds: businessIds },
    { name: 'Stand Up', imageSrc: categoryImage('comedy-show'), businessIds: businessIds.slice(0, 2) },
    { name: 'Coffee', imageSrc: categoryImage('coffee-cafe'), businessIds: businessIds },
    { name: 'Restaurants', imageSrc: categoryImage('restaurant-food'), businessIds: businessIds },
    { name: 'Home', imageSrc: categoryImage('home-furniture'), businessIds: businessIds.slice(0, 2) },
    { name: 'Shopping', imageSrc: categoryImage('shopping-mall'), businessIds: businessIds.slice(0, 2) },
    { name: 'Amusement park', imageSrc: categoryImage('amusement-park'), businessIds: businessIds.slice(0, 1) },
    { name: 'Travel', imageSrc: categoryImage('travel-vacation'), businessIds: [businessIds[2]] },
    { name: 'Sports', imageSrc: categoryImage('sports-fitness'), businessIds: businessIds },
    { name: 'Health', imageSrc: categoryImage('health-wellness'), businessIds: businessIds.slice(0, 2) },
    { name: 'Books', imageSrc: categoryImage('books-library'), businessIds: businessIds },
    { name: 'Electronics', imageSrc: categoryImage('electronics-tech'), businessIds: businessIds.slice(0, 1) },
    { name: 'Fashion', imageSrc: categoryImage('fashion-clothing'), businessIds: businessIds },
    { name: 'Groceries', imageSrc: categoryImage('groceries-supermarket'), businessIds: businessIds },
    { name: 'Entertainment', imageSrc: categoryImage('entertainment'), businessIds: businessIds },
    { name: 'Beauty', imageSrc: categoryImage('beauty-cosmetics'), businessIds: businessIds.slice(0, 2) },
    { name: 'Kids', imageSrc: categoryImage('kids-family'), businessIds: businessIds },
    { name: 'Pets', imageSrc: categoryImage('pets-animals'), businessIds: businessIds },
    { name: 'Pharmacy', imageSrc: categoryImage('pharmacy-health'), businessIds: businessIds.slice(0, 1) },
    { name: 'Salon', imageSrc: categoryImage('salon-beauty'), businessIds: businessIds.slice(0, 2) },
    { name: 'Gym', imageSrc: categoryImage('gym-fitness'), businessIds: businessIds },
  ];
  for (const c of categoryData) {
    const ref = await categoriesRef.add({ ...c, createdAt: now });
    console.log('  categories:', ref.id, c.name);
  }

  // 4. Deals (reference card and business)
  const dealsRef = db.collection('deals');
  const dealData = [
    { description: '10% off at Sample Store A', expirationDate: Timestamp.fromDate(new Date(nowDate.getFullYear() + 1, 0, 1)), createDate: now, link: 'https://example.com/deal1', cardId: cardIds[0], businessId: businessIds[0] },
    { description: 'Free shipping at Sample Store B', expirationDate: Timestamp.fromDate(new Date(nowDate.getFullYear() + 1, 5, 1)), createDate: now, link: 'https://example.com/deal2', cardId: cardIds[1], businessId: businessIds[1] },
  ];
  for (const d of dealData) {
    const ref = await dealsRef.add(d);
    console.log('  deals:', ref.id, d.description.slice(0, 30));
  }

  // 5. Users collection (empty; users created on login/register)
  const usersRef = db.collection('users');
  const userDoc = usersRef.doc('demo@example.com');
  if (!(await userDoc.get()).exists) {
    await userDoc.set({
      email: 'demo@example.com',
      name: 'Demo User',
      image: '',
      password: null,
      cards: [],
      searches: [],
      createdAt: now,
    });
    console.log('  users: demo@example.com (placeholder)');
  } else {
    console.log('  users: demo@example.com already exists');
  }

  console.log('Done. Collections: users, cards, categories, businesses, deals.');
}

seed().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
