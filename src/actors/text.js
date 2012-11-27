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

  function generateGlyphTextDrawFunction(pText, pSWF, pParams) {
//console.log(pText);
    var tTwipsWidth = 0, tTwipsHeight = 0;

    // Override Prop#draw function to display text records.
    var i, il, j, jl, tTextRecords = pText.textrecords || [],
        tTextLines = new Array();

    for (i = 0, il = tTextRecords.length; i < il; i++) {
      var tTextRecord = tTextRecords[i],
          tFont, tPrevFont, tShape, tGlyphList, tGlyph,
          tDrawFunctions = new Array(), tPaddingList = new Array(),
          tXPadding = tTextRecord.x;

      // Convert each glyph index into a draw function.
      tGlyphList = tTextRecord.glyphs;
      tPrevFont = tFont = tTextRecord.id === null ? tPrevFont : pSWF.fonts[tTextRecord.id];
//console.log(tFont);
//console.log('---------------------');
//console.log('pText.bounds=', pText.bounds);
//console.log('tTextRecord[' + i + '].height=' + tTextRecord.height);
//console.log('tTextRecord[' + i + '].offsetX=' + tTextRecord.x);
//console.log('tTextRecord[' + i + '].offsetY=' + tTextRecord.y);
      var tString = '';

      for (j = 0, jl = tGlyphList.length; j < jl; j++) {
        tGlyph = tGlyphList[j];
        tShape = tFont.shapes[tGlyph.index];
        if (tFont.codeTable && tFont.codeTable[tGlyph.index] !== void 0) {
          tString += String.fromCharCode(tFont.codeTable[tGlyph.index]);
        }
        tShape.bounds = {left: 0, right: 1024, top: -tTextRecord.height, bottom: 1024 - tTextRecord.height};
        tShape.fillStyles[0].color = tTextRecord.color;
        tDrawFunctions.push(mShapeUtils.generateDrawFunction(pSWF.images, tShape));
        tPaddingList.push({x: tXPadding / 20, y: 0});
        tXPadding += tGlyph.advance;
//console.log('Glyph width [' + j + ']=' + tGlyph.advance);
      }
      tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList, height: tTextRecord.height});
//console.log('Glyph width total=' + tXPadding);
      tTwipsWidth = Math.max(tTwipsWidth, tXPadding);
      tTwipsHeight += tTextRecord.height;
    }
    pParams.width = tTwipsWidth;
    pParams.height = tTwipsHeight;
    pParams.string = tString;
//console.log('tTwipsWidth=' + tTwipsWidth);
//console.log('tTwipsHeight=' + tTwipsHeight);
//console.log('tString=' + tString);

    return function (pData) {
        var tContext = pData.context;

        for (i = 0, il = tTextLines.length; i < il; i++) {
          var tDrawList = tTextLines[i].draws;
          var tPadding = tTextLines[i].paddings;
          var tFontScale = tTextLines[i].height / 1024;
          this.drawingContext.save();
          this.drawingContext.scale(tFontScale, tFontScale);
          for (j = 0, jl = tDrawList.length; j < jl; j++) {
            tContext.save();
            tContext.translate(tPadding[j].x, tPadding[j].y);
//console.log('tContext.translate(', tPadding[j].x, tPadding[j].y, ');');
            tDrawList[j].call(this, pData);
            tContext.restore();
          }
          this.drawingContext.restore();
        }
      };
  }

  function generateGlyphEditTextDrawFunction(pEditText, pSWF, pParams) {
    var i, il, j, jl, tTextBounds = pEditText.bounds, 
        tCurrX, tXBounds, tString = pParams.string || pEditText.initialtext,
        tFont = pSWF.fonts[pEditText.font],
        tBoundsWidth = pEditText.bounds.right - pEditText.bounds.left,
        tBoundsHeight = pEditText.bounds.bottom - pEditText.bounds.top,
        tTwipsWidth = 0, tTwipsHeight = 0,
        tTextLines = new Array();
//console.log(pEditText);
//console.log(tFont);

    if (tFont.shiftJIS) {
      // Not for now...
      return new Function();
    }

    tCurrX = tTextBounds.left + pEditText.leftmargin;
    tXBounds = tTextBounds.right - pEditText.rightmargin;

    while (tCurrX <= tXBounds) {
      var tDrawFunctions = new Array(), tPaddingList = new Array();
      for (i = 0, il = tString.length; i < il; i++) {

        var tCharCode = tString.charCodeAt(i),
            tFontInfo = tFont.lookupTable[tCharCode + ''],
            tShape = tFontInfo.shape;

        tShape.bounds = {left: 0, right: 1024, top: -pEditText.fontheight, bottom: 1024 - pEditText.fontheight};
        tShape.fillStyles[0].color = pEditText.textcolor;
        tDrawFunctions.push(mShapeUtils.generateDrawFunction(pSWF.images, tShape));
        tPaddingList.push({x: tCurrX / 20, y: 0});
        tCurrX += tFontInfo.advance;
      }
      tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList, height: pEditText.fontheight, 
        xScale: (tCurrX - tTextBounds.left) / tBoundsWidth, yScale: pEditText.fontheight / tBoundsHeight});
      tTwipsWidth = Math.max(tTwipsWidth, tCurrX - tTextBounds.left);
      tTwipsHeight += pEditText.fontheight;
      break;
    }

    pParams.width = tTwipsWidth;
    pParams.height = tTwipsHeight;
    pParams.string = tString;
