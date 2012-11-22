/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers;
  var mShapeUtils = mSWFCrew.utils.shape;
  var ShapeActor = mSWFCrew.actors.ShapeActor;

  function TextActor() {
    this.base();

    var tWidth = this.width = this.twipsWidth / 20;
    var tHeight = this.height = this.twipsHeight / 20;
  }
  theatre.inherit(TextActor, mSWFCrew.DisplayListActor);

  function TextProp(pBackingCanvas, pWidth, pHeight) {
    this.base(pBackingCanvas, pWidth, pHeight);
    this.cacheDrawResult = true;
    this.cacheWithClass = true;
  }
  theatre.inherit(TextProp, theatre.crews.canvas.CanvasProp);

  var mPreDrawBackup = theatre.crews.canvas.CanvasProp.prototype.preDraw;
  var mPostDrawBackup = theatre.crews.canvas.CanvasProp.prototype.postDraw;

  TextProp.prototype.preDraw = function(pData) {
    if (this.actor.isVisible === false) {
      return false;
    }

    var tContext = pData.context;
    var tActor = this.actor;

    tContext.save();
    tContext.scale(20, 20);
//console.log('tContext.save();');
//console.log('tContext.scale(20, 20);');

    var tWillDraw = mPreDrawBackup.call(this, pData);

    if (tWillDraw === false) {
      pData.context.restore();
//console.log('tContext.restore();');
    }

    return tWillDraw;
  };

  TextProp.prototype.postDraw = function(pData) {
    mPostDrawBackup.call(this, pData);

    pData.context.restore();
//console.log('tContext.restore();');
  };

  /**
   * Handles SWF Texts.
   * The 5 is the displayList code for texts in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Text} pText The Text to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineText'] = function(pSWF, pStage, pParams, pText, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tTwipsWidth = pText.bounds.right - pText.bounds.left;
    var tTwipsHeight = pText.bounds.bottom - pText.bounds.top;

    var tTextPropClass = function BuiltinTextProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tTextPropClass, TextProp);

    var tProto = tTextPropClass.prototype;

    // Override Prop#draw function to display text records.
    var i, il, j, jl, tTextRecords = pText.textrecords || [],
        tTextLines = new Array(), tEMSquareX = 1024, tEMSquareY = 1024;

    for (i = 0, il = tTextRecords.length; i < il; i++) {
      var tTextRecord = tTextRecords[i],
          tFont, tPrevFont, tShape, tGlyphList, tGlyph,
          tDrawFunctions = new Array(), tPaddingList = new Array(),
          tXPadding = tTextRecord.x;

      // Convert each glyph index into a draw function.
      tGlyphList = tTextRecord.glyphs;
      tPrevFont = tFont = tTextRecord.id === null ? tPrevFont : pSWF.fonts[tTextRecord.id];

      for (j = 0, jl = tGlyphList.length; j < jl; j++) {
        tGlyph = tGlyphList[j];
        tShape = tFont.shapes[tGlyph.index];
        tShape.bounds = {left: 0, right: tEMSquareX, top: -(tEMSquareY / 2), bottom: tEMSquareY / 2};
        tShape.fillStyles[0].color = tTextRecord.color;
        tDrawFunctions.push(mShapeUtils.generateDrawFunction(pSWF.images, tShape));
        tPaddingList.push({x: tXPadding / 20, y: 0});
        tXPadding += tGlyph.advance;
      }
      tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList});
    }
    tProto.draw = function (pData) {
        var tContext = pData.context;

        for (i = 0, il = tTextLines.length; i < il; i++) {
          var tDrawList = tTextLines[i].draws;
          var tPadding = tTextLines[i].paddings;
          this.drawingContext.save();
//console.log('tTempContext.save();');
          //var tXScale = this.drawingCanvas.width * 20 / (tEMSquareX * tDrawList.length);
          //var tYScale = this.drawingCanvas.height * 20 / tEMSquareY;
          var tWidth = pText.bounds.right - pText.bounds.left;
          var tHeight = pText.bounds.bottom - pText.bounds.top;
          var tXScale =  tWidth / (tEMSquareX * tDrawList.length);
          var tYScale = tHeight / tEMSquareY;
          this.drawingContext.scale(tXScale, tYScale);
//console.log('tTempContext.scale(', tXScale, tYScale, ');');
          for (j = 0, jl = tDrawList.length; j < jl; j++) {
            tContext.save();
//console.log('tContext.save();');
            tContext.translate(tPadding[j].x, tPadding[j].y);
//console.log('tContext.translate(', tPadding[j].x, tPadding[j].y, ');');
//console.log(tDrawList[j]);
            tDrawList[j].call(this, pData);
            tContext.restore();
//console.log('tContext.restore();');
          }
          this.drawingContext.restore();
//console.log('tTempContext.restore();');
        }
      };

    //
    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tTwipsHeight / 20) >>> 0) || 1;
    console.log('TextProp: Canvas size : w=' + tCanvas.width + ', h=' + tCanvas.height);
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);
//console.log('tTempContext.scale(0.05, 0.05);');

    var tTextActor = tDictionaryToActorMap[pText.id] = function BuiltinTextActor() {
      this.base();
      var tShapeProp = new tTextPropClass(pStage.backingContainer, this.width, this.height); // TODO: This feels like a hack...
      this.addProp(tShapeProp);
    };
    theatre.inherit(tTextActor, TextActor);
    tProto = tTextActor.prototype;

    tProto.twipsWidth = tTwipsWidth;
    tProto.twipsHeight = tTwipsHeight;
    tProto.bounds = pText.bounds;
    tProto.matrix = pText.matrix;
  };

}(this));
