import { Point, Maze } from '../types.js'

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
  }
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
  }
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
  }
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

  return true
}

export default canMove
