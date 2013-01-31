/**
 * @author Jason Parrott
 *
 * Copyright (C) 2012 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {
  var theatre = global.theatre,
      swfcrew = theatre.crews.swf,
      quickswf = global.quickswf,
      AlphabetJS = global.AlphabetJS,
      PersistentCueListener = global.benri.cues.PersistentCueListener;

  /**
   * @constructor
   */
  function Loader() {
    PersistentCueListener.init(this);
    this.swf = null;
    this.options = null;
    this.actionScriptLoader = null;
    this.actionScriptProgram = null;
    this.actorMap = [];
    this.actorNameMap = {};
    this.actorRenderableCache = [];
    this.media = null;
  }

  swfcrew.Loader = Loader;

  Loader.prototype.load = function(pSWF, pOptions) {
    this.options = pOptions = (pOptions || {});
    this.swf = pSWF;

    this.cue('loadstart', this);

    var tASType = pOptions.asType || 'AS1VM';

    var tActionScriptProgram = this.actionScriptProgram = AlphabetJS.createProgram(tASType, swfcrew.ASHandlers);
    var tActionScriptLoader = this.actionScriptLoader = AlphabetJS.createLoader(tASType);

    tActionScriptProgram.callMapped('SetLiteralTable', 255, pSWF.mediaLoader); // Set the asynchronously converted multibyte strings.

    var tActorTypes = swfcrew.actors;

    this.media = pSWF.mediaLoader;

    var tDictionaryToActorMap = this.actorMap;
    var k;

    var tHandlers = swfcrew.handlers;

    var tDictionary = pSWF.dictionary;
    for (k in tDictionary) {
      var tDisplayListType = tDictionary[k].displayListType;
      if (tHandlers[tDisplayListType] === void 0) {
        continue;
      }
      tHandlers[tDisplayListType].call(this, tDictionary[k]);
    }

    tHandlers['DefineSprite'].call(this, pSWF.rootSprite);

    this.cue('loadcomplete', this);
  };

  PersistentCueListener.extend(Loader.prototype);

  Loader.prototype.setActorRenderableCache = function(pId, pRenderable) {
    this.actorRenderableCache[pId] = pRenderable;
  };

  Loader.prototype.getActorRenderableCache = function(pId) {
    return this.actorRenderableCache[pId] || null;
  };

  Loader.prototype.clearActorRenderableCache = function() {
    this.actorRenderableCache.length = 0;
  };


  /**
   * @class
   * @extends Loader
   */
  var DataLoader = (function(pSuper) {
    function DataLoader() {
      pSuper.call(this);
      this.data = null;
    }

    DataLoader.prototype = Object.create(pSuper.prototype);
    DataLoader.prototype.constructor = DataLoader;

    DataLoader.prototype.load = function(pData, pOptions) {
      var tSelf = this;
      this.data = pData;
      var tParser = new quickswf.Parser(pData);

      tSelf.cue('parsestart', this);

      tParser.parse(
        function(pSWF) {
          tSelf.swf = pSWF;
          tSelf.cue('parsecomplete', this);
          pSuper.prototype.load.call(tSelf, pSWF, pOptions);
        },
        function(pError) {
          tSelf.cue('error', pError);
        }
      );
    };

    return DataLoader;
  })(Loader);

  swfcrew.DataLoader = DataLoader;

  /**
   * @class
   * @extends DataLoader
   */
  var URLLoader = (function(pSuper) {
    function URLLoader() {
      pSuper.call(this);
    }

    URLLoader.prototype = Object.create(pSuper.prototype);
    URLLoader.prototype.constructor = URLLoader;

    URLLoader.prototype.load = function(pURL, pOptions) {
      var tSelf = this;
      var tXhr = new XMLHttpRequest();

      tXhr.addEventListener('load', function() {
        tSelf.cue('downloadcomplete', this);
        var tData = new Uint8Array(this.response);
        pSuper.prototype.load.call(tSelf, tData, pOptions);
      }, false);

      tXhr.addEventListener('progress', function(e) {
        tSelf.cue('downloadprogress', e);
        // TODO: Progressive Loading
      }, false);

      tXhr.addEventListener('error', function(e) {
        tSelf.cue('error', e);
      }, false);

      tXhr.open('GET', pURL, true);
      tXhr.responseType = 'arraybuffer';
      tXhr.send(null);

      tSelf.cue('downloadstart', this);
    };

    return URLLoader;
  })(DataLoader);

  swfcrew.URLLoader = URLLoader;

}(this));
