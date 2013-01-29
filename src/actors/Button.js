/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;

  theatre.define('actors.ButtonActor', ButtonActor, mSWFCrew);

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

  function ButtonActor(pPlayer) {
    this.base(pPlayer);

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
    var tMatrix; // Necessary because only the first record can have the matrix.
    for (var i = 0, il = tRecords.length; i < il; i++) {
      var tRecord = tRecords[i];
      //console.log('** record=', tRecord);
      if (tRecord.state.up) { // Initial state is ButtonUp.
        var tActor = pPlayer.newFromId(tRecord.id);
        if (tActor instanceof mSWFCrew.actors.SpriteActor) {
          tMatrix = tActor.buttonMatrix = tMatrix || tRecord.matrix;
        }
        tActor.colorTransform = tRecord.colorTransform;
        this.colorTransform = tRecord.colorTransform;
        this.addActor(tActor);
      }
    }
  }
  theatre.inherit(ButtonActor, mSWFCrew.DisplayListActor);

}(this));
