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
   * @class
   * @extends {theatre.crews.render.RenderProp}
   */
  var Compositor = (function(pSuper) {
    function Compositor(pPlayer) {
      this.player = pPlayer;

      this.width = pPlayer.loader.swf.width;
      this.height = pPlayer.loader.swf.height;

      this.backgroundColor = new Color();

      var tType = this.contextType = pPlayer.loader.options.spriteType || 'canvas';
      var tRenderContext;

      switch (tType) {
        case 'canvas':
        default:
          // TODO: Move this to an outside file that is changable by platform.
          tRenderContext = new CanvasRenderContext(this.width, this.height);
          break;
      }

      this.buffers = [];
      this.activeBuffer = tRenderContext.activeBuffer;

      this.masks = {};

      pSuper.call(this, tRenderContext);
    }

    Compositor.prototype = Object.create(pSuper.prototype);
    Compositor.prototype.constructor = Compositor;

    Compositor.prototype.render = function(pData) {
      this.context.backgroundColor = this.backgroundColor;
      this.context.clear();
      this.context.matrix.scale(0.05, 0.05);
    };

    Compositor.prototype.createBuffer = function() {
      var tId = this.context.createBuffer(this.width, this.height);
      this.buffers.push(tId);

      return tId;
    };

    Compositor.prototype.setActiveBuffer = function(pId) {
      this.context.setActiveBuffer(pId);
      // The above might fail. So we assign the real active buffer here.
      this.activeBuffer = this.context.activeBuffer;
    };

    Compositor.prototype.destroyBuffer = function(pId) {
      var tIndex = this.buffers.indexOf(pId);

      if (tIndex !== -1) {
        this.buffers.splice(tIndex, 1);
        this.context.destroyBuffer(pId);
        this.activeBuffer = this.context.activeBuffer;
      }
    };

    Compositor.prototype.startMask = function(pActor, pMaskTexture) {
      var tBufferId = this.createBuffer();

      this.masks[pActor.parent.id + ''] = {
        until: pActor.clipDepth,
        texture: pMaskTexture,
        maskBufferId: tBufferId,
        bufferId: this.activeBuffer
      };

      this.setActiveBuffer(tBufferId);
    };

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
        delete this.masks[tId];
      }
    };

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
          delete this.masks[tId];
        }
      }
    };

    Compositor.prototype.getSurface = function() {
      // TODO: support other types
      return this.context.buffers[this.context.activeBuffer].data.getBitmap();
    };

    return Compositor;
  })(RenderProp);

  swfcrew.props.Compositor = Compositor;

}(this));