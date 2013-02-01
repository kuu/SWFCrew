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

  /**
   * Creates a new closure that will run
   * when we want to execute ActionScript in the
   * correct context.
   */
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
   * @param {quickswf.structs.Sprite} pSprite The Sprite to handle.
   */
  mHandlers['DefineSprite'] = function(pSprite) {
    var tActorMap = this.actorMap;
    var tActions = mSWFCrew.actions;
    var tId = pSprite.id;

    /**
     * A custom class for this particular Sprite.
     * @class
     * @extends {theatre.crews.swf.actors.SpriteActor}
     */
    var BuiltinSpriteActor = tActorMap[tId] = (function(pSuper) {
      function BuiltinSpriteActor(pPlayer) {
        pSuper.call(this, pPlayer);

        // This Actor will be rendered so we add a prop for that.
        this.addProp(new SpriteRenderProp());
      }

      BuiltinSpriteActor.prototype = Object.create(pSuper.prototype);
      BuiltinSpriteActor.prototype.constructor = BuiltinSpriteActor;

      BuiltinSpriteActor.prototype.displayListId = tId;

      return BuiltinSpriteActor;
    })(mSWFCrew.actors.SpriteActor);

    /**
     * Labels that will be assigned once this Sprite is instantiated.
     * @type {Array.<string>}
     */
    BuiltinSpriteActor.prototype.labels = pSprite.frameLabels;

    /**
     * Display list commands (like placeObject and such) that
     * will be added to the Actor on instantiation.
     * @type {Array}
     */
    var tStepData = BuiltinSpriteActor.prototype.stepData = [];

    /**
     * ActionScript that will be added to the Actor on instantiation.
     * @type {Array}
     */
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
          // We handle scripts differently than other commands.
          // Create a new context for them to run in.
          tStepScripts[i].push(createLoaderWrapper(this.actionScriptLoader, this.actionScriptProgram, tData.script, this.swf.version));
          continue;
        }

        if (!(tType in tActions)) {
          // We don't know how to handle this type... Ignore it.
          continue;
        }

        // Add the command to the step data as a new closure.
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
