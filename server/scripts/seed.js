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

// Comprehensive Home Workout Programs
const programs = [
  {
    slug: 'full-body-blitz',
    title: 'Full Body 28-Day Kickstart',
    category: 'full_body',
    difficulty: 'beginner',
    duration_days: 28,
    description: 'A complete zero-equipment conditioning program designed to build lean functional muscle, boost metabolic burn, and build consistent daily workout habits.',
    banner_color: '#84ae00',
    sessions: [
      { day: 1, title: 'Full Body Ignition', duration: 18, exercises: ['Jumping Jacks', 'Standard Push-Ups', 'Bodyweight Squats', 'Standard Plank', 'High Knees', 'Child\'s Pose'] },
      { day: 2, title: 'Core & Upper Circuit', duration: 20, exercises: ['Mountain Climbers', 'Wide Grip Push-Ups', 'Bicycle Crunches', 'Tricep Dips on Chair', 'Russian Twists', 'Cobra Stretch'] },
      { day: 3, title: 'Lower Body & Conditioning', duration: 22, exercises: ['Walking Lunges', 'Jump Squats', 'Glute Bridges', 'Calf Raises', 'Wall Sit', 'Cat-Cow Pose'] },
      { day: 4, title: 'Active Recovery & Flow', duration: 15, exercises: ['Cat-Cow Pose', 'Downward Dog', 'Cobra Stretch', 'Child\'s Pose'] },
      { day: 5, title: 'Metabolic Heat & Core', duration: 24, exercises: ['Burpees', 'Mountain Climbers', 'Standard Push-Ups', 'Leg Raises', 'High Knees', 'Standard Plank'] },
      { day: 6, title: 'Strength Endurance', duration: 25, exercises: ['Diamond Push-Ups', 'Bulgarian Split Squats', 'Pike Push-Ups', 'Side Plank', 'Jump Squats', 'Child\'s Pose'] },
      { day: 7, title: 'Rest & Regeneration', duration: 10, exercises: ['Cat-Cow Pose', 'Child\'s Pose', 'Cobra Stretch'] },
    ],
  },
  {
    slug: 'core-abs-shred',
    title: 'Abs & Core Shred',
    category: 'abs',
    difficulty: 'intermediate',
    duration_days: 21,
    description: 'Targeted midsection training focusing on rotational control, deep transverse abdominis activation, and sculpted abdominal endurance.',
    banner_color: '#3b82f6',
    sessions: [
      { day: 1, title: 'Deep Core Activation', duration: 16, exercises: ['Standard Plank', 'Bicycle Crunches', 'Leg Raises', 'Mountain Climbers', 'Cobra Stretch'] },
      { day: 2, title: 'Rotational Power', duration: 18, exercises: ['Russian Twists', 'Side Plank', 'Mountain Climbers', 'Flutter Kicks', 'Cat-Cow Pose'] },
      { day: 3, title: 'Lower Ab Attack', duration: 20, exercises: ['Leg Raises', 'Flutter Kicks', 'Bicycle Crunches', 'Standard Plank', 'Child\'s Pose'] },
      { day: 4, title: 'Isometric Core Stamina', duration: 15, exercises: ['Standard Plank', 'Side Plank', 'Wall Sit', 'Cobra Stretch'] },
      { day: 5, title: 'High-Pace Core Burn', duration: 22, exercises: ['Mountain Climbers', 'Russian Twists', 'Bicycle Crunches', 'Leg Raises', 'Child\'s Pose'] },
    ],
  },
  {
    slug: 'chest-arms-power',
    title: 'Chest & Arms Sculpt',
    category: 'chest',
    difficulty: 'intermediate',
    duration_days: 28,
    description: 'Develop upper body pressing strength, tricep definition, and shoulder stabilization through progressive push-up variations and calisthenics.',
    banner_color: '#f97316',
    sessions: [
      { day: 1, title: 'Chest Fundamentals', duration: 20, exercises: ['Standard Push-Ups', 'Wide Grip Push-Ups', 'Tricep Dips on Chair', 'Standard Plank', 'Child\'s Pose'] },
      { day: 2, title: 'Shoulders & Triceps Focus', duration: 22, exercises: ['Pike Push-Ups', 'Diamond Push-Ups', 'Tricep Dips on Chair', 'Mountain Climbers', 'Cobra Stretch'] },
      { day: 3, title: 'Upper Body Pump', duration: 24, exercises: ['Standard Push-Ups', 'Diamond Push-Ups', 'Wide Grip Push-Ups', 'Pike Push-Ups', 'Child\'s Pose'] },
      { day: 4, title: 'Upper Mobility & Spine', duration: 15, exercises: ['Cat-Cow Pose', 'Downward Dog', 'Cobra Stretch', 'Child\'s Pose'] },
      { day: 5, title: 'Push-Up Density Challenge', duration: 25, exercises: ['Standard Push-Ups', 'Wide Grip Push-Ups', 'Diamond Push-Ups', 'Tricep Dips on Chair', 'Child\'s Pose'] },
    ],
  },
  {
    slug: 'lower-body-glutes',
    title: 'Lower Body & Glutes Sculpt',
    category: 'legs',
    difficulty: 'intermediate',
    duration_days: 21,
    description: 'Tone legs, fire up the posterior chain, and build explosive quad and hamstring strength without needing gym barbells.',
    banner_color: '#ec4899',
    sessions: [
      { day: 1, title: 'Glute & Quad Power', duration: 20, exercises: ['Bodyweight Squats', 'Walking Lunges', 'Glute Bridges', 'Wall Sit', 'Cat-Cow Pose'] },
      { day: 2, title: 'Single-Leg Balance & Tone', duration: 22, exercises: ['Bulgarian Split Squats', 'Donkey Kicks', 'Calf Raises', 'Glute Bridges', 'Child\'s Pose'] },
      { day: 3, title: 'Plyometric Burn', duration: 24, exercises: ['Jump Squats', 'High Knees', 'Walking Lunges', 'Wall Sit', 'Downward Dog'] },
      { day: 4, title: 'Hip Mobility & Lower Stretch', duration: 16, exercises: ['Cat-Cow Pose', 'Downward Dog', 'Cobra Stretch', 'Child\'s Pose'] },
      { day: 5, title: 'Glute Hypertrophy Circuit', duration: 25, exercises: ['Donkey Kicks', 'Glute Bridges', 'Bodyweight Squats', 'Calf Raises', 'Child\'s Pose'] },
    ],
  },
  {
    slug: 'mobility-restore',
    title: 'Mobility & Morning Recovery',
    category: 'mobility',
    difficulty: 'beginner',
    duration_days: 14,
    description: 'Gentle, breath-led mobility and decompression sequences to alleviate desk stiffness, open tight hips, and enhance recovery between workouts.',
    banner_color: '#10b981',
    sessions: [
      { day: 1, title: 'Spine & Hip Flow', duration: 15, exercises: ['Cat-Cow Pose', 'Downward Dog', 'Cobra Stretch', 'Child\'s Pose'] },
      { day: 2, title: 'Hamstring & Lower Back Release', duration: 18, exercises: ['Downward Dog', 'Cobra Stretch', 'Child\'s Pose', 'Cat-Cow Pose'] },
      { day: 3, title: 'Full Body Decompression', duration: 20, exercises: ['Cat-Cow Pose', 'Cobra Stretch', 'Downward Dog', 'Child\'s Pose'] },
    ],
  },
]

