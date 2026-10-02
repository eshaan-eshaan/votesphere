// Idempotent registry seeding: makes sure the election row exists and, if the
// roll is empty, loads the synthetic voters. Runs at every server start, so a
// reset database (e.g. Render free tier) comes back with the same roll.

const fs = require("fs");
const path = require("path");

async function seedRegistry(prisma, { ELECTION_ID, ELECTION_TITLE }) {
    await prisma.election.upsert({
        where: { id: ELECTION_ID },
        update: {},
        create: { id: ELECTION_ID, title: ELECTION_TITLE, status: "DRAFT" },
    });

    if ((await prisma.member.count()) > 0) return { seeded: 0 };

    const file = path.join(__dirname, "voters.synthetic.json");
    const { voters } = JSON.parse(fs.readFileSync(file, "utf8"));

    await prisma.member.createMany({
        data: voters.map((v) => ({
            membershipNo: v.membership_no,
            unitLabel: v.unit_label,
            block: v.block,
            floor: v.floor,
            flatNo: v.flat_no,
            bhk: v.bhk,
            fullName: v.full_name,
            jointOwnerName: v.joint_owner_name,
            aadhaarMasked: v.aadhaar_masked,
            phoneMasked: v.phone_masked,
            ownership: v.ownership,
            occupancy: v.occupancy,
            memberSince: v.member_since,
            duesCleared: v.dues_cleared,
            titleDisputed: v.title_disputed,
        })),
    });
    return { seeded: voters.length };
}

module.exports = { seedRegistry };
