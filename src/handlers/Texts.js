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
  var TextActor = mSWFCrew.actors.TextActor;
  var TextProp = mSWFCrew.props.TextProp;

  function generateGlyphTextDrawFunction(pText, pSWF, pParams) {
//console.log(pText);
    var tTwipsWidth = 0;
    var tY0 = 1000000;
    var tY1 = -1000000;

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
      var tFontScale = tTextRecord.height / 1024;
      var tAscent = ((tFont.ascent === 0) ? 880 : tFont.ascent) * tFontScale;
      var tDescent = ((tFont.descent === 0) ? 144 : tFont.descent) * tFontScale;
      tYPadding = tTextRecord.y - tAscent;
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
            top: (tFont.ascent === 0 ? -1024 : -tFont.ascent),
            bottom: (tFont.descent === 0 ? 0 : tFont.descent)};
        tShape.fillStyles[0].color = tTextRecord.color;
        var tActualBounds = {left: 0, right: 0, top: 0, bottom: 0};
        var tDrawFunc = mShapeUtils.generateDrawFunction(pSWF.mediaLoader, tShape, tActualBounds);
        if (tActualBounds.bottom > tShape.bounds.bottom) {
          // The font's shape can exceed the EM square (1024 x 1024) downward.
          var tNewTop = tShape.bounds.top + (tActualBounds.bottom - tShape.bounds.bottom);
          tShape.bounds.top = tNewTop < tActualBounds.top ? tNewTop : tActualBounds.top;
          tShape.bounds.bottom = tActualBounds.bottom;
          tDrawFunc = mShapeUtils.generateDrawFunction(pSWF.mediaLoader, tShape);
        }
        tDrawFunctions.push(tDrawFunc);
        tPaddingList.push({x: tTextRecord.xAdvance / 20, y: tYPadding / 20});
        tTextRecord.xAdvance += tGlyph.advance;
        tEMHeight = Math.max(tEMHeight, (tShape.bounds.bottom - tShape.bounds.top));
//console.log('Glyph width [' + j + ']=' + tGlyph.advance);
      }
      tTextLines.push({draws: tDrawFunctions, paddings: tPaddingList, height: tTextRecord.height, emHeight: tEMHeight});
      tTwipsWidth = Math.max(tTwipsWidth, tTextRecord.xAdvance);
      tY0 = Math.min(tY0, tTextRecord.y - tAscent);
      tY1 = Math.max(tY1, tTextRecord.y + tDescent);
//console.log('Glyph width total=' + tXPadding);
    }
    pParams.width = tTwipsWidth;
    pParams.height = tY1 - tY0;
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

  /**
   * Handles SWF Texts (DefineText, DefineText2.)
   * @param {quickswf.Text} pText The Text to handle.
   */
  mHandlers['DefineText'] = function(pText) {
    var tDictionaryToActorMap = this.actorMap;
    tDictionaryToActorMap[pText.id] = {clazz: null, singleton: false};

    // Define TextProp
    var tTextPropClass = function BuiltinTextProp(pBackingContainer, pWidth, pHeight, pDeviceText) {
      this.base(pBackingContainer, pWidth, pHeight, pDeviceText);
    }
    theatre.inherit(tTextPropClass, TextProp);
    var tProto = tTextPropClass.prototype;
    var tParams = new Object();
    tProto.draw = generateGlyphTextDrawFunction(pText, this.swf, tParams);
    var tWidthDiff  = tParams.width - (pText.bounds.right  - pText.bounds.left);
    var tHeightDiff = tParams.height - (pText.bounds.bottom - pText.bounds.top);
    if (tWidthDiff > 0) {
      pText.bounds.left   -= tWidthDiff  / 2;
      pText.bounds.right  += tWidthDiff  / 2;
    }
    if (tHeightDiff > 0) {
      pText.bounds.top    -= tHeightDiff / 2;
      pText.bounds.bottom += tHeightDiff / 2;
    }
    var tTwipsWidth = pText.bounds.right  - pText.bounds.left;
    var tTwipsHeight = pText.bounds.bottom - pText.bounds.top;

    var tCanvas = tProto.drawingCanvas = global.document.createElement('canvas');
    tCanvas.width = ((tTwipsWidth / 20) >>> 0) || 1;
    tCanvas.height = ((tTwipsHeight / 20) >>> 0) || 1;
    //console.log('TextProp: Canvas size : w=' + tCanvas.width + ', h=' + tCanvas.height);

    var tContext = tProto.drawingContext = tCanvas.getContext('2d');
    tContext.lineCap = 'round';
    tContext.lineJoin = 'round';
    tContext.scale(0.05, 0.05);

    // Define TextActor
    var tTextActor = tDictionaryToActorMap[pText.id].clazz = function BuiltinTextActor(pPlayer) {
      this.base(pPlayer);
      var tShapeProp = new tTextPropClass(pPlayer.backingContainer, this.width, this.height, false); // TODO: This feels like a hack...
      this.addProp(tShapeProp);
    };
    theatre.inherit(tTextActor, TextActor);
    tProto = tTextActor.prototype;

    tProto.bounds = pText.bounds;
    tProto.matrix = pText.matrix;
  };

}(this));
