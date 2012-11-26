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

  function createLoaderWrapper(pStage, pScripts, pSWFVersion) {
    var tId = pStage.actionScriptLoader.load(
      pStage.actionScriptProgram,
      pScripts,
      {
        version: pSWFVersion
      }
    );

    return function(pTarget) {
      pStage.actionScriptProgram.run(tId, pTarget);
    }
  }

  function translateKeyCode(pKeyCode, pShift) {
    var tKeyCode = pKeyCode;
    switch (pKeyCode) {
    case 9: // tab
      tKeyCode = 18;
      break;
    case 27: // escape
      tKeyCode = 19;
      break;
    case 37: // left
      tKeyCode =  1;
      break;
    case 38: // up
      tKeyCode = 14;
      break;
    case 39: // right
      tKeyCode = 2;
      break;
    case 40: // down
      tKeyCode = 15;
      break;
    case 46: // delete
      tKeyCode = 6;
      break;
    case 51: // 3
      if (pShift) {
        // Convert '3' into '#'.
        tKeyCode = 35;
      }
      break;
    }
    return tKeyCode;
  };

  function ButtonActor() {
    this.base();

    var tCondActions = this.condActions;
    var tRecords = this.records;

    // Register the event handlers.
    var tThis = this;
    function onKeyDown(pEvent) {
      var tKeyCode = translateKeyCode(pEvent.code, pEvent.shift);
      console.log('KeyDown: code=', tKeyCode);
      var i, il, tCond, tScript;
      for (i = 0, il = tCondActions.length; i < il; i++) {
        tCond = tCondActions[i].cond;
        tScript = tCondActions[i].script;
        if (tCond.keyPress === tKeyCode) {
          tScript(tThis.parent);
        }
      }
    }
    this.on('enter', function () {
      tThis.stage.on('keydown', onKeyDown);
    });
    this.on('leave', function () {
      tThis.stage.ignore('keydown', onKeyDown);
    });

    // Add the button shapes.
    for (var i = 0, il = tRecords.length; i < il; i++) {
      var tRecord = tRecords[i];
      //console.log('** record=', tRecord);
      if (tRecord.state.up) { // Initial state is ButtonUp.
        var tActor = new tRecord.actor();
        tActor.colorTransform = tRecord.colorTransform;
        this.colorTransform = tRecord.colorTransform;
        this.addActor(tActor);
      }
    }
  }
  theatre.inherit(ButtonActor, mSWFCrew.DisplayListActor);

  /**
   * Handles SWF Buttons.
   * The 1 is the displayList code for sprites in QuickSWF.
   * @param {quickswf.SWF} pSWF The SWF file.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {quickswf.Sprite} pSprite The Sprite to handle.
   * @param {Object} pOptions Options to customize things.
   */
  mHandlers['DefineButton'] = function(pSWF, pStage, pParams, pButton, pOptions) {
    var tDictionaryToActorMap = pParams.dictionaryToActorMap;
    var tButtonActor = tDictionaryToActorMap[pButton.id] = function BuiltinButtonActor() {
      this.base();
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
          script: createLoaderWrapper(pStage, tRawCondAction.action, pSWF.version)
      });
    }
    // Map the button shapes' Actor class.
    for (i = 0, il = tRawRecords.length; i < il; i++) {
      var tRawRecord = tRawRecords[i],
          tRecord = {};
      for (var k in tRawRecord) {
        if (k === 'id') {
          tRecord['actor'] = tDictionaryToActorMap[tRawRecord.id];
        } else {
          tRecord[k] = tRawRecord[k];
        }
      }
      tRecords.push(tRecord);
    }
    tButtonActor.prototype.isMenu = pButton.isMenu;
  };

}(this));
