import React, {createContext, useCallback, useContext, useMemo, useRef, useState} from 'react';
import {Animated, Pressable, StyleSheet, Text, View} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

export type ToastVariant = 'info' | 'success' | 'error';

type ToastMessage = {
  id: number;
  title: string;
  body?: string;
  variant: ToastVariant;
};

type ToastContextValue = {
  showToast: (title: string, options?: {body?: string; variant?: ToastVariant; durationMs?: number}) => void;
};

const ToastContext = createContext<ToastContextValue>({
  showToast: () => undefined,
});

const VARIANT_STYLES: Record<ToastVariant, {backgroundColor: string; borderColor: string; titleColor: string}> =
  {
    info: {backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', titleColor: '#1D4ED8'},
    success: {backgroundColor: '#F0FDF4', borderColor: '#BBF7D0', titleColor: '#15803D'},
    error: {backgroundColor: '#FEF2F2', borderColor: '#FECACA', titleColor: '#B91C1C'},
  };

type ToastProviderProps = {
  children: React.ReactNode;
};

export function ToastProvider({children}: ToastProviderProps) {
  const insets = useSafeAreaInsets();
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const nextIdRef = useRef(0);

  const hideToast = useCallback(() => {
    Animated.timing(opacity, {toValue: 0, duration: 180, useNativeDriver: true}).start(() => {
      setToast(null);
    });
  }, [opacity]);

  const showToast = useCallback(
    (title: string, options?: {body?: string; variant?: ToastVariant; durationMs?: number}) => {
      if (hideTimerRef.current) {
        clearTimeout(hideTimerRef.current);
      }

      const id = nextIdRef.current + 1;
      nextIdRef.current = id;
      setToast({
        id,
        title,
        body: options?.body,
        variant: options?.variant ?? 'info',
      });

      opacity.setValue(0);
      Animated.timing(opacity, {toValue: 1, duration: 200, useNativeDriver: true}).start();

      hideTimerRef.current = setTimeout(() => {
        hideToast();
      }, options?.durationMs ?? 3200);
    },
    [hideToast, opacity],
  );

  const value = useMemo(() => ({showToast}), [showToast]);
  const variantStyle = toast ? VARIANT_STYLES[toast.variant] : VARIANT_STYLES.info;

  return (
    <ToastContext.Provider value={value}>
      {children}
      {toast ? (
        <Animated.View
          pointerEvents="box-none"
          style={[styles.host, {bottom: insets.bottom + 88, opacity}]}>
          <Pressable
            style={[styles.toast, variantStyle]}
            onPress={hideToast}
            accessibilityRole="button"
            accessibilityLabel={`Dismiss ${toast.title}`}>
            <Text style={[styles.title, {color: variantStyle.titleColor}]}>{toast.title}</Text>
            {toast.body ? <Text style={styles.body}>{toast.body}</Text> : null}
          </Pressable>
        </Animated.View>
      ) : null}
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  return useContext(ToastContext);
}

const styles = StyleSheet.create({
  host: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 100,
  },
  toast: {
    borderRadius: 12,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    shadowColor: '#0F172A',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.12,
    shadowRadius: 8,
    elevation: 6,
    gap: 4,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  body: {
    fontSize: 12,
    color: '#475569',
  },
});
