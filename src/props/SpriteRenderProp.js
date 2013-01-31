/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  /**
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var SpriteRenderProp = (function(pSuper) {
    function SpriteRenderProp() {
      pSuper.call(this);
    }

    SpriteRenderProp.prototype = Object.create(pSuper.prototype);
    SpriteRenderProp.prototype.constructor = SpriteRenderProp;

    return SpriteRenderProp;
  })(theatre.crews.swf.props.DisplayListRenderProp);

  global.theatre.crews.swf.props.SpriteRenderProp = SpriteRenderProp;

}(this));