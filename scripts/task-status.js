#!/usr/bin/env node

/**
 * NRBFIT - Phase & Task Completion Tracker
 *
 * This script provides a live terminal dashboard displaying:
 * 1. Markdown task completion status from task.md
 * 2. Cross-referenced Git commits matching the 30 target phase commit messages
 * 3. Overall completion percentage and progress bar
 * 4. Current active phase and next steps
 *
 * Usage:
 *   node scripts/task-status.js
 *   node scripts/task-status.js --sync  (automatically checks boxes in task.md if git commit exists)
 */

import fs from 'node:fs'
import path from 'node:path'
import process from 'node:process'
import { execSync } from 'node:child_process'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const rootDir = path.resolve(__dirname, '..')
const taskFile = path.join(rootDir, 'task.md')

// Terminal color codes
const colors = {
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  red: '\x1b[31m',
  gray: '\x1b[90m',
  bgDark: '\x1b[40m',
}

// Fetch git commits list
function getGitCommits() {
  try {
    const output = execSync('git log --pretty=format:"%h||%s" -n 100', {
      cwd: rootDir,
      stdio: ['pipe', 'pipe', 'ignore'],
    }).toString().trim()

    if (!output) return []
    return output.split('\n').map((line) => {
      const [hash, ...rest] = line.split('||')
      return { hash, subject: rest.join('||').trim() }
    })
  } catch {
    return []
  }
}

// Parse phases from task.md
function parseTaskFile() {
  if (!fs.existsSync(taskFile)) {
    console.error(`${colors.red}Error: task.md not found at ${taskFile}${colors.reset}`)
    process.exit(1)
  }

  const content = fs.readFileSync(taskFile, 'utf-8')
  const phaseRegex = /## Phase\s+(\d+):\s+([^\n]+)[\s\S]*?- \*\*Commit Message\*\*:\s*`([^`]+)`[\s\S]*?- \*\*Tasks\*\*:([\s\S]*?)(?=(?:## Phase|$))/g

  const phases = []
  let match

  while ((match = phaseRegex.exec(content)) !== null) {
    const num = parseInt(match[1], 10)
    const title = match[2].trim()
    const commitMsg = match[3].trim()
    const taskBlock = match[4]

    // Count tasks and checkboxes
    const taskLines = taskBlock
      .split('\n')
      .map((l) => l.trim())
      .filter((l) => l.startsWith('- [ ]') || l.startsWith('- [x]') || /^\d+\./.test(l))

    const completedTasks = taskBlock
      .split('\n')
      .filter((l) => l.trim().startsWith('- [x]')).length

    phases.push({
      number: num,
      title,
      commitMessage: commitMsg,
      totalTasks: taskLines.length,
      completedTasks,
      isMarkedDone: completedTasks > 0 && completedTasks === taskLines.length,
    })
  }

  return { phases, content }
}

function renderProgressBar(completed, total, width = 24) {
  const percent = total > 0 ? (completed / total) : 0
  const filled = Math.round(percent * width)
  const empty = width - filled
  const bar = '█'.repeat(filled) + '░'.repeat(empty)
  return `${colors.green}${bar}${colors.reset} ${Math.round(percent * 100)}%`
}

