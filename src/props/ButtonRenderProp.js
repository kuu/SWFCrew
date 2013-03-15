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
   * The class responsible for rendering Buttons.
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var ButtonRenderProp = (function(pSuper) {
    function ButtonRenderProp() {
      pSuper.call(this);
    }
    ButtonRenderProp.prototype = Object.create(pSuper.prototype);
    ButtonRenderProp.prototype.constructor = ButtonRenderProp;
    return ButtonRenderProp;
  })(theatre.crews.swf.props.DisplayListRenderProp);

  mProps.ButtonRenderProp = ButtonRenderProp;

}(this));
