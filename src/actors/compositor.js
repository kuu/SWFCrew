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
    this.width = pSWF.width;
    this.height = pSWF.height;

    pSWF = null;

    var tCompositingProp;
    var tContext;
    var tFragmentShader;
    var tVertexShader;
    var tProgram;
    var tPositionAttribute;
    var tTextureCoordAttribute;
    var tProjectionUniform;
    var tSamplerUniform;

    switch (pOptions.spriteType) {
      case 'dom':
        tCompositingProp = new theatre.crews.dom.DOMProp(pAttachTo);
        break;
      case 'webgl':
        tCompositingProp = new theatre.crews.webgl.WebGLProp(pAttachTo, this.width, this.height);
        tContext = pAttachTo.getContext('experimental-webgl');

        tContext.viewport(0, 0, this.width, this.height);

        tVertexShader = tContext.createShader(tContext.VERTEX_SHADER);
        tContext.shaderSource(tVertexShader, 'attribute vec2 aPosition; attribute vec2 aTextureCoord; uniform mat4 uProjection; varying highp vec2 vTextureCoord;  void main(void) { gl_Position = uProjection * vec4(aPosition.x, aPosition.y, 0.0, 1.0); vTextureCoord = aTextureCoord; }');
        tContext.compileShader(tVertexShader);

        if (!tContext.getShaderParameter(tVertexShader, tContext.COMPILE_STATUS)) {
          console.error(tContext.getShaderInfoLog(tVertexShader));
          throw new Error('Vertex Shader Error');
        }

        tFragmentShader = tContext.createShader(tContext.FRAGMENT_SHADER);
        tContext.shaderSource(tFragmentShader, 'varying highp vec2 vTextureCoord; uniform sampler2D uSampler;  void main(void) { gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)); }');
        tContext.compileShader(tFragmentShader);

        if (!tContext.getShaderParameter(tFragmentShader, tContext.COMPILE_STATUS)) {
          console.error(tContext.getShaderInfoLog(tFragmentShader));
          throw new Error('Fragment Shader Error');
        }

        tProgram = tContext.createProgram();
        tContext.attachShader(tProgram, tFragmentShader);
        tContext.attachShader(tProgram, tVertexShader);
        tContext.linkProgram(tProgram);

        if (!tContext.getProgramParameter(tProgram, tContext.LINK_STATUS)) {
          console.error(tContext.getProgramInfoLog(tProgram));
          throw new Error('Program Link Error');
        }

        tContext.validateProgram(tProgram);

        if (!tContext.getProgramParameter(tProgram, tContext.VALIDATE_STATUS)) {
          console.error(tContext.getProgramInfoLog(tProgram));
          throw new Error('Program Validate Error');
        }

        tContext.useProgram(tProgram);

        tPositionAttribute = tContext.getAttribLocation(tProgram, 'aPosition');

        if (tPositionAttribute === -1) {
          throw new Error('Failed to find position attribute.');
        }

        tContext.enableVertexAttribArray(tPositionAttribute);

        tTextureCoordAttribute = tContext.getAttribLocation(tProgram, 'aTextureCoord');

        if (tTextureCoordAttribute === -1) {
          throw new Error('Failed to find texture coord attribute.');
        }

        tContext.enableVertexAttribArray(tTextureCoordAttribute);

        tProjectionUniform = tContext.getUniformLocation(tProgram, 'uProjection');
        tSamplerUniform = tContext.getUniformLocation(tProgram, 'uSampler');

        if (tProjectionUniform === -1) {
          throw new Error('Failed to find projection uniform.');
        }

        tCompositingProp.preDrawChildren = function(pData) {
          if (!(pData instanceof theatre.crews.webgl.GLDrawingState)) {
            var tData = new theatre.crews.webgl.GLDrawingState(tContext);
            pData.__proto__ = tData.__proto__;
            pData.stack = tData.stack;
            pData.matrix = tData.matrix;
            pData.context = tData.context;
          }

          var tGL = pData.context;

          pData.save();

          pData.matrix = pData.matrix.scale(0.05, 0.05);

          tGL.clearColor(0, 0, 0, 0);
          tGL.clear(tGL.COLOR_BUFFER_BIT);

          pData.positionAttribute = tPositionAttribute;
          pData.textureCoordAttribute = tTextureCoordAttribute;
          pData.projectionUniform = tProjectionUniform;
          pData.samplerUniform = tSamplerUniform;

          return true;
        };

        tCompositingProp.postDrawChildren = function(pData) {
          pData.restore();
        };
        break;
      case 'canvas':
      default:
        tCompositingProp = new theatre.crews.canvas.CanvasProp(pAttachTo, this.width, this.height);
        tCompositingProp.cacheDrawResult = false;
        tCompositingProp.cacheWithClass = false;

        tCompositingProp.preDrawChildren = function(pData) {
          pData.context.scale(0.05, 0.05);
          return true;
        };

        tCompositingProp.postDrawChildren = function(pData) {
          pData.context.scale(20, 20);
        };

        break;
    }

    this.addProp(tCompositingProp);
  }
  theatre.inherit(Compositor, theatre.Actor);

}(this));