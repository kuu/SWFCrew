/**
 * @author Kuu Miyazaki
 *
 * Copyright (C) 2012 Jason Parrott.
 * This code is licensed under the zlib license. See LICENSE for details.
 */
(function(global) {

  var theatre = global.theatre;
  var mActions = theatre.define('theatre.crews.swf.actions');

  /**
   * Sets up playing back event sounds.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor the sound belongs to.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {Object} pData The data to use to know haw to play back the sound.
   */
  mActions.startSound = function(pSpriteActor, pParams, pData) {
    var tId = pData.soundId,
        tInfo = pData.soundInfo,
        tSound = pParams.eventSounds[tId + ''];

    console.log('StartSound: id=' + tId);
    console.log(tSound);
    console.log(tInfo);

    if (tInfo.syncStop) {
        // Stop sound
        // ... Query the AudioProp
        // pSpriteActor.removeProp(tAudioProp);
    } else {
        // Start sound
        // ... Create an AudioProp
        // pSpriteActor.addProp(tAudioProp);
    }
  };

  /**
   * Sets up playing back audio streams.
   * @param {theatre.Actor} pSpriteActor The Sprite Actor the sound belongs to.
   * @param {Object} pParams An object containing a dictionary-actor map object.
   * @param {Object} pData The audio data.
   */
  mActions.soundStreamBlock = function(pSpriteActor, pParams, pData) {
    var tMetadata = pParams.soundStreamHead,
        tSound = pData.soundData;

    console.log('SoundStreamBlock:');
    console.log(tMetadata);
    console.log(tSound);

    // Feed stream data
  };
}(this));
