import { Point, Rotation } from '../types.js'

const maaritaSuunta = (seuraavaPiste: Point, nykyinenPiste: Point): Rotation | null => {
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

export default maaritaSuunta
