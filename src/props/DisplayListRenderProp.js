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
   * Base class for all Props related to rendering DisplayList objects.
   * @class
   * @extends {theatre.crews.render.RenderProp}
   */
  var DisplayListRenderProp = (function(pSuper) {
    function DisplayListRenderProp() {
      pSuper.call(this, null);

      /**
       * The ID of the buffer that this Prop is
       * currently using for rendering.
       * -1 means no buffer.
       * @type {number}
       */
      this.bufferId = -1;

      /**
       * The ID of the buffer we were using before
       * we created our own buffer to render to.
       * We use this to render our buffer to the
       * correct buffer after we are finished.
       * @type {number}
       */
      this.previousBufferId = -1;

      /**
       * The RenderContext that we use to render.
       * @type {benri.render.RenderContext}
       */
      this.context = null;
    }

    DisplayListRenderProp.prototype = Object.create(pSuper.prototype);
    DisplayListRenderProp.prototype.constructor = DisplayListRenderProp;

    /**
     * @inheritDoc
     */
    DisplayListRenderProp.prototype.onAdd = function(pActor) {
      this.context = pActor.player.compositor.context;

      pSuper.prototype.onAdd.call(this, pActor);
    };

    /**
     * @inheritDoc
     */
    DisplayListRenderProp.prototype.onRemove = function() {
      pSuper.prototype.onRemove.call(this);

      this.context = null;
    };

    /**
     * @inheritDoc
     */
    DisplayListRenderProp.prototype.render = function(pData) {
      var tActor = this.actor;
      var tCompositor = tActor.player.compositor;
      var tContext;
      var tBufferId;

      // This checks the situation where the mask specified
      // by clipDepth was less than the current Actors depth.
      // This means the mask is finished and this Prop should
      // be rendered normally (not masked).
      // We finish the mask here.
      tCompositor.endMaskIfDone(tActor);

      // If this Actor is invisible, don't render it or it's children.
      if (tActor.isVisible === false) {
        return false;
      }

      tContext = this.context;

      if (tActor.clipDepth > 0 || tActor.colorTransform !== null) {
        // We need to do some effects.
        // We create a buffer and switch to that buffer
        // so all rendering is redirected to the buffer instead
        // of the screen (or parent buffer).
        this.previousBufferId = tCompositor.activeBuffer;
        tBufferId = this.bufferId = tCompositor.createBuffer();
        tCompositor.setActiveBuffer(tBufferId);
      }
    };

    /**
     * @inheritDoc
     */
    DisplayListRenderProp.prototype.postRender = function(pData) {
      var tActor = this.actor;
      var tColorTransform = tActor.colorTransform;
      var tCompositor = tActor.player.compositor;
      var tContext = this.context;
      var tTexture = null;
      var tBufferId = this.bufferId;

      // This covers the situation where this Prop's Actor has children.
      // One of those children had a mask who's clipDepth was past the
      // depth of the last child (All children were masked). In that case
      // the above endMaskIfDone() check would never pass and we would
      // never finish up the mask.
      // This will forcefully finish a mask that this Actor's children had.
      tCompositor.cleanupChildMask(tActor);

      if (tBufferId !== -1) {
        // We are doing some effects of some sort.
        if (tColorTransform !== null) {
          // We need to colour transform our buffer.
          // Render it to a texture to be rendered to
          // something else later.
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
          // This Prop is actually the start of a new mask.
          // And this props bitmap is the mask's bitmap.
          if (tTexture === null) {
            // If there was no colour transformation, we don't
            // have a texture yet so we render the
            // current buffer to a new texture.
            tTexture = tContext.renderToTexture(null);
          }

          // Change the current buffer back the buffer we were
          // using before we starting doing effects.
          tCompositor.setActiveBuffer(this.previousBufferId);

          // Start a new mask using this Prop's texture as the bitmap.
          tCompositor.startMask(tActor, tTexture);
        } else if (tTexture !== null) {
          // Change the current buffer back the buffer we were
          // using before we starting doing effects.
          tCompositor.setActiveBuffer(this.previousBufferId);

          // Our texture was in absolute coordinates.
          // Therefore we need to draw ignoring the current matrix.
          // Reset the matrix to identity.
          tContext.matrix.identity();

          // Render the texture that had effects applied to the
          // main buffer (or screen).
          tContext.renderTexture(tTexture);
        } else {
          // Change the current buffer back the buffer we were
          // using before we starting doing effects.
          tCompositor.setActiveBuffer(this.previousBufferId);
        }

        // Clean up the buffer since we are done with it.
        // TODO: Can we cache this for performance?
        tCompositor.destroyBuffer(tBufferId);
        this.bufferId = -1;
      }
    };

    return DisplayListRenderProp;
  })(theatre.crews.render.RenderProp);

  swfcrew.props.DisplayListRenderProp = DisplayListRenderProp;

}(this));