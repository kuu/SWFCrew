/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;
  var mProps = theatre.crews.swf.props;
  var mSWFCrew = theatre.crews.swf;
  var mMorphShapeUtils = mSWFCrew.utils.morphshapes;

  /**
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var MorphShapeRenderProp = (function(pSuper) {
    function MorphShapeRenderProp(pWidth, pHeight) {
      pSuper.call(this);
    }

    MorphShapeRenderProp.prototype = Object.create(pSuper.prototype);
    MorphShapeRenderProp.prototype.constructor = MorphShapeRenderProp;

    MorphShapeRenderProp.prototype.render = function(pData) {
      if (pSuper.prototype.render.call(this, pData) === false) {
        return false;
      }

      var tActor = this.actor;
      var tContext = this.context;

      var tStartBounds = tActor.startBounds;
      var tEndBounds = tActor.endBounds;

      var tRatio = tActor.ratio;

      var tRenderable = tActor.player.loader.getActorRenderableCache(tActor.displayListId);

      tContext.matrix.translate(
        tStartBounds.left + (tEndBounds.left - tStartBounds.left) * tRatio,
        tStartBounds.top + (tEndBounds.top - tStartBounds.top) * tRatio
      );

      tContext.matrix.scale(20, 20);

      if (tRenderable.ratio !== tRatio) {
        this.updateRenderable(tRenderable);
      }

      tContext.render(tRenderable);
    };

    MorphShapeRenderProp.prototype.updateRenderable = function(pRenderable) {
      var tActor = this.actor;
      var tRatio = tActor.ratio;
      var tRecords = mMorphShapeUtils.interpolateRecords(tActor.startCanvasRecords, tActor.endCanvasRecords, tRatio);
      pRenderable.canvas.records = tRecords;
      pRenderable.ratio = tRatio;
      pRenderable.isPrepared = false;
    };

    return MorphShapeRenderProp;
  })(mSWFCrew.props.DisplayListRenderProp);

  mProps.MorphShapeRenderProp = MorphShapeRenderProp;
}(this));