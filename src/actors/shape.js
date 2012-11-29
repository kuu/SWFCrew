/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mActors = theatre.define('theatre.crews.swf.actors');
  var mProps = theatre.define('theatre.crews.swf.props');
  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers;
  var mShapeUtils = mSWFCrew.utils.shape;

  mActors.ShapeActor = ShapeActor;
  mProps.ShapeProp = ShapeProp;

  /**
   * The actor for handling SWF Shapes.
   * @constructor
   * @type {theatre.crews.swf.actors.ShapeActor}
   * @extends {theatre.Actor}
   */
  function ShapeActor() {
    this.base();

    this.width = (((this.twipsWidth / 20) >>> 0) || 0) + 1;
    this.height = (((this.twipsHeight / 20) >>> 0) || 0) + 1;
  }
  theatre.inherit(ShapeActor, mSWFCrew.DisplayListActor);

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

  /**
   * Handles SWF Shapes.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {theatre.Stage} pStage The stage.
   * @param {Object} pParams An obect containing a dictionary-actor map object.
   * @param {quickswf.structs.Shape} pShape The Shape to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineShape'] = function(pSWF, pStage, pParams, pShape, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tProto;
    var tTwipsWidth = pShape.bounds.right - pShape.bounds.left;
    var tTwipsHeight = pShape.bounds.bottom - pShape.bounds.top;

    var tShapePropClass = function BuiltinShapeProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tShapePropClass, ShapeProp);

    tProto = tShapePropClass.prototype;

    tProto.images = pSWF.images;
    tProto.draw = mShapeUtils.generateDrawFunction(pSWF.images, pShape);

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = (((tTwipsWidth / 20) >>> 0) || 0) + 1;
    tCanvas.height = (((tTwipsHeight / 20) >>> 0) || 0) + 1;
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    var tShapeActor = tDictionaryToActorMap[pShape.id] = function BuiltinShapeActor() {
      this.base();

      var tShapeProp = new tShapePropClass(pStage.backingContainer, this.width, this.height); // TODO: This feels like a hack...

      this.addProp(tShapeProp);
    };
    theatre.inherit(tShapeActor, ShapeActor);

    tProto = tShapeActor.prototype;

    tProto.twipsWidth = tTwipsWidth;
    tProto.twipsHeight = tTwipsHeight;
    tProto.bounds = pShape.bounds;

  };

}(this));
