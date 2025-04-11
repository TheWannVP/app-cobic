import React, { useEffect, useRef } from 'react';
import { Modal, View, StyleSheet, Animated } from 'react-native';
import { Logo } from './Logo';

interface LoadingOverlayProps {
  visible: boolean;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({ visible }) => {
  const spinValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 1500, // Tăng tốc độ quay
          useNativeDriver: true,
        })
      ).start();
    } else {
      spinValue.stopAnimation();
      spinValue.setValue(0);
    }
  }, [visible, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg']
  });

  return (
    <Modal
      transparent={true}
      animationType="fade"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.overlay}>
        <Animated.View style={[styles.logoContainer, { transform: [{ rotate: spin }] }]}>
          <Logo />
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // Nền mờ nhẹ
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoContainer: {
    // Có thể thêm style cho logo nếu cần
  },
}); 