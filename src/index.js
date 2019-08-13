import parseSvgPath from 'parse-svg-path'
import arcToBezier from 'svg-arc-to-cubic-bezier'
import { sort, sortCurves } from './sort'
import { split } from './split'

class Robin {}

Robin.MIM_CURVES_COUNT = 100
Robin.parser = parseSvgPath

Robin.transform = function(pathA, pathB) {
  const [pA, pB] = Robin._preprocessing(
    Robin.path2shapes(pathA),
    Robin.path2shapes(pathB)
  )
  return [Robin.toSVGString(pA), Robin.toSVGString(pB)]
}

Robin.toSVGString = function(shapes) {
  return shapes
    .map(function(shape) {
      shape.forEach(function(point, idx) {
        if (!idx) {
          /*
           * 若是第一个点数组，那么对该点数组的处理是前面加M,然后前两个点后面加C
           * */
          point.splice(2, 0, 'C')
          point.unshift('M')
        } else {
          /*
           * 除了第一个点数据外,所有的点数组的前两个点删除掉
           * */
          point.splice(0, 2, 'C')
        }
      })
      return shape
        .map(function(point) {
          return point.join(' ')
        })
        .join('')
    })
    .join('')
}

Robin._subShapes = function(shapes, count) {
  // 该函数没有返回值
  for (let i = 0; i < count; i++) {
    let shape = shapes[shapes.length - 1]
    let newShape = []
    let x = shape[0][0],
      y = shape[0][1]
    shape.forEach(function() {
      newShape.push([x, y, x, y, x, y, x, y])
    })

    shapes.push(newShape)
  }
}

Robin._splitCurves = function(curves, count) {
  let i = 0,
    index = 0

  for (; i < count; i++) {
    let curve = curves[index]
    let cs = split(
      curve[0],
      curve[1],
      curve[2],
      curve[3],
      curve[4],
      curve[5],
      curve[6],
      curve[7],
      0.5
    )
    curves.splice(index, 1)
    curves.splice(index, 0, cs.left, cs.right)

    index += 2
    if (index >= curves.length - 1) {
      index = 0
    }
  }
}

Robin._upShapes = function(shapes, count) {
  for (let i = 0; i < count; i++) {
    let shape = shapes[shapes.length - 1]
    let newShape = []

    shape.forEach(function(curve) {
      newShape.push(curve.slice(0))
    })
    shapes.push(newShape)
  }
}

Robin._preprocessing = function(pathA, pathB) {
  let lenA = pathA.length,
    lenB = pathB.length,
    clonePathA = JSON.parse(JSON.stringify(pathA)),
    clonePathB = JSON.parse(JSON.stringify(pathB))

  if (lenA > lenB) {
    Robin._subShapes(clonePathB, lenA - lenB)
  } else if (lenA < lenB) {
    Robin._upShapes(clonePathA, lenB - lenA)
  }

  clonePathA = sort(clonePathA, clonePathB)

  clonePathA.forEach(function(curves, index) {
    let lenA = curves.length,
      lenB = clonePathB[index].length

    if (lenA > lenB) {
      if (lenA < Robin.MIM_CURVES_COUNT) {
        Robin._splitCurves(curves, Robin.MIM_CURVES_COUNT - lenA)
        Robin._splitCurves(clonePathB[index], Robin.MIM_CURVES_COUNT - lenB)
      } else {
        Robin._splitCurves(clonePathB[index], lenA - lenB)
      }
    } else if (lenA < lenB) {
      if (lenB < Robin.MIM_CURVES_COUNT) {
        Robin._splitCurves(curves, Robin.MIM_CURVES_COUNT - lenA)
        Robin._splitCurves(clonePathB[index], Robin.MIM_CURVES_COUNT - lenB)
      } else {
        Robin._splitCurves(curves, lenB - lenA)
      }
    }
  })

  clonePathA.forEach(function(curves, index) {
    clonePathA[index] = sortCurves(curves, clonePathB[index])
  })

  return [clonePathA, clonePathB]
}

