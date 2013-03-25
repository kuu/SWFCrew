/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;

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

  /**
   * @class
   * @extends {theatre.crews.swf.actors.DisplayListActor}
   */
  var ButtonActor = (function(pSuper) {
    function ButtonActor(pPlayer) {
      pSuper.call(this, pPlayer);

      var tCondActions = this.condActions;
      var tRecords = this.records;

      // Register the event handlers.
      var tThis = this;

      function onKeyDown(pEvent) {
        var tKeyCode = translateKeyCode(pEvent.code, pEvent.shift);
        var i, il, tCond, tScript;
        for (i = 0, il = tCondActions.length; i < il; i++) {
          tCond = tCondActions[i].cond;
          tScript = tCondActions[i].script;
          if (tCond.keyPress === tKeyCode) {
            tScript(tThis.parent);
          }
        }
      }

      function onPointerDown(pEvent) {
        var i, il, tCond, tScript;
        for (i = 0, il = tCondActions.length; i < il; i++) {
          tCond = tCondActions[i].cond;
          tScript = tCondActions[i].script;
          if (tCond.overUpToOverDown) {
            tScript(tThis.parent);
          }
        }
      }

      function onPointerUp(pEvent) {
        var i, il, tCond, tScript;
        for (i = 0, il = tCondActions.length; i < il; i++) {
          tCond = tCondActions[i].cond;
          tScript = tCondActions[i].script;
          if (tCond.overDownToOverUp) {
            tScript(tThis.parent);
          }
        }
      }

      this.on('enter', function () {
        tThis.stage.on('keydown', onKeyDown);
        this.enableHitTest();
        this.on('pointerdown', onPointerDown);
        this.on('pointerup', onPointerUp);
      });

      this.on('leave', function () {
        tThis.stage.ignore('keydown', onKeyDown);
        this.disableHitTest();
        this.ignore('pointerdown', onPointerDown);
        this.ignore('pointerup', onPointerUp);
      });

      // Add the button shapes.
      for (var i = 0, il = tRecords.length; i < il; i++) {
        var tRecord = tRecords[i];
        var tMatrix = tRecord.matrix;
        if (tRecord.state.up) { // Initial state is ButtonUp.
          var tActor = pPlayer.newFromId(tRecord.id);
          var tMatrix2d = tActor.matrix;
          if (tMatrix) {
            tMatrix2d.fill(tMatrix);
          }
          this.addActor(tActor, tRecord.depth);
        }
      }
    }

    ButtonActor.prototype = Object.create(pSuper.prototype);
    ButtonActor.prototype.constructor = ButtonActor;

    return ButtonActor;
  })(mSWFCrew.actors.DisplayListActor);

  mSWFCrew.actors.ButtonActor = ButtonActor;

}(this));
