/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var RenderProp = theatre.crews.render.RenderProp;
  var CanvasRenderContext = benri.render.platform.canvas.CanvasRenderContext;
  var swfcrew = theatre.crews.swf;
  var Color = global.benri.draw.Color;
  var MaskShader = global.benri.render.fragmentShaders.MaskShader;

  /**
   * A class for compositing the render system together.
   * @class
   * @extends {theatre.crews.render.RenderProp}
   */
  var Compositor = (function(pSuper) {
    function Compositor(pPlayer) {
      /**
       * The Player this compositor is compositing for.
       * @type {theatre.crews.swf.Player}
       */
      this.player = pPlayer;

      /**
       * The width of this SWF file.
       * @type {number}
       */
      this.width = pPlayer.loader.swf.width;

      /**
       * The height of this SWF file.
       * @type {number}
       */
      this.height = pPlayer.loader.swf.height;

      /**
       * The bound of this SWF file in twips.
       * @type {quickswf.structs.RECT}
       */
      this.bounds = pPlayer.loader.swf.bounds;

      /**
       * The background colour to fill with every frame.
       * @type {benri.draw.Color}
       */
      this.backgroundColor = new Color(0, 0, 0, 0);

      var tType = this.contextType = pPlayer.loader.options.spriteType || 'canvas';
      var tRenderContext;

      switch (tType) {
        case 'canvas':
        default:
          // We want to use Canvas as our backend for rendering.
          // TODO: Move this to an outside file that is changable by platform.
          tRenderContext = new CanvasRenderContext(this.width, this.height);
          break;
      }

      /**
       * Currently active buffers.
       * @type {Array.<object>}
       */
      this.buffers = [];

      /**
       * The ID of the currently active buffer.
       * @type {number}
       */
      this.activeBuffer = tRenderContext.activeBuffer;

      /**
       * A hash of masks that are currently in effect.
       * The key is the Actor ID of the parent of the
       * Actor masking.
       * @type {object}
       */
      this.masks = {};

      pSuper.call(this, tRenderContext);
    }

    Compositor.prototype = Object.create(pSuper.prototype);
    Compositor.prototype.constructor = Compositor;

    /**
     * @inheritDoc
     */
    Compositor.prototype.render = function(pData) {
      this.context.backgroundColor = this.backgroundColor;
      // Clear the canvas and fill with the background colour.
      this.context.clear();
      // Convert from twips to pixels.
      this.context.matrix.scale(0.05, 0.05);
      // Translate by the global SWF file's bounds.
      this.context.matrix.translate(-this.bounds.left, -this.bounds.top);
    };

    /**
     * Creates a new buffer that is the same
     * size as the SWF file itself.
     * @return {number} The ID of the new buffer.
     */
    Compositor.prototype.createBuffer = function() {
      var tId = this.context.createBuffer(this.width, this.height);
      this.buffers.push(tId);

      return tId;
    };

    /**
     * Sets the active buffer.
     * @param {number} pId The ID of the buffer to activate.
     */
    Compositor.prototype.setActiveBuffer = function(pId) {
      this.context.setActiveBuffer(pId);
      // The above might fail. So we assign the real active buffer here.
      this.activeBuffer = this.context.activeBuffer;
    };

    /**
     * Destroys a buffer.
     * @param  {number} pId The ID of the buffer to destroy.
     */
    Compositor.prototype.destroyBuffer = function(pId) {
      var tIndex = this.buffers.indexOf(pId);

      if (tIndex !== -1) {
        this.buffers.splice(tIndex, 1);
        this.context.destroyBuffer(pId);
        // After destroying it was possible the active buffer
        // changed. Reset it.
        this.activeBuffer = this.context.activeBuffer;
      }
    };

    /**
     * Start a new mask on the given Actor
     * with the given texture as the mask.
     * @param  {theatre.Actor} pActor The Actor to start the mask on.
     * @param  {benri.render.Texture} pMaskTexture The Texture to use for masking.
     */
    Compositor.prototype.startMask = function(pActor, pMaskTexture) {
      var tBufferId = this.createBuffer();

      this.masks[pActor.parent.id + ''] = {
        until: pActor.clipDepth, // When we need to mask until (Actor's layer).
        texture: pMaskTexture, // The texture to use as a mask.
        maskBufferId: tBufferId, // The buffer ID of the mask.
        bufferId: this.activeBuffer // The buffer ID of the buffer to render the mask to.
      };

      this.setActiveBuffer(tBufferId);
    };

    /**
     * Clean up any leftover masks on the given Actor's children.
     * @param  {theatre.Actor} pActor
     */
    Compositor.prototype.cleanupChildMask = function(pActor) {
      var tId = pActor.id;
      var tMask = this.masks[tId];
      var tContext;

      if (tMask !== void 0) {
        tContext = this.context;
        this.setActiveBuffer(tMask.bufferId);
        tContext.save();
        tContext.matrix.identity();
        tContext.renderBuffer(tMask.maskBufferId, new MaskShader(tContext, tMask.texture));
        tContext.restore();
        this.destroyBuffer(tMask.maskBufferId);
        tContext.destroyTexture(tMask.texture);
        delete this.masks[tId];
      }
    };

    /**
     * End a mask if the mask is complete using the given Actor
     * as the basis for checking if the mask is complete.
     * @param  {theatre.Actor} pActor
     */
    Compositor.prototype.endMaskIfDone = function(pActor) {
      var tId = pActor.parent.id;
      var tMask = this.masks[tId];
      var tContext;

      if (tMask !== void 0) {
        if (pActor.layer > tMask.until) {
          tContext = this.context;
          this.setActiveBuffer(tMask.bufferId);
          tContext.save();
          tContext.matrix.identity();
          tContext.renderBuffer(tMask.maskBufferId, new MaskShader(tContext, tMask.texture));
          tContext.restore();
          this.destroyBuffer(tMask.maskBufferId);
          tContext.destroyTexture(tMask.texture);
          delete this.masks[tId];
        }
      }
    };

    /**
     * Get a surface that can be used to display
     * the SWF file on the screen.
     */
    Compositor.prototype.getSurface = function() {
      // TODO: support other types
      return this.context.buffers[this.context.activeBuffer].data.canvas.getBitmap();
    };

    return Compositor;
  })(RenderProp);

  swfcrew.props.Compositor = Compositor;

}(this));