Robin.q2b = function(x1, y1, x2, y2, x3, y3) {
  return [
    x1,
    y1,
    (x1 + 2 * x2) / 3,
    (y1 + 2 * y2) / 3,
    (x3 + 2 * x2) / 3,
    (y3 + 2 * y2) / 3,
    x3,
    y3
  ]
}

Robin.path2shapes = function(path) {
  // https://developer.mozilla.org/zh-CN/docs/Web/SVG/Tutorial/Paths
  //M = moveto
  //L = lineto
  //H = horizontal lineto
  //V = vertical lineto
  //C = curveto
  //S = smooth curveto
  //Q = quadratic Belzier curve
  //T = smooth quadratic Belzier curveto
  //A = elliptical Arc
  //Z = closepath
  //以上所有命令均允许小写字母。大写表示绝对定位，小写表示相对定位(从上一个点开始)。
  let cmds = Robin.parser(path),
    preX = 0,
    preY = 0,
    j = 0,
    len = cmds.length,
    shapes = [],
    current = null,
    closeX,
    closeY,
    preCX,
    preCY,
    sLen,
    curves,
    lastCurve

  for (; j < len; j++) {
    let item = cmds[j]
    let action = item[0]
    let preItem = cmds[j - 1]

    switch (action) {
      case 'm':
        sLen = shapes.length
        shapes[sLen] = []
        current = shapes[sLen]
        preX = preX + item[1]
        preY = preY + item[2]
        break
      case 'M':
        sLen = shapes.length
        shapes[sLen] = []
        current = shapes[sLen]
        preX = item[1]
        preY = item[2]
        break

      case 'l':
        current.push([
          preX,
          preY,
          preX,
          preY,
          preX,
          preY,
          preX + item[1],
          preY + item[2]
        ])
        preX += item[1]
        preY += item[2]
        break

      case 'L':
        current.push([
          preX,
          preY,
          item[1],
          item[2],
          item[1],
          item[2],
          item[1],
          item[2]
        ])
        preX = item[1]
        preY = item[2]

        break

      case 'h':
        current.push([preX, preY, preX, preY, preX, preY, preX + item[1], preY])
        preX += item[1]
        break

      case 'H':
        current.push([preX, preY, item[1], preY, item[1], preY, item[1], preY])
        preX = item[1]
        break

      case 'v':
        current.push([preX, preY, preX, preY, preX, preY, preX, preY + item[1]])
        preY += item[1]
        break

      case 'V':
        current.push([preX, preY, preX, item[1], preX, item[1], preX, item[1]])
        preY = item[1]
        break

      case 'C':
        current.push([
          preX,
          preY,
          item[1],
          item[2],
          item[3],
          item[4],
          item[5],
          item[6]
        ])
        preX = item[5]
        preY = item[6]
        break
      case 'S':
        if (preItem[0] === 'C' || preItem[0] === 'c') {
          current.push([
            preX,
            preY,
            preX + preItem[5] - preItem[3],
            preY + preItem[6] - preItem[4],
            item[1],
            item[2],
            item[3],
            item[4]
          ])
        } else if (preItem[0] === 'S' || preItem[0] === 's') {
          current.push([
            preX,
            preY,
            preX + preItem[3] - preItem[1],
            preY + preItem[4] - preItem[2],
            item[1],
            item[2],
            item[3],
            item[4]
          ])
        }
        preX = item[3]
        preY = item[4]
        break

      case 'c':
        current.push([
          preX,
          preY,
          preX + item[1],
          preY + item[2],
          preX + item[3],
          preY + item[4],
          preX + item[5],
          preY + item[6]
        ])
        preX = preX + item[5]
        preY = preY + item[6]
        break
      case 's':
        if (preItem[0] === 'C' || preItem[0] === 'c') {
          current.push([
            preX,
            preY,
            preX + preItem[5] - preItem[3],
            preY + preItem[6] - preItem[4],
            preX + item[1],
            preY + item[2],
            preX + item[3],
            preY + item[4]
          ])
        } else if (preItem[0] === 'S' || preItem[0] === 's') {
          current.push([
            preX,
            preY,
            preX + preItem[3] - preItem[1],
            preY + preItem[4] - preItem[2],
            preX + item[1],
            preY + item[2],
            preX + item[3],
            preY + item[4]
          ])
        }

        preX = preX + item[3]
        preY = preY + item[4]

        break
      case 'a':
        curves = arcToBezier({
          rx: item[1],
          ry: item[2],
          px: preX,
          py: preY,
          xAxisRotation: item[3],
          largeArcFlag: item[4],
          sweepFlag: item[5],
          cx: preX + item[6],
          cy: preX + item[7]
        })
        lastCurve = curves[curves.length - 1]

        curves.forEach((curve, index) => {
          if (index === 0) {
            current.push([
              preX,
              preY,
              curve.x1,
              curve.y1,
              curve.x2,
              curve.y2,
              curve.x,
              curve.y
            ])
          } else {
            current.push([
              curves[index - 1].x,
              curves[index - 1].y,
              curve.x1,
              curve.y1,
              curve.x2,
              curve.y2,
              curve.x,
              curve.y
            ])
          }
        })

        preX = lastCurve.x
        preY = lastCurve.y

        break

      case 'A':
        curves = arcToBezier({
          rx: item[1],
          ry: item[2],
          px: preX,
          py: preY,
          xAxisRotation: item[3],
          largeArcFlag: item[4],
          sweepFlag: item[5],
          cx: item[6],
          cy: item[7]
        })
        lastCurve = curves[curves.length - 1]

        curves.forEach((curve, index) => {
          if (index === 0) {
            current.push([
              preX,
              preY,
              curve.x1,
              curve.y1,
              curve.x2,
              curve.y2,
              curve.x,
              curve.y
            ])
          } else {
            current.push([
              curves[index - 1].x,
              curves[index - 1].y,
              curve.x1,
              curve.y1,
              curve.x2,
              curve.y2,
              curve.x,
              curve.y
            ])
          }
        })

        preX = lastCurve.x
        preY = lastCurve.y

        break
      case 'Q':
        current.push(Robin.q2b(preX, preY, item[1], item[2], item[3], item[4]))
        preX = item[3]
        preY = item[4]

        break
      case 'q':
        current.push(
          Robin.q2b(
            preX,
            preY,
            preX + item[1],
            preY + item[2],
            item[3] + preX,
            item[4] + preY
          )
        )
        preX += item[3]
        preY += item[4]
        break

      case 'T':
        if (preItem[0] === 'Q' || preItem[0] === 'q') {
          preCX = preX + preItem[3] - preItem[1]
          preCY = preY + preItem[4] - preItem[2]
          current.push(Robin.q2b(preX, preY, preCX, preCY, item[1], item[2]))
        } else if (preItem[0] === 'T' || preItem[0] === 't') {
          current.push(
            Robin.q2b(
              preX,
              preY,
              preX + preX - preCX,
              preY + preY - preCY,
              item[1],
              item[2]
            )
          )
          preCX = preX + preX - preCX
          preCY = preY + preY - preCY
        }

        preX = item[1]
        preY = item[2]
        break

      case 't':
        if (preItem[0] === 'Q' || preItem[0] === 'q') {
          preCX = preX + preItem[3] - preItem[1]
          preCY = preY + preItem[4] - preItem[2]
          current.push(
            Robin.q2b(preX, preY, preCX, preCY, preX + item[1], preY + item[2])
          )
        } else if (preItem[0] === 'T' || preItem[0] === 't') {
          current.push(
            Robin.q2b(
              preX,
              preY,
              preX + preX - preCX,
              preY + preY - preCY,
              preX + item[1],
              preY + item[2]
            )
          )
          preCX = preX + preX - preCX
          preCY = preY + preY - preCY
        }

        preX += item[1]
        preY += item[2]
        break

      case 'Z':
        closeX = current[0][0]
        closeY = current[0][1]
        current.push([
          preX,
          preY,
          closeX,
          closeY,
          closeX,
          closeY,
          closeX,
          closeY
        ])
        break
      case 'z':
        closeX = current[0][0]
        closeY = current[0][1]
        current.push([
          preX,
          preY,
          closeX,
          closeY,
          closeX,
          closeY,
          closeX,
          closeY
        ])
        break
    }
  }

  return shapes
}

export default Robin
