import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Message, NoWayOutState, Rotation } from './types.js'
import { message } from './utils/message.js'
import { getWalls } from './utils/walls.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'

type Point = { x: number; y: number }
type Maze = number[][]

let maze: Maze
let start: Point
let end: Point

interface BaseState {
  player: {
    position: Point
    rotation: number
  }
  moves: number
  timer: number
  start: Point
  startRotation: number
  target: Point
  maze: number[][]
  rows: number
  columns: number
}

interface Level {
  entityId: string
  baseState: string // Tämä on JSON-merkkijono, joka sisältää BaseState-rakenteen
  name: string
  gameType: string
  ordinal: number
}

async function fetchMaze(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching maze: ${response.statusText}`)
    }
    const levels = (await response.json()) as Level[]
    const levelData = levels.find((level) => level.entityId === process.env['LEVEL_ID'])
    const baseState: BaseState = JSON.parse(levelData.baseState)
    const maze: Maze = baseState.maze
    return maze
  } catch (error) {
    console.error(error)
    return null // Tai palauta oletuslabyrintti virhetilanteessa
  }
}

async function fetchTarget(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching maze: ${response.statusText}`)
    }
    const levels = (await response.json()) as Level[]
    const levelData = levels.find((level) => level.entityId === process.env['LEVEL_ID'])
    const baseState: BaseState = JSON.parse(levelData.baseState)
    const end: Point = baseState.target
    return end
  } catch (error) {
    console.error(error)
    return null // Tai palauta oletuslabyrintti virhetilanteessa
  }
}

