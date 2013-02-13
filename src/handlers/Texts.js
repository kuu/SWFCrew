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
  var TextRenderProp = mSWFCrew.props.TextRenderProp;
  var Canvas = global.benri.draw.Canvas;
  var Font = global.benri.draw.Font;
  var Glyph = global.benri.draw.Glyph;
  var TextStyle = global.benri.draw.TextStyle;
  var CanvasRenderable = global.benri.render.CanvasRenderable;

  function createFont(pSwfFont) {
    var tFont = new Font();
    tFont.name = pSwfFont.name;
    tFont.advance = pSwfFont.name;
    tFont.ascent = pSwfFont.ascent;
    tFont.descent = pSwfFont.descent;
    tFont.leading = pSwfFont.leading;
    tFont.italic = pSwfFont.italic;
    tFont.bold = pSwfFont.bold;
    return tFont;
  }

  function createGlyph(pCharCode, pSwfShape, pAdvance, pMediaLoader) {
    var tTempCanvas = new Canvas(1024, 1024);
    var tExtent = mShapeUtils.drawShape(pSwfShape, tTempCanvas, pMediaLoader);
    pSwfShape.bounds = tExtent;
    var tGlyph = new Glyph(pCharCode);
    tGlyph.data = tTempCanvas.getRecords(true);
    tGlyph.advance = pAdvance;
    return tGlyph;
  }

  function createTextStyle(pTextRecord, pFont, pXOffset, pYOffset) {
    var tTextStyle = new TextStyle(pFont);
    tTextStyle.fontHeight = pTextRecord.height / 20;
    tTextStyle.leftMargin = pXOffset / 20;
    tTextStyle.topMargin = pYOffset / 20;
    return tTextStyle;
  }

  /**
   * Handles SWF Texts.
   * @param {quickswf.structs.Text} pText The Text to handle.
   */
  mHandlers['DefineText'] = function(pText) {
    var tId = pText.id;
    var tBounds = pText.bounds;
    var tTwipsWidth = tBounds.right  - tBounds.left;
    var tTwipsHeight = tBounds.bottom - tBounds.top;
    var tPixelWidth = Math.round(tTwipsWidth / 20);
    var tPixelHeight = Math.round(tTwipsHeight / 20);

    // Create a new Canvas to render to.
    var tCanvas = new Canvas(tPixelWidth, tPixelHeight);
    var tTextRecords = pText.textrecords;
    var tSWF = this.swf;

    // Iterate on each text line.
    for (var i = 0, il = tTextRecords.length; i < il; i++) {
      var tTextRecord = tTextRecords[i],
          tFontId = tTextRecord.id, tPrevFontId, tSwfFont,
          tGlyphList = tTextRecord.glyphs, tSwfGlyph,
          tFontScale, tXOffset = tTextRecord.xAdvance, tYOffset,
          tFont, tStyle, tGlyph, tCharCode, tString = '',
          tShape, tGlyphIndex, tGlyphHeight;

      // Get benri.draw.Font object.
      if (tFontId === null) {
        if (tPrevFontId === null) {
          return;
        } else {
          tFontId = tPrevFontId;
        }
      } else {
        tPrevFontId = tFontId;
      }
      tSwfFont = tSWF.fonts[tFontId];
      if (!(tFont = this.getFontCache(tFontId))) {
        tFont = createFont(tSwfFont);
        this.setFontCache(tFontId, tFont);
      }

      tFontScale = tTextRecord.height / 1024;
      tXOffset = tTextRecord.xAdvance;
      tGlyphHeight = 0;

      // Iterate on each character.
      for (var j = 0, jl = tGlyphList.length; j < jl; j++) {

        // Get character code.
        tSwfGlyph = tGlyphList[j];
        tGlyphIndex = tSwfGlyph.index;

        if (tFont.codeTable && (tCharCode = tFont.codeTable[tGlyphIndex]) !== void 0) {
          ;
        } else {
          tCharCode = tGlyphIndex;
        }

        // Get glyph data.
        tGlyph = tFont.getGlyph(tCharCode);
        if (!tGlyph) {
          tShape = tSwfFont.shapes[tGlyphIndex];
          tShape.fillStyles[0].color = tTextRecord.color;
          tGlyph = createGlyph(tCharCode, tShape, tSwfGlyph.advance / tFontScale, tSWF.mediaLoader);
          tFont.setGlyph(tCharCode, tGlyph);
          tGlyphHeight = Math.max(tGlyphHeight, tShape.bounds.bottom - tShape.bounds.top);
        }
        // Build text.
        tString += String.fromCharCode(tCharCode);
      }
      tYOffset = tGlyphHeight * tFontScale;
      // Create style.
      tStyle = createTextStyle(tTextRecord, tFont, tXOffset, tYOffset);
      // Draw text.
      tCanvas.drawText(tString, tStyle);
    } // [loop end] -- for each text line.

    /**
     * @class
     * @extends {theatre.crews.swf.actors.ShapeActor}
     */
    var BuiltinTextActor = this.actorMap[tId] = (function(pSuper) {
      function BuiltinTextActor(pPlayer) {
        pSuper.call(this, pPlayer);
        this.addProp(new TextRenderProp(this.pixelWidth, this.pixelHeight));
      }

      BuiltinTextActor.prototype = Object.create(pSuper.prototype);
      BuiltinTextActor.prototype.constructor = BuiltinTextActor;

      BuiltinTextActor.prototype.bounds = tBounds;
      BuiltinTextActor.prototype.matrix = pText.matrix;
      BuiltinTextActor.prototype.twipsWidth = tTwipsWidth;
      BuiltinTextActor.prototype.twipsHeight = tTwipsHeight;
      BuiltinTextActor.prototype.pixelWidth = tPixelWidth;
      BuiltinTextActor.prototype.pixelHeight = tPixelHeight;

      return BuiltinTextActor;
    })(theatre.crews.swf.actors.TextActor);

    BuiltinTextActor.prototype.displayListId = tId;

    this.setActorRenderableCache(tId, new CanvasRenderable(tCanvas));
  };

}(this));
