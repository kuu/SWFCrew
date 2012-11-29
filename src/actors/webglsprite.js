/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global)  {

  var theatre = global.theatre;

  var SpriteActor = theatre.crews.swf.actors.SpriteActor;
  var ButtonActor = theatre.crews.swf.actors.ButtonActor;

  theatre.define('theatre.crews.swf.props.WebGLSpriteProp', WebGLSpriteProp);

  /**
   * An Actor for handing Sprites that use Canvas to draw.
   * @constructor
   * @extends {theatre.crews.canvas.CanvasProp}
   */
  function WebGLSpriteProp(pBackingContainer) {
    this.base(pBackingContainer);
    this.clipUntil = -1;
    this.parentContext = null;

    this.cacheDrawResult = false;
    this.cacheWithClass = false;
  }
  theatre.inherit(WebGLSpriteProp, theatre.crews.webgl.WebGLProp);

  var mBackupPreDraw = theatre.crews.webgl.WebGLProp.prototype.preDraw;

  WebGLSpriteProp.prototype.preDraw = function(pData) {
    if (this.actor.isVisible === false) {
      return false;
    }
    return mBackupPreDraw.call(this, pData);
  };

  /**
   * @override
   */
  WebGLSpriteProp.prototype.draw = function(pData) {
    // Do nothing
  };

  var mBackupPreDrawChild = theatre.crews.webgl.WebGLProp.prototype.preDrawChild;

  /**
   * @override
   */
  WebGLSpriteProp.prototype.preDrawChild = function(pData, pActor) {
    if (pActor.isVisible === false) {
      return false;
    }

    var tWillDraw = mBackupPreDrawChild.call(this, pData, pActor);

    if (pActor instanceof SpriteActor || pActor instanceof ButtonActor) {
      return tWillDraw;
    } else {
      var tCanvas = global.document.createElement('canvas');
      var tMatrix = pActor.matrix;
      tCanvas.width = pActor.width;
      tCanvas.height = pActor.height;
      pData.context = tCanvas.getContext('2d');
      pData.context.scale(0.05, 0.05);
      pData.context.translate(-pActor.bounds.left, -pActor.bounds.top);
    }

    return true;
  };

  var mBackupPostDrawChild = theatre.crews.webgl.WebGLProp.prototype.postDrawChild;

  /**
   * @override
   */
  WebGLSpriteProp.prototype.postDrawChild = function(pData, pActor) {
    var tShapeCanvas = pData.context.canvas;
    var tMatrix = pData.matrix;

    mBackupPostDrawChild.call(this, pData, pActor);

    if (pActor instanceof SpriteActor) {
      return;
    }

    var tContext = pData.context;
    var tError;

    var tGLMatrix = new Float32Array([
      tMatrix.m11, tMatrix.m12, tMatrix.m13, tMatrix.m14,
      tMatrix.m21, tMatrix.m22, tMatrix.m23, tMatrix.m24,
      tMatrix.m31, tMatrix.m32, tMatrix.m33, tMatrix.m34,
      tMatrix.m41, tMatrix.m42, tMatrix.m43, tMatrix.m44
    ]);

    var tTexture = tContext.createTexture();
    tContext.activeTexture(tContext.TEXTURE0);
    tContext.bindTexture(tContext.TEXTURE_2D, tTexture);
    tContext.texImage2D(tContext.TEXTURE_2D, 0, tContext.RGBA, tContext.RGBA, tContext.UNSIGNED_BYTE, tShapeCanvas);
    if ((tError = tContext.getError()) !== tContext.NO_ERROR) {
      console.error(tError);
    }
    tContext.texParameteri(tContext.TEXTURE_2D, tContext.TEXTURE_MAG_FILTER, tContext.LINEAR);
    tContext.texParameteri(tContext.TEXTURE_2D, tContext.TEXTURE_MIN_FILTER, tContext.LINEAR);
    tContext.texParameteri(tContext.TEXTURE_2D, tContext.TEXTURE_WRAP_S, tContext.CLAMP_TO_EDGE);
    tContext.texParameteri(tContext.TEXTURE_2D, tContext.TEXTURE_WRAP_T, tContext.CLAMP_TO_EDGE);

    var tVertices = new Float32Array([
      0, 0,
      0, pActor.height * 20,
      pActor.width * 20, 0,
      pActor.width * 20, pActor.height * 20
    ]);

    var tVertexBufferId = tContext.createBuffer();
    tContext.bindBuffer(tContext.ARRAY_BUFFER, tVertexBufferId);
    tContext.bufferData(tContext.ARRAY_BUFFER, tVertices, tContext.STATIC_DRAW);
    tContext.vertexAttribPointer(pData.positionAttribute, 2, tContext.FLOAT, false, 0, 0);

    var tTextureCoords = new Float32Array([
      0, 0,
      0, 1,
      1, 0,
      1, 1
    ]);

    var tTextureCoordsBufferId = tContext.createBuffer();
    tContext.bindBuffer(tContext.ARRAY_BUFFER, tTextureCoordsBufferId);
    tContext.bufferData(tContext.ARRAY_BUFFER, tTextureCoords, tContext.STATIC_DRAW);
    tContext.vertexAttribPointer(pData.textureCoordAttribute, 2, tContext.FLOAT, false, 0, 0);

    tContext.uniformMatrix4fv(pData.projectionUniform, false, tGLMatrix);
    tContext.uniform1i(pData.samplerUniform, 0);

    tContext.drawArrays(tContext.TRIANGLE_STRIP, 0, 4);
    tContext.flush();

    tContext.deleteBuffer(tVertexBufferId);

    tContext.deleteTexture(tTexture);
    tContext.bindTexture(tContext.TEXTURE_2D, null);
  };

}(this));