console.log('tTwipsWidth=' + tTwipsWidth);
console.log('tTwipsHeight=' + tTwipsHeight);
//console.log('tString=' + tString);

    return function (pData) {
        var tContext = pData.context;

        for (i = 0, il = tTextLines.length; i < il; i++) {
          var tDrawList = tTextLines[i].draws;
          var tPadding = tTextLines[i].paddings;
          var tFontScale = tTextLines[i].height / 1024;
console.log('tFontScale=' + tFontScale);
          //var tXScale = tTextLines[i].xScale;
          //var tYScale = tTextLines[i].yScale;
//console.log('tXScale=' + tXScale);
//console.log('tYScale=' + tYScale);
          this.drawingContext.save();
          this.drawingContext.scale(tFontScale, tFontScale);
          for (j = 0, jl = tDrawList.length; j < jl; j++) {
            tContext.save();
            tContext.translate(tPadding[j].x, tPadding[j].y);
//console.log('tContext.translate(', tPadding[j].x, tPadding[j].y, ');');
            tDrawList[j].call(this, pData);
            tContext.restore();
          }
          this.drawingContext.restore();
        }
      };
  }

  function generateDeviceTextDrawFunction(pText, pSWF) {
    return new Function();
  }

  function generateDeviceEditTextDrawFunction(pText, pSWF) {
    return new Function();
  }

  /**
   * Handles SWF Texts (DefineText, DefineText2.)
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {theatre.Stage} pSage TheatreScript's Stage object.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Text} pText The Text to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineText'] = function(pSWF, pStage, pParams, pText, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;

    // Define TextProp
    var tTextPropClass = function BuiltinTextProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tTextPropClass, TextProp);
    var tProto = tTextPropClass.prototype;
    var tParams = new Object();
    tProto.draw = generateGlyphTextDrawFunction(pText, pSWF, tParams);
    var tTwipsWidth = tParams.width;
    var tTwipsHeight = tParams.height;

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tTwipsHeight / 20) >>> 0) || 1;
    //console.log('TextProp: Canvas size : w=' + tCanvas.width + ', h=' + tCanvas.height);

    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    // Define TextActor
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

  /**
   * Handles SWF Texts (DefineEditText.)
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {theatre.Stage} pSage TheatreScript's Stage object.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Text} pText The Text to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineEditText'] = function(pSWF, pStage, pParams, pEditText, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    // Define TextProp
    var tTextPropClass = function BuiltinEditTextProp(pBackingContainer, pWidth, pHeight) {
      this.base(pBackingContainer, pWidth, pHeight);
    }
    theatre.inherit(tTextPropClass, TextProp);
    var tProto = tTextPropClass.prototype;
    var tParams = new Object();
    if (pEditText.useoutline && pEditText.font) {
      tProto.draw = generateGlyphEditTextDrawFunction(pEditText, pSWF, tParams);
    } else {
      tProto.draw = generateDeviceEditTextDrawFunction(pEditText, pSWF, tParams);
    }
    var tTwipsWidth = tParams.width;
    var tTwipsHeight = tParams.height;

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tTwipsHeight / 20) >>> 0) || 1;
    //console.log('TextProp: Canvas size : w=' + tCanvas.width + ', h=' + tCanvas.height);

    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    // Define TextActor
    var tTextActor = tDictionaryToActorMap[pEditText.id] = function BuiltinEditTextActor() {
      this.base();
      var tShapeProp = new tTextPropClass(pStage.backingContainer, this.width, this.height); // TODO: This feels like a hack...
      this.addProp(tShapeProp);
    };
    theatre.inherit(tTextActor, TextActor);
    tProto = tTextActor.prototype;

    tProto.twipsWidth = tTwipsWidth;
    tProto.twipsHeight = tTwipsHeight;
    tProto.bounds = pEditText.bounds;
  };

}(this));
