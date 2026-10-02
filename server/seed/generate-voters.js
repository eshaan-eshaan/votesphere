// Deterministic generator for a fully SYNTHETIC electoral roll: 50 flats in a
// fictional two-block housing society ("Parijat Residency"), modelled on how
// Indian RWA elections work (one flat = one vote, owner votes, tenants don't,
// dues/title-dispute can bar a member). See docs/adr/ADR-001-*.md.
//
// Everything is fictional. Aadhaar and phone are MASKED placeholders only: a
// random 4-digit prefix followed by X's, never a full identifier. No email,
// PAN, religion or caste field is produced. Same SEED => byte-identical output.
//
// Usage (from server/):  node seed/generate-voters.js

const fs = require("fs");
const path = require("path");

const SEED = 20260215;

function mulberry32(a) {
    return function () {
        a |= 0;
        a = (a + 0x6d2b79f5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}
const rand = mulberry32(SEED);
const pick = (arr) => arr[Math.floor(rand() * arr.length)];
const shuffle = (arr) => {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
        const j = Math.floor(rand() * (i + 1));
        [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
};

// Name pools grouped by region/community so full names stay coherent.
// `count` is how many of the 50 flats are drawn from each pool.
const CLUSTERS = [
    { count: 12, male: ["Rajesh", "Sandeep", "Anil", "Vikas", "Naveen", "Deepak", "Pankaj", "Manoj"],
      female: ["Sunita", "Neha", "Anjali", "Pooja", "Meena", "Rekha", "Kavita", "Shweta"],
      surnames: ["Sharma", "Verma", "Gupta", "Agarwal", "Mishra", "Tyagi", "Chauhan", "Saxena"] },
    { count: 7, male: ["Harpreet", "Gurpreet", "Jaspal", "Manjit", "Amarjeet"],
      female: ["Simran", "Harleen", "Jasleen", "Navneet", "Manpreet"],
      surnames: ["Singh", "Gill", "Bedi", "Sandhu", "Chadha", "Arora", "Khanna", "Malhotra"] },
    { count: 5, male: ["Subhajit", "Soumen", "Arindam", "Debashish", "Partha"],
      female: ["Moumita", "Sreeparna", "Piyali", "Madhumita", "Rupa"],
      surnames: ["Banerjee", "Chatterjee", "Mukherjee", "Das", "Ghosh", "Sen", "Bose"] },
    { count: 7, male: ["Prashant", "Sachin", "Nitin", "Chetan", "Hitesh", "Kunal"],
      female: ["Smita", "Varsha", "Hetal", "Pallavi", "Mansi"],
      surnames: ["Deshmukh", "Kulkarni", "Patil", "Joshi", "Shah", "Mehta", "Patel", "Desai"] },
    { count: 10, male: ["Venkatesh", "Karthik", "Suresh", "Ramesh", "Anand", "Sreenivasan", "Gopal"],
      female: ["Lakshmi", "Revathi", "Padmini", "Deepa", "Anitha", "Sheela", "Vimala"],
      surnames: ["Iyer", "Iyengar", "Reddy", "Rao", "Nair", "Menon", "Pillai", "Naidu", "Krishnan", "Narayanan"] },
    { count: 5, male: ["Zaheer", "Farhan", "Adnan", "Tariq", "Javed", "Rizwan"],
      female: ["Nazia", "Shabana", "Farah", "Ayesha", "Rukhsar", "Sana"],
      surnames: ["Ansari", "Siddiqui", "Qureshi", "Hussain", "Mirza", "Sheikh", "Khan"] },
    { count: 4, male: ["Joseph", "Thomas", "Sebastian", "Peter", "Francis"],
      female: ["Mary", "Susan", "Grace", "Teresa", "Rosy"],
      surnames: ["D'Souza", "Fernandes", "Mathew", "George", "Pereira", "Vaz"] },
];

// Avoid accidentally generating the names of well-known real people.
const BLOCKLIST = new Set([
    "Salman Khan", "Imran Khan", "Irfan Khan", "Aamir Khan", "Anil Kapoor",
    "Sachin Patil", "Javed Khan", "Farhan Khan",
]);

const usedNames = new Set();
function uniqueName(gender, cluster) {
    for (let tries = 0; tries < 200; tries++) {
        const first = pick(gender === "M" ? cluster.male : cluster.female);
        const full = `${first} ${pick(cluster.surnames)}`;
        if (!usedNames.has(full) && !BLOCKLIST.has(full)) {
            usedNames.add(full);
            return { first, full };
        }
    }
    throw new Error("Could not generate a unique name");
}

// ---- Units: 2 blocks x 5 floors x 5 flats = 50 ----
const units = [];
for (const block of ["A", "B"]) {
    for (let floor = 1; floor <= 5; floor++) {
        for (let n = 1; n <= 5; n++) {
            const flatNo = `${floor}0${n}`;
            units.push({ block, floor, flat_no: flatNo, unit_label: `${block}-${flatNo}`, bhk: n >= 4 ? 3 : 2 });
        }
    }
}

// ---- Attribute assignment with fixed counts (so the roll has known edge cases) ----
const idx = (n) => Array.from({ length: n }, (_, i) => i);
const jointSet = new Set(shuffle(idx(50)).slice(0, 12));

const occPerm = shuffle(idx(50));
const tenanted = new Set(occPerm.slice(0, 9));
const vacant = new Set(occPerm.slice(9, 12));

const inelPerm = shuffle(idx(50));
const duesPending = new Set(inelPerm.slice(0, 3));
const titleDisputed = new Set(inelPerm.slice(3, 4));

const clusterSlots = shuffle(CLUSTERS.flatMap((c, i) => Array(c.count).fill(i)));

const voters = units.map((u, i) => {
    const cluster = CLUSTERS[clusterSlots[i]];
    const gender = rand() < 0.62 ? "M" : "F";
    const { full } = uniqueName(gender, cluster);
    const surname = full.split(" ").slice(1).join(" ");

    let jointOwner = null;
    if (jointSet.has(i)) {
        const spouseGender = gender === "M" ? "F" : "M";
        const spouseFirst = pick(spouseGender === "M" ? cluster.male : cluster.female);
        jointOwner = `${spouseFirst} ${surname}`;
        usedNames.add(jointOwner);
    }

    const dues = !duesPending.has(i);
    const disputed = titleDisputed.has(i);
    const reason = !dues ? "DUES_PENDING" : disputed ? "TITLE_DISPUTED" : null;

    return {
        unit_label: u.unit_label,
        block: u.block,
        floor: u.floor,
        flat_no: u.flat_no,
        bhk: u.bhk,
        full_name: full,
        joint_owner_name: jointOwner,
        ownership: jointOwner ? "JOINT" : "SOLE",
        occupancy: tenanted.has(i) ? "TENANTED" : vacant.has(i) ? "VACANT" : "OWNER_OCCUPIED",
        member_since: 2012 + Math.floor(rand() * 13),
        dues_cleared: dues,
        title_disputed: disputed,
        eligible_to_vote: reason === null,
        ineligible_reason: reason,
    };
});

// Earlier members get lower membership numbers (as in a real register).
voters.sort((a, b) => a.member_since - b.member_since || a.unit_label.localeCompare(b.unit_label));
voters.forEach((v, i) => { v.membership_no = `PRW-${String(i + 1).padStart(3, "0")}`; });

// Masked identifiers use a second PRNG so they never shift the names/flats above.
const maskRand = mulberry32(SEED ^ 0x9e3779b1);
const randDigits = (n) => Array.from({ length: n }, () => Math.floor(maskRand() * 10)).join("");
const usedAadhaar = new Set();
const usedPhone = new Set();
function maskedPrefix(firstMin, firstSpan, used) {
    for (;;) {
        const p = String(firstMin + Math.floor(maskRand() * firstSpan)) + randDigits(3);
        if (!used.has(p)) { used.add(p); return p; }
    }
}
voters.forEach((v) => {
    v.aadhaar_masked = `${maskedPrefix(2, 8, usedAadhaar)} XXXX XXXX`; // Aadhaar never starts with 0 or 1
    v.phone_masked = `+91 ${maskedPrefix(6, 4, usedPhone)}XXXXXX`;     // Indian mobiles start with 6-9
});

const ordered = voters.map((v) => ({
    membership_no: v.membership_no,
    unit_label: v.unit_label,
    block: v.block,
    floor: v.floor,
    flat_no: v.flat_no,
    bhk: v.bhk,
    full_name: v.full_name,
    joint_owner_name: v.joint_owner_name,
    aadhaar_masked: v.aadhaar_masked,
    phone_masked: v.phone_masked,
    ownership: v.ownership,
    occupancy: v.occupancy,
    member_since: v.member_since,
    dues_cleared: v.dues_cleared,
    title_disputed: v.title_disputed,
    eligible_to_vote: v.eligible_to_vote,
    ineligible_reason: v.ineligible_reason,
}));

const out = {
    meta: {
        synthetic: true,
        notice: "FICTIONAL DATA. Names, flats and statuses are generated; they do not describe real people. Aadhaar and phone are masked placeholders (random 4-digit prefix only), not real identifiers.",
        society: "Parijat Residency RWA (synthetic)",
        voting_unit: "one flat = one vote; the registered (first) owner is the voting member",
        seed: SEED,
        generator: "server/seed/generate-voters.js",
        counts: {
            flats: ordered.length,
            eligible_to_vote: ordered.filter((v) => v.eligible_to_vote).length,
            ineligible: ordered.filter((v) => !v.eligible_to_vote).length,
        },
    },
    voters: ordered,
};

const dir = __dirname;
fs.writeFileSync(path.join(dir, "voters.synthetic.json"), JSON.stringify(out, null, 2) + "\n");

const cols = Object.keys(ordered[0]);
const esc = (v) => {
    const s = v === null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};
const csv = [cols.join(","), ...ordered.map((r) => cols.map((c) => esc(r[c])).join(","))].join("\n") + "\n";
fs.writeFileSync(path.join(dir, "voters.synthetic.csv"), csv);

console.log("Wrote voters.synthetic.json and voters.synthetic.csv", out.meta.counts);
