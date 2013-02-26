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
  var EditTextRenderProp = mSWFCrew.props.EditTextRenderProp;
  var Color = global.benri.draw.Color;
  var Canvas = global.benri.draw.Canvas;
  var Font = global.benri.draw.Font;
  var TextStyle = global.benri.draw.TextStyle;
  var CanvasRenderable = global.benri.render.CanvasRenderable;

  function createFont(pSwfFont, pDeviceText) {
    var tFont = new Font();
    tFont.name = pSwfFont.name;
    tFont.advance = pSwfFont.name;
    tFont.ascent = pSwfFont.ascent;
    tFont.descent = pSwfFont.descent;
    tFont.leading = pSwfFont.leading;
    tFont.italic = pSwfFont.italic;
    tFont.bold = pSwfFont.bold;
    tFont.system = pDeviceText;
    return tFont;
  }

  function createTextStyle(pEditText, pFont) {
    var tTextStyle = new TextStyle(pFont);
    var tSwfColor = pEditText.textcolor;
    tTextStyle.color = new Color(tSwfColor.red, tSwfColor.green, tSwfColor.blue, tSwfColor.alpha * 255);
    tTextStyle.fontHeight = Math.floor(pEditText.fontheight / 20);
    tTextStyle.leftMargin = Math.floor((pEditText.leftmargin || 0) / 20);
    tTextStyle.topMargin = Math.floor((pEditText.leading || 0) / 20);
    var tAscent = pFont.ascent ? pFont.ascent : 1024;
    tTextStyle.topMargin += Math.floor(tAscent * tTextStyle.fontHeight / 1024);
    tTextStyle.maxWidth = Math.floor(
        (pEditText.bounds.right - pEditText.bounds.left
          - pEditText.leftmargin - pEditText.rightmargin) / 20
      );
    tTextStyle.align = pEditText.align === 1 ? 'right' : (pEditText.align === 2 ? 'center' : 'left');
    tTextStyle.wrap = !!pEditText.wrap;
    tTextStyle.multiline = !!pEditText.multiline;
    return tTextStyle;
  }

  /**
   * Handles SWF EditTexts.
   * @param {quickswf.structs.EditText} pText The EditText to handle.
   */
  mHandlers['DefineEditText'] = function(pEditText) {
    var tId = pEditText.id;
    var tBounds = pEditText.bounds;
    var tTwipsWidth = tBounds.right  - tBounds.left;
    var tTwipsHeight = tBounds.bottom - tBounds.top;
    var tPixelWidth = Math.round(tTwipsWidth / 20);
    var tPixelHeight = Math.round(tTwipsHeight / 20);

    // Create a new Canvas to render to.
    var tCanvas = new Canvas(tPixelWidth, tPixelHeight);
    var tRenderable = new CanvasRenderable(tCanvas);
    var tSWF = this.swf;
    var tFontId = pEditText.font;
    var tSwfFont = tSWF.fonts[tFontId];
    var tDeviceText = !pEditText.useoutline;
    var tFont, tStyle;

    // Create font.
    tFont = this.getFontCache(tFontId);
    if (!tFont) {
      tFont = createFont(tSwfFont, tDeviceText);
      this.setFontCache(tFontId, tFont);
    } else if (tFont.system !== tDeviceText) {
      // This is the case:
      //  - two texts share the same font.
      //  - one wants to be rendered as a glyph text.
      //  - the other as a device text.
      tFont = createFont(tSwfFont, tDeviceText);
      // We overwrite the cache only when the font has the glyph data.
      if (tDeviceText === false) {
        this.setFontCache(tFontId, tFont);
      }
    }

    // Create style.
    tStyle = createTextStyle(pEditText, tFont);


    /**
     * @class
     * @extends {theatre.crews.swf.actors.ShapeActor}
     */
    var BuiltinEditTextActor = this.actorMap[tId] = (function(pSuper) {
      function BuiltinEditTextActor(pPlayer) {
        pSuper.call(this, pPlayer);

        // Initialize text.
        if (pEditText.sjis && pEditText.initialtext) {
          this.text = tSWF.mediaLoader.get('text', pEditText.initialtext);
        } else {
          this.text = pEditText.initialtext || '';
        }
        this.device = tDeviceText;
        this.fontHeight = pEditText.fontheight;
        this.lookupTable = tSwfFont.lookupTable;
        this.mediaLoader = tSWF.mediaLoader;
        this.font = tFont;
        this.style = tStyle;
        this.color = pEditText.textcolor;
        var tTextProp = new EditTextRenderProp(this.pixelWidth, this.pixelHeight);
        this.addProp(tTextProp);

        // Set up variable accessor methods.
        var tVarName = pEditText.variablename;
        var tSelf = this;
        var updateText = function (pValue) {
                tSelf.text = pValue + '';
                tRenderable.isPrepared = false;
                tTextProp.rebuildGlyph = true;
                tSelf.invalidate();
          };
        if (tVarName) {
          this.on('enter', function () {
            var tText = this.parent.getVariable(tVarName);
            if (tText === void 0) {
              this.parent.setVariable(tVarName, this.text);
            } else {
              updateText.call(this, tText);
            }
            var tSelf = this;
            this.parent.addVariableListener(tVarName, updateText);
          });
          this.on('leave', function () {
            this.parent.removeVariableListener(tVarName, updateText);
          });
/*
          var tThis = this;
          var tGetter = function () {
            return tThis.text;
          };
          var tSetter = function (pValue) {
            // need some escape ?
            tThis.text = pValue;
            tRenderable.isPrepared = false;
            tTextProp.rebuildGlyph = true;
            tThis.invalidate();
          };
          this.on('enter', function () {
            // Registers the accessor methods.
            this.parent.hookVariable(tVarName, tGetter, tSetter);
          });
          this.on('leave', function () {
            // Unregisters the accessor methods.
            if (this.varName && this.parent) {
              this.parent.unhookVariable(this.varName, tGetter, tSetter);
            }
          });
*/
        }
      }

      BuiltinEditTextActor.prototype = Object.create(pSuper.prototype);
      BuiltinEditTextActor.prototype.constructor = BuiltinEditTextActor;

      BuiltinEditTextActor.prototype.bounds = tBounds;
      BuiltinEditTextActor.prototype.pixelWidth = tPixelWidth;
      BuiltinEditTextActor.prototype.pixelHeight = tPixelHeight;

      return BuiltinEditTextActor;
    })(theatre.crews.swf.actors.TextActor);

    BuiltinEditTextActor.prototype.displayListId = tId;

    this.setActorRenderableCache(tId, tRenderable);
  };

}(this));