// 25+ Standard Bodyweight Exercises Library
const exercisesList = [
  { name: 'Jumping Jacks', target: 'Full Body', equip: 'none', instr: 'Start standing with arms by your sides. Jump feet out while clapping hands overhead, then return to start.', tips: 'Stay light on the balls of your feet and maintain steady rhythm.', duration: 30, reps: null },
  { name: 'Standard Push-Ups', target: 'Chest & Triceps', equip: 'none', instr: 'Hands placed slightly wider than shoulders. Lower chest to floor while keeping body straight, then press back up.', tips: 'Keep core tight and avoid sagging your hips.', duration: null, reps: 12 },
  { name: 'Wide Grip Push-Ups', target: 'Chest', equip: 'none', instr: 'Place hands roughly 1.5x shoulder width. Lower chest towards the floor to emphasize outer pecs.', tips: 'Do not flare elbows excessively outward.', duration: null, reps: 10 },
  { name: 'Diamond Push-Ups', target: 'Triceps & Inner Chest', equip: 'none', instr: 'Place index fingers and thumbs together under chest forming a diamond. Lower chest towards your hands.', tips: 'Engage triceps throughout the entire pressing phase.', duration: null, reps: 8 },
  { name: 'Pike Push-Ups', target: 'Shoulders', equip: 'none', instr: 'Start in a downward dog shape with hips high. Bend elbows and lower crown of head toward the floor, then push up.', tips: 'Look towards your feet to keep neck aligned.', duration: null, reps: 10 },
  { name: 'Tricep Dips on Chair', target: 'Triceps', equip: 'chair', instr: 'Grip edge of a stable chair or bench behind you. Lower hips by bending elbows to 90 degrees, then extend arms.', tips: 'Keep your back close to the chair surface.', duration: null, reps: 12 },
  { name: 'Bodyweight Squats', target: 'Quads & Glutes', equip: 'none', instr: 'Stand with feet shoulder-width apart. Sit hips back and down until thighs are parallel to ground, then stand.', tips: 'Keep chest lifted and knees tracking over toes.', duration: null, reps: 15 },
  { name: 'Jump Squats', target: 'Quads & Plyometrics', equip: 'none', instr: 'Descend into a quarter squat, then explode upward into a vertical jump. Land softly and repeat.', tips: 'Absorb the impact smoothly through ankles and knees.', duration: null, reps: 12 },
  { name: 'Walking Lunges', target: 'Legs & Glutes', equip: 'none', instr: 'Step forward into a lunge until both knees reach 90 degrees. Push off front foot and step into the next stride.', tips: 'Keep torso upright and do not slam back knee into the ground.', duration: null, reps: 12 },
  { name: 'Bulgarian Split Squats', target: 'Quads & Glutes', equip: 'chair', instr: 'Rest rear foot on a chair or bench behind you. Lower front thigh until parallel to ground, then press up.', tips: 'Balance weight primarily through front heel.', duration: null, reps: 10 },
  { name: 'Wall Sit', target: 'Quads & Endurance', equip: 'wall', instr: 'Press back flat against a wall and slide down until thighs are parallel to ground. Hold position.', tips: 'Breathe evenly and do not rest hands on knees.', duration: 40, reps: null },
  { name: 'Glute Bridges', target: 'Glutes & Hamstrings', equip: 'none', instr: 'Lie on your back with knees bent and feet flat. Drive through heels to raise hips towards ceiling, squeezing glutes.', tips: 'Pause for 1 second at top extension.', duration: null, reps: 15 },
  { name: 'Donkey Kicks', target: 'Glutes', equip: 'none', instr: 'Start on hands and knees. Keep knee bent at 90 degrees and kick sole of foot upward towards ceiling.', tips: 'Avoid arching lower back; isolate the glute.', duration: null, reps: 15 },
  { name: 'Calf Raises', target: 'Calves', equip: 'none', instr: 'Stand tall with feet hip-width. Push onto the balls of your feet as high as possible, then lower slowly.', tips: 'Hold the peak contraction at the top for 1 second.', duration: null, reps: 20 },
  { name: 'Standard Plank', target: 'Core', equip: 'none', instr: 'Rest on forearms and toes. Maintain a straight line from crown of head to heels, bracing abdomen.', tips: 'Do not let hips pike up or drop down.', duration: 45, reps: null },
  { name: 'Side Plank', target: 'Obliques', equip: 'none', instr: 'Lie on your side propped on one elbow. Lift hips so body forms a straight diagonal line. Hold.', tips: 'Keep hips stacked vertically.', duration: 30, reps: null },
  { name: 'Mountain Climbers', target: 'Core & Cardio', equip: 'none', instr: 'From a high plank, drive knees alternately toward chest in a rapid running motion.', tips: 'Keep shoulders steady over wrists.', duration: 30, reps: null },
  { name: 'Russian Twists', target: 'Obliques', equip: 'none', instr: 'Sit on floor with knees bent and feet elevated. Rotate torso from left to right, tapping floor beside hips.', tips: 'Maintain a 45-degree backward torso lean.', duration: null, reps: 20 },
  { name: 'Bicycle Crunches', target: 'Abs & Obliques', equip: 'none', instr: 'Lie on back. Bring opposite elbow to opposite knee while extending other leg straight, alternating sides.', tips: 'Rotate with your core, not by pulling on your neck.', duration: null, reps: 20 },
  { name: 'Leg Raises', target: 'Lower Abs', equip: 'none', instr: 'Lie flat with hands under hips. Lift straight legs up to 90 degrees, then lower slowly without touching floor.', tips: 'Press lower back firmly into the floor.', duration: null, reps: 12 },
  { name: 'Flutter Kicks', target: 'Lower Abs', equip: 'none', instr: 'Lie flat, raise legs 6 inches off ground, and perform small scissor kicks with straight legs.', tips: 'Keep movements controlled and core braced.', duration: 30, reps: null },
  { name: 'High Knees', target: 'Cardio & Hip Flexors', equip: 'none', instr: 'Run in place, driving knees up to hip height while pumping arms rhythmically.', tips: 'Stay upright and maintain quick cadence.', duration: 30, reps: null },
  { name: 'Burpees', target: 'Full Body', equip: 'none', instr: 'Drop into a squat, kick feet back into a push-up, jump feet forward, and explode into a vertical jump.', tips: 'Pace your breathing during continuous reps.', duration: null, reps: 10 },
  { name: 'Cobra Stretch', target: 'Spine & Mobility', equip: 'none', instr: 'Lie face down. Place hands under shoulders and gently push up, extending arms and arching back softly.', tips: 'Relax shoulders down away from ears.', duration: 30, reps: null },
  { name: 'Cat-Cow Pose', target: 'Spine Mobility', equip: 'none', instr: 'On all fours, inhale while arching back (Cow), then exhale while rounding spine up (Cat).', tips: 'Sync movement directly with slow, deep breaths.', duration: 40, reps: null },
  { name: 'Downward Dog', target: 'Hamstrings & Shoulders', equip: 'none', instr: 'Form an inverted V-shape, pressing heels toward ground and chest toward thighs.', tips: 'Pedal heels gently to stretch calf muscles.', duration: 30, reps: null },
  { name: 'Child\'s Pose', target: 'Back & Hip Recovery', equip: 'none', instr: 'Kneel with big toes touching, sit hips onto heels, and extend arms forward on the floor.', tips: 'Breathe deeply into your lower abdomen.', duration: 45, reps: null },
]

