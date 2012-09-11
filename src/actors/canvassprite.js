/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global)  {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  mActors.CanvasSpriteActor = CanvasSpriteActor;

  /**
   * An Actor for handing Sprites that use Canvas to draw.
   * @constructor
   * @extends {theatre.crews.canvas.CanvasActor}
   */
  function CanvasSpriteActor() {
    this.base();
    this.clipDepth = 0;
    this.currentClipCanvas = null;
    this.currentClippedContext = null;
    this.clipUntil = -1;
    this.colorTransform = null;
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

  /**
   * @override
   */
  CanvasSpriteActor.prototype.getDrawingContextForChild = function(pParentContext, pActor) {
    var tMatrix;

    if (pActor.clipDepth > 0) {
      if (this.clipUntil !== -1) {
        console.error('Clip inside clip depth! Need to support!');
      }
      this.clipUntil = pActor.clipDepth;
      // TODO: Make it use the bounds of the child shapes. But first we need to make that information...
      var tWidth = pParentContext.canvas.width;
      var tHeight = pParentContext.canvas.height;

      tMatrix = pActor.parent.getAbsoluteMatrix();

      var tClipCanvas = this.currentClipCanvas = global.document.createElement('canvas');
      tClipCanvas.width = tWidth;
      tClipCanvas.height = tHeight;
      var tClipCanvasContext = tClipCanvas.getContext('2d');
      tClipCanvasContext.scale(0.05, 0.05);
      tClipCanvasContext.transform(tMatrix.a, tMatrix.b, tMatrix.c, tMatrix.d, tMatrix.e, tMatrix.f);

      var tClippedContext = this.currentClippedContext = global.document.createElement('canvas').getContext('2d');
      tClippedContext.canvas.width = tWidth;
      tClippedContext.canvas.height = tHeight;
      tClippedContext.scale(0.05, 0.05);
      tClippedContext.transform(tMatrix.a, tMatrix.b, tMatrix.c, tMatrix.d, tMatrix.e, tMatrix.f);

      return tClipCanvasContext;
    } else if (pActor.colorTransform !== null) { // TODO: Support mask + colorTransform at same time.
      var tColorTransformCanvas = global.document.createElement('canvas');
      tColorTransformCanvas.width = pParentContext.canvas.width;
      tColorTransformCanvas.height = pParentContext.canvas.height;

      tMatrix = pActor.parent.getAbsoluteMatrix();

      var tTransformContext = tColorTransformCanvas.getContext('2d');
      tTransformContext.scale(0.05, 0.05);
      tTransformContext.transform(tMatrix.a, tMatrix.b, tMatrix.c, tMatrix.d, tMatrix.e, tMatrix.f);

      return tTransformContext;
    } else if (pActor.layer <= this.clipUntil) {
      return this.currentClippedContext;
    }

    return pParentContext;
  };

  var mBackupPreDispatchDraw = theatre.crews.canvas.CanvasActor.prototype.preDispatchDraw;

  /**
   * @override
   */
  CanvasSpriteActor.prototype.preDispatchDraw = function(pParentContext, pChildContext, pActor) {
    if (this.clipUntil !== -1 || pActor.colorTransform !== null) { // In other words, we are currently clipping.
      mBackupPreDispatchDraw.call(this, pChildContext, pChildContext, pActor); // Hack it to the child.
      return;
    }

    mBackupPreDispatchDraw.call(this, pParentContext, pChildContext, pActor);
  };

  function cleanupClip(pActor, pParentContext) {
    var tClippedContext = pActor.currentClippedContext;
    tClippedContext.globalCompositeOperation = 'destination-in';
    tClippedContext.scale(20, 20);
    tClippedContext.drawImage(pActor.currentClipCanvas, 0, 0);

    pParentContext.scale(20, 20);
    pParentContext.drawImage(tClippedContext.canvas, 0, 0);
    pParentContext.scale(0.05, 0.05);

    pActor.currentClipCanvas = null;
    pActor.currentClippedContext = null;
    pActor.clipUntil = -1;
  }

  /**
   * @override
   */
  CanvasSpriteActor.prototype.postDispatchDraw = function(pParentContext, pChildContext, pActor) {
    if (pActor.colorTransform !== null) {
      // TODO: Fix me. Make me fast. Make me better!
      // Yes, I know lots of stuff here is bad. Let's all think of a better way.
      var tColorTransform = pActor.colorTransform;

      var tHasAlpha = !!(tColorTransform.aa !== 0 || tColorTransform.am !== 1);
      var tHasRed = !!(tColorTransform.ra !== 0 || tColorTransform.rm !== 1);
      var tHasGreen = !!(tColorTransform.ga !== 0 || tColorTransform.gm !== 1);
      var tHasBlue = !!(tColorTransform.ba !== 0 || tColorTransform.bm !== 1);

      var tContextToTransferTo = pParentContext;

      if (pActor.layer <= this.clipUntil) {
        tContextToTransferTo = this.currentClippedContext;
      }

      if (tHasRed || tHasGreen || tHasBlue) {
        var tImageData = pChildContext.getImageData(0, 0, pChildContext.canvas.width, pChildContext.canvas.height);
        var tPixels = tImageData.data;

        var tRM = tColorTransform.rm;
        var tRA = tColorTransform.ra;
        var tGM = tColorTransform.gm;
        var tGA = tColorTransform.ga;
        var tBM = tColorTransform.bm;
        var tBA = tColorTransform.ba;
        var tAM = tColorTransform.am;
        var tAA = tColorTransform.aa;

        for (var i = 0, il = tPixels.length; i < il; i += 4) {
          if (tPixels[i + 3] === 0) {
            continue;
          }

          if (tHasRed === true) {
            tPixels[i] = ((((tPixels[i] * tRM) / 256) + tRA) * 255) | 0;
          }
          if (tHasGreen === true) {
            tPixels[i + 1] = ((((tPixels[i + 1] * tGM) / 256) + tGA) * 255) | 0;
          }
          if (tHasBlue === true) {
            tPixels[i + 2] = ((((tPixels[i + 2] * tBM) / 256) + tBA) * 255) | 0;
          }
          if (tHasAlpha === true) {
            tPixels[i + 3] = ((((tPixels[i + 3] * tAM) / 256) + tAA) * 255) | 0;
          }
        }

        pChildContext.putImageData(tImageData, 0, 0);

        tContextToTransferTo.save();
        tContextToTransferTo.setTransform(1, 0, 0, 1, 0, 0);
        tContextToTransferTo.drawImage(pChildContext.canvas, 0, 0);
        tContextToTransferTo.restore();
      } else {
        tContextToTransferTo.save();
        tContextToTransferTo.globalAlpha = tColorTransform.am + tColorTransform.aa;
        tContextToTransferTo.setTransform(1, 0, 0, 1, 0, 0);
        tContextToTransferTo.drawImage(pChildContext.canvas, 0, 0);
        tContextToTransferTo.restore();
      }

    }

    if (this.clipUntil !== -1) { // We are currently clipping.
      if (pActor.layer > this.clipUntil) { // Double check.
        cleanupClip(this, pParentContext);
      }
    }
  };

  /**
   * @override
   */
  CanvasSpriteActor.prototype.postDrawChildren = function(pContext) {
    if (this.clipUntil !== -1) { // In other words, we haven't cleaned up our clipping.
      cleanupClip(this, pContext);
    }
  };

  var mBackupGetDrawingCache = theatre.crews.canvas.CanvasActor.prototype.getDrawingCache;

  /**
   * @override
   */
  CanvasSpriteActor.prototype.getDrawingCache = function() {
    var tCache = mBackupGetDrawingCache.call(this);
    if (tCache._swfAjusted !== true) {
      tCache.scale(0.05, 0.05);
      tCache._swfAjusted = true;
    }
    return tCache;
  };

}(this));
