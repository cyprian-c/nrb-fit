import { Pool } from 'pg'
import dotenv from 'dotenv'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: path.resolve(__dirname, '../../.env') })
dotenv.config({ path: path.resolve(__dirname, '../.env') })

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

async function seed() {
  const client = await pool.connect()
  
  try {
    console.log('Starting database seeding...')
    await client.query('BEGIN')
    
    // 1. Seed users
    console.log('Seeding users...')
    const usersData = [
      { full_name: 'Admin User', email: 'admin@nrbfit.com', password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qV6.x1qG8YqOZe', role: 'admin' },
      { full_name: 'Coach Peter', email: 'peter@nrbfit.com', password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qV6.x1qG8YqOZe', role: 'coach' },
      { full_name: 'Coach Sarah', email: 'sarah@nrbfit.com', password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qV6.x1qG8YqOZe', role: 'coach' },
      { full_name: 'Member John', email: 'john@example.com', password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qV6.x1qG8YqOZe', role: 'member' },
      { full_name: 'Member Jane', email: 'jane@example.com', password_hash: '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/X4.qV6.x1qG8YqOZe', role: 'member' }
    ]
    
    for (const user of usersData) {
      await client.query(
        'INSERT INTO users (full_name, email, password_hash, role) VALUES ($1, $2, $3, $4) ON CONFLICT (email) DO NOTHING',
        [user.full_name, user.email, user.password_hash, user.role]
      )
    }
    console.log('  Created users')

    // 2. Seed coaches
    console.log('Seeding coaches...')
    const coachesData = [
      { name: 'Peter Mwangi', specialty: 'Strength and Hypertrophy', bio: 'Certified strength coach with 8+ years experience.', image_url: 'https://example.com/images/peter.jpg' },
      { name: 'Sarah Wanjiru', specialty: 'Functional Fitness and Mobility', bio: 'Specializes in movement quality and injury prevention.', image_url: 'https://example.com/images/sarah.jpg' },
      { name: 'David Onyango', specialty: 'Boxing and Combat Sports', bio: 'Former national boxing coach.', image_url: 'https://example.com/images/david.jpg' },
      { name: 'Grace Chebet', specialty: 'Yoga and Flexibility', bio: 'Yoga instructor with holistic approach.', image_url: 'https://example.com/images/grace.jpg' },
      { name: 'Michael Kimathi', specialty: 'Nutrition and Recovery', bio: 'Sports nutritionist and recovery specialist.', image_url: 'https://example.com/images/michael.jpg' }
    ]
    
    for (const coach of coachesData) {
      await client.query(
        'INSERT INTO coaches (name, specialty, bio, image_url) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [coach.name, coach.specialty, coach.bio, coach.image_url]
      )
    }
    console.log('  Created coaches')

    // 3. Seed memberships
    console.log('Seeding memberships...')
    const membershipsData = [
      { label: 'Monthly', title: 'Standard Access', price: 'KSH 5000', description: 'Full access to gym', perks: '["gym_access": true]', featured: true, sort_order: 1 },
      { label: 'Monthly', title: 'Premium Access', price: 'KSH 8500', description: 'Plus PT sessions', perks: '["gym_access": true, "pt_sessions": 2]', featured: true, sort_order: 2 },
      { label: 'Quarterly', title: 'Value Plan', price: 'KSH 13500', description: 'Save 10%', perks: '["gym_access": true]', featured: true, sort_order: 3 }
    ]
    
    for (const mem of membershipsData) {
      await client.query(
        'INSERT INTO memberships (label, title, price, description, perks, featured, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT DO NOTHING',
        [mem.label, mem.title, mem.price, mem.description, mem.perks, mem.featured, mem.sort_order]
      )
    }
    console.log('  Created memberships')

    // 4. Seed classes
    console.log('Seeding classes...')
    const classesData = [
      { time: '05:45', name: 'Morning Yoga Flow', category: 'Morning', focus: 'Flexibility', duration: 60, coach_id: 4 },
      { time: '06:30', name: 'Sunrise HIIT', category: 'Morning', focus: 'Cardio', duration: 45, coach_id: 1 },
      { time: '07:15', name: 'Strength Circuit', category: 'Morning', focus: 'Strength', duration: 45, coach_id: 1 },
      { time: '17:00', name: 'Boxing Fundamentals', category: 'Evening', focus: 'Cardio', duration: 60, coach_id: 3 },
      { time: '18:00', name: 'Power Lifting', category: 'Evening', focus: 'Strength', duration: 75, coach_id: 1 }
    ]
    
    for (const cls of classesData) {
      await client.query(
        'INSERT INTO classes (time, name, category, focus, duration, coach_id) VALUES ($1, $2, $3, $4, $5, $6) ON CONFLICT DO NOTHING',
        [cls.time, cls.name, cls.category, cls.focus, cls.duration, cls.coach_id]
      )
    }
    console.log('  Created classes')

    // 5. Seed exercises
    console.log('Seeding exercises...')
    const exercisesData = [
      ['Push-ups', 'Chest', 'dumbbells', 'Keep elbows tucked, lower to chest, push through palms'],
      ['Pull-ups', 'Back', 'pull-up bar', 'Full extension, engage lats, pull chest to bar'],
      ['Squat', 'Legs', 'barbell', 'Goblet or barbell squat, feet shoulder width'],
      ['Deadlift', 'Back', 'barbell', 'Hip hinge, neutral spine, lift with legs'],
      ['Plank', 'Core', 'mat', 'Elbow under shoulders, body straight line'],
      ['Mountain Climbers', 'Cardio', 'mat', 'High knee drive, fast tempo'],
      ['Lunges', 'Legs', 'dumbbells', 'Walking or stationary, knee behind toe'],
      ['Bent-over Row', 'Back', 'dumbbells', 'Chest up, pull to rib cage'],
      ['Overhead Press', 'Shoulders', 'dumbbells', 'Seated or standing, feet planted'],
      ['Burpees', 'Cardio', 'none', 'Full body power movement'],
      ['Russian Twists', 'Core', 'mat', 'Seated, feet on ground or elevated'],
      ['Leg Raises', 'Core', 'mat', 'Hang or lying, lower to tabletop'],
      ['Bicep Curls', 'Arms', 'dumbbells', 'Elbows fixed, rotate palms up'],
      ['Tricep Dips', 'Arms', 'bench', 'Shoulders over wrists, lean forward'],
      ['Hip Thrust', 'Glutes', 'bench', 'Upper back on surface, drive hips up'],
      ['Skater Jumps', 'Cardio', 'none', 'Side-to-side leg strength, balance']
    ]
    
    for (const ex of exercisesData) {
      await client.query(
        'INSERT INTO exercises (name, target_muscle, equipment, instructions) VALUES ($1, $2, $3, $4) ON CONFLICT (name) DO NOTHING',
        [ex[0], ex[1], ex[2], ex[3]]
      )
    }
    console.log('  Created exercises')

    // 6. Seed training programs
    console.log('Seeding training programs...')
    const programsData = [
      { slug: 'beginner-strength', title: 'Beginner Strength Program', category: 'Strength', difficulty: 'Beginner', duration_days: 28, description: 'Perfect for beginners...', banner_color: '#3b82f6' },
      { slug: 'intermediate-hypertrophy', title: 'Hypertrophy Builder', category: 'Strength', difficulty: 'Intermediate', duration_days: 12, description: 'Target muscle growth...', banner_color: '#ef4444' },
      { slug: 'mobility-flow', title: 'Daily Mobility Flow', category: 'Wellness', difficulty: 'Beginner', duration_days: 30, description: 'Daily mobility routine...', banner_color: '#8b5cf6' }
    ]
    
    for (const prog of programsData) {
      await client.query(
        'INSERT INTO training_programs (slug, title, category, difficulty, duration_days, description, banner_color) VALUES ($1, $2, $3, $4, $5, $6, $7) ON CONFLICT (slug) DO NOTHING',
        [prog.slug, prog.title, prog.category, prog.difficulty, prog.duration_days, prog.description, prog.banner_color]
      )
    }
    console.log('  Created training programs')

    // 7. Seed program sessions
    console.log('Seeding program sessions...')
    const daysData = [
      { program_id: 1, day_number: 1, title: 'Day 1: Foundation', estimated_duration_min: 25 },
      { program_id: 1, day_number: 2, title: 'Day 2: Push Focus', estimated_duration_min: 25 },
      { program_id: 1, day_number: 3, title: 'Day 3: Pull Focus', estimated_duration_min: 25 },
      { program_id: 1, day_number: 4, title: 'Day 4: Legs', estimated_duration_min: 25 },
      { program_id: 1, day_number: 5, title: 'Day 5: Full Body Review', estimated_duration_min: 30 },
      { program_id: 1, day_number: 6, title: 'Day 6: Core Blast', estimated_duration_min: 25 },
      { program_id: 1, day_number: 7, title: 'Day 7: Rest and Mobility', estimated_duration_min: 20 }
    ]
    
    for (const day of daysData) {
      await client.query(
        'INSERT INTO program_sessions (program_id, day_number, title, estimated_duration_min) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
        [day.program_id, day.day_number, day.title, day.estimated_duration_min]
      )
    }
    console.log('  Created program sessions')

    // 8. Seed user enrollments for demo
    console.log('Seeding user enrollments...')
    await client.query(
      'INSERT INTO user_enrollments (user_id, program_id, status, current_day) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [4, 1, 'active', 1]
    )
    await client.query(
      'INSERT INTO user_enrollments (user_id, program_id, status, current_day) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [5, 3, 'active', 1]
    )
    console.log('  Created user enrollments')

    await client.query('COMMIT')
    console.log('Database seeding completed successfully!')
    
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('Seeding failed:', error)
    process.exit(1)
  } finally {
    client.release()
    await pool.end()
  }
}

if (import.meta.url === \`file://\${process.argv[1]}\`) {
  seed()
}

export { seed }
