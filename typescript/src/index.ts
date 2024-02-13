import 'dotenv/config'
import fetch from 'node-fetch'
import open from 'open'
import WebSocket from 'ws'
import { Action, GameInstance, Message, NoWayOutState, Rotation, Point, Maze, Level, BaseState } from './types.js'
import { message } from './utils/message.js'
import bfs from './components/bfsAlgoritmi.js'
import maaritaSuunta from './components/direction.js'

const frontend_base = 'goldrush.monad.fi'
const backend_base = 'goldrush.monad.fi/backend'

let maze: Maze
let start: Point
let end: Point

const fetchMaze = async (url: string): Promise<Maze | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching maze: ${response.statusText}`)
    }
    const levels = (await response.json()) as Level[]
    const levelData = levels.find((level) => level.entityId === process.env['LEVEL_ID'])
    if (!levelData) {
      throw new Error('Level data not found')
    }
    const baseState: BaseState = JSON.parse(levelData.baseState)
    const maze: Maze = baseState.maze
    return maze
  } catch (error) {
    console.error(error)
    return null
  }
}

const fetchTarget = async (url: string): Promise<Point | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching target: ${response.statusText}`)
    }
    const levels = (await response.json()) as Level[]
    const levelData = levels.find((level) => level.entityId === process.env['LEVEL_ID'])
    if (!levelData) {
      throw new Error('Level data not found')
    }
    const baseState: BaseState = JSON.parse(levelData.baseState)
    const end: Point = baseState.target
    return end
  } catch (error) {
    console.error(error)
    return null
  }
}

const fetchStart = async (url: string): Promise<Point | null> => {
  try {
    const response = await fetch(url)
    if (!response.ok) {
      throw new Error(`Error fetching start: ${response.statusText}`)
    }
    const levels = (await response.json()) as Level[]
    const levelData = levels.find((level) => level.entityId === process.env['LEVEL_ID'])
    if (!levelData) {
      throw new Error('Level data not found')
    }
    const baseState: BaseState = JSON.parse(levelData.baseState)
    const start: Point = baseState.start
    return start
  } catch (error) {
    console.error(error)
    return null
  }
}

maze = await fetchMaze(`https://goldrush.monad.fi/backend/api/levels`)
start = await fetchStart(`https://goldrush.monad.fi/backend/api/levels`)
end = await fetchTarget(`https://goldrush.monad.fi/backend/api/levels`)

const path = bfs(start, end, maze)
let x = 1
let liike = false
let nykyinenSuunta: Rotation | null = null

const generateAction: (gameState: NoWayOutState) => Action = (gameState) => {
  const { player } = gameState

  const haluttuSuunta: Rotation | null = maaritaSuunta(path[x], path[x - 1])

  if (x === 1) {
    player.position = start
  }

  if (nykyinenSuunta === haluttuSuunta) {
    liike = true
  }

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
