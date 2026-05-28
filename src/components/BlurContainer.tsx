import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
  type ViewStyle,
} from 'react-native';

let BlurViewComponent: React.ComponentType<{style?: object; blurType?: string; blurAmount?: number}> | null =
  null;

if (Platform.OS !== 'web') {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const blurModule = require('@react-native-community/blur');
    BlurViewComponent = blurModule.BlurView;
  } catch {
    BlurViewComponent = null;
  }
}

type BlurContainerProps = {
  visible: boolean;
  onClose: () => void;
  children: React.ReactNode;
  expandedFraction?: number;
  /** Bottom sheet (default) or vertically centered panel. */
  position?: 'bottom' | 'center';
  showHandle?: boolean;
  contentStyle?: ViewStyle;
  horizontalInset?: number;
};

function BlurContainer({
  visible,
  onClose,
  children,
  expandedFraction = 0.85,
  position = 'bottom',
  showHandle = true,
  contentStyle,
  horizontalInset = 0,
}: BlurContainerProps) {
  const {height: windowHeight, width: windowWidth} = useWindowDimensions();
  const panelHeight = Math.round(windowHeight * expandedFraction);
  const isCentered = position === 'center';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={[styles.root, isCentered && styles.rootCentered]}>
        <Pressable style={styles.backdropPressable} onPress={onClose} accessibilityLabel="Close">
          {BlurViewComponent ? (
            <BlurViewComponent style={StyleSheet.absoluteFill} blurType="dark" blurAmount={14} />
          ) : null}
          <View style={styles.dimOverlay} />
        </Pressable>

        <View
          style={[
            styles.panel,
            isCentered ? styles.panelCentered : styles.panelBottom,
            {
              height: isCentered ? undefined : panelHeight,
              maxHeight: isCentered ? panelHeight : undefined,
              width: windowWidth - horizontalInset * 2,
              marginHorizontal: horizontalInset,
            },
          ]}>
          {showHandle ? <View style={styles.handle} /> : null}
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <View style={[styles.panelContent, contentStyle]}>{children}</View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  rootCentered: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 16,
    overflow: 'hidden',
  },
  panelBottom: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
  },
  panelCentered: {
    borderRadius: 18,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    marginTop: 10,
    marginBottom: 4,
  },
  closeButton: {
    position: 'absolute',
    top: 10,
    right: 12,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    lineHeight: 18,
  },
  panelContent: {
    flex: 1,
    paddingTop: 36,
    paddingHorizontal: 14,
    paddingBottom: 14,
  },
});

export default BlurContainer;
