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
    this.width  = (this.bounds.right  - this.bounds.left) / 20;
    this.height = (this.bounds.bottom - this.bounds.top ) / 20;
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

  var mTextPreDrawBackup = TextProp.prototype.preDraw = function(pData) {
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
    var tTwipsHeight = 0;

    // Override Prop#draw function to display text records.
    var i, il, j, jl, tTextRecords = pText.textrecords || [],
        tTextLines = new Array();

    for (i = 0, il = tTextRecords.length; i < il; i++) {
      var tTextRecord = tTextRecords[i],
          tFont, tPrevFont, tShape, tGlyphList, tGlyph,
          tDrawFunctions = new Array(), tPaddingList = new Array(),
          tYPadding = 0, tEMHeight = 0;

      // Convert each glyph index into a draw function.
      tGlyphList = tTextRecord.glyphs;
      tPrevFont = tFont = tTextRecord.id === null ? tPrevFont : pSWF.fonts[tTextRecord.id];
      tYPadding = (tFont.ascent === null ? tTextRecord.y - tTextRecord.height: 0);
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
        tShape.bounds = {left: 0, right: 1024, 
            top: (tFont.ascent === null ? -1024 : -tFont.ascent), 
            bottom: (tFont.descent === null ? 0 : tFont.descent)};
        tShape.fillStyles[0].color = tTextRecord.color;
        var tActualBounds = {left: 0, right: 0, top: 0, bottom: 0};
        var tDrawFunc = mShapeUtils.generateDrawFunction(pSWF.images, tShape, tActualBounds);
        if (tActualBounds.bottom > tShape.bounds.bottom) {
          // The font's shape can exceed the EM square (1024 x 1024) downward.
          tShape.bounds.bottom = tActualBounds.bottom;
          tDrawFunc = mShapeUtils.generateDrawFunction(pSWF.images, tShape);
        }
        tDrawFunctions.push(tDrawFunc);
        tPaddingList.push({x: pText.xAdvance / 20, y: tYPadding / 20});
        pText.xAdvance += tGlyph.advance;
        tEMHeight = Math.max(tEMHeight, (tShape.bounds.bottom - tShape.bounds.top));
//console.log('Glyph width [' + j + ']=' + tGlyph.advance);
      }
      tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList, height: tTextRecord.height, emHeight: tEMHeight});
      tTwipsHeight = Math.max(tTwipsHeight, tTextRecord.height);
//console.log('Glyph width total=' + tXPadding);
    }
    pParams.width = pText.xAdvance;
    pParams.height = tTwipsHeight;
