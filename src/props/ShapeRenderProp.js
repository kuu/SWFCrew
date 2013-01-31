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
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var ShapeRenderProp = (function(pSuper) {
    function ShapeRenderProp(pWidth, pHeight) {
      pSuper.call(this);
    }

    ShapeRenderProp.prototype = Object.create(pSuper.prototype);
    ShapeRenderProp.prototype.constructor = ShapeRenderProp;

    ShapeRenderProp.prototype.render = function(pData) {
      if (pSuper.prototype.render.call(this, pData) === false) {
        return false;
      }

      var tActor = this.actor;
      var tContext = this.context;

      var tRenderable = tActor.player.loader.getActorRenderableCache(tActor.displayListId);

      tContext.matrix.translate(tActor.bounds.left, tActor.bounds.top);
      tContext.matrix.scale(20, 20);

      tContext.render(tRenderable);
    };

    return ShapeRenderProp;
  })(theatre.crews.swf.props.DisplayListRenderProp);

  mProps.ShapeRenderProp = ShapeRenderProp;

}(this));
