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
  var ShapeRenderProp = mSWFCrew.props.ShapeRenderProp;
  var Canvas = global.benri.draw.Canvas;
  var CanvasRenderable = global.benri.render.CanvasRenderable;

  /**
   * Handles SWF Shapes.
   * @param {quickswf.structs.Shape} pShape The Shape to handle.
   */
  mHandlers['DefineShape'] = function(pShape) {
    var tActorMap = this.actorMap;
    var tId = pShape.id;
    var tBounds = pShape.bounds;
    var tTwipsWidth = tBounds.right - tBounds.left;
    var tTwipsHeight = tBounds.bottom - tBounds.top;
    var tPixelWidth = (tTwipsWidth / 20 | 0) + 1;
    var tPixelHeight = (tTwipsHeight / 20 | 0) + 1

    var tCanvas = new Canvas(tPixelWidth, tPixelHeight);

    mShapeUtils.drawShape(pShape, tCanvas, this.swf.mediaLoader);

    /**
     * @class
     * @extends {theatre.crews.swf.actors.ShapeActor}
     */
    var BuiltinShapeActor = this.actorMap[tId] = (function(pSuper) {
      function BuiltinShapeActor(pPlayer) {
        pSuper.call(this, pPlayer);
        this.addProp(new ShapeRenderProp(this.pixelWidth, this.pixelHeight));
      }

      BuiltinShapeActor.prototype = Object.create(pSuper.prototype);
      BuiltinShapeActor.prototype.constructor = BuiltinShapeActor;

      BuiltinShapeActor.prototype.bounds = tBounds;
      BuiltinShapeActor.prototype.twipsWidth = tTwipsWidth;
      BuiltinShapeActor.prototype.twipsHeight = tTwipsHeight;
      BuiltinShapeActor.prototype.pixelWidth = tPixelWidth;
      BuiltinShapeActor.prototype.pixelHeight = tPixelHeight;

      return BuiltinShapeActor;
    })(theatre.crews.swf.actors.ShapeActor);

    BuiltinShapeActor.prototype.displayListId = tId;

    this.setActorRenderableCache(tId, new CanvasRenderable(tCanvas));
  };

}(this));
