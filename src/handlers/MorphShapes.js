/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers;
  var QuickSWFShape = quickswf.structs.Shape;
  var mShapeUtils = mSWFCrew.utils.shape;
  var MorphShapeActor = mSWFCrew.actors.MorphShapeActor;
  var MorphShapeRenderProp = mSWFCrew.props.MorphShapeRenderProp;
  var Canvas = global.benri.draw.Canvas;
  var CanvasRenderable = global.benri.render.CanvasRenderable;
  var mMorphShapeUtils = mSWFCrew.utils.morphshapes;

  /**
   * Handles SWF MorphShapes.
   * @param {quickswf.structs.MorphShape} pMorphShape The MorphShape to handle.
   */
  mHandlers['DefineMorphShape'] = function(pMorphShape) {
    var tActorMap = this.actorMap;
    var tId = pMorphShape.id;

    var tStartBounds = pMorphShape.startBounds;
    var tEndBounds = pMorphShape.endBounds;

    var tTwipsWidth = Math.max(
      tStartBounds.right - tStartBounds.left,
      tEndBounds.right - tEndBounds.left
    );
    var tTwipsHeight = Math.max(
      tStartBounds.bottom - tStartBounds.top,
      tEndBounds.bottom - tEndBounds.top
    );

    var tPixelWidth = (tTwipsWidth / 20 | 0) + 1;
    var tPixelHeight = (tTwipsHeight / 20 | 0) + 1

    /**
     * @class
     * @extends {theatre.crews.swf.actors.ShapeActor}
     */
    var BuiltinMorphShapeActor = this.actorMap[tId] = (function(pSuper) {
      function BuiltinMorphShapeActor(pPlayer) {
        pSuper.call(this, pPlayer);
        this.addProp(new MorphShapeRenderProp(this.pixelWidth, this.pixelHeight));
      }

      BuiltinMorphShapeActor.prototype = Object.create(pSuper.prototype);
      BuiltinMorphShapeActor.prototype.constructor = BuiltinMorphShapeActor;

      BuiltinMorphShapeActor.prototype.startBounds = tStartBounds;
      BuiltinMorphShapeActor.prototype.endBounds = tEndBounds;
      BuiltinMorphShapeActor.prototype.twipsWidth = tTwipsWidth;
      BuiltinMorphShapeActor.prototype.twipsHeight = tTwipsHeight;
      BuiltinMorphShapeActor.prototype.pixelWidth = tPixelWidth;
      BuiltinMorphShapeActor.prototype.pixelHeight = tPixelHeight;

      return BuiltinMorphShapeActor;
    })(theatre.crews.swf.actors.ShapeActor);

    BuiltinMorphShapeActor.prototype.displayListId = tId;

    var tCanvas = new Canvas(tPixelWidth, tPixelHeight);

    var tConvertedFillStyles = mMorphShapeUtils.convertFillStyles(pMorphShape.fillStyles);
    var tConvertedLineStyles = mMorphShapeUtils.convertLineStyles(pMorphShape.lineStyles);

    var tTempShape = new QuickSWFShape();
    tTempShape.bounds = tStartBounds;
    var tStartRecords = tTempShape.records = pMorphShape.startEdges;
    tTempShape.fillStyles = tConvertedFillStyles[0];
    tTempShape.lineStyles = tConvertedLineStyles[0];

    mShapeUtils.drawShape(tTempShape, tCanvas, this.swf.mediaLoader);

    BuiltinMorphShapeActor.prototype.startCanvasRecords = tCanvas.records.slice(0);

    // We will probably use this shape (the first one) the most. Cache it.
    var tRenderable = new CanvasRenderable(tCanvas);
    tRenderable.ratio = 0;
    this.setActorRenderableCache(tId, tRenderable);

    tCanvas = new Canvas(tPixelWidth, tPixelHeight);

    tTempShape = new QuickSWFShape();
    tTempShape.bounds = tEndBounds;
    var tEndRecords = tTempShape.records = pMorphShape.endEdges;
    tTempShape.fillStyles = tConvertedFillStyles[1];
    tTempShape.lineStyles = tConvertedLineStyles[1];
    var tEndRecord, tStartRecord;
    var i, il;

    // Copy all style changes to the end records.
    for (i = 0, il = tEndRecords.length; i < il; i++) {
      tEndRecord = tEndRecords[i];
      if (tEndRecord.type === 1) {
        tStartRecord = tStartRecords[i];
        tEndRecord.fillStyle0 = tStartRecord.fillStyle0;
        tEndRecord.fillStyle1 = tStartRecord.fillStyle1;
        tEndRecord.lineStyle = tStartRecord.lineStyle;
        tEndRecord.fillStyles = tStartRecord.fillStyles;
        tEndRecord.lineStyles = tStartRecord.lineStyles;
      }
    }

    mShapeUtils.drawShape(tTempShape, tCanvas, this.swf.mediaLoader);

    BuiltinMorphShapeActor.prototype.endCanvasRecords = tCanvas.records.slice(0);

    tCanvas = null;
  };
}(this));
