/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers = mSWFCrew.handlers || new Array();

  mActors.ShapeActor = ShapeActor;

  /**
   * The actor for handling SWF Shapes.
   * @constructor
   * @type {theatre.crews.swf.actors.ShapeActor}
   * @extends {theatre.Actor}
   */
  function ShapeActor() {
    this.base();

    var tWidth = this.width = this.twipsWidth / 20;
    var tHeight = this.height = this.twipsHeight / 20;
  }
  theatre.inherit(ShapeActor, mSWFCrew.DisplayListActor);

  function ShapeProp(pBackingCanvas, pWidth, pHeight) {
    this.base(pBackingCanvas, pWidth, pHeight);
    this.cacheDrawResult = true;
    this.cacheWithClass = true;
  }
  theatre.inherit(ShapeProp, theatre.crews.canvas.CanvasProp);

  var mPreDrawBackup = theatre.crews.canvas.CanvasProp.prototype.preDraw;
  var mPostDrawBackup = theatre.crews.canvas.CanvasProp.prototype.postDraw;

  ShapeProp.prototype.preDraw = function(pData) {
    if (this.actor.isVisible === false) {
      return false;
    }

    var tContext = pData.context;
    var tActor = this.actor;

    tContext.save();

    tContext.translate(tActor.bounds.left, tActor.bounds.top);
    tContext.scale(20, 20);

    var tWillDraw = mPreDrawBackup.call(this, pData);

    if (tWillDraw === false) {
      pData.context.restore();
    }

    return tWillDraw;
  };

  ShapeProp.prototype.postDraw = function(pData) {
    mPostDrawBackup.call(this, pData);

    pData.context.restore();
  };

  /**
   * Generates a new function for drawing a given shape.
   * @private
   */
  ShapeActor.generateDrawFunction = function (pSWF, pShape, pPrototype) {
    var tBounds = pShape.bounds;
    var tWidth = (tBounds.right - tBounds.left) / 20;
    var tHeight = (tBounds.bottom - tBounds.top) / 20;
    // TODO: Account for the very small offset created by this scale.

    var tCode = [
      'var tContext = pData.context;',
      'var tTempCanvas = this.drawingCanvas;',
      'var tTempContext = this.drawingContext;',
      'tTempContext.save();',
      'tTempContext.translate(' + -tBounds.left + ',' + -tBounds.top + ');'
    ];

    var i, il, k, kl;

    var tFillStyles = pShape.fillStyles;
    var tLineStyles = pShape.lineStyles;

    var tFillEdges, tLineEdges;

    function populateFillBuffers() {
      tFillEdges = new Array(tFillStyles.length + 1);
      for (var i = 0, il = tFillEdges.length; i < il; i++) {
        tFillEdges[i + 1] = new Object();
      }
    }

    function populateLineBuffers() {
      tLineEdges = new Array(tLineStyles.length + 1);
      for (var i = 0, il = tLineEdges.length; i < il; i++) {
        tLineEdges[i + 1] = new Object();
      }
    }

    var tCurrentFillEdges0;
    var tCurrentFillEdges1;
    var tCurrentLineEdges;

    populateFillBuffers();
    populateLineBuffers();

    var tCurrentFillStyle0 = null;
    var tCurrentFillStyle1 = null;
    var tCurrentLineStyle = null;

    /**
     * Flushes the edges arrays in to code.
     * @param {String=line|fill} pType The type of edge.
     * @param {Object.<String, Object>} pAllPoints A map of all points to edges in this shape so far.
     * @param {Array.<Object>} pStyles The array of fill or line styles to reference from.
     * @private
     */
    function flush(pType, pAllPoints, pStyles) {
      var tFinalPointX = 0;
      var tFinalPointY = 0;
      var tPoints;
      var tPoint;

      /**
       * Finds the next edge to connect to for this shape.
       * @param {Object} pEdge The edge to search from.
       * @param {Boolean} pAIfTrue Which side of the edge to search from.
       *  Sorry, needs to be a bool for performance.
       * @private
       */
      function findNext(pEdge, pAIfTrue) {
        var tAorB = pAIfTrue === true ? 'a' : 'b';

        var tEdgeCompareX;
        var tEdgeCompareY;

        if (pAIfTrue === true) {
          tEdgeCompareX = pEdge.px;
          tEdgeCompareY = pEdge.py;
        } else {
          tEdgeCompareX = pEdge.x;
          tEdgeCompareY = pEdge.y;
        }

        var tNextPoint = tPoints[pEdge[tAorB]];
        var tNextPointEdgesLength;

        if (tNextPoint === void 0 || (tNextPointEdgesLength = tNextPoint.length) === 1) {
          if (pType === 'line') {
            tCode.push('tTempContext.stroke();');
          } else {
            console.warn('Encountered an unclosed shape! Forcing it closed!');
            tCode.push(
              'tTempContext.closePath();',
              'tTempContext.fill();'
            );
          }
          if (tNextPoint !== void 0) {
            // Remove the base edge as we already used it.
            var tIndex = tNextPoint.indexOf(pEdge);
            if (tIndex !== -1) {
              tNextPoint.splice(tIndex, 1);
              delete tPoints[pEdge[tAorB]];
            }
          }
          return;
        }

        // Remove the base edge as we already used it.
        var tIndex = tNextPoint.indexOf(pEdge);
        if (tIndex === -1) {
          console.error('Could not find edge that has to be there. Error with algorithm!');
        }
        tNextPoint.splice(tIndex, 1);

        for (var i = 0; i < tNextPointEdgesLength; i++) {
          var tNextEdge = tNextPoint[i];
          var tEdgeType = tNextEdge.type;

          // We used this edge, remove it.
          tNextPoint.splice(i, 1);

          if (tNextPointEdgesLength === 2) {
            // We use 2 because we calculated this before.
            // If there are not more edges on this point
            // there would have been 2 edges when we started
            // this function. Meaning we now have 0.
            delete tPoints[pEdge[pAIfTrue === true ? 'a' : 'b']];
          }

          // Next we try to figure out which data (a or b) to use.
          if (tEdgeCompareX === tNextEdge.x && tEdgeCompareY === tNextEdge.y) {
            // We use a.

            // Draw the current edge.
            if (tEdgeType === 2) { // Curve
              tCode.push('tTempContext.quadraticCurveTo(' + tNextEdge.controlX + ', ' + tNextEdge.controlY + ', ' + tNextEdge.px + ', ' + tNextEdge.py + ');');
            } else if (tEdgeType === 3) { // Straight
              tCode.push('tTempContext.lineTo(' + tNextEdge.px + ', ' + tNextEdge.py + ');');
            }

            // Check if have completed a shape.
            if (tFinalPointX === tNextEdge.px && tFinalPointY === tNextEdge.py) {
              // We have completed a shape!
              if (pType === 'line') {
                tCode.push('tTempContext.stroke();');
              } else {
                tCode.push(
                  'tTempContext.fill();'
                );
              }

              // Clean things up as we have now used this edge.
              tIndex = tPoint.indexOf(tNextEdge);
              if (tIndex === -1) {
                console.error('Major error in shape algorithm. Last edge is not in first point array.');
              }
              tPoint.splice(tIndex, 1);

              if (tPoint.length === 0) {
                delete tPoints[tNextEdge.a];
              }
              return;
            } else {
              findNext(tNextEdge, true);
            }
          } else {
            // We use b.

            // Draw the current edge.
            if (tEdgeType === 2) { // Curve
              tCode.push('tTempContext.quadraticCurveTo(' + tNextEdge.controlX + ', ' + tNextEdge.controlY + ', ' + tNextEdge.x + ', ' + tNextEdge.y + ');');
            } else if (tEdgeType === 3) { // Straight
              tCode.push('tTempContext.lineTo(' + tNextEdge.x + ', ' + tNextEdge.y + ');');
            }

            // Check if have completed a shape.
            if (tFinalPointX === tNextEdge.x && tFinalPointY === tNextEdge.y) {
              // We have completed a shape!
              if (pType === 'line') {
                tCode.push('tTempContext.stroke();');
              } else {
                tCode.push(
                  'tTempContext.fill();'
                );
              }

              // Clean things up as we have now used this edge.
              tIndex = tPoint.indexOf(tNextEdge);
              if (tIndex === -1) {
                console.error('Major error in shape algorithm. Last edge is not in first point array.');
              }
              tPoint.splice(tIndex, 1);

              if (tPoint.length === 0) {
                delete tPoints[tNextEdge.b];
              }
              return;
            } else {
              findNext(tNextEdge, false);
            }

          }

          break; // TODO: Need to choose which edge is the CORRECT one. Right now we just choose the first.
        }
      }


      for (var i = 1, il = pAllPoints.length; i < il; i++) {
        tPoints = pAllPoints[i];

        if (Object.keys(tPoints).length === 0) {
          continue;
        }

        var tStyleData = pStyles[i - 1];

        if (pType === 'line') {
          tCode.push(
            'tTempContext.globalCompositeOperation = \'source-over\';',
            'tTempContext.save();',
            'tTempContext.setTransform(1, 0, 0, 1, 0, 0);',
            'tTempContext.clearRect(0, 0, ' + tWidth + ', ' + tHeight + ');',
            'tTempContext.restore()',
            'tTempContext.lineWidth = ' + tStyleData.width + ';',
            'tTempContext.strokeStyle = \'' + tStyleData.color.toString() + '\';'
          );
        } else {
          tCode.push(
            'tTempContext.globalCompositeOperation = \'xor\';',
            'tTempContext.save();',
            'tTempContext.setTransform(1, 0, 0, 1, 0, 0);',
            'tTempContext.clearRect(0, 0, ' + tWidth + ', ' + tHeight + ');',
            'tTempContext.restore()'
          );

          if (tStyleData.color !== null) {
            tCode.push('tTempContext.fillStyle = \'' + tStyleData.color.toString() + '\';');
          } else if (tStyleData.matrix !== null) {
            var tMatrix = tStyleData.matrix;

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
              tCode.push(
                'var tStyle = tTempContext.createLinearGradient(' + tPoint0X + ', ' + tPoint0Y + ', ' + tPoint1X + ', ' + tPoint1Y + ');'
              );

              tStops = tStyleData.gradient.stops;
              for (tStopsIndex = 0, tStopsLength = tStops.length; tStopsIndex < tStopsLength; tStopsIndex++) {
                tStop = tStops[tStopsIndex];
                tCode.push('tStyle.addColorStop(' + tStop.ratio / 255 + ', \'' + tStop.color.toString() + '\');');
              }
            } else if (tStyleData.type === 0x12) { // radial gradient
              var tCircleWidth = Math.abs(tPoint1X - tPoint0X);
              var tCircleHeight = Math.abs(tPoint1Y - tPoint0Y);
              var tCircleX = tPoint0X + tCircleWidth / 2;
              var tCircleY = tPoint0Y + tCircleHeight / 2;

              tStops = tStyleData.gradient.stops;
              tCode.push(
                'var tStyle = tTempContext.createRadialGradient(' + tCircleX + ', ' + tCircleY + ', 0, ' + tCircleX + ', ' + tCircleY + ', ' + tCircleWidth / 2 + ');'
              );

              for (tStopsIndex = 0, tStopsLength = tStops.length; tStopsIndex < tStopsLength; tStopsIndex++) {
                tStop = tStops[tStopsIndex];
                tCode.push('tStyle.addColorStop(' + tStop.ratio / 255 + ', \'' + tStop.color.toString() + '\');');
              }
            } else if (tStyleData.type === 0x13) { // focal radial gradient
              console.warn('Focal radient detected. Showing it as red.');
              tCode.push('var tStyle = \'rgba(255, 0, 0, 1)\';');
            } else if (tStyleData.type === 0x40 || tStyleData.type === 0x41) { // repeating bitmap or clipped bitmap
              if (pSWF.images[tStyleData.bitmapId] === void 0) {
                tCode.push('var tStyle = \'rgba(255, 0, 0, 1)\';');
              } else {
                if (pPrototype.images === void 0) {
                  pPrototype.images = new Object();
                }
                pPrototype.images[tStyleData.bitmapId] = pSWF.images[tStyleData.bitmapId];

                tCode.push(
                  'var tPatternMatrix = [' + tMatrix[0] + ', ' + tMatrix[1] + ', ' + tMatrix[2] + ', ' + tMatrix[3] + ', ' + tMatrix[4] + ', ' + tMatrix[5] + '];',
                  'var tPatternStyle = tTempContext.createPattern(this.images[' + tStyleData.bitmapId + '], \'' + (tStyleData.type === 0x40 ? 'repeat' : 'no-repeat') + '\');',
                  'var tStyle = \'rgba(0, 255, 0, 1)\';'
                );
              }
            }

            tCode.push('tTempContext.fillStyle = tStyle;');
          }
        }

        tFinalPointX = 0;
        tFinalPointY = 0;

        // Go through all the points (each key is a string point of (x,y)).
        while (Object.keys(tPoints).length > 0) {
          for (var k in tPoints) {
            var tEdgeMain;
            var tEdgeType;

            tPoint = tPoints[k];
            // Every point needs at least 2 edges attached to it.
            if (tPoint.length === 1) {
              tEdgeMain = tPoint[0];

              if (pType === 'line') {
                tEdgeType = tEdgeMain.type;

                tCode.push(
                  'tTempContext.beginPath();',
                  'tTempContext.moveTo(' + tEdgeMain.px + ', ' + tEdgeMain.py + ');'
                );

                if (tEdgeType === 2) { // Curve
                  tCode.push('tTempContext.quadraticCurveTo(' + tEdgeMain.controlX + ', ' + tEdgeMain.controlY + ', ' + tEdgeMain.x + ', ' + tEdgeMain.y + ');');
                } else if (tEdgeType === 3) { // Straight
                  tCode.push('tTempContext.lineTo(' + tEdgeMain.x + ', ' + tEdgeMain.y + ');');
                }

                tCode.push('tTempContext.stroke();');
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

            tCode.push(
              'tTempContext.beginPath();',
              'tTempContext.moveTo(' + tEdgeMain.px + ', ' + tEdgeMain.py + ');'
            );

            if (tEdgeType === 2) { // Curve
              tCode.push('tTempContext.quadraticCurveTo(' + tEdgeMain.controlX + ', ' + tEdgeMain.controlY + ', ' + tEdgeMain.x + ', ' + tEdgeMain.y + ');');
            } else if (tEdgeType === 3) { // Straight
              tCode.push('tTempContext.lineTo(' + tEdgeMain.x + ', ' + tEdgeMain.y + ');');
            }

            // Start searching from the b point of the edge.
            findNext(tEdgeMain, false);
          }

          if (tStyleData.bitmapId !== null && pSWF.images[tStyleData.bitmapId] !== void 0) {
            tCode.push(
              'tTempContext.save();',
              'tTempContext.setTransform(1, 0, 0, 1, 0, 0);',
              'tTempContext.scale(.05, .05);',
              'tTempContext.translate(' + -tBounds.left + ',' + -tBounds.top + ');',
              'tTempContext.transform(tPatternMatrix[0], tPatternMatrix[1], tPatternMatrix[2], tPatternMatrix[3], tPatternMatrix[4], tPatternMatrix[5]);',
              'tTempContext.globalCompositeOperation = \'source-in\';',
              'tTempContext.fillStyle = tPatternStyle;',
              'tTempContext.fillRect(-16384, -16384, 32768, 32768);',
              'tTempContext.restore();'
            );
          }

          tCode.push(
            'tContext.drawImage(tTempCanvas, 0, 0);' // TODO: Is it possible to get rid of an image style way of doing this?
          );
        }
      }
    }

    var tRecords = pShape.records;

    var tX = 0;
    var tY = 0;
    var tPreviousX = 0;
    var tPreviousY = 0;

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

    for (i = 0, il = tRecords.length; i < il; i++) {
      var tRecord = tRecords[i];
      var tType = tRecord.type;
      tPreviousX = tX;
      tPreviousY = tY;
      var tNewData;

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
          flush('fill', tFillEdges, tFillStyles);
          tFillStyles = tRecord.fillStyles;
          populateFillBuffers();
        }

        if (tRecord.lineStyles !== null) {
          flush('line', tLineEdges, tLineStyles);
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

    flush('fill', tFillEdges, tFillStyles);
    flush('line', tLineEdges, tLineStyles);

    tCode.push('tTempContext.restore();');

    return eval('(function(pData) {\n' + tCode.join('\n') + '\n})');
  }

  /**
   * Handles SWF Shapes.
   * The 2 is the displayList code for shapes in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object} pParams An obect containing a dictionary-actor map object.
   * @param {quickswf.Sprite} pSprite The Shape to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers[2] = function(pSWF, pStage, pParams, pShape, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tActions = mSWFCrew.actions;
    var tProto;
    var tTwipsWidth = pShape.bounds.right - pShape.bounds.left;
    var tTwipsHeight = pShape.bounds.bottom - pShape.bounds.top;

    var tShapePropClass = ShapeActor.propClass = function BuiltinShapeProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tShapePropClass, ShapeProp);

    tProto = tShapePropClass.prototype;

    tProto.draw = ShapeActor.generateDrawFunction(pSWF, pShape, tProto);

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tTwipsHeight / 20) >>> 0) || 1;
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    var tShapeActor = tDictionaryToActorMap[pShape.id] = function BuiltinShapeActor() {
      this.base();

      var tShapeProp = new tShapePropClass(pStage.backingContainer, this.width, this.height); // TODO: This feels like a hack...

      this.addProp(tShapeProp);
    };
    theatre.inherit(tShapeActor, ShapeActor);

    tProto = tShapeActor.prototype;

    tProto.twipsWidth = tTwipsWidth;
    tProto.twipsHeight = tTwipsHeight;
    tProto.bounds = pShape.bounds;

  };

}(this));