function run() {
  const shouldSync = process.argv.includes('--sync')
  const { phases, content } = parseTaskFile()
  const commits = getGitCommits()

  console.log(`\n${colors.bold}${colors.cyan}====================================================${colors.reset}`)
  console.log(`${colors.bold}   NRBFIT — 30-PHASE FULL-STACK PROGRESS TRACKER    ${colors.reset}`)
  console.log(`${colors.bold}${colors.cyan}====================================================${colors.reset}\n`)

  let completedPhasesCount = 0
  let currentActivePhase = null
  let updatedContent = content

  const rows = phases.map((phase) => {
    // Check if git commit exists
    const matchingCommit = commits.find((c) =>
      c.subject.toLowerCase() === phase.commitMessage.toLowerCase() ||
      c.subject.toLowerCase().startsWith(phase.commitMessage.toLowerCase())
    )

    const isCommitted = Boolean(matchingCommit)
    const isCompleted = isCommitted || phase.isMarkedDone

    if (isCompleted) {
      completedPhasesCount++
    } else if (!currentActivePhase) {
      currentActivePhase = phase
    }

    // Auto sync task.md checkboxes if --sync passed and commit exists
    if (shouldSync && isCommitted && !phase.isMarkedDone) {
      // Find the phase block in content and replace [ ] with [x]
      const phaseHeader = `## Phase ${String(phase.number).padStart(2, '0')}:`
      const phaseIdx = updatedContent.indexOf(phaseHeader)
      if (phaseIdx !== -1) {
        const nextPhaseIdx = updatedContent.indexOf('## Phase', phaseIdx + phaseHeader.length)
        const blockEnd = nextPhaseIdx !== -1 ? nextPhaseIdx : updatedContent.length
        const originalBlock = updatedContent.substring(phaseIdx, blockEnd)
        const updatedBlock = originalBlock.replace(/- \[ \]/g, '- [x]')
        updatedContent = updatedContent.substring(0, phaseIdx) + updatedBlock + updatedContent.substring(blockEnd)
      }
    }

    const numStr = String(phase.number).padStart(2, '0')
    let statusBadge
    let commitBadge

    if (isCompleted) {
      statusBadge = `${colors.green}✔ DONE  ${colors.reset}`
      commitBadge = matchingCommit
        ? `${colors.dim}(commit: ${matchingCommit.hash})${colors.reset}`
        : `${colors.dim}(marked done)${colors.reset}`
    } else if (currentActivePhase && currentActivePhase.number === phase.number) {
      statusBadge = `${colors.yellow}▶ ACTIVE${colors.reset}`
      commitBadge = `${colors.yellow}pending commit${colors.reset}`
    } else {
      statusBadge = `${colors.gray}○ PENDING${colors.reset}`
      commitBadge = `${colors.gray}pending${colors.reset}`
    }

    return {
      numStr,
      title: phase.title.length > 40 ? phase.title.substring(0, 37) + '...' : phase.title,
      statusBadge,
      commitBadge,
    }
  })

  // Display summary stats
  console.log(`  Completed Phases : ${colors.bold}${completedPhasesCount} / ${phases.length}${colors.reset}`)
  console.log(`  Overall Progress : ${renderProgressBar(completedPhasesCount, phases.length, 30)}\n`)

  if (currentActivePhase) {
    console.log(`  ${colors.bold}Current Target   : ${colors.yellow}Phase ${String(currentActivePhase.number).padStart(2, '0')}: ${currentActivePhase.title}${colors.reset}`)
    console.log(`  ${colors.bold}Expected Commit  : ${colors.cyan}${currentActivePhase.commitMessage}${colors.reset}\n`)
  } else {
    console.log(`  ${colors.bold}${colors.green}All 30 phases complete! Ready for final assessment.${colors.reset}\n`)
  }

  // Display phase list
  console.log(`${colors.dim}  ----------------------------------------------------------------------------------${colors.reset}`)
  console.log(`  ${colors.bold}Phase   Status     Title                                     Git Commit${colors.reset}`)
  console.log(`${colors.dim}  ----------------------------------------------------------------------------------${colors.reset}`)

  rows.forEach((r) => {
    const padTitle = r.title.padEnd(41, ' ')
    console.log(`  Phase ${r.numStr} ${r.statusBadge}  ${padTitle} ${r.commitBadge}`)
  })

  console.log(`${colors.dim}  ----------------------------------------------------------------------------------${colors.reset}\n`)

  if (shouldSync && updatedContent !== content) {
    fs.writeFileSync(taskFile, updatedContent, 'utf-8')
    console.log(`${colors.green}✔ Updated task.md checkmarks to match Git commit history.${colors.reset}\n`)
  }

  console.log(`${colors.dim}To run anytime: npm run tasks${colors.reset}`)
  console.log(`${colors.dim}To sync checkmarks with git: npm run tasks:sync${colors.reset}\n`)
}

run()
