/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var theatre = global.theatre;
  var swfcrew = theatre.crews.swf;
  var ColorTransformShader = global.benri.render.fragmentShaders.ColorTransformShader;

  /**
   * @class
   * @extends {theatre.crews.render.RenderProp}
   */
  var DisplayListRenderProp = (function(pSuper) {
    function DisplayListRenderProp() {
      pSuper.call(this, null);
      this.bufferId = -1;
      this.previousBufferId = -1;
    }

    DisplayListRenderProp.prototype = Object.create(pSuper.prototype);
    DisplayListRenderProp.prototype.constructor = DisplayListRenderProp;

    DisplayListRenderProp.prototype.onAdd = function(pActor) {
      this.context = pActor.player.compositor.context;

      pSuper.prototype.onAdd.call(this, pActor);
    };

    DisplayListRenderProp.prototype.onRemove = function() {
      pSuper.prototype.onRemove.call(this);

      this.context = null;
    };

    DisplayListRenderProp.prototype.render = function(pData) {
      var tActor = this.actor;
      var tCompositor = tActor.player.compositor;
      var tContext;
      var tBufferId;

      tCompositor.endMaskIfDone(tActor);

      if (tActor.isVisible === false) {
        return false;
      }

      tContext = this.context;

      if (tActor.clipDepth > 0 || tActor.colorTransform !== null) {
        this.previousBufferId = tCompositor.activeBuffer;
        tBufferId = this.bufferId = tCompositor.createBuffer();
        tCompositor.setActiveBuffer(tBufferId);
      }
    };

    DisplayListRenderProp.prototype.postRender = function(pData) {
      var tActor = this.actor;
      var tColorTransform = tActor.colorTransform;
      var tCompositor = tActor.player.compositor;
      var tContext = this.context;
      var tTexture = null;
      var tBufferId = this.bufferId;

      tCompositor.cleanupChildMask(tActor);

      if (tBufferId !== -1) {
        if (tColorTransform !== null) {
          tTexture = tContext.renderToTexture(null, new ColorTransformShader(
            tContext,
            tColorTransform.rm,
            tColorTransform.gm,
            tColorTransform.bm,
            tColorTransform.am,
            tColorTransform.ra,
            tColorTransform.ga,
            tColorTransform.ba,
            tColorTransform.aa
          ));
        }

        if (tActor.clipDepth > 0) {
          if (tTexture === null) {
            tTexture = tContext.renderToTexture(null);
          }

          tCompositor.setActiveBuffer(this.previousBufferId);
          tCompositor.startMask(tActor, tTexture);
        } else if (tTexture !== null) {
          tCompositor.setActiveBuffer(this.previousBufferId);
          tContext.matrix.identity();
          tContext.renderTexture(tTexture);
        } else {
          tCompositor.setActiveBuffer(this.previousBufferId);
        }

        tCompositor.destroyBuffer(tBufferId);
        this.bufferId = -1;
      }
    };

    return DisplayListRenderProp;
  })(theatre.crews.render.RenderProp);

  swfcrew.props.DisplayListRenderProp = DisplayListRenderProp;

}(this));