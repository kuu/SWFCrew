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
  var MorphShapeProp = mSWFCrew.props.MorphShapeProp;

  /**
   * Handles SWF MorphShapes.
   * @param {quickswf.structs.MorphShape} pMorphShape The MorphShape to handle.
   */
  mHandlers['DefineMorphShape'] = function(pMorphShape) {
    var tDictionaryToActorMap = this.actorMap;
    tDictionaryToActorMap[pMorphShape.id] = {clazz: null, singleton: false};
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
    tProto.images = this.swf.mediaLoader;
    tProto.morphShape = pMorphShape;

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tMaxTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tMaxTwipsHeight / 20) >>> 0) || 1;
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    var tMorphShapeActor = tDictionaryToActorMap[pMorphShape.id].clazz = function BuiltinMorphShapeActor(pPlayer) {
      this.base(pPlayer);

      var tMorphShapeProp = new tMorphShapePropClass(pPlayer.backingContainer, this.width, this.height); // TODO: This feels like a hack...

      this.addProp(tMorphShapeProp);
    };
    theatre.inherit(tMorphShapeActor, MorphShapeActor);

    var tTempShape = new QuickSWFShape();
    tTempShape.bounds = pMorphShape.startBounds;
    var tStartRecords = tTempShape.records = pMorphShape.startEdges;
    tTempShape.fillStyles = pMorphShape.fillStyles;
    tTempShape.lineStyles = pMorphShape.lineStyles;

    tMorphShapeActor.prototype.startDrawables = mShapeUtils.getResolvedDrawables(tTempShape);

    tTempShape = new QuickSWFShape();
    tTempShape.bounds = pMorphShape.endBounds;
    var tEndRecords = tTempShape.records = pMorphShape.endEdges;
    tTempShape.fillStyles = pMorphShape.fillStyles;
    tTempShape.lineStyles = pMorphShape.lineStyles;
    var tEndRecord, tStartRecord;

    // Copy all style changes to the end records.
    for (var i = 0, il = tEndRecords.length; i < il; i++) {
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

    tMorphShapeActor.prototype.endDrawables = mShapeUtils.getResolvedDrawables(tTempShape);
  };
}(this));
