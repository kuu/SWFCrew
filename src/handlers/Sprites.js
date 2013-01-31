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
  var SpriteRenderProp = mSWFCrew.props.SpriteRenderProp;

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
    var tActorMap = this.actorMap;
    var tActions = mSWFCrew.actions;
    var tId = pSprite.id;

    /**
     * @class
     * @extends {theatre.crews.swf.actors.SpriteActor}
     */
    var BuiltinSpriteActor = tActorMap[tId] = (function(pSuper) {
      function BuiltinSpriteActor(pPlayer) {
        pSuper.call(this, pPlayer);

        this.addProp(new SpriteRenderProp());
      }

      BuiltinSpriteActor.prototype = Object.create(pSuper.prototype);
      BuiltinSpriteActor.prototype.constructor = BuiltinSpriteActor;

      BuiltinSpriteActor.prototype.displayListId = tId;

      return BuiltinSpriteActor;
    })(mSWFCrew.actors.SpriteActor);

    BuiltinSpriteActor.prototype.labels = pSprite.frameLabels;

    var tStepData = BuiltinSpriteActor.prototype.stepData = [];
    var tStepScripts = BuiltinSpriteActor.prototype.stepScripts = [];
    var tFrames = pSprite.frames;
    var tFrame;
    var i, il, k, kl;
    var tData;
    var tType;

    for (i = 0, il = tFrames.length; i < il; i++) {
      tFrame = tFrames[i];
      tStepData[i] = [];
      tStepScripts[i] = [];

      if (tFrame === void 0) {
        continue;
      }

      for (k = 0, kl = tFrame.length; k < kl; k++) {
        tData = tFrame[k];
        tType = tData.type;

        if (tType === 'script') {
          tStepScripts[i].push(createLoaderWrapper(this.actionScriptLoader, this.actionScriptProgram, tData.script, this.swf.version));
          continue;
        }

        if (!(tType in tActions)) {
          continue;
        }

        tStepData[i].push((function(pAction, pData) {
          return function() {
            // this is in this case is the Sprite instance.
            pAction(this, pData);
          };
        })(tActions[tType], tData));
      }
    }
  };

}(this));