//console.log('tTwipsWidth=' + tTwipsWidth);
//console.log('tTwipsHeight=' + tTwipsHeight);
//console.log('tString=' + tString);

    return function (pData) {
        var tContext = pData.context;

        for (i = 0, il = tTextLines.length; i < il; i++) {
          var tDrawList = tTextLines[i].draws;
          var tPadding = tTextLines[i].paddings;
          var tFontScale = tTextLines[i].height / tTextLines[i].emHeight;
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

  function generateGlyphEditTextDrawFunction(pActor, pParams) {
    var i, il, j, jl, tTextBounds = pActor.bounds,
        tCurrX = pActor.leftmargin, tXBounds,
        tString = pActor.text || '',
        tFont = pActor.font,
        tTwipsWidth = 0, tTwipsHeight = 0, tEMHeight = 0,
        tTextLines = new Array(), tYPadding = 0;

    tXBounds = tTextBounds.right - tTextBounds.left - pActor.leftmargin - pActor.rightmargin;

    var tDrawFunctions = new Array(), tPaddingList = new Array();

    for (i = 0, il = tString.length; i < il; i++) {
      var tCharCode = tString.charCodeAt(i),
          tFontInfo = tFont.lookupTable[tCharCode + ''];

      if (tCharCode === 13 || (tFontInfo && tCurrX + tFontInfo.advance > tXBounds)) {
        // new line
        tYPadding += (pActor.leading + pActor.fontheight);
        tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList, height: pActor.fontheight, emHeight: tEMHeight});
        tTwipsWidth = Math.max(tTwipsWidth, tCurrX);
        tDrawFunctions = new Array();
        tPaddingList = new Array();
        tCurrX = pActor.leftmargin;
        tEMHeight = 0;
      }
      if (tCharCode === 13 || !tFontInfo) {
        continue;
      }
      var tShape = tFontInfo.shape;
      tShape.bounds = {left: 0, right: 1024, 
        top: (tFont.ascent === null ? -1024 : -tFont.ascent), 
        bottom: (tFont.descent === null ? 0 : tFont.descent)};
      tShape.fillStyles[0].color = pActor.textcolor;
      var tActualBounds = {left: 0, right: 0, top: 0, bottom: 0};
      var tDrawFunc = mShapeUtils.generateDrawFunction(null, tShape, tActualBounds);
      if (tActualBounds.bottom > tShape.bounds.bottom) {
        // The font's shape can exceed the EM square (1024 x 1024) downward.
        tShape.bounds.bottom = tActualBounds.bottom;
        tDrawFunc = mShapeUtils.generateDrawFunction(null, tShape);
      }
      tDrawFunctions.push(tDrawFunc);
      tPaddingList.push({x: tCurrX / 20, y: tYPadding / 20});
      tEMHeight = Math.max(tEMHeight, (tShape.bounds.bottom - tShape.bounds.top));
      tCurrX += tFontInfo.advance;
    }
    tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList, height: pActor.fontheight, emHeight: tEMHeight});
    tTwipsWidth = Math.max(tTwipsWidth, tCurrX);
    tTwipsHeight = tYPadding + pActor.leading + pActor.fontheight;

    pParams.width = tTwipsWidth;
    pParams.height = tTwipsHeight;
    pParams.string = tString;

    return function (pData) {
        var tContext = pData.context;

        for (i = 0, il = tTextLines.length; i < il; i++) {
          var tDrawList = tTextLines[i].draws;
          var tPadding = tTextLines[i].paddings;
          var tFontScale = tTextLines[i].height / tTextLines[i].emHeight;
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

  function generateDeviceEditTextDrawFunction(pActor, pParams) {
    var tColor = pActor.textcolor;
    var tStringList = pActor.text.split(String.fromCharCode(10)); // split by CR
    var tRows = [];
    var tFont = pActor.font;
    var tFontString = (tFont.italic ? 'italic ' : '') + (tFont.bold ? 'bold ' : '') + pActor.fontheight + 'px ' + tFont.name;
    var tBounds = pActor.bounds;
    var tXPos = pActor.leftmargin, tYPos = 0, tWidth = tBounds.right - tBounds.left - pActor.leftmargin - pActor.rightmargin, tHeight = tBounds.bottom - tBounds.top;
    var tAlign = '\'left\'';

    if (pActor.align === 1) {
      tAlign = '\'right\'';
      tXPos += tWidth;
    } else if (pActor.align === 2) {
      tAlign = '\'center\'';
      tXPos += tWidth / 2;
    }

    for (var i = 0, il = tStringList.length; i < il; i++) {
      var tCode = [
        'var tContext = pData.context;',
        'var tTempCanvas = this.drawingCanvas;',
        'var tTempContext = this.drawingContext;',
        'tTempContext.save();',
        'tTempContext.globalCompositeOperation = \'xor\';',
        'tTempContext.fillStyle = \'' + tColor.toString() + '\';',
        'tTempContext.font = \'' + tFontString + '\';',
        'tTempContext.textBaseline = \'top\';',
        'tTempContext.textAlign = ' + tAlign + ';',
        'tTempContext.fillText(\'' + tStringList[i] + '\', ' + tXPos + ', ' + tYPos + ', ' + tWidth + ');',
        'tContext.drawImage(tTempCanvas, 0, 0);',
        'tTempContext.restore();'
      ];
      tRows.push(new Function('pData', tCode.join('\n')));
      tYPos += (pActor.leading + pActor.fontheight);
    }

    pParams.width = tWidth;
    pParams.height = tHeight;

    return function (pData) {
        for (i = 0, il = tRows.length; i < il; i++) {
          var tDrawFunc = tRows[i];
          tDrawFunc.call(this, pData);
        }
      };
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
    var tTextPropClass = function BuiltinTextProp(pBackingContainer, pWidth, pHeight, pDeviceText) {
      this.base(pBackingContainer, pWidth, pHeight, pDeviceText);
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
      var tShapeProp = new tTextPropClass(pStage.backingContainer, this.width, this.height, false); // TODO: This feels like a hack...
      this.addProp(tShapeProp);
    };
    theatre.inherit(tTextActor, TextActor);
    tProto = tTextActor.prototype;

    var tWidthDiff  = tTwipsWidth  - (pText.bounds.right  - pText.bounds.left);
    var tHeightDiff = tTwipsHeight - (pText.bounds.bottom - pText.bounds.top);
    pText.bounds.left   -= tWidthDiff  / 2;
    pText.bounds.right  += tWidthDiff  / 2;
    pText.bounds.top    -= tHeightDiff / 2;
    pText.bounds.bottom += tHeightDiff / 2;
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
    var tTextPropClass = function BuiltinEditTextProp(pBackingContainer, pWidth, pHeight, pDeviceText) {
      this.base(pBackingContainer, pWidth, pHeight, pDeviceText);
      this.rebuildGlyph = true;
    }
    theatre.inherit(tTextPropClass, TextProp);
    var tProto = tTextPropClass.prototype;
    var tParams = new Object();
    if (!pEditText.font) {
      throw new Exception('No font info.');
    }
    var tDeviceText = !pEditText.useoutline;
    tProto.preDraw = function(pData) {
        if (this.rebuildGlyph) {
          var tParams = new Object();
          if (tDeviceText) {
            tProto.draw = generateDeviceEditTextDrawFunction(this.actor, tParams);
          } else {
            tProto.draw = generateGlyphEditTextDrawFunction(this.actor, tParams);
          }
          this.rebuildGlyph = false;
        }
        var tWillDraw = mTextPreDrawBackup.call(this, pData);

/*
        var tBounds = this.actor.bounds;
        var tWidth  = tBounds.right  - tBounds.left;
        var tHeight = tBounds.bottom - tBounds.top;
        var tWidthDiff  = tParams.width  - tWidth;
        var tHeightDiff = tParams.height - tHeight;
        tBounds.left   -= tWidthDiff  / 2;
        tBounds.right  += tWidthDiff  / 2;
        tBounds.top    -= tHeightDiff / 2;
        tBounds.bottom += tHeightDiff / 2;
*/

        return tWillDraw;
      };
    var tBounds = pEditText.bounds;
    var tTwipsWidth  = tBounds.right  - tBounds.left;
    var tTwipsHeight = tBounds.bottom - tBounds.top;

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

      // Copy necesary data.
      this.text = pEditText.initialtext;
      this.bounds = pEditText.bounds;
      this.leftmargin = pEditText.leftmargin;
      this.rightmargin = pEditText.rightmargin;
      this.align = pEditText.align;
      this.textcolor = pEditText.textcolor;
      this.fontheight = pEditText.fontheight;
      this.leading = pEditText.leading;
      this.font = pSWF.fonts[pEditText.font],
      this.isDeviceText = tDeviceText;

      // Creates Prop objects.
      var tTextProp = this.prop = new tTextPropClass(pStage.backingContainer, this.width, this.height); // TODO: This feels like a hack...
      this.addProp(tTextProp);

      // Sets up variable accessor methods.
      var tVarName = pEditText.variablename;
      if (tVarName) {
        this.varName = tVarName;
        this.on('enter', function () {
            var tThis = this;
            // Registers the accessor methods.
            this.parent.hookVariable(tVarName, function () {
console.log('getter called!!!');
                return tThis.text;
              }, 'getter');
            this.parent.hookVariable(tVarName, function (pValue) {
console.log('setter called!!!');
                // need some escape ?
                tThis.text = pValue;
                tTextProp.clearCache();
                tTextProp.rebuildGlyph = true;
                tThis.invalidate();
              }, 'setter');
          });
        this.on('leave', function () {
            // Unregisters the accessor methods.
            if (this.varName && this.parent) {
              this.parent.unhookVariable(this.varName);
            }
          });
      }
    };
    theatre.inherit(tTextActor, TextActor);
    tTextActor.prototype.bounds = pEditText.bounds;
  };

}(this));
