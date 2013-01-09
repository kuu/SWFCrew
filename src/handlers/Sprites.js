/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;

  var mSWFCrew = theatre.crews.swf;
  var mHandlers = mSWFCrew.handlers;
  var SpriteActor = mSWFCrew.actors.SpriteActor;

  function createLoaderWrapper(pActionScriptLoader, pActionScriptProgram, pScripts, pSWFVersion) {
    var tId = pActionScriptLoader.load(
      pActionScriptProgram,
      pScripts,
      {
        version: pSWFVersion
      }
    );

    return function() {
      pActionScriptProgram.run(tId, this);
    }
  }

  /**
   * Handles SWF Sprites.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   */
  mHandlers['DefineSprite'] = function(pSprite) {
    var tDictionaryToActorMap = this.actorMap;
    var tActions = mSWFCrew.actions;
    var tSpriteActor = tDictionaryToActorMap[pSprite.id] = function BuiltinSpriteActor(pPlayer) {
      this.base(pPlayer);
    };
    theatre.inherit(tSpriteActor, SpriteActor);

    tSpriteActor.prototype.labels = pSprite.frameLabels;

    switch (this.options.spriteType) {
      case 'dom':
        tSpriteActor.prototype.propClass = theatre.crews.dom.DOMProp;
        break;
      case 'webgl':
        tSpriteActor.prototype.propClass = mSWFCrew.props.WebGLSpriteProp;
        break;
      case 'canvas':
      default:
        tSpriteActor.prototype.propClass = mSWFCrew.props.CanvasSpriteProp;
        break;
    }

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
          tStepScripts[i].push(createLoaderWrapper(this.actionScriptLoader, this.actionScriptProgram, tData.script, this.swf.version));
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

        tStepData[i].push((function(pAction, pData) {
          return function() {
            // this is in this case is the Sprite instance.
            pAction(this, pData);
          };
        })(tActions[tType], tConvertedData));
      }
    }
  };

}(this));
