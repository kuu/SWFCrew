/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mProps = theatre.define('theatre.crews.swf.props');

  mProps.ShapeProp = ShapeProp;

  function ShapeProp(pBackingCanvas, pWidth, pHeight) {
    this.base(pBackingCanvas, pWidth, pHeight);
    this.cacheDrawResult = true;
    this.cacheWithClass = true;
  }
  theatre.inherit(ShapeProp, theatre.crews.canvas.CanvasProp);

  var mPreDrawBackup = theatre.crews.canvas.CanvasProp.prototype.preDraw;
  var mPostDrawBackup = theatre.crews.canvas.CanvasProp.prototype.postDraw;

  ShapeProp.prototype.preDraw = function(pData) {
    if (this.actor.isVisible === false) {
      return false;
    }

    var tContext = pData.context;
    var tActor = this.actor;

    tContext.save();

    tContext.translate(tActor.bounds.left, tActor.bounds.top);
    tContext.scale(20, 20);

    var tWillDraw = mPreDrawBackup.call(this, pData);

    if (tWillDraw === false) {
      pData.context.restore();
    }

    return tWillDraw;
  };

  ShapeProp.prototype.postDraw = function(pData) {
    mPostDrawBackup.call(this, pData);

    pData.context.restore();
  };

}(this));