async function fetchStart(url) {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching maze: ${response.statusText}`)
    }
    const levels = (await response.json()) as Level[]
    const levelData = levels.find((level) => level.entityId === process.env['LEVEL_ID'])
    const baseState: BaseState = JSON.parse(levelData.baseState)
    const start: Point = baseState.start
    return start
  } catch (error) {
    console.error(error)
    return null // Tai palauta oletuslabyrintti virhetilanteessa
  }
}

maze = await fetchMaze(`https://goldrush.monad.fi/backend/api/levels`)
start = await fetchStart(`https://goldrush.monad.fi/backend/api/levels`)
end = await fetchTarget(`https://goldrush.monad.fi/backend/api/levels`)

// const start: Point = { x: 0, y: 0 }
// const end: Point = { x: 9, y: 7 }

const canMove: (from: Point, to: Point, maze: Maze) => boolean = (from, to, maze) => {
  const wall = maze[from.y][from.x]
  if (to.x < 0 || to.x >= maze[0].length || to.y < 0 || to.y >= maze.length) {
    return false
  }
  const nextWall = maze[to.y][to.x]

  let erikoisTapausAlaVaaka = false
  let erikoisTapausYlaVaaka = false
  let erikoisTapausVasenPysty = false
  let erikoisTapausOikeaPysty = false

  if (
    (wall === 2 ||
      wall === 3 ||
      wall === 6 ||
      wall === 7 ||
      wall === 10 ||
      wall === 11 ||
      wall === 14 ||
      wall === 15) &&
    (nextWall === 8 ||
      nextWall === 9 ||
      nextWall === 10 ||
      nextWall === 11 ||
      nextWall === 12 ||
      nextWall === 13 ||
      nextWall === 14 ||
      nextWall === 15)
  ) {
    erikoisTapausAlaVaaka = true
  }

  if (
    (nextWall === 2 ||
      nextWall === 3 ||
      nextWall === 6 ||
      nextWall === 7 ||
      nextWall === 10 ||
      nextWall === 11 ||
      nextWall === 14 ||
      nextWall === 15) &&
    (wall === 8 || wall === 9 || wall === 10 || wall === 11 || wall === 12 || wall === 13 || wall === 14 || wall === 15)
  ) {
    erikoisTapausYlaVaaka = true
  }

  if (
    (wall === 1 || wall === 3 || wall === 5 || wall === 7 || wall === 9 || wall === 11 || wall === 13 || wall === 15) &&
    (nextWall === 4 ||
      nextWall === 5 ||
      nextWall === 6 ||
      nextWall === 7 ||
      nextWall === 12 ||
      nextWall === 13 ||
      nextWall === 14 ||
      nextWall === 15)
  ) {
    erikoisTapausVasenPysty = true
  }

  if (
    (nextWall === 1 ||
      nextWall === 3 ||
      nextWall === 5 ||
      nextWall === 7 ||
      nextWall === 9 ||
      nextWall === 11 ||
      nextWall === 13 ||
      nextWall === 15) &&
    (wall === 4 || wall === 5 || wall === 6 || wall === 7 || wall === 12 || wall === 13 || wall === 14 || wall === 15)
  ) {
    erikoisTapausOikeaPysty = true
  }

  if (
    to.x > from.x &&
    to.y === from.y &&
    (wall === 4 || wall === 5 || wall === 6 || wall === 7 || wall === 12 || wall === 13 || wall === 14 || wall === 15)
  ) {
    return false
  }
  if (
    to.x > from.x &&
    to.y > from.y &&
    (wall === 6 ||
      wall === 7 ||
      wall === 14 ||
      wall === 15 ||
      nextWall === 9 ||
      nextWall === 11 ||
      nextWall === 13 ||
      nextWall === 15 ||
      erikoisTapausAlaVaaka === true ||
      erikoisTapausOikeaPysty === true)
  ) {
    return false
  }
  if (
    to.x < from.x &&
    to.y === from.y &&
    (wall === 1 || wall === 3 || wall === 5 || wall === 7 || wall === 9 || wall === 11 || wall === 13 || wall === 15)
  ) {
    return false
  } // Vasen seinä kohteessa
  if (
    to.x > from.x &&
    to.y < from.y &&
    (wall === 12 ||
      wall === 13 ||
      wall === 14 ||
      wall === 15 ||
      nextWall === 3 ||
      nextWall === 7 ||
      nextWall === 11 ||
      nextWall === 15 ||
      erikoisTapausYlaVaaka === true ||
      erikoisTapausOikeaPysty === true)
  ) {
    return false
  }
  if (
    to.y < from.y &&
    to.x === from.x &&
    (wall === 8 || wall === 9 || wall === 10 || wall === 11 || wall === 12 || wall === 13 || wall === 14 || wall === 15)
  ) {
    return false
  } // Yläseinä
  if (
    to.x < from.x &&
    to.y < from.y &&
    (wall === 9 ||
      wall === 11 ||
      wall === 13 ||
      wall === 15 ||
      nextWall === 6 ||
      nextWall === 7 ||
      nextWall === 14 ||
      nextWall === 15 ||
      erikoisTapausYlaVaaka === true ||
      erikoisTapausVasenPysty === true)
  ) {
    return false
  }
  if (
    to.y > from.y &&
    to.x === from.x &&
    (wall === 2 || wall === 3 || wall === 6 || wall === 7 || wall === 10 || wall === 11 || wall === 14 || wall === 15)
  ) {
    return false
  } // Alaseinä
  if (
    to.x < from.x &&
    to.y > from.y &&
    (wall === 3 ||
      wall === 7 ||
      wall === 11 ||
      wall === 15 ||
      nextWall === 12 ||
      nextWall === 13 ||
      nextWall === 14 ||
      nextWall === 15 ||
      erikoisTapausAlaVaaka === true ||
      erikoisTapausVasenPysty === true)
  ) {
    return false
  }

  // if (to.x > from.x && (wall & 2) > 0) return false // Oikea seinä
  // if (to.x < from.x && (maze[to.y][to.x] & 8) > 0) return false // Vasen seinä kohteessa
  // if (to.y > from.y && (wall & 4) > 0) return false // Alaseinä
  // if (to.y < from.y && (maze[to.y][to.x] & 1) > 0) return false // Yläseinä kohteessa

  return true
}

interface PointWithDirection extends Point {
  direction: string
  turns: number
  steps: number
  parent: PointWithDirection | null
}

const bfs = (start: Point, end: Point, maze: number[][]): Point[] | null => {
  let queue: PointWithDirection[] = [{ ...start, direction: '', turns: 0, steps: 0, parent: null }]
  let visited = new Map<string, number>() // Avaimena pisteen koordinaatit, arvona pienin löydettyjen käännösten määrä
  let bestPath: Point[] = []
  let bestScore = Infinity

  visited.set(`${start.x},${start.y}`, 0)

  while (queue.length > 0) {
    const current = queue.shift()!
    const currentKey = `${current.x},${current.y}`

    if (current.x === end.x && current.y === end.y) {
      let score = current.turns + current.steps
      if (score < bestScore) {
        bestScore = score
        bestPath = []
        let at = current
        while (at) {
          bestPath.unshift({ x: at.x, y: at.y })
          at = at.parent
        }
      }
      continue
    }

    const directions = [
      { dx: 1, dy: 0, direction: 'right' },
      { dx: -1, dy: 0, direction: 'left' },
      { dx: 0, dy: 1, direction: 'down' },
      { dx: 0, dy: -1, direction: 'up' },
      { dx: 1, dy: 1, direction: 'down-right' },
      { dx: 1, dy: -1, direction: 'up-right' },
      { dx: -1, dy: -1, direction: 'up-left' },
      { dx: -1, dy: 1, direction: 'down-left' },
    ]

    for (const { dx, dy, direction } of directions) {
      const nextPoint = { x: current.x + dx, y: current.y + dy }
      const nextKey = `${nextPoint.x},${nextPoint.y}`
      const newTurns = current.direction !== direction ? current.turns + 1 : current.turns
      const newSteps = current.steps + 1
      const newScore = newTurns + newSteps

      if (canMove(current, nextPoint, maze)) {
        const existingScore = visited.get(nextKey)
        if (existingScore === undefined || newScore < existingScore) {
          visited.set(nextKey, newScore)
          queue.push({
            ...nextPoint,
            direction,
            turns: newTurns,
            steps: newSteps,
            parent: current,
          })
        }
      }
    }
  }

  return bestPath.length > 0 ? bestPath : null
}

function maaritaSuunta(seuraavaPiste: Point, nykyinenPiste: Point): Rotation | null {
  if (seuraavaPiste.x > nykyinenPiste.x && seuraavaPiste.y === nykyinenPiste.y) {
    return 90
  } else if (seuraavaPiste.x < nykyinenPiste.x && seuraavaPiste.y === nykyinenPiste.y) {
    return 270
  } else if (seuraavaPiste.y > nykyinenPiste.y && seuraavaPiste.x === nykyinenPiste.x) {
    return 180
  } else if (seuraavaPiste.y < nykyinenPiste.y && seuraavaPiste.x === nykyinenPiste.x) {
    return 0
  } else if (seuraavaPiste.x > nykyinenPiste.x && seuraavaPiste.y < nykyinenPiste.y) {
    return 45
  } else if (seuraavaPiste.x > nykyinenPiste.x && seuraavaPiste.y > nykyinenPiste.y) {
    return 135
  } else if (seuraavaPiste.x < nykyinenPiste.x && seuraavaPiste.y > nykyinenPiste.y) {
    return 225
  } else if (seuraavaPiste.x < nykyinenPiste.x && seuraavaPiste.y < nykyinenPiste.y) {
    return 315
  }
  return null
}

const path = bfs(start, end, maze)
let x = 1
let liike = false
let nykyinenSuunta: Rotation | null = null

// Change this to your own implementation
const generateAction: (gameState: NoWayOutState) => Action = (gameState) => {
  const { player, square } = gameState

  const haluttuSuunta: Rotation | null = maaritaSuunta(path[x], path[x - 1])

  if (x === 1) {
    player.position = start
  }

  if (nykyinenSuunta === haluttuSuunta) {
    liike = true
  }
  // Lyhin reitti löydetty, määritellään seuraava toiminto reitin perusteella
  if (!liike) {
    liike = true
    const nextPoint = path[x]
    nykyinenSuunta = haluttuSuunta

    if (nextPoint.x > player.position.x && nextPoint.y === player.position.y) {
      return { action: 'rotate', rotation: 90 }
    } else if (nextPoint.x < player.position.x && nextPoint.y === player.position.y) {
      return { action: 'rotate', rotation: 270 }
    } else if (nextPoint.y > player.position.y && nextPoint.x === player.position.x) {
      return { action: 'rotate', rotation: 180 }
    } else if (nextPoint.y < player.position.y && nextPoint.x === player.position.x) {
      return { action: 'rotate', rotation: 0 }
    } else if (nextPoint.x > player.position.x && nextPoint.y < player.position.y) {
      return { action: 'rotate', rotation: 45 }
    } else if (nextPoint.x > player.position.x && nextPoint.y > player.position.y) {
      return { action: 'rotate', rotation: 135 }
    } else if (nextPoint.x < player.position.x && nextPoint.y > player.position.y) {
      return { action: 'rotate', rotation: 225 }
    } else if (nextPoint.x < player.position.x && nextPoint.y < player.position.y) {
      return { action: 'rotate', rotation: 315 }
    }
  } else {
    liike = false
    x += 1
    return { action: 'move' }
  }
}

// Oletustoiminto, jos mikään muu ei toteudu

const createGame = async (levelId: string, token: string) => {
  const res = await fetch(`https://${backend_base}/api/levels/${levelId}`, {
    method: 'POST',
    headers: {
      Authorization: token,
    },
  })

  if (!res.ok) {
    console.error(`Couldn't create game: ${res.statusText} - ${await res.text()}`)
    return null
  }

  return res.json() as any as GameInstance // Can be made safer
}

const main = async () => {
  const token = process.env['PLAYER_TOKEN'] ?? ''
  const levelId = process.env['LEVEL_ID'] ?? ''

  const game = await createGame(levelId, token)
  if (!game) return

  const url = `https://${frontend_base}/?id=${game.entityId}`
  console.log(`Game at ${url}`)
  await open(url) // Remove this if you don't want to open the game in browser

  await new Promise((f) => setTimeout(f, 2000))
  const ws = new WebSocket(`wss://${backend_base}/${token}/`)

  ws.addEventListener('open', () => {
    ws.send(message('sub-game', { id: game.entityId }))
  })

  ws.addEventListener('message', ({ data }) => {
    const [action, payload] = JSON.parse(data.toString()) as Message<'game-instance'>

    if (action !== 'game-instance') {
      console.log([action, payload])
      return
    }

    // New game tick arrived!
    const gameState = JSON.parse(payload['gameState']) as NoWayOutState
    const commands = generateAction(gameState)

    setTimeout(() => {
      ws.send(message('run-command', { gameId: game.entityId, payload: commands }))
    }, 100)
  })
}

await main()
