import canMove from './canMove.js'
import { Point, PointWithDirection } from '../types.js'

const bfs = (start: Point, end: Point, maze: number[][]): Point[] | null => {
  let queue: PointWithDirection[] = [{ ...start, direction: '', turns: 0, steps: 0, parent: null }]
  let visited = new Map<string, number>()
  let bestPath: Point[] = []
  let bestScore = Infinity

  visited.set(`${start.x},${start.y}`, 0)

  while (queue.length > 0) {
    const current = queue.shift()!

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

export default bfs
