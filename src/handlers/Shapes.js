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
  var mShapeUtils = mSWFCrew.utils.shape;
  var ShapeActor = mSWFCrew.actors.ShapeActor;
  var ShapeProp = mSWFCrew.props.ShapeProp;

  /**
   * Handles SWF Shapes.
   * @param {quickswf.structs.Shape} pShape The Shape to handle.
   */
  mHandlers['DefineShape'] = function(pShape) {
    var tDictionaryToActorMap = this.actorMap;
    var tProto;
    var tTwipsWidth = pShape.bounds.right - pShape.bounds.left;
    var tTwipsHeight = pShape.bounds.bottom - pShape.bounds.top;

    var tShapePropClass = function BuiltinShapeProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tShapePropClass, ShapeProp);

    tProto = tShapePropClass.prototype;

    tProto.images = this.swf.mediaLoader;
    tProto.draw = mShapeUtils.generateDrawFunction(this.swf.mediaLoader, pShape);

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = (((tTwipsWidth / 20) >>> 0) || 0) + 1;
    tCanvas.height = (((tTwipsHeight / 20) >>> 0) || 0) + 1;
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    var tShapeActor = tDictionaryToActorMap[pShape.id] = function BuiltinShapeActor(pPlayer) {
      this.base(pPlayer);

      var tShapeProp = new tShapePropClass(pPlayer.backingContainer, this.width, this.height);

      this.addProp(tShapeProp);
    };
    theatre.inherit(tShapeActor, ShapeActor);

    tProto = tShapeActor.prototype;

    tProto.twipsWidth = tTwipsWidth;
    tProto.twipsHeight = tTwipsHeight;
    tProto.bounds = pShape.bounds;
  };

}(this));
