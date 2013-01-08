/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global)  {

  var theatre = global.theatre;

  theatre.define('theatre.crews.swf.props.CanvasSpriteProp', CanvasSpriteProp);

  /**
   * An Actor for handing Sprites that use Canvas to draw.
   * @constructor
   * @extends {theatre.crews.canvas.CanvasProp}
   */
  function CanvasSpriteProp(pBackingContainer) {
    this.base(pBackingContainer);
    this.currentClipCanvas = null;
    this.currentClippedContext = null;
    this.clipUntil = -1;
    this.parentContext = null;

    this.cacheDrawResult = false;
    this.cacheWithClass = false;
  }
  theatre.inherit(CanvasSpriteProp, theatre.crews.canvas.CanvasProp);

  var mBackupPreDraw = theatre.crews.canvas.CanvasProp.prototype.preDraw;

  CanvasSpriteProp.prototype.preDraw = function(pData) {
    if (this.actor.isVisible === false) {
      return false;
    }
    return mBackupPreDraw.call(this, pData);
  };

  /**
   * @override
   */
  CanvasSpriteProp.prototype.draw = function(pData) {
    // Do nothing
  };

  /**
   * @override
   */
  CanvasSpriteProp.prototype.getDrawingContextForChild = function(pParentContext, pActor) {
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

  var mBackupPreDrawChild = theatre.crews.canvas.CanvasProp.prototype.preDrawChild;

  /**
   * @override
   */
  CanvasSpriteProp.prototype.preDrawChild = function(pData, pActor) {
    if (pActor.isVisible === false) {
      return false;
    }

    this.parentContext = pData.context;
    pData.context = this.getDrawingContextForChild(pData.context, pActor);
    return mBackupPreDrawChild.call(this, pData, pActor);
  };

  function cleanupClip(pProp, pParentContext) {
    var tClippedContext = pProp.currentClippedContext;
    tClippedContext.globalCompositeOperation = 'destination-in';
    tClippedContext.setTransform(1, 0, 0, 1, 0, 0);
    tClippedContext.drawImage(pProp.currentClipCanvas, 0, 0);

    var tMatrix = pProp.actor.getAbsoluteMatrix();
    pParentContext.setTransform(1, 0, 0, 1, 0, 0);
    pParentContext.drawImage(tClippedContext.canvas, 0, 0);
    pParentContext.setTransform(tMatrix.a, tMatrix.b, tMatrix.c, tMatrix.d, tMatrix.e, tMatrix.f);

    pProp.currentClipCanvas = null;
    pProp.currentClippedContext = null;
    pProp.clipUntil = -1;
  }

  var mBackupPostDrawChild = theatre.crews.canvas.CanvasProp.prototype.postDrawChild;

  /**
   * @override
   */
  CanvasSpriteProp.prototype.postDrawChild = function(pData, pActor) {
    var tChildContext = pData.context;
    var tParentContext = this.parentContext;

    if (pActor.colorTransform !== null) {
      // TODO: Fix me. Make me fast. Make me better!
      // Yes, I know lots of stuff here is bad. Let's all think of a better way.
      var tColorTransform = pActor.colorTransform;

      var tHasAlpha = !!(tColorTransform.aa !== 0 || tColorTransform.am !== 1);
      var tHasRed = !!(tColorTransform.ra !== 0 || tColorTransform.rm !== 1);
      var tHasGreen = !!(tColorTransform.ga !== 0 || tColorTransform.gm !== 1);
      var tHasBlue = !!(tColorTransform.ba !== 0 || tColorTransform.bm !== 1);

      var tContextToTransferTo = tParentContext;

      if (pActor.layer <= this.clipUntil) {
        tContextToTransferTo = this.currentClippedContext;
      }

      if (tHasRed || tHasGreen || tHasBlue) {
        var tImageData = tChildContext.getImageData(0, 0, tChildContext.canvas.width, tChildContext.canvas.height);
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
          /*if (tHasAlpha === true) {
            tPixels[i + 3] = ((((tPixels[i + 3] * tAM) / 256) + tAA) * 255) | 0;
          }*/
        }

        tChildContext.putImageData(tImageData, 0, 0);

        tContextToTransferTo.save();
        if (tHasAlpha === true) {
          tContextToTransferTo.globalAlpha = tColorTransform.am + tColorTransform.aa;
        }
        tContextToTransferTo.setTransform(1, 0, 0, 1, 0, 0);
        tContextToTransferTo.drawImage(tChildContext.canvas, 0, 0);
        tContextToTransferTo.restore();
      } else {
        tContextToTransferTo.save();
        tContextToTransferTo.globalAlpha = tColorTransform.am + tColorTransform.aa;
        tContextToTransferTo.setTransform(1, 0, 0, 1, 0, 0);
        tContextToTransferTo.drawImage(tChildContext.canvas, 0, 0);
        tContextToTransferTo.restore();
      }
    }

    if (this.clipUntil !== -1) { // We are currently clipping.
      if (pActor.layer > this.clipUntil) { // Double check.
        cleanupClip(this, tParentContext);
      }
    }

    mBackupPostDrawChild.call(this, pData);

    pData.context = tParentContext;
  };

  /**
   * @override
   */
  CanvasSpriteProp.prototype.postDrawChildren = function(pData) {
    if (this.clipUntil !== -1) { // In other words, we haven't cleaned up our clipping.
      pData.context = this.parentContext;
      this.parentContext = null;
      cleanupClip(this, pData.context);
    }
  };

}(this));
