export function split(x1, y1, x2, y2, x3, y3, x4, y4, t) {
  return {
    left: _split(x1, y1, x2, y2, x3, y3, x4, y4, t),
    right: _split(x4, y4, x3, y3, x2, y2, x1, y1, 1 - t, true)
  }
}

function _split(x1, y1, x2, y2, x3, y3, x4, y4, t, reverse) {
  let x12 = (x2 - x1) * t + x1
  let y12 = (y2 - y1) * t + y1

  let x23 = (x3 - x2) * t + x2
  let y23 = (y3 - y2) * t + y2

  let x34 = (x4 - x3) * t + x3
  let y34 = (y4 - y3) * t + y3

  let x123 = (x23 - x12) * t + x12
  let y123 = (y23 - y12) * t + y12

  let x234 = (x34 - x23) * t + x23
  let y234 = (y34 - y23) * t + y23

  let x1234 = (x234 - x123) * t + x123
  let y1234 = (y234 - y123) * t + y123

  if (reverse) {
    return [x1234, y1234, x123, y123, x12, y12, x1, y1]
  }
  return [x1, y1, x12, y12, x123, y123, x1234, y1234]
}