async function seed() {
  if (!pool) {
    console.error('DATABASE_URL must be configured before running database seed.')
    process.exitCode = 1
    return
  }

  let client

  try {
    client = await pool.connect()
    await client.query('BEGIN')

    // Natural names are used for idempotency because the initial schema uses
    // generated numeric IDs and does not add unique keys to content tables.
    for (const coach of coaches) {
      await client.query(
        `INSERT INTO coaches (name, specialty, bio, image_url)
         SELECT $1::varchar, $2::varchar, $3::text, $4::varchar
         WHERE NOT EXISTS (SELECT 1 FROM coaches WHERE name = $1::varchar)`,
        [coach.name, coach.specialty, coach.bio, coach.imageUrl],
      )
    }

    for (const classRecord of classes) {
      const [time, name, category, focus, duration, coachName] = classRecord
      await client.query(
        `INSERT INTO classes (time, name, category, focus, duration, coach_id)
         SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::varchar, coaches.id
         FROM coaches
         WHERE coaches.name = $6::varchar
           AND NOT EXISTS (SELECT 1 FROM classes WHERE name = $2::varchar)`,
        [time, name, category, focus, duration, coachName],
      )
    }

    for (const membership of memberships) {
      const [label, title, price, suffix, description, perks, featured] = membership
      await client.query(
        `INSERT INTO memberships (label, title, price, suffix, description, perks, featured)
         SELECT $1::varchar, $2::varchar, $3::varchar, $4::varchar, $5::text, $6::jsonb, $7::boolean
         WHERE NOT EXISTS (SELECT 1 FROM memberships WHERE label = $1::varchar)`,
        [label, title, price, suffix, description, JSON.stringify(perks), featured],
      )
    }

    // Seed Exercise Library
    for (const ex of exercisesList) {
      await client.query(
        `INSERT INTO exercises (name, target_muscle, equipment, instructions, tips, default_duration_seconds, default_reps)
         SELECT $1::varchar, $2::varchar, $3::varchar, $4::text, $5::text, $6::integer, $7::integer
         WHERE NOT EXISTS (SELECT 1 FROM exercises WHERE name = $1::varchar)`,
        [ex.name, ex.target, ex.equip, ex.instr, ex.tips, ex.duration, ex.reps],
      )
    }

    const exRes = await client.query('SELECT id, name, default_reps, default_duration_seconds FROM exercises')
    const exerciseMap = new Map()
    for (const row of exRes.rows) {
      exerciseMap.set(row.name, row)
    }

    // Seed Training Programs, Sessions, and Session Exercises
    for (const prog of programs) {
      const progRes = await client.query(
        `INSERT INTO training_programs (slug, title, category, difficulty, duration_days, description, banner_color)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (slug) DO UPDATE
         SET title = EXCLUDED.title,
             category = EXCLUDED.category,
             difficulty = EXCLUDED.difficulty,
             duration_days = EXCLUDED.duration_days,
             description = EXCLUDED.description,
             banner_color = EXCLUDED.banner_color
         RETURNING id`,
        [prog.slug, prog.title, prog.category, prog.difficulty, prog.duration_days, prog.description, prog.banner_color],
      )
      const programId = progRes.rows[0].id

      for (const session of prog.sessions) {
        const sessionRes = await client.query(
          `INSERT INTO program_sessions (program_id, day_number, title, estimated_duration_min)
           VALUES ($1, $2, $3, $4)
           ON CONFLICT (program_id, day_number) DO UPDATE
           SET title = EXCLUDED.title,
               estimated_duration_min = EXCLUDED.estimated_duration_min
           RETURNING id`,
          [programId, session.day, session.title, session.duration],
        )
        const sessionId = sessionRes.rows[0].id

        await client.query('DELETE FROM session_exercises WHERE session_id = $1', [sessionId])

        let order = 1
        for (const exName of session.exercises) {
          const exercise = exerciseMap.get(exName)
          if (exercise) {
            await client.query(
              `INSERT INTO session_exercises (session_id, exercise_id, sort_order, reps, duration_seconds, rest_after_seconds)
               VALUES ($1, $2, $3, $4, $5, 30)`,
              [sessionId, exercise.id, order++, exercise.default_reps, exercise.default_duration_seconds],
            )
          }
        }
      }
    }

    await client.query('COMMIT')
    console.info('Studio and training program seed data inserted successfully.')
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