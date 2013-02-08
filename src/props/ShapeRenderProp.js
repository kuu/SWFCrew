/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mProps = theatre.crews.swf.props;

  /**
   * The class responsible for rendering Shapes.
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var ShapeRenderProp = (function(pSuper) {
    function ShapeRenderProp(pWidth, pHeight) {
      pSuper.call(this);
    }

    ShapeRenderProp.prototype = Object.create(pSuper.prototype);
    ShapeRenderProp.prototype.constructor = ShapeRenderProp;

    /**
     * @inheritDoc
     */
    ShapeRenderProp.prototype.render = function(pData) {
      // If super returns false, we abort rendering.
      if (pSuper.prototype.render.call(this, pData) === false) {
        return false;
      }

      var tActor = this.actor;
      var tContext = this.context;

      /**
       * We have previously created a cache for this prop. Grab it.
       * We created it in the Handler for Shapes (DefineShape).
       * @type {benri.render.Renderable}
       */
      var tRenderable = tActor.player.loader.getActorRenderableCache(tActor.displayListId);

      // Offset by the Shapes bounds.
      // We do this because when boudns are negative they would be
      // drawn off of the Canvas.
      // To counteract that, in the drawing code we have translated
      // by the negative of the bounds.
      // Here we offset that negative translation to bring it back in place.
      tContext.translate(tActor.bounds.left, tActor.bounds.top)

      // We are rendering a bitmap in the end, so revert the matrix back to normal
      // temporarily.
      tContext.scale(20, 20);

      // Render the cached Renderable.
      tRenderable.render(tContext);
    };

    return ShapeRenderProp;
  })(theatre.crews.swf.props.DisplayListRenderProp);

  mProps.ShapeRenderProp = ShapeRenderProp;

}(this));
