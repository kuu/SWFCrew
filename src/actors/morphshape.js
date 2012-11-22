/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  var mProps = theatre.define('theatre.crews.swf.props');
  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers;

  var QuickSWFShape = quickswf.structs.Shape;
  var QuickSWFRect = quickswf.structs.Rect;
  var QuickSWFFillStyle = quickswf.structs.FillStyle;
  var QuickSWFLineStyle = quickswf.structs.LineStyle;
  var QuickSWFMatrix = quickswf.structs.Matrix;
  var QuickSWFRGBA = quickswf.structs.RGBA;
  var QuickSWFGradient = quickswf.structs.Gradient;
  var QuickSWFStop = quickswf.structs.Stop;
  var QuickSWFEdgeRecord = quickswf.structs.EdgeRecord;
  var QuickSWFStyleChangeRecord = quickswf.structs.StyleChangeRecord;

  var generateDrawFunction = mSWFCrew.utils.shape.generateDrawFunction;

  mActors.MorphShapeActor = MorphShapeActor;

  /**
   * @constructor
   */
  function MorphShapeActor() {
    this.base();
  }
  theatre.inherit(MorphShapeActor, mActors.ShapeActor);

  /**
   * @constructor
   */
  function MorphShapeProp(pBackingCanvas, pWidth, pHeight) {
    this.base(pBackingCanvas, pWidth, pHeight);
    this.cacheDrawResult = false;
    this.cacheWithClass = false;
  }
  theatre.inherit(MorphShapeProp, mProps.ShapeProp);

  function convertFillStyles(pMorphedFillStyles, pRatio) {
    var i, j, jl;
    var tMorphedFillStylesLength = pMorphedFillStyles.length;
    var tFillStyle;
    var tFillStyles = new Array(tMorphedFillStylesLength);
    var tMorphedFillStyle;
    var tMatrix, tStartMatrix, tEndMatrix;
    var tColor, tStartColor, tEndColor;
    var tGradient, tMorphedGradient;
    var tStops, tMorphedStops;
    var tStop, tMorphedStop;

    for (i = 0; i < tMorphedFillStylesLength; i++) {
      tFillStyle = tFillStyles[i] = new QuickSWFFillStyle(false);
      tMorphedFillStyle = pMorphedFillStyles[i];
      tFillStyle.bitmapId = tMorphedFillStyle.bitmapId;
      tFillStyle.type = tMorphedFillStyle.type;

      if (tMorphedFillStyle.startMatrix !== null) {
        tMatrix = tFillStyle.matrix = new QuickSWFMatrix();
        tStartMatrix = tMorphedFillStyle.startMatrix;
        tEndMatrix = tMorphedFillStyle.endMatrix;
        for (j = 0; j < 6; j++) {
          tMatrix[j] = tStartMatrix[j] + (tEndMatrix[j] - tStartMatrix[j]) * pRatio;
        }
      }

      if (tMorphedFillStyle.startColor !== null) {
        tColor = tFillStyle.color = new QuickSWFRGBA();
        tStartColor = tMorphedFillStyle.startColor;
        tEndColor = tMorphedFillStyle.endColor;
        tColor.red = (tStartColor.red + (tEndColor.red - tStartColor.red) * pRatio) | 0;
        tColor.green = (tStartColor.green + (tEndColor.green - tStartColor.green) * pRatio) | 0;
        tColor.blue = (tStartColor.blue + (tEndColor.blue - tStartColor.blue) * pRatio) | 0;
        tColor.alpha = (tStartColor.alpha + (tEndColor.alpha - tStartColor.alpha) * pRatio) | 0;
      }

      if (tMorphedFillStyle.gradient !== null) {
        tGradient = tFillStyle.gradient = new QuickSWFGradient();
        tMorphedGradient = tMorphedFillStyle.gradient;

        tGradient.spreadMode = tMorphedGradient.spreadMode;
        tGradient.interpolationMode = tMorphedGradient.interpolationMode;
        tGradient.focalPoint = tMorphedGradient.focalPoint;

        tStops = tGradient.stops;
        tMorphedStops = tMorphedGradient.stops;

        for (j = 0, jl = tMorphedStops.length; j < jl; j++) {
          tStop = tStops[j] = new QuickSWFStop();
          tMorphedStop = tMorphedStops[j];

          tStop.ratio = tMorphedStop.startRatio + (tMorphedStop.endRatio - tMorphedStop.startRatio) * pRatio;

          tColor = tStop.color = new QuickSWFRGBA();
          tStartColor = tMorphedStop.startColor;
          tEndColor = tMorphedStop.endColor;
          tColor.red = (tStartColor.red + (tEndColor.red - tStartColor.red) * pRatio) | 0;
          tColor.green = (tStartColor.green + (tEndColor.green - tStartColor.green) * pRatio) | 0;
          tColor.blue = (tStartColor.blue + (tEndColor.blue - tStartColor.blue) * pRatio) | 0;
          tColor.alpha = (tStartColor.alpha + (tEndColor.alpha - tStartColor.alpha) * pRatio) | 0;
        }
      }
    }

    return tFillStyles;
  }

  function convertLineStyles(pMorphedLineStyles, pRatio) {
    var i;
    var tMorphedLineStylesLength = pMorphedLineStyles.length;
    var tLineStyles = new Array(tMorphedLineStylesLength);
    var tLineStyle, tMorphedLineStyle;
    var tColor, tStartColor, tEndColor;

    for (i = 0; i < tMorphedLineStylesLength; i++) {
      tLineStyle = tLineStyles[i] = new QuickSWFLineStyle(false);
      tMorphedLineStyle = pMorphedLineStyles[i];

      tLineStyle.width = tMorphedLineStyle.startWidth + (tMorphedLineStyle.endWidth - tMorphedLineStyle.startWidth) * pRatio;

      if (tMorphedLineStyle.startColor !== null) {
        tColor = tLineStyle.color = new QuickSWFRGBA();
        tStartColor = tMorphedLineStyle.startColor;
        tEndColor = tMorphedLineStyle.endColor;
        tColor.red = (tStartColor.red + (tEndColor.red - tStartColor.red) * pRatio) | 0;
        tColor.green = (tStartColor.green + (tEndColor.green - tStartColor.green) * pRatio) | 0;
        tColor.blue = (tStartColor.blue + (tEndColor.blue - tStartColor.blue) * pRatio) | 0;
        tColor.alpha = (tStartColor.alpha + (tEndColor.alpha - tStartColor.alpha) * pRatio) | 0;
      }
    }

    return tLineStyles;
  }

  MorphShapeProp.convertBounds = function(pMorphShape, pRatio) {
    var tStartBounds = pMorphShape.startBounds;
    var tEndBounds = pMorphShape.endBounds;
    var tBounds = new QuickSWFRect();
    tBounds.left = (tStartBounds.left + ((tEndBounds.left - tStartBounds.left) * pRatio));
    tBounds.top = (tStartBounds.top + ((tEndBounds.top - tStartBounds.top) * pRatio));
    tBounds.right = (tStartBounds.right + ((tEndBounds.right - tStartBounds.right) * pRatio));
    tBounds.bottom = (tStartBounds.bottom + ((tEndBounds.bottom - tStartBounds.bottom) * pRatio));

    return tBounds;
  };

  MorphShapeProp.generateDrawFunction = function(pMorphShape, pBounds, pImages, pRatio) {
    var tShape = new QuickSWFShape();
    var tRecords = tShape.records;
    var tEdgeRecord, tStyleChangeRecord;
    var tStartRecord, tEndRecord;
    var tStartRecords = pMorphShape.startEdges;
    var tEndRecords = pMorphShape.endEdges;
    var tStartType, tEndType;
    var tNewDeltaX, tNewDeltaY;
    var i, il, j;

    tShape.fillStyles = convertFillStyles(pMorphShape.fillStyles, pRatio);
    tShape.lineStyles = convertLineStyles(pMorphShape.lineStyles, pRatio);
    tShape.bounds = pBounds;

    if (tStartRecords.length !== tEndRecords.length) {
      console.error('MorphShape edges dont match. Blowing up nicely with a blank draw.');
      return function() {};
    }

    for (i = 0, il = tStartRecords.length; i < il; i++) {
      tStartRecord = tStartRecords[i];
      tEndRecord = tEndRecords[i];

      tStartType = tStartRecord.type;
      tEndType = tEndRecord.type;

      if (tStartType === 1) { // Style Change
        if (tEndType !== 1) {
          console.error('MorphShape edge records dont match (' + tStartType + ' and ' + tEndType + '). Blowing up nicely with a blank draw.');
          return function() {};
        }

        tStyleChangeRecord = tRecords[i] = new QuickSWFStyleChangeRecord(tStartRecord.fillBits, tStartRecord.lineBits);

        tStyleChangeRecord.hasMove = tStartRecord.hasMove;
        tStyleChangeRecord.moveDeltaX = (tStartRecord.moveDeltaX + (tEndRecord.moveDeltaX - tStartRecord.moveDeltaX) * pRatio);
        tStyleChangeRecord.moveDeltaY = (tStartRecord.moveDeltaY + (tEndRecord.moveDeltaY - tStartRecord.moveDeltaY) * pRatio);
        tStyleChangeRecord.fillStyle0 = tStartRecord.fillStyle0;
        tStyleChangeRecord.fillStyle1 = tStartRecord.fillStyle1;
        tStyleChangeRecord.lineStyle = tStartRecord.lineStyle;

        if (tStartRecord.fillStyles !== null) {
          // TODO: Is this possible? Do we interpolate between them???
          console.warn('New fill styles in MorphShape');
        }

        if (tStartRecord.lineStyles !== null) {
          // TODO: Is this possible? Do we interpolate between them???
          console.warn('New line styles in MorphShape');
        }
      } else if (tStartType === 3) { // Straight edge
        if (tEndType === 2) {
          // Convert this edge to a curve.
          tNewDeltaX = tStartRecord.deltaX / 2;
          tNewDeltaY = tStartRecord.deltaY / 2;
          tEdgeRecord = tRecords[i] = new QuickSWFEdgeRecord(
            2,
            (tNewDeltaX + (tEndRecord.deltaX - tNewDeltaX) * pRatio) | 0,
            (tNewDeltaY + (tEndRecord.deltaY - tNewDeltaY) * pRatio) | 0,
            (tNewDeltaX + (tEndRecord.deltaControlX - tNewDeltaX) * pRatio) | 0,
            (tNewDeltaY + (tEndRecord.deltaControlY - tNewDeltaY) * pRatio) | 0
          );
        } else if (tEndType === 3) {
          // Just use it.
          tEdgeRecord = tRecords[i] = new QuickSWFEdgeRecord(
            3,
            (tStartRecord.deltaX + (tEndRecord.deltaX - tStartRecord.deltaX) * pRatio) | 0,
            (tStartRecord.deltaY + (tEndRecord.deltaY - tStartRecord.deltaY) * pRatio) | 0
          );
        } else {
          console.error('MorphShape edge records dont match (' + tStartType + ' and ' + tEndType + '). Blowing up nicely with a blank draw.');
          return function() {};
        }
      } else if (tStartType === 2) { // Curve edge
        if (tEndType === 3) {
          // Convert the end edge to a curve.
          tNewDeltaX = tEndRecord.deltaX / 2;
          tNewDeltaY = tEndRecord.deltaY / 2;
          tEdgeRecord = tRecords[i] = new QuickSWFEdgeRecord(
            2,
            (tStartRecord.deltaX + (tNewDeltaX - tStartRecord.deltaX) * pRatio) | 0,
            (tStartRecord.deltaY + (tNewDeltaY - tStartRecord.deltaY) * pRatio) | 0,
            (tStartRecord.deltaControlX + (tNewDeltaX - tStartRecord.deltaControlX) * pRatio) | 0,
            (tStartRecord.deltaControlY + (tNewDeltaY - tStartRecord.deltaControlY) * pRatio) | 0
          );
        } else if (tEndType === 2) {
          // Just use it.
          tEdgeRecord = tRecords[i] = new QuickSWFEdgeRecord(
            2,
            (tStartRecord.deltaX + (tEndRecord.deltaX - tStartRecord.deltaX) * pRatio) | 0,
            (tStartRecord.deltaY + (tEndRecord.deltaY - tStartRecord.deltaY) * pRatio) | 0,
            (tStartRecord.deltaControlX + (tEndRecord.deltaControlX - tStartRecord.deltaControlX) * pRatio) | 0,
            (tStartRecord.deltaControlY + (tEndRecord.deltaControlY - tStartRecord.deltaControlY) * pRatio) | 0
          );
        } else {
          console.error('MorphShape edge records dont match (' + tStartType + ' and ' + tEndType + '). Blowing up nicely with a blank draw.');
          return function() {};
        }
      }
    }

    return generateDrawFunction(pImages, tShape);
  }

  MorphShapeProp.drawFunctions = {};

  var mPreDrawBackup = mProps.ShapeProp.prototype.preDraw;

  MorphShapeProp.prototype.preDraw = function(pData) {
    var tActor = this.actor;

    if (tActor.isVisible === false) {
      return false;
    }

    var tDrawFunctions = MorphShapeProp.drawFunctions;
    var tRatio = tActor.ratio;
    var tRatioString = tRatio + '';
    var tDrawFunction;
    var tMorphShape = this.morphShape;
    var tBounds = MorphShapeProp.convertBounds(tMorphShape, tRatio);

    tActor.bounds = tBounds;

    if (!(tRatioString in tDrawFunctions)) {
      tDrawFunction = tDrawFunctions[tRatioString] = MorphShapeProp.generateDrawFunction(tMorphShape, tBounds, this.images, tRatio);
    } else {
      tDrawFunction = tDrawFunctions[tRatioString];
    }

    this.draw = tDrawFunction;

    return mPreDrawBackup.call(this, pData);
  }

  /**
   * Handles SWF MorphShapes.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {theatre.Stage} pStage The stage.
   * @param {Object} pParams An obect containing a dictionary-actor map object.
   * @param {quickswf.structs.MorphShape} pMorphShape The MorphShape to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineMorphShape'] = function(pSWF, pStage, pParams, pMorphShape, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tProto;
    var tMaxTwipsWidth = Math.max(
      pMorphShape.startBounds.right - pMorphShape.startBounds.left,
      pMorphShape.endBounds.right - pMorphShape.endBounds.left
    );
    var tMaxTwipsHeight = Math.max(
      pMorphShape.startBounds.bottom - pMorphShape.startBounds.top,
      pMorphShape.endBounds.bottom - pMorphShape.endBounds.top
    );

    var tMorphShapePropClass = function BuiltinMorphShapeProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tMorphShapePropClass, MorphShapeProp);

    tProto = tMorphShapePropClass.prototype;
    tProto.images = pSWF.images;
    tProto.morphShape = pMorphShape;

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tMaxTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tMaxTwipsHeight / 20) >>> 0) || 1;
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    var tMorphShapeActor = tDictionaryToActorMap[pMorphShape.id] = function BuiltinMorphShapeActor() {
      this.base();

      var tMorphShapeProp = new tMorphShapePropClass(pStage.backingContainer, this.width, this.height); // TODO: This feels like a hack...

      this.addProp(tMorphShapeProp);
    };
    theatre.inherit(tMorphShapeActor, MorphShapeActor);
  };
}(this));