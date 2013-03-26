/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mSWFCrew = theatre.crews.swf;
  var Rect = global.benri.geometry.Rect;

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

      this.buttonChildren = [];
      this.buttonState = 'up';

      var tThis = this;

      // Updates button records.
      var doUpdateButtonRecords = function () {
        var tChildren = tThis.getActors();

        // Remove button records.
        for (var i = 0, il = tChildren.length; i < il; i++) {
          tChildren[i].leave();
        }

        // Add button records.
        for (var i = 0, il = tRecords.length; i < il; i++) {

          var tRecord = tRecords[i], tActor,
              tButtonState = tThis.buttonState;

          if (tButtonState === 'up' && tRecord.state.up
            || tButtonState === 'down' && tRecord.state.down
            || tButtonState === 'move' && tRecord.state.over) {

            tActor = tThis.buttonChildren[tRecord.id + ''];
            if (!tActor) {
              tActor = pPlayer.newFromId(tRecord.id);
              tThis.buttonChildren[tRecord.id + ''] = tActor;
              if (tRecord.matrix) {
                tActor.matrix.fill(tRecord.matrix);
              }
            }
            tThis.addActor(tActor, tRecord.depth);
          }
        }
      };

      // Register the event handlers.

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
        if (tThis.buttonState === 'down') {
          return;
        }
        var i, il, tCond, tScript;
        for (i = 0, il = tCondActions.length; i < il; i++) {
          tCond = tCondActions[i].cond;
          tScript = tCondActions[i].script;
          if (tCond.overUpToOverDown) {
            tScript(tThis.parent);
          }
        }
        tThis.buttonState = 'down';
        doUpdateButtonRecords();
      }

      function onPointerUp(pEvent) {
        if (tThis.buttonState === 'up') {
          return;
        }
        var i, il, tCond, tScript;
        for (i = 0, il = tCondActions.length; i < il; i++) {
          tCond = tCondActions[i].cond;
          tScript = tCondActions[i].script;
          if (tCond.overDownToOverUp) {
            tScript(tThis.parent);
          }
        }
        tThis.buttonState = 'up';
        doUpdateButtonRecords();
      }

      function onPointerMove(pEvent) {
        if (tThis.buttonState === 'move') {
          return;
        }
        tThis.buttonState = 'move';
        doUpdateButtonRecords();
      }

      this.on('enter', function () {
        tThis.stage.on('keydown', onKeyDown);
        this.enableHitTest();
        this.on('pointerdown', onPointerDown);
        this.on('pointerup', onPointerUp);
        this.on('pointermove', onPointerMove);
      });

      this.on('leave', function () {
        tThis.stage.ignore('keydown', onKeyDown);
        this.disableHitTest();
        this.ignore('pointerdown', onPointerDown);
        this.ignore('pointerup', onPointerUp);
        this.ignore('pointermove', onPointerMove);
      });

      // Update the button records. (initial state is 'up')
      doUpdateButtonRecords();
    }

    ButtonActor.prototype = Object.create(pSuper.prototype);
    ButtonActor.prototype.constructor = ButtonActor;

    // @override
    ButtonActor.prototype.getBoundingRect = function() {
      var tChildren = this.getActors();
      var tRect = null;
      var tRect2;
      var i, il;

      for (i = 0, il = tChildren.length; i < il; i++) {
        if (tRect === null) {
          tRect = tChildren[i].getBoundingRect();
        } else {
          tRect2 = tChildren[i].getBoundingRect();

          if (tRect2 !== null) {
            tRect.merge(tRect2);
          }
        }
      }

      if (tRect === null) {
        tRect = new Rect(0, 0, 0, 0);
      }
      return tRect.transform(this.matrix);
    };

    return ButtonActor;
  })(mSWFCrew.actors.DisplayListActor);

  mSWFCrew.actors.ButtonActor = ButtonActor;

}(this));
