/**
 * @author Jason Parrott
 *
 * Copyright (C) 2013 SWFCrew Project.
 * This code is licensed under the zlib license. See LICENSE for details.
 */

(function(global) {

  var quickswf = global.quickswf;
  var mSWFCrew = global.theatre.crews.swf;
  var QuickSWFFillStyle = quickswf.structs.FILLSTYLE;
  var QuickSWFLineStyle = quickswf.structs.LINESTYLE;
  var QuickSWFGradient = quickswf.structs.GRADIENT;
  var QuickSWFStop = quickswf.structs.Stop;
  var Point = global.benri.geometry.Point;
  var Matrix2D = global.benri.geometry.Matrix2D;
  var Color = global.benri.draw.Color;
  var StrokeStyle = global.benri.draw.StrokeStyle;
  var Style = global.benri.draw.Style;
  var ColorShader = global.benri.draw.ColorShader;
  var LinearGradientShader = global.benri.draw.LinearGradientShader;
  var RadialGradientShader = global.benri.draw.RadialGradientShader;
  var BitmapShader = global.benri.draw.BitmapShader;
  var Shader = global.benri.draw.Shader;

  var morphshapes = mSWFCrew.utils.morphshapes = {};

  /**
   * Interpolate between a start and end value.
   * @param  {number} pStart The start value.
   * @param  {number} pEnd   The end value.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {number}        The interpolated value.
   */
  function interpolate(pStart, pEnd, pRatio) {
    return pStart + (pEnd - pStart) * pRatio;
  }

  /**
   * Interpolate between a start Color and end Color.
   * @param  {benri.draw.Color} pStart The start color.
   * @param  {benri.draw.Color} pEnd   The end color.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {benri.draw.Color}        The interpolated Color.
   */
  function interpolateColor(pStart, pEnd, pRatio) {
    var tStartRGBA = pStart.getRGBA();
    var tEndRGBA = pEnd.getRGBA();
    return new Color(
      interpolate(tStartRGBA[0], tEndRGBA[0], pRatio),
      interpolate(tStartRGBA[1], tEndRGBA[1], pRatio),
      interpolate(tStartRGBA[2], tEndRGBA[2], pRatio),
      interpolate(tStartRGBA[3], tEndRGBA[3], pRatio)
    );
  }

  /**
   * Interpolate between a start Point and end Point.
   * @param  {benri.geometry.Point} pStart The start Point.
   * @param  {benri.geometry.Point} pEnd   The end Point.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {benri.geometry.Point}        The interpolated Point.
   */
  function interpolatePoint(pStart, pEnd, pRatio) {
    return new Point(
      interpolate(pStart.x, pEnd.x, pRatio),
      interpolate(pStart.y, pEnd.y, pRatio)
    );
  }

  /**
   * Interpolate between a start Matrix2D and end Matrix2D.
   * @param  {benri.geometry.Matrix2D} pStart The start Matrix2D.
   * @param  {benri.geometry.Matrix2D} pEnd   The end Matrix2D.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {benri.geometry.Matrix2D}        The interpolated Matrix2D.
   */
  function interpolateMatrix(pStart, pEnd, pRatio) {
    return new Matrix2D([
      interpolate(pStart.a, pStart.a, pRatio),
      interpolate(pStart.b, pStart.b, pRatio),
      interpolate(pStart.c, pStart.c, pRatio),
      interpolate(pStart.d, pStart.d, pRatio),
      interpolate(pStart.e, pStart.e, pRatio),
      interpolate(pStart.f, pStart.f, pRatio)
    ]);
  }

  /**
   * Interpolate all values in the given array using the given
   * interpolation function.
   * @param  {Array.<object>} pStart The start Array.
   * @param  {Array.<object>} pEnd   The end Array.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {Array.<object>}        The interpolated Array.
   */
  function interpolateArray(pStart, pEnd, pRatio, pFunction) {
    var i, il = pStart.length;
    var tArray = new Array(il);

    for (i = 0; i < il; i++) {
      tArray[i] = pFunction(pStart[i], pEnd[i], pRatio);
    }

    return tArray;
  }

  /**
   * Interpolate between a start StrokeStyle and end StrokeStyle.
   * @param  {benri.draw.StrokeStyle} pStart The start StrokeStyle.
   * @param  {benri.draw.StrokeStyle} pEnd   The end StrokeStyle.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {benri.draw.StrokeStyle}        The interpolated StrokeStyle.
   */
  function interpolateStrokeStyle(pStart, pEnd, pRatio) {
    var tStyle = new StrokeStyle(interpolate(pStart.width, pEnd.width, pRatio));
    tStyle.cap = pStart.cap;
    tStyle.join = pStart.join;
    tStyle.miter = interpolate(pStart.miter, pEnd.miter, pRatio);

    tStyle.shader = interpolateShader(pStart.shader, pEnd.shader, pRatio);
    return tStyle;
  }

  /**
   * Interpolate between a start Style and end Style.
   * @param  {benri.draw.Style} pStart The start Style.
   * @param  {benri.draw.Style} pEnd   The end Style.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {benri.draw.Style}        The interpolated Style.
   */
  function interpolateStyle(pStart, pEnd, pRatio) {
    var tStyle = new Style();
    tStyle.shader = interpolateShader(pStart.shader, pEnd.shader, pRatio);
    return tStyle;
  }

  /**
   * Interpolate between a start Shader and end Shader.
   * @param  {benri.draw.Shader} pStart The start Shader.
   * @param  {benri.draw.Shader} pEnd   The end Shader.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {benri.draw.Shader}        The interpolated Shader.
   */
  function interpolateShader(pStart, pEnd, pRatio) {
    var tShader;

    if (pStart.constructor === ColorShader) {
      return new ColorShader(interpolateColor(pStart.color, pEnd.color, pRatio));
    } else if (pStart.constructor === LinearGradientShader) {
      tShader = new LinearGradientShader(
        interpolatePoint(pStart.startPoint, pEnd.startPoint, pRatio),
        interpolatePoint(pStart.endPoint, pEnd.endPoint, pRatio),
        interpolateArray(pStart.positions, pEnd.positions, pRatio, interpolate),
        interpolateArray(pStart.colors, pEnd.colors, pRatio, interpolateColor)
      );
      tShader.matrix = interpolateMatrix(pStart.matrix, pEnd.matrix, pRatio);
      return tShader;
    } else if (pStart.constructor === RadialGradientShader) {
      tShader = new RadialGradientShader(
        interpolatePoint(pStart.startPoint, pEnd.startPoint, pRatio),
        interpolate(pStart.radius, pEnd.radius, pRatio),
        interpolateArray(pStart.positions, pEnd.positions, pRatio, interpolate),
        interpolateArray(pStart.colors, pEnd.colors, pRatio, interpolateColor)
      );
      tShader.matrix = interpolateMatrix(pStart.matrix, pEnd.matrix, pRatio);
      return tShader;
    } else if (pStart.constructor === BitmapShader) {
      tShader = new BitmapShader(
        pStart.bitmap
      );
      tShader.matrix = interpolateMatrix(pStart.matrix, pEnd.matrix, pRatio);
      return tShader;
    }

    return new Shader();
  }

  /**
   * Interpolate between start canvas records and end canvas records.
   * @param  {Array.<object>} pStartRecords The start records.
   * @param  {Array.<object>} pEndRecords   The end records.
   * @param  {number} pRatio The ratio from 0 to 1.
   * @return {Array.<object>}        The interpolated records.
   */
  morphshapes.interpolateRecords = function(pStartRecords, pEndRecords, pRatio) {
    var tStartRecordsLength = pStartRecords.length;
    var tEndRecordsLength = pEndRecords.length;
    var tRecords = new Array(tStartRecordsLength);
    var tStartRecord, tEndRecord, tRecord;
    var tType;
    var tCurrentPoint, tPreviousPoint;
    var i;

    /**
     * Finds the previous Point from the current record.
     * @param  {Array.<object>} pRecords The records to search in.
     * @param  {number} pCurrentIndex The current position in the records.
     * @return {benri.geometry.Point} The previous Point.
     */
    function getPreviousPoint(pRecords, pCurrentIndex) {
      var tRecord, tRecordType;

      for (pCurrentIndex--; pCurrentIndex >= 0; pCurrentIndex--) {
        tRecord = pRecords[i];
        tRecordType = tRecord.type;
        if (tRecordType === 'line' || tRecordType === 'quadraticCurve' || tRecordType === 'move') {
          return tRecord.point;
        } else if (tRecordType === 'path') {
          break;
        }
      }

      return new Point(0, 0);
    }

    for (i = 0; i < tStartRecordsLength; i++) {
      tStartRecord = pStartRecords[i];
      tEndRecord = pEndRecords[i];

      if (!tEndRecord) {
        tRecords[i] = pStartRecords[i];
        continue;
      }

      tType = tStartRecord.type;

      if (tType !== tEndRecord.type) {
        if ((tType === 'quadraticCurve' || tType === 'line') && (tEndRecord.type === 'quadraticCurve' || tEndRecord.type === 'line')) {
          // Convert everything to quadraticCurve.

          if (tType === 'line') {
            tPreviousPoint = getPreviousPoint(pStartRecords, i);
            tCurrentPoint = tStartRecord.point;

            tStartRecord.type = 'quadraticCurve';
            tStartRecord.controlPoint = new Point((tCurrentPoint.x - tPreviousPoint.x) / 2, (tCurrentPoint.y - tPreviousPoint.y) / 2);
            console.log(tStartRecord, tCurrentPoint, tPreviousPoint)
          } else if (tEndRecord.type === 'line') {
            tPreviousPoint = getPreviousPoint(pEndRecords, i);
            tCurrentPoint = tEndRecord.point;

            tEndRecord.type = 'quadraticCurve';
            tEndRecord.controlPoint = new Point((tCurrentPoint.x - tPreviousPoint.x) / 2, (tCurrentPoint.y - tPreviousPoint.y) / 2);
          }
        } else {
          console.warn('Record types are not equal!', tStartRecord, tEndRecord);
          tRecords[i] = pStartRecords[i];
          continue;
        }
      }

      switch (tType) {
        case 'clearColor':
          tRecords[i] = {
            type: tType,
            color: interpolateColor(tStartRecord.color, tEndRecord.color, pRatio)
          };
          break;
        case 'layer':
          tRecords[i] = {
            type: tType,
            rect: tStartRecord.rect
          };
          break;
        case 'matrix':
          tRecords[i] = {
            type: tType,
            matrix: interpolateMatrix(tStartRecord.matrix, tEndRecord.matrix, pRatio)
          };
          break;
        case 'move':
        case 'line':
          tRecords[i] = {
            type: tType,
            point: interpolatePoint(tStartRecord.point, tEndRecord.point, pRatio)
          };
          break;
        case 'quadraticCurve':
          tRecords[i] = {
            type: tType,
            controlPoint: interpolatePoint(tStartRecord.controlPoint, tEndRecord.controlPoint, pRatio),
            point: interpolatePoint(tStartRecord.point, tEndRecord.point, pRatio)
          };
          break;
        case 'stroke':
          tRecords[i] = {
            type: tType,
            style: interpolateStrokeStyle(tStartRecord.style, tEndRecord.style, pRatio)
          };
          break;
        case 'fill':
          tRecords[i] = {
            type: tType,
            style: interpolateStyle(tStartRecord.style, tEndRecord.style, pRatio)
          };
          break;
        default:
          tRecords[i] = tStartRecord;
      }
    }

    return tRecords;
  };

  /**
   * Converts MorphShape fill styles to regular Fill styles.
   * @param  {Array.<object>} pMorphFillStyles The MorphShape fill styles.
   * @return {Array.<object>}                  The regular fill styles.
   */
  morphshapes.convertFillStyles = function(pMorphFillStyles) {
    var i, il = pMorphFillStyles.length;
    var tStartAndEndStyles = [new Array(il), new Array(il)];
    var tStyle;
    var tNewStyle;
    var tEnd;

    for (i = 0; i < il; i++) {
      tStyle = pMorphFillStyles[i];

      if (!tStyle) {
        continue;
      }

      tNewStyle = new QuickSWFFillStyle();
      tNewStyle.type = tStyle.type;
      tNewStyle.color = tStyle.startColor;
      tNewStyle.matrix = tStyle.startMatrix;
      tNewStyle.gradient = morphshapes.convertGradient(tStyle.gradient, 'start');
      tNewStyle.bitmapId = tStyle.bitmapId;

      tStartAndEndStyles[0][i] = tNewStyle;

      tNewStyle = new QuickSWFFillStyle();
      tNewStyle.type = tStyle.type;
      tNewStyle.color = tStyle.endColor;
      tNewStyle.matrix = tStyle.endMatrix;
      tNewStyle.gradient = morphshapes.convertGradient(tStyle.gradient, 'end');
      tNewStyle.bitmapId = tStyle.bitmapId;

      tStartAndEndStyles[1][i] = tNewStyle;
    }

    return tStartAndEndStyles;
  };

  /**
   * Converts MorphShape line styles to regular line styles.
   * @param  {Array.<object>} pMorphLineStyles The MorphShape line styles.
   * @return {Array.<object>}                  The regular line styles.
   */
  morphshapes.convertLineStyles = function(pMorphLineStyles) {
    var i, il = pMorphLineStyles.length;
    var tStartAndEndStyles = [new Array(il), new Array(il)];
    var tStyle;
    var tNewStyle;
    var tEnd;

    for (i = 0; i < il; i++) {
      tStyle = pMorphLineStyles[i];

      if (!tStyle) {
        continue;
      }

      tNewStyle = new QuickSWFLineStyle();
      tNewStyle.width = tStyle.startWidth;
      tNewStyle.color = tStyle.startColor;

      tStartAndEndStyles[0][i] = tNewStyle;

      tNewStyle = new QuickSWFLineStyle();
      tNewStyle.width = tStyle.endWidth;
      tNewStyle.color = tStyle.endColor;

      tStartAndEndStyles[1][i] = tNewStyle;
    }

    return tStartAndEndStyles;
  };

  /**
   * Converts a MorphShape gradient to a standard gradient
   * @param  {object} pMorphGradient
   * @param  {string} pStartOrEnd    The start or end records.
   * @return {object}                The new gradient.
   */
  morphshapes.convertGradient = function(pMorphGradient, pStartOrEnd) {
    if (!pMorphGradient) {
      return null;
    }

    var tNewGradient = new QuickSWFGradient();
    var tStops = pMorphGradient.stops;
    var tStop;
    var i, il;

    tNewGradient.spreadMode = pMorphGradient.spreadMode;
    tNewGradient.interpolationMode = pMorphGradient.interpolationMode;
    tNewGradient.focalPoint = pMorphGradient.focalPoint;

    for (i = 0, il = tStops.length; i < il; i++) {
      tStop = new QuickSWFStop();
      tStop.ratio = tStops[i][pStartOrEnd + 'Ratio'];
      tStop.color = tStops[i][pStartOrEnd + 'Color'];

      tNewGradient.stops.push(tStop);
    }

    return tNewGradient;
  };

}(this));