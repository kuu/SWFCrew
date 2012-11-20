/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers = mSWFCrew.handlers || new Array();
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

    tContext.translate(tActor.bounds.left, tActor.bounds.top);
    tContext.scale(20, 20);

    var tWillDraw = mPreDrawBackup.call(this, pData);

    if (tWillDraw === false) {
      pData.context.restore();
    }

    return tWillDraw;
  };

  TextProp.prototype.postDraw = function(pData) {
    mPostDrawBackup.call(this, pData);

    pData.context.restore();
  };

  /**
   * Handles SWF Texts.
   * The 5 is the displayList code for texts in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Text} pText The Text to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers[5] = function(pSWF, pStage, pParams, pText, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tTwipsWidth = pText.bounds.right - pText.bounds.left;
    var tTwipsHeight = pText.bounds.bottom - pText.bounds.top;

    var tTextPropClass = TextActor.propClass = function BuiltinTextProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tTextPropClass, TextProp);

    var tProto = tTextPropClass.prototype;

    // Override Prop#draw function to display text records.
    var i, il, j, jl, tTextRecords = pText.textrecords || [],
        tTextLines = new Array(); 

    for (i = 0, il = tTextRecords.length; i < il; i++) {

      var tTextRecord = tTextRecords[i], 
          tFont, tShapeList, tShape, tGlyphList, tGlyph,
          tDrawFunctions = new Array(),
          tTextBounds = pText.bounds, tCharBounds, tBounds;

      // Convert each glyph index into a draw function.
      tGlyphList = tTextRecord.glyphs;
      tFont = pSWF.fonts[tTextRecord.id];
      //tTextBounds.move(tTextRecord.x || 0, tTextRecord.y || 0);

      for (j = 0, jl = tGlyphList.length; j < jl; j++) {
        tGlyph = tGlyphList[j];
        tShape = tFont.shapes[tGlyph.index];
        tBounds = tShape.bounds = tTextBounds.clone();
        tBounds.right = (tBounds.left + tGlyph.advance);
        tTextBounds.left = tBounds.right;
//console.log('Shape[' + j + '] = ', tShape.bounds);
        tDrawFunctions.push(ShapeActor.generateDrawFunction(pSWF, tShape, tProto));
      }
      tTextLines.push(tDrawFunctions);
    }
    tProto.draw = function (pData) {
        for (i = 0, il = tTextLines.length; i < il; i++) {
          var tLine = tTextLines[i];
          for (j = 0, jl = tLine.length; j < jl; j++) {
            tLine[j].call(this, pData);
          }
        }
      };

    // 
    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tTwipsHeight / 20) >>> 0) || 1;
    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

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
