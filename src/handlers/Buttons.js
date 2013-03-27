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
  var ButtonRenderProp = mSWFCrew.props.ButtonRenderProp;

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
    var tActorMap = this.actorMap;
    var tId = pButton.id;

    /**
     * @class
     * @extends {theatre.crews.swf.actors.ButtonActor}
     */
    var BuiltinButtonActor = this.actorMap[tId] = (function(pSuper) {
      function BuiltinButtonActor(pPlayer) {
        pSuper.call(this, pPlayer);
        this.addProp(new ButtonRenderProp());
      }

      BuiltinButtonActor.prototype = Object.create(pSuper.prototype);
      BuiltinButtonActor.prototype.constructor = BuiltinButtonActor;

      return BuiltinButtonActor;
    })(ButtonActor);

    BuiltinButtonActor.prototype.displayListId = tId;

    var tCondActions = BuiltinButtonActor.prototype.condActions = [];
    var tRecords = BuiltinButtonActor.prototype.records = [];
    var i, il, tRawCondActions = pButton.condActions || [],
        tRawRecords = pButton.records || [];

    // Set button actions.
    var tKeyEnterPress = null;
    var tMouseClick = null;

    for (i = 0, il = tRawCondActions.length; i < il; i++) {
      var tRawCondAction = tRawCondActions[i];
      var tCond = tRawCondAction.cond;
      var tCondAction = {
          cond: tCond,
          script: createLoaderWrapper(this.actionScriptLoader, this.actionScriptProgram, tRawCondAction.action, this.swf.version)
        };
      if (tCond.keyPress === 13) {
        tKeyEnterPress = tCondAction;
      }
      if (tCond.overUpToOverDown) {
        tMouseClick = tCondAction;
      }
      if (tCond.overDownToOverUp) {
        tMouseClick = tCondAction;
      }
      tCondActions.push(tCondAction);
    }
    // For mobile, treat a mouse click as an enter key.
    if (tMouseClick === null && tKeyEnterPress !== null) {
      tKeyEnterPress.cond.overDownToOverUp = 1;
    }
    // Map the button shapes' Actor class.
    for (i = 0, il = tRawRecords.length; i < il; i++) {
      var tRawRecord = tRawRecords[i],
          tRecord = {};
      if (tRawRecord.state.hitTest) {
        var tHitShapeClass = this.actorMap[tRawRecord.id];
        if (tHitShapeClass) {
          var tRawBounds = tHitShapeClass.prototype.bounds;
          if (tRawBounds) {
            var Rect = global.benri.geometry.Rect;
            BuiltinButtonActor.prototype.hitRect = new Rect(tRawBounds.left, tRawBounds.top,
                  tRawBounds.right - tRawBounds.left, tRawBounds.bottom - tRawBounds.top);
          }
        }
      }
      for (var k in tRawRecord) {
        tRecord[k] = tRawRecord[k];
      }
      tRecords.push(tRecord);
    }

    BuiltinButtonActor.prototype.isMenu = pButton.isMenu;
  };

}(this));
