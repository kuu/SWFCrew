/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');

  mActors.Compositor = Compositor;

  function Compositor(pSWF, pAttachTo, pOptions) {
    this.base();
    this.swf = pSWF;
    this.width = pSWF.width;
    this.height = pSWF.height;

    var tCompositingProp;

    switch (pOptions.spriteType) {
      case 'dom':
        tCompositingProp = new theatre.crews.dom.DOMProp(pAttachTo);
        break;
      case 'canvas':
      default:
        tCompositingProp = new theatre.crews.canvas.CanvasProp(pAttachTo, pSWF.width, pSWF.height);
        tCompositingProp.cacheDrawResult = false;
        tCompositingProp.cacheWithClass = false;
        break;
    }

    tCompositingProp.preDrawChildren = function(pData) {
      pData.context.scale(0.05, 0.05);
      return true;
    };

    tCompositingProp.postDrawChildren = function(pData) {
      pData.context.scale(20, 20);
    };

    this.addProp(tCompositingProp);
  }
  theatre.inherit(Compositor, theatre.Actor);

}(this));