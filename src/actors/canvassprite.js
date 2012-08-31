(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  mActors.CanvasSpriteActor = CanvasSpriteActor;

  function CanvasSpriteActor() {
    this.base();
  }
  theatre.inherit(CanvasSpriteActor, theatre.crews.canvas.CanvasActor);

  /**
   * @override
   */
  CanvasSpriteActor.prototype.draw = function(pContext) {
    if (this.parent.dispatchDraw === void 0) {
      pContext.clearRect(0, 0, pContext.canvas.width * 20, pContext.canvas.height * 20);
    }
  };

  var mBackupGetDrawingCache = theatre.crews.canvas.CanvasActor.prototype.getDrawingCache;

  CanvasSpriteActor.prototype.getDrawingCache = function() {
    var tCache = mBackupGetDrawingCache.call(this);
    if (tCache._swfAjusted !== true) {
      tCache.scale(1 / 20, 1 / 20);
      tCache._swfAjusted = true;
    }
    return tCache;
  };

}(this));
