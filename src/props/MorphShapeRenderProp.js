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
   * The class responsible for rendering MorphShapes.
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var MorphShapeRenderProp = (function(pSuper) {
    function MorphShapeRenderProp(pWidth, pHeight) {
      pSuper.call(this);
    }

    MorphShapeRenderProp.prototype = Object.create(pSuper.prototype);
    MorphShapeRenderProp.prototype.constructor = MorphShapeRenderProp;

    /**
     * @inheritDoc
     */
    MorphShapeRenderProp.prototype.render = function(pData) {
      // If super returns false, we abort rendering.
      if (pSuper.prototype.render.call(this, pData) === false) {
        return false;
      }

      var tActor = this.actor;
      var tContext = this.context;

      var tStartBounds = tActor.startBounds;
      var tEndBounds = tActor.endBounds;

      /**
       * The current ratio for interpolating the shape.
       * @type {number}
       */
      var tRatio = tActor.ratio;

      /**
       * We have previously created a cache for this prop. Grab it.
       * We created it in the Handler for Shapes (DefineMorphShape).
       * This cache might be invalid now if the ratio is different.
       * We check that just below here.
       * @type {benri.render.Renderable}
       */
      var tRenderable = tActor.player.loader.getActorRenderableCache(tActor.displayListId);

      // Offset by the Shapes bounds.
      // We do this because when boudns are negative they would be
      // drawn off of the Canvas.
      // To counteract that, in the drawing code we have translated
      // by the negative of the bounds.
      // Here we offset that negative translation to bring it back in place.
      tContext.matrix.translate(
        tStartBounds.left + (tEndBounds.left - tStartBounds.left) * tRatio,
        tStartBounds.top + (tEndBounds.top - tStartBounds.top) * tRatio
      );

      // We are rendering a bitmap in the end, so revert the matrix back to normal
      // temporarily.
      tContext.matrix.scale(20, 20);

      // If the current ratio is different than the cached one,
      // we need to regenerate our cache.
      // TODO: There might be a more efficient way of doing this.
      if (tRenderable.ratio !== tRatio) {
        this.updateRenderable(tRenderable);
      }

      // Render the Renderable.
      tContext.render(tRenderable);
    };

    /**
     * Updates the cache of the given Renderable with the current ratio.
     * @param  {benri.render.Renderable} pRenderable The Renderable to be updated.
     */
    MorphShapeRenderProp.prototype.updateRenderable = function(pRenderable) {
      var tActor = this.actor;
      var tRatio = tActor.ratio;
      // Interpolate between records with the current ratio.
      var tRecords = mMorphShapeUtils.interpolateRecords(tActor.startCanvasRecords, tActor.endCanvasRecords, tRatio);

      // Replace our Canvas's records with the interpolated ones.
      pRenderable.canvas.records = tRecords;
      pRenderable.ratio = tRatio;

      // Make sure we tell the RenderContext that this Renderable
      // needs to have it's prepare() function called again.
      pRenderable.isPrepared = false;
    };

    return MorphShapeRenderProp;
  })(mSWFCrew.props.DisplayListRenderProp);

  mProps.MorphShapeRenderProp = MorphShapeRenderProp;
}(this));