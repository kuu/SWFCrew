/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mProps = theatre.crews.swf.props;

  /**
   * The class responsible for rendering Texts.
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var TextRenderProp = (function(pSuper) {
    function TextRenderProp(pWidth, pHeight) {
      pSuper.call(this);
    }

    TextRenderProp.prototype = Object.create(pSuper.prototype);
    TextRenderProp.prototype.constructor = TextRenderProp;

    /**
     * @inheritDoc
     */
    TextRenderProp.prototype.render = function(pData) {
      // If super returns false, we abort rendering.
      if (pSuper.prototype.render.call(this, pData) === false) {
        return false;
      }

      var tActor = this.actor;
      var tContext = this.context;

      /**
       * We have previously created a cache for this prop. Grab it.
       * We created it in the Handler for Texts (DefineText/DefineEditText).
       * @type {benri.render.Renderable}
       */
      var tRenderable = tActor.player.loader.getActorRenderableCache(tActor.displayListId);

      // Offset by the Texts bounds.
      // We do this because when boudns are negative they would be
      // drawn off of the Canvas.
      // To counteract that, in the drawing code we have translated
      // by the negative of the bounds.
      // Here we offset that negative translation to bring it back in place.
      tContext.matrix.translate(tActor.bounds.left, tActor.bounds.top);

      // We are rendering a bitmap in the end, so revert the matrix back to normal
      // temporarily.
      tContext.matrix.scale(20, 20);

      // Render the cached Renderable.
      tContext.render(tRenderable);
    };

    return TextRenderProp;
  })(theatre.crews.swf.props.DisplayListRenderProp);

  mProps.TextRenderProp = TextRenderProp;

}(this));
