import React from 'react';
import {
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
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
};

function BlurContainer({
  visible,
  onClose,
  children,
  expandedFraction = 0.85,
}: BlurContainerProps) {
  const {height: windowHeight} = useWindowDimensions();
  const panelHeight = Math.round(windowHeight * expandedFraction);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent>
      <View style={styles.root}>
        <Pressable style={styles.backdropPressable} onPress={onClose} accessibilityLabel="Close">
          {BlurViewComponent ? (
            <BlurViewComponent style={StyleSheet.absoluteFill} blurType="dark" blurAmount={12} />
          ) : null}
          <View style={styles.dimOverlay} />
        </Pressable>

        <View style={[styles.panel, {height: panelHeight}]}>
          <Pressable
            style={styles.closeButton}
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close">
            <Text style={styles.closeButtonText}>✕</Text>
          </Pressable>
          <View style={styles.panelContent}>{children}</View>
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
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  dimOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(15, 23, 42, 0.55)',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: -4},
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 16,
    overflow: 'hidden',
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
    paddingTop: 44,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
});

export default BlurContainer;
