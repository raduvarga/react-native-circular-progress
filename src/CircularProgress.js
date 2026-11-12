import React from 'react';
import PropTypes from 'prop-types';
import { Animated, View, StyleSheet } from 'react-native';
import { Svg, Path, G, Defs, Filter, FeGaussianBlur } from 'react-native-svg';

export default class CircularProgress extends React.PureComponent {
  polarToCartesian(centerX, centerY, radius, angleInDegrees) {
    var angleInRadians = ((angleInDegrees - 90) * Math.PI) / 180.0;
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians),
    };
  }

  circlePath(x, y, radius, startAngle, endAngle) {
    var start = this.polarToCartesian(x, y, radius, endAngle * 0.9999999);
    var end = this.polarToCartesian(x, y, radius, startAngle);
    var largeArcFlag = endAngle - startAngle <= 180 ? '0' : '1';
    var d = ['M', start.x, start.y, 'A', radius, radius, 0, largeArcFlag, 0, end.x, end.y];
    return d.join(' ');
  }

  clampFill = fill => Math.min(100, Math.max(0, fill));

  render() {
    const {
      size,
      width,
      backgroundWidth,
      tintColor,
      tintTransparency,
      shadowColor,
      shadowRadius,
      backgroundColor,
      style,
      rotation,
      lineCap,
      fillLineCap = lineCap,
      arcSweepAngle,
      fill,
      children,
      childrenContainerStyle,
      padding,
      renderCap,
      dashedBackground,
      dashedTint
    } = this.props;

    const maxWidthCircle = backgroundWidth ? Math.max(width, backgroundWidth) : width;
    const sizeWithPadding = size / 2 + padding / 2;
    const radius = size / 2 - maxWidthCircle / 2 - padding / 2;

    const currentFillAngle = (arcSweepAngle * this.clampFill(fill)) / 100;
    const backgroundPath = this.circlePath(
      sizeWithPadding,
      sizeWithPadding,
      radius,
      tintTransparency ? 0 : currentFillAngle,
      arcSweepAngle
    );
    const circlePath = this.circlePath(
      sizeWithPadding,
      sizeWithPadding,
      radius,
      0,
      currentFillAngle
    );
    const coordinate = this.polarToCartesian(
      sizeWithPadding,
      sizeWithPadding,
      radius,
      currentFillAngle
    );
    const cap = this.props.renderCap ? this.props.renderCap({ center: coordinate }) : null;

    const offset = size - maxWidthCircle * 2;

    const localChildrenContainerStyle = {
      ...{
        position: 'absolute',
        left: maxWidthCircle + padding / 2,
        top: maxWidthCircle + padding / 2,
        width: offset,
        height: offset,
        borderRadius: offset / 2,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
      },
      ...childrenContainerStyle,
    }

    const strokeDasharrayTint = dashedTint.gap > 0 ?
      Object.values(dashedTint)
      .map(value => parseInt(value))
      : null;

    const strokeDasharrayBackground = dashedBackground.gap > 0 ?
      Object.values(dashedBackground)
      .map(value => parseInt(value))
      : null;

    let svgSize = Math.ceil(size + padding)
    // the glow is a blurred copy of the arc, inside the Svg (a layer shadow on a transparent Svg is drawn offscreen):
    // the Svg grows by glowMargin on each side, so the blur isn't cut, and the negative margin keeps the layout
    const hasGlow = shadowRadius > 0 && fill > 0;
    const glowMargin = hasGlow ? Math.ceil(shadowRadius * 2) : 0;
    const glowSize = svgSize + glowMargin * 2;
    // the arc's coordinates: moved by the glow margin, rotated around the center
    const arc = (content) => (
      <G transform={`translate(${glowMargin}, ${glowMargin})`}>
        <G rotation={rotation} originX={svgSize / 2} originY={svgSize / 2}>
          {content}
        </G>
      </G>
    );
    return (
      <View style={style}>
        <Svg style={styles(glowMargin).svg} width={glowSize} height={glowSize}>
          {hasGlow && (
            <Defs>
              <Filter id="glow" filterUnits="userSpaceOnUse" x={0} y={0} width={glowSize} height={glowSize}>
                <FeGaussianBlur stdDeviation={shadowRadius} />
              </Filter>
            </Defs>
          )}
          {arc(backgroundColor && (
            <Path
              d={backgroundPath}
              stroke={backgroundColor}
              strokeWidth={backgroundWidth || width}
              strokeLinecap={lineCap}
              strokeDasharray={strokeDasharrayBackground}
              fill="transparent"
            />
          ))}
          {/* the filter is on an untransformed group: its region is in the Svg's own coordinates (the arc's are rotated) */}
          {hasGlow && (
            <G filter="url(#glow)">
              {arc(
                <Path
                  d={circlePath}
                  stroke={shadowColor}
                  strokeOpacity={0.5}
                  strokeWidth={width}
                  strokeLinecap={fillLineCap}
                  fill="transparent"
                />
              )}
            </G>
          )}
          {arc(<>
            {fill > 0 && (
              <Path
                d={circlePath}
                stroke={tintColor}
                strokeWidth={width}
                strokeLinecap={fillLineCap}
                strokeDasharray={strokeDasharrayTint}
                fill="transparent"
              />
            )}
            {cap}
          </>)}
        </Svg>
        {children && <View style={localChildrenContainerStyle}>{children(fill)}</View>}
      </View>
    );
  }
}

CircularProgress.propTypes = {
  style: PropTypes.object,
  size: PropTypes.oneOfType([
    PropTypes.number,
    PropTypes.instanceOf(Animated.Value),
  ]).isRequired,
  fill: PropTypes.number.isRequired,
  width: PropTypes.number.isRequired,
  backgroundWidth: PropTypes.number,
  tintColor: PropTypes.string,
  tintTransparency: PropTypes.bool,
  backgroundColor: PropTypes.string,
  rotation: PropTypes.number,
  lineCap: PropTypes.string,
  arcSweepAngle: PropTypes.number,
  children: PropTypes.func,
  childrenContainerStyle: PropTypes.object,
  padding: PropTypes.number,
  renderCap: PropTypes.func,
  dashedBackground: PropTypes.object,
  dashedTint: PropTypes.object
};

CircularProgress.defaultProps = {
  tintColor: 'black',
  tintTransparency: true,
  rotation: 90,
  lineCap: 'butt',
  arcSweepAngle: 360,
  padding: 0,
  dashedBackground: { width: 0, gap: 0 },
  dashedTint: { width: 0, gap: 0 },
};

const styles = (glowMargin) => StyleSheet.create({
  svg: {
    margin: -glowMargin,
  },
});
