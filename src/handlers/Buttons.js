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
  var ButtonActor = mSWFCrew.actors.ButtonActor;

  function createLoaderWrapper(pActionScriptLoader, pActionScriptProgram, pScripts, pSWFVersion) {
    var tId = pActionScriptLoader.load(
      pActionScriptProgram,
      pScripts,
      {
        version: pSWFVersion
      }
    );

    return function(pTarget) {
      pActionScriptProgram.run(tId, pTarget);
    }
  }

  /**
   * Handles SWF Buttons.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   */
  mHandlers['DefineButton'] = function(pButton) {
    var tDictionaryToActorMap = this.actorMap;
    var tButtonActor = tDictionaryToActorMap[pButton.id] = function BuiltinButtonActor(pPlayer) {
      this.base(pPlayer);
    };
    theatre.inherit(tButtonActor, ButtonActor);

    var tCondActions = tButtonActor.prototype.condActions = new Array();
    var tRecords = tButtonActor.prototype.records = new Array();
    var i, il, tRawCondActions = pButton.condActions || [],
        tRawRecords = pButton.records || [];

    // Decompile ActionScript
    for (i = 0, il = tRawCondActions.length; i < il; i++) {
      var tRawCondAction = tRawCondActions[i];
      tCondActions.push({
          cond: tRawCondAction.cond,
          script: createLoaderWrapper(this.actionScriptLoader, this.actionScriptProgram, tRawCondAction.action, this.swf.version)
      });
    }
    // Map the button shapes' Actor class.
    for (i = 0, il = tRawRecords.length; i < il; i++) {
      var tRawRecord = tRawRecords[i],
          tRecord = {};
      for (var k in tRawRecord) {
        tRecord[k] = tRawRecord[k];
      }
      tRecords.push(tRecord);
    }
    tButtonActor.prototype.isMenu = pButton.isMenu;
  };

}(this));
