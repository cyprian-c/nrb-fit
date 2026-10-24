import { pool } from '../config/db.js'

// The seed data mirrors the studio content used by the client. Keeping this
// copy in the server means the database can be initialized without importing
// Vite-only image modules from the frontend workspace.
const coaches = [
  {
    name: 'Nina Kim',
    specialty: 'Strength & Conditioning',
    bio: 'Coaching focus: progressive strength, movement technique and small-group conditioning. Professional highlight: builds structured programmes that help members track and develop strength over time.',
    imageUrl: '/assets/nina-kim-coach.webp',
  },
  {
    name: 'Mae Rivera',
    specialty: 'Pilates & Mobility',
    bio: 'Coaching focus: Pilates-based core training, mobility and recovery. Professional highlight: leads accessible movement sessions that build control, stability and confidence across experience levels.',
    imageUrl: '/assets/mae-rivera-coach.webp',
  },
  {
    name: 'Andre Miles',
    specialty: 'Ride & Run Club',
    bio: 'Coaching focus: run-club programming, endurance conditioning and indoor cycling. Professional highlight: plans progressive sessions for a range of paces, with an emphasis on consistency and race-day preparation.',
    imageUrl: '/assets/andre-miles-coach.webp',
  },
]

const classes = [
  ['05:45', 'Strength Foundations', 'Strength', 'Technique & progressive lifting', '50 min', 'Nina Kim'],
  ['06:45', 'Athletic Conditioning', 'Conditioning', 'Intervals, agility & engine work', '45 min', 'Andre Miles'],
  ['07:45', 'Pilates & Core', 'Pilates', 'Control, stability & mobility', '50 min', 'Mae Rivera'],
  ['09:00', 'Lower Body Strength', 'Strength', 'Strength, balance & power', '50 min', 'Nina Kim'],
  ['12:15', 'Lunch Break Express', 'Full Body', 'Efficient full-body training', '40 min', 'Andre Miles'],
  ['16:30', 'Mobility Reset', 'Recovery', 'Range of motion & recovery', '45 min', 'Mae Rivera'],
  ['17:30', 'Upper Body Strength', 'Strength', 'Push, pull & carry', '50 min', 'Nina Kim'],
  ['18:30', 'Boxing Conditioning', 'Boxing', 'Footwork, bags & intervals', '45 min', 'Andre Miles'],
  ['19:30', 'Strength & Conditioning', 'Hybrid', 'Compound lifts & conditioning', '50 min', 'Nina Kim'],
  ['20:15', 'Stretch & Restore', 'Recovery', 'Guided stretch & breathwork', '40 min', 'Mae Rivera'],
]

const memberships = [
  ['Class drop-in', 'One coached session.', 'KES 2,000', '/ class', 'A single small-group class, booked in advance.', ['Any available class', 'Coach-led session', 'Mat and studio equipment included'], false],
  ['5-class pack', 'Build a steady rhythm.', 'KES 8,500', '/ pack', 'Five coached classes to use within 60 days.', ['Any scheduled class', 'Save KES 1,500 vs drop-ins', 'Book up to 14 days ahead'], false],
  ['10-class pack', 'Make training a habit.', 'KES 15,000', '/ pack', 'Ten coached classes to use within 90 days.', ['Any scheduled class', 'Save KES 5,000 vs drop-ins', 'Book up to 14 days ahead'], false],
  ['Studio monthly', 'Your weekly training plan.', 'KES 18,000', '/ month', 'For members who want coached training every week.', ['12 classes per month', 'Priority booking, 14 days ahead', 'One monthly progress check-in'], true],
  ['Unlimited studio', 'Make the studio yours.', 'KES 28,000', '/ month', 'Unlimited group classes for a consistent routine.', ['Unlimited scheduled classes', 'Priority booking, 14 days ahead', 'One guest class each month'], false],
  ['Open gym access', 'Train on your own terms.', 'KES 12,000', '/ month', 'Independent training for members with their own programme.', ['Reserved open-gym sessions', 'Orientation included', 'Coach support available on request'], false],
]

async function seed() {
  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // Natural names are used for idempotency because the initial schema uses
    // generated numeric IDs and does not add unique keys to content tables.
    for (const coach of coaches) {
      await client.query(
        `INSERT INTO coaches (name, specialty, bio, image_url)
         SELECT $1, $2, $3, $4
         WHERE NOT EXISTS (SELECT 1 FROM coaches WHERE name = $1)`,
        [coach.name, coach.specialty, coach.bio, coach.imageUrl],
      )
    }

    for (const classRecord of classes) {
      const [time, name, category, focus, duration, coachName] = classRecord
      await client.query(
        `INSERT INTO classes (time, name, category, focus, duration, coach_id)
         SELECT $1, $2, $3, $4, $5, coaches.id
         FROM coaches
         WHERE coaches.name = $6
           AND NOT EXISTS (SELECT 1 FROM classes WHERE name = $2)`,
        [time, name, category, focus, duration, coachName],
      )
    }

    for (const membership of memberships) {
      const [label, title, price, suffix, description, perks, featured] = membership
      await client.query(
        `INSERT INTO memberships (label, title, price, suffix, description, perks, featured)
         SELECT $1, $2, $3, $4, $5, $6::jsonb, $7
         WHERE NOT EXISTS (SELECT 1 FROM memberships WHERE label = $1)`,
        [label, title, price, suffix, description, JSON.stringify(perks), featured],
      )
    }

    await client.query('COMMIT')
    console.info('Studio seed data inserted successfully.')
  } catch (error) {
    if (client) {
      try {
        await client.query('ROLLBACK')
      } catch (rollbackError) {
        console.error('Database seed rollback failed:', rollbackError.message)
      }
    }

    console.error('Studio seed failed:', error.message)
    process.exitCode = 1
  } finally {
    client?.release()
    await pool.end()
  }
}

await seed()