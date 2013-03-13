/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mProps = theatre.crews.swf.props;
  var mShapeUtils = theatre.crews.swf.utils.shape;
  var Canvas = global.benri.draw.Canvas;
  var Color = global.benri.draw.Color;
  var Glyph = global.benri.draw.Glyph;

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


  /**
   * The class responsible for rendering EditTexts.
   * @class
   * @extends {theatre.crews.swf.props.DisplayListRenderProp}
   */
  var EditTextRenderProp = (function(pSuper) {
    function EditTextRenderProp(pWidth, pHeight) {
      pSuper.call(this);
      this.rebuildGlyph = false;
    }

    EditTextRenderProp.prototype = Object.create(pSuper.prototype);
    EditTextRenderProp.prototype.constructor = EditTextRenderProp;

    /**
     * @inheritDoc
     */
    EditTextRenderProp.prototype.render = function(pData) {
      // If super returns false, we abort rendering.
      if (pSuper.prototype.render.call(this, pData) === false) {
        return false;
      }

      var tActor = this.actor;
      var tContext = this.context;

      /**
       * We have previously created a cache for this prop. Grab it.
       * We created it in the Handler for Texts (DefineText/DefineEditText).
       * @type {benri.render.Renderable}
       */
      var tRenderableList = tActor.player.loader.getActorRenderableCache(tActor.displayListId);
      var tRenderableItem, tRenderable;
      for (var i = 0, il = tRenderableList.length; i < il; i++) {
        tRenderableItem = tRenderableList[i];
        if (tRenderableItem.actor === tActor) {
          tRenderable = tRenderableItem.renderable;
          break;
        }
      }
      var tCanvas = tRenderable.canvas;
      var tString = tActor.text;
      var tFont = tActor.font;
      var tStyle = tActor.style;
      var tCharCode, tFontInfo, tAdvance,
          tGlyph, tShape;

      if (this.rebuildGlyph && tString) {
        var tTextWidth = 0;
        // Create glyphs.
        for (var i = 0, il = tString.length; i < il; i++) {
          tCharCode = tString.charCodeAt(i);

          // Get advance.
          tFontInfo = tActor.lookupTable[tCharCode + ''];
          tAdvance = tFontInfo ? tFontInfo.advance
                : (tCharCode < 256 ? tActor.fontHeight / 2 : tActor.fontHeight);
          // Get glyph data.
          tGlyph = tFont.getGlyph(tCharCode);
          if (!tGlyph && tFontInfo) {
            tShape = tFontInfo.shape;
            tShape.fillStyles[0].color = tActor.color;
            tGlyph = createGlyph(tCharCode, tShape, tAdvance, tActor.mediaLoader);
            tFont.setGlyph(tCharCode, tGlyph);
          }
          if (tGlyph) {
            tTextWidth += tGlyph.advance;
          }
        }
        tStyle.textWidth = tTextWidth * tStyle.fontHeight / 1024;
      }
      this.rebuildGlyph = false;

      // Clear canvas.
      tCanvas.clear(new Color(0, 0, 0, 0));
      // Draw text.
      tCanvas.drawText(tString, tStyle);

      // Offset by the Texts bounds.
      // We do this because when boudns are negative they would be
      // drawn off of the Canvas.
      // To counteract that, in the drawing code we have translated
      // by the negative of the bounds.
      // Here we offset that negative translation to bring it back in place.
      tContext.translate(tActor.bounds.left, tActor.bounds.top);

      // We are rendering a bitmap in the end, so revert the matrix back to normal
      // temporarily.
      tContext.scale(20, 20);

      // Render the cached Renderable.
      tRenderable.render(tContext);
    };

    return EditTextRenderProp;
  })(theatre.crews.swf.props.DisplayListRenderProp);

  mProps.EditTextRenderProp = EditTextRenderProp;

}(this));
