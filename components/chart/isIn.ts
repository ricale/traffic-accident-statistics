type Rect1 = {
  x: number
  y: number
  width: number
  height: number
}
// type Rect2 = {
//   x1: number
//   y1: number
//   x2: number
//   y2: number
// }
type Coord = [number, number]
function isIn(rect: Rect1, [x,y]: Coord) {
  return (
    rect.x <= x && x <= (rect.x + rect.width) &&
    rect.y <= y && y <= (rect.y + rect.height)
  )
}

export default isIn;
