/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  mActors.DOMSpriteActor = DOMSpriteActor;

  function DOMSpriteActor() {
    this.base();
    this.clipDepth = 0;

    this.listen('enter', onDOMEnter);
  }
  theatre.inherit(DOMSpriteActor, theatre.crews.dom.DOMActor);

  /**
   * @private
   */
  function onDOMEnter() {
    var tStyle = this.element.style;
    tStyle.position = 'absolute';
    tStyle.top = '0';
    tStyle.left = '0';
    tStyle.webkitTransformOrigin = '0 0';
  }


}(this));
