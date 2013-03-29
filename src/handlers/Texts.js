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
  var Color = global.benri.draw.Color;
  var Canvas = global.benri.draw.Canvas;
  var Font = global.benri.draw.Font;
  var Glyph = global.benri.draw.Glyph;
  var TextStyle = global.benri.draw.TextStyle;
  var CanvasRenderable = global.benri.render.CanvasRenderable;

  function createFont(pSwfFont) {
    var tFont = new Font();
    tFont.name = pSwfFont.name;
    tFont.ascent = pSwfFont.ascent;
    tFont.descent = pSwfFont.descent;
    tFont.leading = pSwfFont.leading;
    tFont.italic = pSwfFont.italic;
    tFont.bold = pSwfFont.bold;
    return tFont;
  }

  function createGlyph(pCharCode, pSwfShape, pAdvance, pMediaLoader) {
    var tTempCanvas = new Canvas(1024, 1024);
    var tRect = mShapeUtils.drawShape(pSwfShape, tTempCanvas, pMediaLoader);
    var tGlyph = new Glyph(pCharCode);
    tGlyph.data = tTempCanvas.getRecords(true);
    tGlyph.data.filter('clearColor', function (_, j, pRecords) {
        // Remove record.
        pRecords.splice(j, 1);
      }, null, true);
    tGlyph.advance = pAdvance;
    tGlyph.rect = tRect;
    return tGlyph;
  }

  function createTextStyle(pTextRecord, pFont, pXOffset, pYOffset, pWidth) {
    var tTextStyle = new TextStyle(pFont);
    var tSwfColor = pTextRecord.color;
    tTextStyle.setColor(new Color(tSwfColor.red, tSwfColor.green, tSwfColor.blue, tSwfColor.alpha * 255));
    tTextStyle.fontHeight = Math.floor(pTextRecord.height / 20);
    tTextStyle.leftMargin = Math.floor(pXOffset / 20);
    tTextStyle.topMargin = Math.floor(pYOffset / 20);
    tTextStyle.maxWidth = Math.floor(pWidth / 20);
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
          tFontScale = tTextRecord.height / 1024,
          tXOffset = tTextRecord.xAdvance, tYOffset,
          tFont, tStyle, tGlyph, tCharCode, tString = '',
          tShape, tGlyphIndex, tGlyphHeight = 0, tActualTwipsWidth = 0;

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

      // Iterate on each character.
      for (var j = 0, jl = tGlyphList.length; j < jl; j++) {

        // Get character code.
        tSwfGlyph = tGlyphList[j];
        tGlyphIndex = tSwfGlyph.index;

        if (tSwfFont.codeTable && (tCharCode = tSwfFont.codeTable[tGlyphIndex])) {
          ;
        } else {
          tCharCode = tGlyphIndex;
        }

        // Get glyph data.
        tGlyph = tFont.getGlyph(tCharCode);
        if (!tGlyph) {
          tShape = tSwfFont.shapes[tGlyphIndex];
          tShape.fillStyles[0].color = tTextRecord.color;
          tGlyph = createGlyph(tCharCode, tShape, Math.floor(tSwfGlyph.advance / tFontScale), tSWF.mediaLoader);
          tFont.setGlyph(tCharCode, tGlyph);
        }
        tActualTwipsWidth += Math.max(tSwfGlyph.advance, tGlyph.rect.getWidth() * tFontScale);
        tGlyphHeight = Math.max(tGlyphHeight, tGlyph.rect.getHeight());
        // Build text.
        tString += String.fromCharCode(tCharCode);
      }

/*
      if (tTwipsWidth < tXOffset + tActualTwipsWidth) {
        tXOffset -= Math.ceil((tXOffset + tActualTwipsWidth - tTwipsWidth) / 2);
      }
*/

      var tDescent = Math.floor(tSwfFont.descent * tFontScale);
      var tBottomOffset = tTextRecord.y + tDescent;
      var tActualShapeHeight = Math.floor(tGlyphHeight * tFontScale);
      var tRequiredHeight = Math.max(tBottomOffset, tActualShapeHeight);
      //var tUseShapesHeight = (tActualShapeHeight < tTwipsHeight);
      if (tTwipsHeight < tRequiredHeight) {
        var tMargin = Math.ceil((tRequiredHeight - tTwipsHeight) / 2);
        tBounds.top -= tMargin;
        tBounds.bottom += tMargin;
        tTwipsHeight = tBounds.bottom - tBounds.top;
        tCanvas.height = tPixelHeight = Math.round(tTwipsHeight / 20);
      }
      if (tBottomOffset < tActualShapeHeight) {
        tTextRecord.y -= (tActualShapeHeight - tBottomOffset);
        tBottomOffset = tTextRecord.y + tDescent;
      }
      //tYOffset = (tUseShapesHeight ? tActualShapeHeight : tTextRecord.y);
      tYOffset = tTextRecord.y;
      // Create style.
      tStyle = createTextStyle(tTextRecord, tFont, tXOffset, tYOffset, tTwipsWidth - tXOffset);
      // Clear canvas on the first draw.
      if (i === 0) {
        tCanvas.clear(new Color(0, 0, 0, 0));
      }
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
      BuiltinTextActor.prototype.twipsWidth = tBounds.right - tBounds.left;
      BuiltinTextActor.prototype.twipsHeight = tBounds.bottom - tBounds.top;
      BuiltinTextActor.prototype.pixelWidth = tPixelWidth;
      BuiltinTextActor.prototype.pixelHeight = tPixelHeight;

      return BuiltinTextActor;
    })(theatre.crews.swf.actors.TextActor);

    BuiltinTextActor.prototype.displayListId = tId;

    this.setActorRenderableCache(tId, new CanvasRenderable(tCanvas));
  };

}(this));
