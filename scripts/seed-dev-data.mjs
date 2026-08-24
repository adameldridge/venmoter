// One-off script to seed venmoter-dev with made-up test venues/promoters.
// Run from the project root: node scripts/seed-dev-data.mjs
// Prompts for your dev-project login (never pass credentials as CLI args or env in shell history).
import { createInterface } from "node:readline";
import { initializeApp } from "firebase/app";
import { getAuth, signInWithEmailAndPassword } from "firebase/auth";
import { getFirestore, collection, addDoc } from "firebase/firestore";

const devConfig = {
  apiKey: "AIzaSyCOovaGeUbgi4f0yZo83YupcYCirEs7JG8",
  authDomain: "venmoter-dev.firebaseapp.com",
  projectId: "venmoter-dev",
  storageBucket: "venmoter-dev.firebasestorage.app",
  messagingSenderId: "229518799884",
  appId: "1:229518799884:web:27b73fa185b6bb9096ea29",
};

function prompt(question, hidden = false) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    if (!hidden) {
      rl.question(question, (answer) => {
        rl.close();
        resolve(answer);
      });
      return;
    }
    const stdin = process.stdin;
    process.stdout.write(question);
    let value = "";
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding("utf8");
    const onData = (char) => {
      if (char === "\n" || char === "\r" || char === "") {
        stdin.setRawMode(false);
        stdin.pause();
        stdin.removeListener("data", onData);
        process.stdout.write("\n");
        rl.close();
        resolve(value);
      } else if (char === "") {
        process.exit(1);
      } else if (char === "") {
        value = value.slice(0, -1);
      } else {
        value += char;
      }
    };
    stdin.on("data", onData);
  });
}

const VENUES = [
  { name: "The Fleece", city: "Bristol", website: "https://thefleece.co.uk", instagram: "thefleecebristol" },
  { name: "Motion", city: "Bristol", website: "https://motionbristol.com", instagram: "motionbristoluk" },
  { name: "Tramshed", city: "Cardiff", website: "https://tramshedcardiff.co.uk", facebook: "tramshedcardiff" },
  { name: "Clwb Ifor Bach", city: "Cardiff", website: "https://clwb.net" },
  { name: "Le Pub", city: "Newport", website: "https://lepub.org.uk", email: "info@lepub.org.uk" },
  { name: "Chalk", city: "Brighton", website: "https://chalkvenue.com", instagram: "chalkvenue" },
  { name: "The Warehouse Project", city: "Manchester", website: "https://thewarehouseproject.com", facebook: "whpwarehouseproject" },
  { name: "Brudenell Social Club", city: "Leeds", website: "https://brudenellsocialclub.co.uk", email: "hello@brudenellsocialclub.co.uk" },
];

const PROMOTERS = [
  { name: "Purple Turtle Presents", website: "https://purpleturtlepresents.example.com", instagram: "purpleturtlepresents" },
  { name: "Silent Roar Promotions", website: "https://silentroar.example.com" },
  { name: "Riot Collective", website: "https://riotcollective.example.com", facebook: "riotcollective" },
  { name: "Neon Nights", website: "https://neonnights.example.com", instagram: "neonnightsuk" },
  { name: "Underground Sound", website: "https://undergroundsound.example.com", email: "bookings@undergroundsound.example.com" },
  { name: "Firefly Events", website: "https://fireflyevents.example.com" },
];

// venue index -> promoter indexes
const LINKS = [
  [0, 1],
  [0],
  [1, 2],
  [2],
  [3],
  [4, 5],
  [4],
  [5, 0],
];

async function main() {
  const email = process.env.DEV_EMAIL || (await prompt("Dev login email: "));
  const password = process.env.DEV_PASSWORD || (await prompt("Dev login password: ", true));

  const app = initializeApp(devConfig);
  const auth = getAuth(app);
  const db = getFirestore(app);

  await signInWithEmailAndPassword(auth, email, password);
  console.log("Signed in. Seeding data into venmoter-dev...");

  const venueIds = [];
  for (const venue of VENUES) {
    const ref = await addDoc(collection(db, "venues"), venue);
    venueIds.push(ref.id);
    console.log(`Added venue: ${venue.name} (${venue.city})`);
  }

  const promoterIds = [];
  for (const promoter of PROMOTERS) {
    const ref = await addDoc(collection(db, "promoters"), promoter);
    promoterIds.push(ref.id);
    console.log(`Added promoter: ${promoter.name}`);
  }

  for (let venueIndex = 0; venueIndex < LINKS.length; venueIndex++) {
    for (const promoterIndex of LINKS[venueIndex]) {
      await addDoc(collection(db, "venue-promoters"), {
        venueId: venueIds[venueIndex],
        promoterId: promoterIds[promoterIndex],
      });
    }
  }

  console.log(`Done. Added ${venueIds.length} venues, ${promoterIds.length} promoters, and their links.`);
  process.exit(0);
}

main().catch((error) => {
  console.error("Seed failed:", error.message);
  process.exit(1);
});
