/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers = mSWFCrew.handlers || new Array();

  function createLoaderWrapper(pStage, pScripts, pSWFVersion) {
    var tId = pStage.actionScriptLoader.load(
      pStage.actionScriptProgram,
      pScripts,
      {
        version: pSWFVersion
      }
    );

    return function() {
      pStage.actionScriptProgram.run(tId, this);
    }
  }

  /**
   * When a scene seeks backwards for a Sprite, we call this.
   * @private
   */
  function onReverseStep() {
    var tChildren = this.getActors();
    for (var i = 0, il = tChildren.length; i < il; i++) {
      tChildren[i].leave();
    }
  }

  function SpriteActor() {
    this.base();

    this.on('reversestep', onReverseStep);

    var i, il, k, kl, tScripts;
    var tData = this.stepData;
    for (i = 0, il = tData.length; i < il; i++) {
      tScripts = tData[i];
      for (k = 0, kl = tScripts.length; k < kl; k++) {
        if (tScripts[k] === void 0) {
          continue;
        }
        this.addPreparationScript(i, tScripts[k]);
      }
    }

    tData = this.stepScripts;
    for (i = 0, il = tData.length; i < il; i++) {
      tScripts = tData[i];
      for (k = 0, kl = tScripts.length; k < kl; k++) {
        if (tScripts[k] === void 0) {
          continue;
        }
        this.addScript(i, tScripts[k]);
      }
    }

    var tLabels = this.labels;
    for (var tName in tLabels) {
      this.setLabelInScene('', tName, tLabels[tName]);
    }

    this.addProp(new this.propClass(this.backingContainer));
  }
  theatre.inherit(SpriteActor, mSWFCrew.DisplayListActor);

  /**
   * Handles SWF Sprites.
   * The 1 is the displayList code for sprites in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers[1] = function(pSWF, pStage, pParams, pSprite, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tActions = mSWFCrew.actions;
    var tSpriteActor = tDictionaryToActorMap[pSprite.id] = function BuiltinSpriteActor() {
      this.base();
    };
    theatre.inherit(tSpriteActor, SpriteActor);

    tSpriteActor.prototype.labels = pSprite.frameLabels;

    switch (pOptions.spriteType) {
      case 'dom':
        tSpriteActor.prototype.propClass = theatre.crews.dom.DOMProp;
        break;
      case 'canvas':
      default:
        tSpriteActor.prototype.propClass = mSWFCrew.props.CanvasSpriteProp;
        break;
    }

    tSpriteActor.prototype.backingContainer = pStage.backingContainer;

    var tStepData = tSpriteActor.prototype.stepData = new Array();
    var tStepScripts = tSpriteActor.prototype.stepScripts = new Array();
    var tFrames = pSprite.frames;

    for (var i = 0, il = tFrames.length; i < il; i++) {
      var tFrame = tFrames[i];
      tStepData[i] = new Array();
      tStepScripts[i] = new Array();

      if (tFrame === void 0) {
        continue;
      }

      for (var k = 0, kl = tFrame.length; k < kl; k++) {
        var tData = tFrame[k];
        var tType = tData.type;

        if (tType === 'script') {
          tStepScripts[i].push(createLoaderWrapper(pStage, tData.script, pSWF.version));
          continue;
        }

        if (!(tType in tActions)) {
          continue;
        }

        var tConvertedData = {};

        // TODO: Need to convert more stuff?
        // Need to be careful. This gets fed directly in to addActor()
        for (var l in tData) {
          switch (l) {
            case 'depth':
              tConvertedData.layer = tData[l];
              break;
            default:
              tConvertedData[l] = tData[l];
          }
        }

        tStepData[i].push((function(pAction, pParams, pData) {
          return function() {
            // this is in this case is the Sprite instance.
            pAction(this, pParams, pData);
          };
        })(tActions[tType], pParams, tConvertedData));
      }
    }
  };

}(this));
