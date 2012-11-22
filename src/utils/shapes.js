/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mShape = theatre.define('crews.swf.utils.shape', void 0, theatre);

  /**
   * Finds the next edge to connect to for this shape.
   * @param {Object} pEdge The edge to search from.
   * @param {Boolean} pAIfTrue Which side of the edge to search from.
   *  Sorry, needs to be a bool for performance.
   * @private
   */
  function findNext(pDrawable, pPath, pEdge, pPoints, pPoint, pFinalPointX, pFinalPointY, pAIfTrue) {
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
        var tIndex = tNextPoint.indexOf(pEdge);
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
        pPath.quadraticCurveTo(
          tNextEdge.controlX,
          tNextEdge.controlY,
          tNextEdge[tPXorX],
          tNextEdge[tPYorY]
        );
      } else if (tEdgeType === 3) { // Straight
        pPath.lineTo(tNextEdge[tPXorX], tNextEdge[tPYorY]);
      }

      // Check if have completed a shape.
      if (pFinalPointX === tNextEdge[tPXorX] && pFinalPointY === tNextEdge[tPYorY]) {
        // We have completed a shape!
        pPath.paint();

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
          pDrawable,
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

  /**
   * Flushes the edges arrays in to code.
   * @param {String=line|fill} pType The type of edge.
   * @param {Object.<String, Object>} pAllPoints A map of all points to edges in this shape so far.
   * @param {Array.<Object>} pStyles The array of fill or line styles to reference from.
   * @private
   */
  function flush(pType, pAllPoints, pStyles) {
    var tDrawables = [];
    var tDrawable;

    var tFinalPointX;
    var tFinalPointY;
    var tPoints;
    var tPoint;

    var tEdgeMain;
    var tEdgeType;
    var tPath;

    var i, il, k;

    // Loop the points. These points' index are Style indicies.
    // That's why we start from 1. (0 is transparent)
    for (i = 1, il = pAllPoints.length; i < il; i++) {
      tPoints = pAllPoints[i];

      // If this style has no points we abort this style.
      if (Object.keys(tPoints).length === 0) {
        continue;
      }

      if (pType === 'line') {
        tDrawable = new Line(pStyles[i - 1]);
      } else {
        tDrawable = new Shape(pStyles[i - 1]);
      }

      tDrawables.push(tDrawable);

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
              tDrawable.addPath(tPath);

              if (tEdgeType === 2) { // Curve
                tPath.quadraticCurveTo(
                  tEdgeMain.controlX,
                  tEdgeMain.controlY,
                  tEdgeMain.x,
                  tEdgeMain.y
                );
              } else if (tEdgeType === 3) { // Straight
                tPath.lineTo(tEdgeMain.x, tEdgeMain.y);
              }

              tPath.stroke();
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
          // Also remove it as have used it now.
          tEdgeMain = tPoint.shift();

          // These are the actual numerical points we are searching for.
          // Once another edge comes up that has these points, it means
          // we have found a full shape, and we close that shape and draw it.
          tFinalPointX = tEdgeMain.px;
          tFinalPointY = tEdgeMain.py;

          tEdgeType = tEdgeMain.type;

          tPath = new Path(tEdgeMain.px, tEdgeMain.py);
          tDrawable.addPath(tPath);

          if (tEdgeType === 2) { // Curve
            tPath.quadraticCurveTo(
              tEdgeMain.controlX,
              tEdgeMain.controlY,
              tEdgeMain.x,
              tEdgeMain.y
            );
          } else if (tEdgeType === 3) { // Straight
            tPath.lineTo(tEdgeMain.x, tEdgeMain.y);
          }

          // Start searching from the b point of the edge.
          if (findNext(
                tDrawable,
                tPath,
                tEdgeMain,
                tPoints,
                tPoint,
                tFinalPointY,
                tFinalPointY,
                false
            ) === false) {
            if (pType === 'line') {
              tPath.stroke();
            } else {
              console.warn('Encountered an unclosed shape! Forcing it closed!');
              tPath.close();
              tPath.fill();
            }
          }

        }
      }
    }

    return tDrawables;
  }

  var getResolvedShapes = mShape.getResolvedShapes = function(pShape) {
    var tFillStyles = pShape.fillStyles;
    var tLineStyles = pShape.lineStyles;
    var tFillEdges, tLineEdges;
    var tCurrentFillEdges0;
    var tCurrentFillEdges1;
    var tCurrentLineEdges;
    var tCurrentFillStyle0 = null;
    var tCurrentFillStyle1 = null;
    var tCurrentLineStyle = null;

    var tRecords = pShape.records;
    var tRecord;
    var tType;
    var tNewData;

    var tX = 0;
    var tY = 0;
    var tPreviousX = 0;
    var tPreviousY = 0;

    var i, il;

    var tNewDrawables = [];

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
          tNewDrawables = tNewDrawables.concat(flush('fill', tFillEdges, tFillStyles));
          tFillStyles = tRecord.fillStyles;
          populateFillBuffers();
        }

        if (tRecord.lineStyles !== null) {
          tNewDrawables = tNewDrawables.concat(flush('line', tLineEdges, tLineStyles));
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

    tNewDrawables = tNewDrawables.concat(flush('fill', tFillEdges, tFillStyles));
    tNewDrawables = tNewDrawables.concat(flush('line', tLineEdges, tLineStyles));

    return tNewDrawables;
  };

  function Path(pStartX, pStartY) {
    this.startX = pStartX;
    this.startY = pStartY;
    this.records = [];
  }

  Path.prototype.draw = function(pCode, pDrawable) {
    var tRecords = this.records;
    var tRecord;
    var tType;

    pCode.push(
      'tTempContext.beginPath();',
      'tTempContext.moveTo(' + this.startX + ', ' + this.startY + ');'
    );

    for (var i = 0, il = tRecords.length; i < il; i++) {
      tRecord = tRecords[i];
      tType = tRecord.type;

      if (tType === 'quadraticCurve') {
        pCode.push('tTempContext.quadraticCurveTo(' + tRecord.controlX + ', ' + tRecord.controlY + ', ' + tRecord.x + ', ' + tRecord.y + ');');
      } else if (tType === 'line') {
        pCode.push('tTempContext.lineTo(' + tRecord.x + ', ' + tRecord.y + ');');
      } else if (tType === 'close') {
        pCode.push('tTempContext.closePath();');
      } else if (tType === 'fill') {
        pCode.push('tTempContext.fill();');
      } else if (tType === 'stroke') {
        pCode.push('tTempContext.stroke();');
      } else if (tType === 'paint') {
        pDrawable.paintPath(pCode, this);
      }
    }
  };

  Path.prototype.lineTo = function(pX, pY) {
    this.records.push({
      type: 'line',
      x: pX,
      y: pY
    });
  };

  Path.prototype.quadraticCurveTo = function(pControlX, pControlY, pX, pY) {
    this.records.push({
      type: 'quadraticCurve',
      controlX: pControlX,
      controlY: pControlY,
      x: pX,
      y: pY
    });
  };

  Path.prototype.close = function() {
    this.records.push({
      type: 'close'
    });
  };

  Path.prototype.fill = function() {
    this.records.push({
      type: 'fill'
    });
  };

  Path.prototype.stroke = function() {
    this.records.push({
      type: 'stroke'
    });
  };

  Path.prototype.paint = function() {
    this.records.push({
      type: 'paint'
    });
  }

  function Drawable(pStyle) {
    this.style = pStyle;
    this.paths = [];
  }

  Drawable.prototype.draw = function(pCode, pBounds, pImages, pSkipTranslate) {
    var tPaths = this.paths;

    for (var i = 0, il = tPaths.length; i < il; i++) {
      tPaths[i].draw(pCode, this);
    }
  };

  Drawable.prototype.addPath = function(pPath) {
    this.paths.push(pPath);
  };

  Drawable.prototype.paintPath = function(pPath) {};

  /**
   * @class
   * @extends {Drawable}
   */
  var Shape = (function(pSuper) {
    function Shape(pStyle) {
      pSuper.call(this, pStyle);
    }

    Shape.prototype = Object.create(pSuper.prototype);

    Shape.prototype.paintPath = function(pCode, pPath) {
      pCode.push('tTempContext.fill();');
    };

    Shape.prototype.draw = function(pCode, pBounds, pImages, pSkipTranslate) {
      var tStyleData = this.style;
      var tMatrix;

      pCode.push(
        'tTempContext.globalCompositeOperation = \'xor\';'
      );

      if (tStyleData.color !== null) {
        pCode.push('tTempContext.fillStyle = \'' + tStyleData.color.toString() + '\';');
      } else if (tStyleData.matrix !== null) {
        tMatrix = tStyleData.matrix;

        var tTopLeftX = -16384 * tMatrix[0] + -16384 * tMatrix[2] + tMatrix[4];
        var tTopLeftY = -16384 * tMatrix[1] + -16384 * tMatrix[3] + tMatrix[5];
        var tTopRightX = 16384 * tMatrix[0] + -16384 * tMatrix[2] + tMatrix[4];
        var tTopRightY = 16384 * tMatrix[1] + -16384 * tMatrix[3] + tMatrix[5];
        var tBottomLeftX = -16384 * tMatrix[0] + 16384 * tMatrix[2] + tMatrix[4];
        var tBottomLeftY = -16384 * tMatrix[1] + 16384 * tMatrix[3] + tMatrix[5];
        var tBottomRightX = 16384 * tMatrix[0] + 16384 * tMatrix[2] + tMatrix[4];
        var tBottomRightY = 16384 * tMatrix[1] + 16384 * tMatrix[3] + tMatrix[5];


        /*var tPoint0X = tBottomLeftX + tBottomLeftX - tTopLeftX;
        var tPoint0Y = tBottomLeftY + tBottomLeftY - tTopLeftY;
        var tPoint1X = tBottomRightX + tBottomRightX - tTopRightX;
        var tPoint1Y = tBottomRightY + tBottomRightY - tTopRightY;
        */


        var tPoint0X = -16384 * tMatrix[0] + tMatrix[4];
        var tPoint0Y = -16384 * tMatrix[1] + tMatrix[5];
        var tPoint1X = 16384 * tMatrix[0] + tMatrix[4];
        var tPoint1Y = 16384 * tMatrix[1] + tMatrix[5];


        //tPoint0X -= (tBottomLeftX - tTopLeftX) * tMatrix[2];
        //tPoint0Y -= (tBottomLeftY - tTopLeftY) * tMatrix[3];
        //tPoint1X += (tBottomRightX - tTopRightX) * tMatrix[2];
        //tPoint1Y += (tBottomRightY - tTopRightY) * tMatrix[3];

        var tStops;
        var tStop;
        var tStopsIndex;
        var tStopsLength;

        if (tStyleData.type === 0x10) { // linear gradient
          pCode.push(
            'var tStyle = tTempContext.createLinearGradient(' + tPoint0X + ', ' + tPoint0Y + ', ' + tPoint1X + ', ' + tPoint1Y + ');'
          );

          tStops = tStyleData.gradient.stops;
          for (tStopsIndex = 0, tStopsLength = tStops.length; tStopsIndex < tStopsLength; tStopsIndex++) {
            tStop = tStops[tStopsIndex];
            pCode.push('tStyle.addColorStop(' + tStop.ratio / 255 + ', \'' + tStop.color.toString() + '\');');
          }
        } else if (tStyleData.type === 0x12) { // radial gradient
          var tCircleWidth = Math.abs(tPoint1X - tPoint0X);
          var tCircleHeight = Math.abs(tPoint1Y - tPoint0Y);
          var tCircleX = tPoint0X + tCircleWidth / 2;
          var tCircleY = tPoint0Y + tCircleHeight / 2;

          tStops = tStyleData.gradient.stops;
          pCode.push(
            'var tStyle = tTempContext.createRadialGradient(' + tCircleX + ', ' + tCircleY + ', 0, ' + tCircleX + ', ' + tCircleY + ', ' + tCircleWidth / 2 + ');'
          );

          for (tStopsIndex = 0, tStopsLength = tStops.length; tStopsIndex < tStopsLength; tStopsIndex++) {
            tStop = tStops[tStopsIndex];
            pCode.push('tStyle.addColorStop(' + tStop.ratio / 255 + ', \'' + tStop.color.toString() + '\');');
          }
        } else if (tStyleData.type === 0x13) { // focal radial gradient
          console.warn('Focal radient detected. Showing it as red.');
          pCode.push('var tStyle = \'rgba(255, 0, 0, 1)\';');
        } else if (tStyleData.type === 0x40 || tStyleData.type === 0x41) { // repeating bitmap or clipped bitmap
          if (pImages[tStyleData.bitmapId] === void 0) {
            pCode.push('var tStyle = \'rgba(255, 0, 0, 1)\';');
          } else {
            pCode.push(
              'var tPatternMatrix = [' + tMatrix[0] + ', ' + tMatrix[1] + ', ' + tMatrix[2] + ', ' + tMatrix[3] + ', ' + tMatrix[4] + ', ' + tMatrix[5] + '];',
              'var tPatternStyle = tTempContext.createPattern(this.images[' + tStyleData.bitmapId + '], \'' + (tStyleData.type === 0x40 ? 'repeat' : 'no-repeat') + '\');',
              'var tStyle = \'rgba(0, 255, 0, 1)\';'
            );
          }
        }

        pCode.push('tTempContext.fillStyle = tStyle;');
      }

      pSuper.prototype.draw.call(this, pCode, pBounds, pImages, pSkipTranslate);

      if (tStyleData.bitmapId !== null && pImages[tStyleData.bitmapId] !== void 0) {
        pCode.push(
          'tTempContext.save();',
          'tTempContext.setTransform(1, 0, 0, 1, 0, 0);',
          'tTempContext.scale(.05, .05);',
          pSkipTranslate ? '' : 'tTempContext.translate(' + -pBounds.left + ',' + -pBounds.top + ');',
          'tTempContext.transform(tPatternMatrix[0], tPatternMatrix[1], tPatternMatrix[2], tPatternMatrix[3], tPatternMatrix[4], tPatternMatrix[5]);',
          'tTempContext.globalCompositeOperation = \'source-in\';',
          'tTempContext.fillStyle = tPatternStyle;',
          'tTempContext.fillRect(-16384, -16384, 32768, 32768);',
          'tTempContext.restore();'
        );
      }
    };

    return Shape;
  })(Drawable);

  /**
   * @class
   * @extends {Drawable}
   */
  var Line = (function(pSuper) {
    function Line(pStyle) {
      pSuper.call(this, pStyle);
    }

    Line.prototype = Object.create(pSuper.prototype);

    Line.prototype.paintPath = function(pCode, pPath) {
      pCode.push('tTempContext.stroke();');
    };

    Line.prototype.draw = function(pCode, pBounds, pImages, pSkipTranslate) {
      var tStyleData = this.style;

      pCode.push(
        'tTempContext.globalCompositeOperation = \'source-over\';',
        'tTempContext.lineWidth = ' + tStyleData.width + ';',
        'tTempContext.strokeStyle = \'' + tStyleData.color.toString() + '\';'
      );

      pSuper.prototype.draw.call(this, pCode, pBounds, pImages, pSkipTranslate);
    };

    return Line;
  })(Drawable);


  var getShapeDrawFunction = mShape.getShapeDrawFunction = function(pShapes, pBounds, pImages, pSkipTranslate) {
    var tWidth = Math.ceil((pBounds.right - pBounds.left) / 20);
    var tHeight = Math.ceil((pBounds.bottom - pBounds.top) / 20);
    // TODO: Account for the very small offset created by this scale.

    var i, il;
    var tShape;

    var tCode = [
      'var tContext = pData.context;',
      'var tTempCanvas = this.drawingCanvas;',
      'var tTempContext = this.drawingContext;',
      'tTempContext.save();',
      pSkipTranslate ? '' : 'tTempContext.translate(' + -pBounds.left + ',' + -pBounds.top + ');'
    ];

    for (i = 0, il = pShapes.length; i < il; i++) {
      tCode.push(
        'tTempContext.save();',
        'tTempContext.setTransform(1, 0, 0, 1, 0, 0);',
        'tTempContext.clearRect(0, 0, ' + tWidth + ', ' + tHeight + ');',
        'tTempContext.restore();'
      );

      tShape = pShapes[i];
      tShape.draw(tCode, pBounds, pImages, pSkipTranslate);

      tCode.push(
        //'console.log(tTempCanvas.width, tTempCanvas.height, ' + tWidth + ', ' + tHeight + ');',
        'tContext.drawImage(tTempCanvas, 0, 0);'
        //'tContext.drawImage(tTempCanvas, 0, 0, ' + tWidth + ', ' + tHeight + ', 0, 0, ' + tWidth + ', ' + tHeight + ');' // TODO: Is it possible to get rid of an image style way of doing this?
      );
    }

    tCode.push('tTempContext.restore();');

    return new Function('pData', tCode.join('\n'));
  };

  /**
   * Generates a new function for drawing a given shape.
   */
  mShape.generateDrawFunction = function(pImages, pShape, pSkipTranslate) {
    return getShapeDrawFunction(getResolvedShapes(pShape), pShape.bounds, pImages, pSkipTranslate);
  }


}(this));