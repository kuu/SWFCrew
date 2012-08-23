(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers = mSWFCrew.handlers || new Array();


  /**
   * Initializer used for all types of shapes.
   * @private
   */
  function initializer(pOptions, pStage, pLayer, pParent, pName) {
    this.width = this.twipsWidth / 20;
    this.height = this.twipsHeight / 20;
  }

  /**
   * Generates a new function for drawing a given shape.
   * @private
   */
  function generateDrawFunction(pSWF, pShape) {
    var tBounds = pShape.bounds;
    var tWidth = (tBounds.right - tBounds.left) / 20;
    var tHeight = (tBounds.bottom - tBounds.top) / 20;
    // TODO: Account for the very small offset created by this scale.

    var tCode = [
      //'pContext.translate(' + (tBounds.left) + ',' + (tBounds.top) + ');',
      'var tTempCanvas = document.createElement(\'canvas\');',
      'tTempCanvas.width = ' + tWidth + ';',
      'tTempCanvas.height = ' + tHeight + ';',
      'var tTempContext = tTempCanvas.getContext(\'2d\');',
      'tTempContext.globalCompositeOperation = \'xor\';',
      'tTempContext.scale(.05, .05);'
    ];

    var i, il, k, kl;

    var tFillStyles = pShape.fillStyles;
    var tLineStyles = pShape.lineStyles;

    var tFillEdges, tLineEdges;

    function populateFillBuffers() {
      tFillEdges = new Array(tFillStyles.length + 1);
      for (var i = 0, il = tFillEdges.length; i < il; i++) {
        tFillEdges[i + 1] = new Array();
      }
    }

    function populateLineBuffers() {
      tLineEdges = new Array(tLineStyles.length + 1);
      for (var i = 0, il = tLineEdges.length; i < il; i++) {
        tLineEdges[i + 1] = new Array();
      }
    }

    var tCurrentFillEdges0, tCurrentFillEdges1;

    var tCurrentLineEdges;

    populateFillBuffers();
    populateLineBuffers();

    var tCurrentFillStyle0 = null;
    var tCurrentFillStyle1 = null;
    var tCurrentLineStyle = null;

    function flush(pType, pAllEdges, pStyles, pX, pY) {
      for (var i = 1, il = pAllEdges.length; i < il; i++) {
        var tEdges = pAllEdges[i];
        if (tEdges.length === 0) continue;
        tCode.push(
          'tTempContext.clearRect(0, 0, ' + tWidth + ', ' + tHeight + ');',
          'tTempContext.' + pType + 'Style = "' + pStyles[i - 1].color.toString() + '";',
          'tTempContext.beginPath();',
          'tTempContext.moveTo(' + pX + ', ' + pY + ');'
        );
    
        var tFinalPointX = pX;
        var tFinalPointY = pY;
        var tNeedsReset = (pX === 0 && pY === 0) ? true : false;

        for (var k = 0, kl = tEdges.length; k < kl; k++) {
          var tEdge = tEdges[k];
          var tStartX = pX;
          var tStartY = pY;
          var tEndX;
          var tEndY;
          var tEdgeType = tEdge.type;

          if (tEdgeType === 2) { // Curve
            tEndX = tStartX + tEdge.deltaControlX + tEdge.deltaX;
            tEndY = tStartY + tEdge.deltaControlY + tEdge.deltaY;
            tCode.push('tTempContext.quadraticCurveTo(' + (tStartX + tEdge.deltaControlX) + ', ' + (tStartY + tEdge.deltaControlY) + ', ' + tEndX + ', ' + tEndY + ');');
          } else if (tEdgeType === 3) { // Straight
            tEndX = tStartX + tEdge.deltaX;
            tEndY = tStartY + tEdge.deltaY;

            tCode.push('tTempContext.lineTo(' + tEndX + ', ' + tEndY + ');');
          } else if (tEdgeType === 1) { // Move
            tEndX = tStartX + tEdge.deltaX;
            tEndY = tStartY + tEdge.deltaY;

            if (tNeedsReset === true) {
              tCode.push(
                'tTempContext.beginPath();'
              );
              tFinalPointX = tEndX;
              tFinalPointY = tEndY;
              tNeedsReset = false;
            }

            tCode.push('tTempContext.moveTo(' + tEndX + ', ' + tEndY + ');');
          }

          pX = tEndX;
          pY = tEndY;


          if (tNeedsReset === false && tEdgeType !== 1 && pX === tFinalPointX && pY === tFinalPointY) {
            tCode.push('tTempContext.' + (pType === 'line' ? 'stroke' : pType) + '();');
            tNeedsReset = true;
          }
        }

        tCode.push(
          'pContext.scale(20, 20);',
          'pContext.drawImage(tTempContext.canvas, 0, 0);',
          'pContext.scale(.05, .05);'
        );
      }

      return [pX, pY];
    }

    var tRecords = pShape.records;

    var tX = 0;
    var tY = 0;

    for (i = 0, il = tRecords.length; i < il; i++) {
      var tRecord = tRecords[i];
      var tType = tRecord.type;
      if (tType === 2) { // Curve
          if (tCurrentFillStyle0 > 0) {
            tCurrentFillEdges0.push(tRecord);
          }
          if (tCurrentFillStyle1 > 0) {
            tCurrentFillEdges1.push(tRecord);
          }
      } else if (tType === 3) { // Straight
          if (tCurrentFillStyle0 > 0) {
            tCurrentFillEdges0.push(tRecord);
          }
          if (tCurrentFillStyle1 > 0) {
            tCurrentFillEdges1.push(tRecord);
          }
      } else if (tType === 1) { // Change
        if (tRecord.fillStyles !== null) {
          var tNewPoints = flush('fill', tFillEdges, tFillStyles, tX, tY);
          tX = tNewPoints[0];
          tY = tNewPoints[1];
          tFillStyles = tRecord.fillStyles;
          populateFillBuffers();
        }

        if (tRecord.lineStyles !== null) {
          var tNewPoints = flush('line', tLineEdges, tLineStyles, tX, tY);
          tX = tNewPoints[0];
          tY = tNewPoints[1];
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

        if (tCurrentFillEdges0) {
          tCurrentFillEdges0.push({
            type: 1,
            deltaX: tRecord.moveDeltaX,
            deltaY: tRecord.moveDeltaY
          });
        }

        if (tCurrentFillEdges1) {
          tCurrentFillEdges1.push({
            type: 1,
            deltaX: tRecord.moveDeltaX,
            deltaY: tRecord.moveDeltaY
          });
        }

        if (tCurrentLineEdges) {
          tCurrentLineEdges.push({
            type: 1,
            deltaX: tRecord.moveDeltaX,
            deltaY: tRecord.moveDeltaY
          });
        }
      }
    }

    flush('fill', tFillEdges, tFillStyles, tX, tY);
    flush('line', tLineEdges, tLineStyles, tX, tY);

    var tFunction = eval('(function(pContext) {\n' + tCode.join('\n') + '\n})');

    return tFunction;
  }

  /**
   * Handles SWF Shapes.
   * The 2 is the displayList code for shapes in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object.<String, theatre.Actor>} pDictionaryToActorMap A map holding mappings for dictionary objects to Actor classes.
   * @param {quickswf.Sprite} pSprite The Shape to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers[2] = function(pSWF, pDictionaryToActorMap, pShape, pOptions) {
    var tActions = mSWFCrew.actions;
    var tShapeActor = pDictionaryToActorMap[pShape.id] = theatre.createActor(
      'Shape_' + pShape.id,
      theatre.crews.canvas.CanvasActor,
      initializer
    );
    
    var tProto = tShapeActor.prototype;

    tProto.draw = generateDrawFunction(pSWF, pShape);

    tProto.twipsWidth = pShape.bounds.right - pShape.bounds.left;
    tProto.twipsHeight = pShape.bounds.bottom - pShape.bounds.top;
  };

}(this));
