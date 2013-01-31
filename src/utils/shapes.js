/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var Path = global.benri.geometry.Path;
  var Point = global.benri.geometry.Point;
  var Color = global.benri.draw.Color;
  var Matrix2D = global.benri.geometry.Matrix2D;
  var Style = global.benri.draw.Style;
  var StrokeStyle = global.benri.draw.StrokeStyle;
  var ColorShader = global.benri.draw.ColorShader;
  var LinearGradientShader = global.benri.draw.LinearGradientShader;
  var RadialGradientShader = global.benri.draw.RadialGradientShader;
  var BitmapShader = global.benri.draw.BitmapShader;
  var mShape = theatre.crews.swf.utils.shape = {};

  /**
   * Finds the next edge to connect to for this shape.
   * @param {Object} pEdge The edge to search from.
   * @param {Boolean} pAIfTrue Which side of the edge to search from.
   *  Sorry, needs to be a bool for performance.
   * @private
   */
  function findNext(pType, pCanvas, pCanvasStyle, pPath, pEdge, pPoints, pPoint, pFinalPointX, pFinalPointY, pAIfTrue) {
    var tAorB = pAIfTrue === true ? 'a' : 'b';

    var tEdgeCompareX;
    var tEdgeCompareY;
    var tIndex;
    var tNextEdge;
    var tEdgeType;
    var tPXorX, tPYorY;

    var i;

    if (pAIfTrue === true) {
      tEdgeCompareX = pEdge.px;
      tEdgeCompareY = pEdge.py;
    } else {
      tEdgeCompareX = pEdge.x;
      tEdgeCompareY = pEdge.y;
    }

    var tNextPoint = pPoints[pEdge[tAorB]];
    var tNextPointEdgesLength;

    if (tNextPoint === void 0 || (tNextPointEdgesLength = tNextPoint.length) === 1) {
      if (tNextPoint !== void 0) {
        // Remove the base edge as we already used it.
        tIndex = tNextPoint.indexOf(pEdge);
        if (tIndex !== -1) {
          tNextPoint.splice(tIndex, 1);
          delete pPoints[pEdge[tAorB]];
        }
      }

      return false;
    }

    // Remove the base edge as we already used it.
    tIndex = tNextPoint.indexOf(pEdge);
    if (tIndex === -1) {
      console.error('Could not find edge that has to be there. Error with algorithm!');
      return false;
    }

    tNextPoint.splice(tIndex, 1);

    for (i = 0; i < tNextPointEdgesLength; i++) {
      tNextEdge = tNextPoint[i];
      tEdgeType = tNextEdge.type;

      // We used this edge, remove it.
      tNextPoint.splice(i, 1);

      if (tNextPointEdgesLength === 2) {
        // We use 2 because we calculated this before.
        // If there are not more edges on this point
        // there would have been 2 edges when we started
        // this function. Meaning we now have 0.
        delete pPoints[pEdge[pAIfTrue === true ? 'a' : 'b']];
      }

      // Next we try to figure out which data (a or b) to use.
      if ((pAIfTrue = (tEdgeCompareX === tNextEdge.x && tEdgeCompareY === tNextEdge.y))) {
        // We use a (going backwards).
        tPXorX = 'px';
        tPYorY = 'py';
        tAorB = 'a';
      } else {
        // We use b (going forwards).
        tPXorX = 'x';
        tPYorY = 'y';
        tAorB = 'b';
      }

      // Draw the current edge.
      if (tEdgeType === 2) { // Curve
        pPath.qc(
          tNextEdge.controlX,
          tNextEdge.controlY,
          tNextEdge[tPXorX],
          tNextEdge[tPYorY]
        );
      } else if (tEdgeType === 3) { // Straight
        pPath.l(tNextEdge[tPXorX], tNextEdge[tPYorY]);
      }

      // Check if have completed a shape.
      if (pFinalPointX === tNextEdge[tPXorX] && pFinalPointY === tNextEdge[tPYorY]) {
        // We have completed a shape!
        if (pType === 'line') {
          pCanvas.strokePath(pPath, pCanvasStyle);
        } else {
          pCanvas.fillPath(pPath, pCanvasStyle);
        }

        // Clean things up as we have now used this edge.
        tIndex = pPoint.indexOf(tNextEdge);
        if (tIndex === -1) {
          console.error('Major error in shape algorithm. Last edge is not in first point array.');
        }
        pPoint.splice(tIndex, 1);

        if (pPoint.length === 0) {
          delete pPoints[tNextEdge[tAorB]];
        }
        return true;
      } else {
        return findNext(
          pType,
          pCanvas,
          pCanvasStyle,
          pPath,
          tNextEdge,
          pPoints,
          pPoint,
          pFinalPointX,
          pFinalPointY,
          pAIfTrue
        );
      }

      break; // TODO: Need to choose which edge is the CORRECT one. Right now we just choose the first.
    }
  }

  function createStyle(pStyle, pType, pResources, pBounds) {
    var tType = pStyle.type;
    var tColor;
    var tCanvasStyle;
    var tShader;
    var tMatrix;
    var tStops, tStop;
    var tBitmap;
    var i, il;

    if (pType === 'line') {
      tCanvasStyle = new StrokeStyle(pStyle.width);
      tCanvasStyle.cap = 'round';
      tCanvasStyle.join = 'round';
    } else {
      tCanvasStyle = new Style();
    }

    tCanvasStyle.compositor = 'xor';

    if (tType === 0x00 || pType === 'line') {
      // Solid colour
      tColor = pStyle.color;
      tCanvasStyle.setColor(new Color(tColor.red, tColor.green, tColor.blue, tColor.alpha * 255));
    } else if (pStyle.matrix !== null) {
      tMatrix = new Matrix2D(pStyle.matrix);

      // TODO: Understand why we can't use transform methods.
      // Why do we need to do everything manually?
      // Need to understand the reasons for this.
      tMatrix.scale(0.05, 0.05);
      tMatrix.e *= 0.05;
      tMatrix.f *= 0.05;
      tMatrix.e -= pBounds.left * 0.05;
      tMatrix.f -= pBounds.top * 0.05;

      if (tType === 0x10 || tType === 0x12 || tType === 0x13) {
        // A Gradient
        if (tType === 0x10) {
          // Linear Gradient
          tShader = new LinearGradientShader(new Point(-16384, 0), new Point(16384, 0));
        } else if (tType === 0x12) {
          // Radial Gradient
          tShader = new RadialGradientShader(new Point(0, 0), 16384);
        } else if (tType === 0x13) {
          // Focal Radial Gradient
          console.warn('Focal radient detected. Showing it as a normal radial.');
          tShader = new RadialGradientShader(new Point(0, 0), 16384);
        }

        tStops = pStyle.gradient.stops;
        for (i = 0, il = tStops.length; i < il; i++) {
          tStop = tStops[i];
          tColor = tStop.color;
          tShader.addStop(tStop.ratio / 255, new Color(tColor.red, tColor.green, tColor.blue, tColor.alpha * 255));
        }

        tShader.matrix = tMatrix;

        tCanvasStyle.shader = tShader;
      } else if (tType === 0x40 || tType === 0x41) {
        // Repeating Bitmap or Clipped Bitmap
        tBitmap = pResources.get('image', pStyle.bitmapId);

        if (!tBitmap) {
          tCanvasStyle.setColor(new Color(255, 0, 0, 255));
        } else {
          tShader = new BitmapShader(tBitmap);
          tShader.tileMode = tType === 0x40 ? 'repeat' : 'none';
          tShader.matrix = tMatrix;

          tCanvasStyle.shader = tShader;
        }
      }
    } else {
      tCanvasStyle.setColor(new Color(255, 0, 0, 255));
    }

    return tCanvasStyle;
  }

  /**
   * Flushes the edges arrays in to code.
   * @param {String=line|fill} pType The type of edge.
   * @param {Object.<String, Object>} pAllPoints A map of all points to edges in this shape so far.
   * @param {Array.<Object>} pStyles The array of fill or line styles to reference from.
   * @private
   */
  function flush(pType, pAllPoints, pStyles, pCanvas, pResources, pBounds) {
    var tFinalPointX;
    var tFinalPointY;
    var tPoints;
    var tPoint;

    var tEdgeMain;
    var tEdgeType;
    var tPath;

    var tCanvasStyle;

    var i, il, k;

    // Loop the points. These points' index are Style indicies.
    // That's why we start from 1. (0 is transparent)
    for (i = 1, il = pAllPoints.length; i < il; i++) {
      tPoints = pAllPoints[i];

      // If this style has no points we abort this style.
      if (Object.keys(tPoints).length === 0) {
        continue;
      }

      pCanvas.enterLayer();
      pCanvas.matrix.scale(0.05, 0.05);
      pCanvas.matrix.translate(-pBounds.left, -pBounds.top);

      tCanvasStyle = createStyle(pStyles[i - 1], pType, pResources, pBounds);

      tFinalPointX = 0;
      tFinalPointY = 0;

      // Go through all the points (each key is a string point of (x,y)).
      while (Object.keys(tPoints).length > 0) {
        for (k in tPoints) {
          tPoint = tPoints[k];

          // Every fill point needs at least 2 edges attached to it.
          if (tPoint.length === 1) {
            tEdgeMain = tPoint[0];

            if (pType === 'line') {
              tEdgeType = tEdgeMain.type;

              tPath = new Path(tEdgeMain.px, tEdgeMain.py);

              if (tEdgeType === 2) { // Curve
                tPath.qc(
                  tEdgeMain.controlX,
                  tEdgeMain.controlY,
                  tEdgeMain.x,
                  tEdgeMain.y
                );
              } else if (tEdgeType === 3) { // Straight
                tPath.l(tEdgeMain.x, tEdgeMain.y);
              }

              pCanvas.strokePath(tPath, tCanvasStyle);
            } else {
              console.warn(k + ' does not have anything connecting to it!');
            }

            tPoint = tPoints[tEdgeMain.a];

            if (tPoint !== void 0) {
              tPoint.splice(tPoint.indexOf(tEdgeMain), 1);

              if (tPoint.length === 0) {
                delete tPoints[tEdgeMain.a];
              }
            }

            tPoint = tPoints[tEdgeMain.b];

            if (tPoint !== void 0) {
              tPoint.splice(tPoint.indexOf(tEdgeMain), 1);

              if (tPoint.length === 0) {
                delete tPoints[tEdgeMain.b];
              }
            }

            continue;
          }

          // Grab the first edge of this point. We use it as our starting edge.
          // Also remove it as we have used it now.
          tEdgeMain = tPoint.shift();

          // These are the actual numerical points we are searching for.
          // Once another edge comes up that has these points, it means
          // we have found a full shape, and we close that shape and draw it.
          tFinalPointX = tEdgeMain.px;
          tFinalPointY = tEdgeMain.py;

          tEdgeType = tEdgeMain.type;

          tPath = new Path(tEdgeMain.px, tEdgeMain.py);

          if (tEdgeType === 2) { // Curve
            tPath.qc(
              tEdgeMain.controlX,
              tEdgeMain.controlY,
              tEdgeMain.x,
              tEdgeMain.y
            );
          } else if (tEdgeType === 3) { // Straight
            tPath.l(tEdgeMain.x, tEdgeMain.y);
          }

          // Start searching from the b point of the edge.
          if (findNext(
                pType,
                pCanvas,
                tCanvasStyle,
                tPath,
                tEdgeMain,
                tPoints,
                tPoint,
                tFinalPointX,
                tFinalPointY,
                false
            ) === false) {
            if (pType === 'line') {
              pCanvas.strokePath(tPath, tCanvasStyle);
            } else {
              console.warn('Encountered an unclosed shape! Forcing it closed!');
              //tPath.close();
              tPath.l(tFinalPointY, tFinalPointY);
              pCanvas.fillPath(tPath, tCanvasStyle);
            }
          }

        }
      }

      pCanvas.leaveLayer();
    }
  }

  mShape.drawShape = function(pShape, pCanvas, pResources) {
    var tFillStyles = pShape.fillStyles;
    var tLineStyles = pShape.lineStyles;
    var tFillEdges, tLineEdges;
    var tCurrentFillEdges0;
    var tCurrentFillEdges1;
    var tCurrentLineEdges;
    var tCurrentFillStyle0 = null;
    var tCurrentFillStyle1 = null;
    var tCurrentLineStyle = null;
    var tBounds = pShape.bounds;

    var tRecords = pShape.records;
    var tRecord;
    var tType;
    var tNewData;

    var tX = 0;
    var tY = 0;
    var tPreviousX = 0;
    var tPreviousY = 0;

    var i, il;

    function populateFillBuffers() {
      tFillEdges = new Array(tFillStyles.length + 1);
      for (var i = 0, il = tFillEdges.length; i < il; i++) {
        tFillEdges[i + 1] = {};
      }
    }

    function populateLineBuffers() {
      tLineEdges = new Array(tLineStyles.length + 1);
      for (var i = 0, il = tLineEdges.length; i < il; i++) {
        tLineEdges[i + 1] = {};
      }
    }

    function add(pEdge, pArray) {
      if (pArray[pEdge.a] === void 0) {
        pArray[pEdge.a] = [pEdge];
      } else {
        pArray[pEdge.a].push(pEdge);
      }

      if (pArray[pEdge.b] === void 0) {
        pArray[pEdge.b] = [pEdge];
      } else {
        pArray[pEdge.b].push(pEdge);
      }
    }

    pCanvas.clear(new Color(0, 0, 0, 0));

    populateFillBuffers();
    populateLineBuffers();

    for (i = 0, il = tRecords.length; i < il; i++) {
      tRecord = tRecords[i];
      tType = tRecord.type;
      tPreviousX = tX;
      tPreviousY = tY;
      tNewData;

      if (tType === 2) { // Curve
        tNewData = {
          type: tType,
          controlX: tX += tRecord.deltaControlX,
          controlY: tY += tRecord.deltaControlY,
          x: tX += tRecord.deltaX,
          y: tY += tRecord.deltaY,
          px: tPreviousX,
          py: tPreviousY,
          a: tPreviousX + ',' + tPreviousY,
          b: tX + ',' + tY
        };

        if (tCurrentFillStyle0 > 0) {
          add(tNewData, tCurrentFillEdges0);
        }

        if (tCurrentFillStyle1 > 0) {
          add(tNewData, tCurrentFillEdges1);
        }

        if (tCurrentLineStyle > 0) {
          add(tNewData, tCurrentLineEdges);
        }
      } else if (tType === 3) { // Straight
        tNewData = {
          type: tType,
          x: tX += tRecord.deltaX,
          y: tY += tRecord.deltaY,
          px: tPreviousX,
          py: tPreviousY,
          a: tPreviousX + ',' + tPreviousY,
          b: tX + ',' + tY
        };

        if (tCurrentFillStyle0 > 0) {
          add(tNewData, tCurrentFillEdges0);
        }

        if (tCurrentFillStyle1 > 0) {
          add(tNewData, tCurrentFillEdges1);
        }

        if (tCurrentLineStyle > 0) {
          add(tNewData, tCurrentLineEdges);
        }
      } else if (tType === 1) { // Change
        if (tRecord.fillStyles !== null) {
          flush('fill', tFillEdges, tFillStyles, pCanvas, pResources, tBounds);
          tFillStyles = tRecord.fillStyles;
          populateFillBuffers();
        }

        if (tRecord.lineStyles !== null) {
          flush('line', tLineEdges, tLineStyles, pCanvas, pResources, tBounds);
          tLineStyles = tRecord.lineStyles;
          populateLineBuffers();
        }

        if (tRecord.fillStyle0 > -1) {
          tCurrentFillStyle0 = tRecord.fillStyle0;
          tCurrentFillEdges0 = tFillEdges[tCurrentFillStyle0];
        }

        if (tRecord.fillStyle1 > -1) {
          tCurrentFillStyle1 = tRecord.fillStyle1;
          tCurrentFillEdges1 = tFillEdges[tCurrentFillStyle1];
        }

        if (tRecord.lineStyle > -1) {
          tCurrentLineStyle = tRecord.lineStyle;
          tCurrentLineEdges = tLineEdges[tCurrentLineStyle];
        }

        if (tRecord.hasMove === true) {
          tX = tRecord.moveDeltaX;
          tY = tRecord.moveDeltaY;
        }
      }
    }

    flush('fill', tFillEdges, tFillStyles, pCanvas, pResources, tBounds);
    flush('line', tLineEdges, tLineStyles, pCanvas, pResources, tBounds);
  };

}(this));
