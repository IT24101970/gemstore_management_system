const bcrypt = require('bcryptjs');

const passwords = ['admin123', 'password123', 'password123'];
const names = ['Admin', 'Buyer', 'Seller'];

async function generateHashes() {
    for (let i = 0; i < passwords.length; i++) {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash(passwords[i], salt);
        console.log(`${names[i]}: ${hash}`);
    }
}

generateHashes();