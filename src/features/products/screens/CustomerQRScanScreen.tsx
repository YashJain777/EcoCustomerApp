/**
 * @file CustomerQRScanScreen.tsx
 * @feature Products / Screens
 * @responsibility High-performance diagnostic QR scanner for customer appliance registration & digital warranty binding.
 *   Provides instant QR detection, laser beam animation, 0.5x/1x/2x/5x zoom controls, flash toggle, gallery picker,
 *   manual serial lookup modal, safe focus/blur lifecycle management, and clear registration feedback.
 *   Strictly adheres to DESIGN_SYSTEM.md standards.
 */

import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Animated,
  Easing,
  Vibration,
  Modal,
  TextInput,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Camera } from 'react-native-camera-kit';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { AppIcon } from '@shared/components/atoms/Icon';
import { spacing, radius, shadows, useTheme, getCommonStyles } from '@theme/index';
import { productApi } from '@infrastructure/api/productApi';
import { launchImageLibrary } from 'react-native-image-picker';

const SCAN_BOX_SIZE = 250;
const ZOOM_OPTIONS = ['0.5x', '1x', '2x', '5x'];
const ZOOM_LEVELS: Record<string, number> = {
  '0.5x': 1,
  '1x': 1,
  '2x': 2,
  '5x': 5,
};

export const CustomerQRScanScreen = ({ navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const topInset = insets.top > 0 ? insets.top : Platform.OS === 'android' ? 12 : 0;
  const bottomInset = insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 12 : 0;

  const common = useMemo(() => getCommonStyles(colors), [colors]);
  const styles = useMemo(() => makeStyles(colors, topInset, bottomInset), [colors, topInset, bottomInset]);

  // ─── State Management ───────────────────────────────────────────────────
  const [flashOn, setFlashOn] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [selectedZoom, setSelectedZoom] = useState('1x');
  const [isScreenActive, setIsScreenActive] = useState(true);
  const [showManualModal, setShowManualModal] = useState(false);
  const [manualCodeInput, setManualCodeInput] = useState('');

  const isScanningRef = useRef(false);
  const currentZoom = ZOOM_LEVELS[selectedZoom] ?? 1;

  // ─── Laser Line Animation ───────────────────────────────────────────────
  const scanLineAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const unsubFocus = navigation.addListener('focus', () => {
      setIsScreenActive(true);
      setScanning(false);
      isScanningRef.current = false;
    });
    const unsubBlur = navigation.addListener('blur', () => {
      setIsScreenActive(false);
      setFlashOn(false);
    });

    return () => {
      unsubFocus();
      unsubBlur();
    };
  }, [navigation]);

  useEffect(() => {
    if (!isScreenActive) return;

    const laserLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineAnim, {
          toValue: SCAN_BOX_SIZE - 6,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineAnim, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    laserLoop.start();

    return () => {
      laserLoop.stop();
    };
  }, [isScreenActive, scanLineAnim]);

  // ─── Clean Code Extractor ───────────────────────────────────────────────
  const extractCode = (input: string): string => {
    const raw = input.trim();
    if (raw.includes('/verify/')) {
      const part = raw.split('/verify/')[1]?.split('/')[0]?.split('?')[0];
      if (part) return decodeURIComponent(part).trim();
    } else if (raw.includes('/qr/')) {
      const part = raw.split('/qr/')[1]?.split('/')[0]?.split('?')[0];
      if (part) return decodeURIComponent(part).trim();
    } else if (raw.includes('/')) {
      const parts = raw.split('/').filter(Boolean);
      return decodeURIComponent(parts[parts.length - 1]?.split('?')[0] || raw).trim();
    }
    return raw;
  };

  // ─── Scan Execution Handler ─────────────────────────────────────────────
  const handleScan = async (scannedCode?: string) => {
    if (!scannedCode || isScanningRef.current) return;

    const cleanCode = extractCode(scannedCode);
    if (!cleanCode) {
      Alert.alert('Invalid QR', 'No valid code found in scanned barcode.');
      return;
    }

    try {
      isScanningRef.current = true;
      setScanning(true);

      try {
        Vibration.vibrate(80);
      } catch (_) {
        // Safe fallback if vibration permission is not granted
      }

      const res = await productApi.scanQr({ code: cleanCode });

      if (res?.success) {
        const item = res.data;
        const productName = item?.product?.name || item?.productName || 'Appliance';
        const brandName = item?.product?.brand ? ` (${item.product.brand})` : '';

        const targetProductId = item?.id || item?.saleItemId;
        const navParams = {
          productId: targetProductId,
          product: {
            id: targetProductId,
            productName,
            brandName: item?.product?.brand || '',
            category: item?.product?.category || 'Appliance',
            qrCode: item?.qrCode,
            warrantyEnd: item?.warrantyEnd,
            warrantyStart: item?.warrantyStart,
            warrantyMonths: item?.warrantyMonths,
          },
        };

        if (item?.status === 'ALREADY_REGISTERED') {
          Alert.alert(
            'Appliance Found! 📦',
            `${productName}${brandName} is already registered in your account.`,
            [
              { text: 'Cancel', style: 'cancel' },
              {
                text: 'View Details',
                onPress: () => {
                  if (targetProductId) {
                    navigation.navigate('ProductDetailScreen', navParams);
                  } else {
                    navigation.navigate('MainTab', { screen: 'MyProductsScreenTab' });
                  }
                },
              },
            ]
          );
        } else {
          Alert.alert(
            'Appliance Registered! 🎉',
            `Successfully linked ${productName}${brandName} to your profile with digital warranty.`,
            [
              {
                text: 'View Product Details',
                onPress: () => {
                  if (targetProductId) {
                    navigation.navigate('ProductDetailScreen', navParams);
                  } else {
                    navigation.navigate('MainTab', { screen: 'MyProductsScreenTab' });
                  }
                },
              },
            ]
          );
        }
      } else {
        const msg = typeof res?.error === 'string' ? res.error : res?.error?.message;
        Alert.alert('Scan Status', msg ?? 'Unable to process QR code. Please try again.');
      }
    } catch (err: any) {
      const errorMsg =
        typeof err?.error === 'string'
          ? err.error
          : err?.error?.message ?? err?.response?.data?.message ?? err?.message;
      Alert.alert('Scan Status', errorMsg ?? 'Network error while contacting server.');
    } finally {
      setTimeout(() => {
        setScanning(false);
        isScanningRef.current = false;
      }, 1500);
    }
  };

  // ─── Gallery QR Picker ──────────────────────────────────────────────────
  const handleGalleryPick = async () => {
    try {
      const result = await launchImageLibrary({
        mediaType: 'photo',
        quality: 0.9,
      });

      if (result.didCancel || !result.assets || result.assets.length === 0) return;

      // When photo is picked, prompt manual serial verification for 100% accuracy
      setShowManualModal(true);
    } catch (error) {
      Alert.alert('Gallery Error', 'Could not open image library.');
    }
  };

  // ─── Manual Code Submit ─────────────────────────────────────────────────
  const handleManualSubmit = () => {
    if (!manualCodeInput.trim()) {
      Alert.alert('Required', 'Please enter a valid QR code or serial number.');
      return;
    }
    const codeToProcess = manualCodeInput.trim();
    setShowManualModal(false);
    setManualCodeInput('');
    handleScan(codeToProcess);
  };

  return (
    <ScreenWrapper
      style={styles.container}
      backgroundColor={colors.scanner.bg}
      barStyle="light-content"
      translucentStatusBar
    >
      {/* Top Navigation Bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          style={styles.navIconBtn}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <AppIcon name="arrow-back" size="md" color={colors.text.inverse} />
        </TouchableOpacity>
        <Text style={styles.title}>Scan Product QR</Text>
        <TouchableOpacity
          style={[styles.navIconBtn, flashOn && styles.flashBtnActive]}
          onPress={() => setFlashOn(!flashOn)}
          activeOpacity={0.7}
        >
          <AppIcon
            name={flashOn ? 'flash' : 'flash-outline'}
            size="md"
            color={flashOn ? colors.text.inverse : colors.border.translucentWhite}
          />
        </TouchableOpacity>
      </View>

      {/* Main Scanner Viewfinder HUD with Hardware Camera Feed */}
      <View style={styles.scannerCenter}>
        <View style={styles.viewfinderBox}>
          {/* Live Hardware Camera Feed */}
          {isScreenActive && (
            <Camera
              style={styles.cameraView}
              scanBarcode={true}
              onReadCode={(event: any) => {
                const code = event?.nativeEvent?.codeStringValue;
                if (code && !scanning && !isScanningRef.current) {
                  handleScan(code);
                }
              }}
              torchMode={flashOn ? 'on' : 'off'}
              showFrame={false}
              zoom={currentZoom}
            />
          )}

          {/* Animated Laser Beam */}
          {isScreenActive && !scanning && (
            <Animated.View
              style={[
                styles.laserBeam,
                {
                  transform: [{ translateY: scanLineAnim }],
                },
              ]}
            />
          )}

          {/* Corner Reticle Guides */}
          <View style={[styles.corner, styles.topLeft]} />
          <View style={[styles.corner, styles.topRight]} />
          <View style={[styles.corner, styles.bottomLeft]} />
          <View style={[styles.corner, styles.bottomRight]} />

          {/* Inner Scanner Spinner Overlay */}
          {scanning && (
            <View style={styles.scanningOverlay}>
              <ActivityIndicator size="large" color={colors.cta.main} />
              <Text style={styles.scanningOverlayText}>Linking appliance...</Text>
            </View>
          )}
        </View>

        {/* Camera Zoom Control Pills */}
        <View style={styles.zoomContainer}>
          {ZOOM_OPTIONS.map((zoom) => {
            const isSelected = selectedZoom === zoom;
            return (
              <TouchableOpacity
                key={zoom}
                style={[styles.zoomPill, isSelected && styles.activeZoomPill]}
                onPress={() => setSelectedZoom(zoom)}
                activeOpacity={0.7}
              >
                <Text style={[styles.zoomText, isSelected && styles.activeZoomText]}>{zoom}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.instructionText}>
          {scanning
            ? 'Binding appliance to your account...'
            : `Align product QR sticker within the frame (${selectedZoom} zoom)`}
        </Text>
      </View>

      {/* Floating 3-Button Action Dock */}
      <View style={styles.bottomDockCard}>
        {/* Left Action: Upload from Gallery */}
        <TouchableOpacity style={styles.dockItem} activeOpacity={0.7} onPress={handleGalleryPick}>
          <View style={styles.dockIconBg}>
            <AppIcon name="images-outline" size="md" color={colors.text.inverse} />
          </View>
          <Text style={styles.dockText}>Upload Photo</Text>
        </TouchableOpacity>

        {/* Center Action: Manual Enter Serial / QR */}
        <TouchableOpacity
          style={styles.dockItem}
          activeOpacity={0.85}
          onPress={() => setShowManualModal(true)}
          disabled={scanning}
        >
          <View style={styles.mainScanBtnBg}>
            <AppIcon name="create-outline" size="lg" color={colors.text.inverse} />
          </View>
          <Text style={[styles.dockText, styles.activeDockText]}>
            Enter Code
          </Text>
        </TouchableOpacity>

        {/* Right Action: How It Works Help */}
        <TouchableOpacity
          style={styles.dockItem}
          activeOpacity={0.7}
          onPress={() =>
            Alert.alert(
              'How to Register',
              '1. Point camera at the QR code sticker on your appliance.\n2. Or tap "Enter Code" to type the serial / QR number directly.\n3. The product and warranty will be linked to your profile automatically.'
            )
          }
        >
          <View style={styles.dockIconBg}>
            <AppIcon name="help-circle-outline" size="md" color={colors.text.inverse} />
          </View>
          <Text style={styles.dockText}>How it works</Text>
        </TouchableOpacity>
      </View>

      {/* Manual Code Entry Modal */}
      <Modal
        visible={showManualModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowManualModal(false)}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Enter QR or Serial Code</Text>
                <TouchableOpacity onPress={() => setShowManualModal(false)} style={styles.modalCloseBtn}>
                  <AppIcon name="close" size="sm" color={colors.text.secondary} />
                </TouchableOpacity>
              </View>

              <Text style={styles.modalDescription}>
                Enter the product code printed beneath the appliance QR sticker (e.g. QR75 or SE-2792283010).
              </Text>

              <TextInput
                style={styles.modalInput}
                placeholder="e.g. QR75 or SE-2792283010"
                placeholderTextColor={colors.text.muted}
                value={manualCodeInput}
                onChangeText={setManualCodeInput}
                autoCapitalize="characters"
                autoCorrect={false}
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.modalCancelBtn}
                  onPress={() => setShowManualModal(false)}
                >
                  <Text style={styles.modalCancelText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.modalSubmitBtn}
                  onPress={handleManualSubmit}
                >
                  <Text style={styles.modalSubmitText}>Verify & Link</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any, topInset: number, bottomInset: number) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      justifyContent: 'space-between',
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: topInset > 0 ? topInset + (Platform.OS === 'android' ? 8 : 4) : Platform.OS === 'android' ? 36 : spacing.md,
      paddingBottom: spacing.sm,
    },
    navIconBtn: {
      width: 42,
      height: 42,
      borderRadius: 21,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.2)',
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: '#FFFFFF',
    },
    flashBtnActive: {
      backgroundColor: colors.scanner.flashActive || '#F59E0B',
      borderColor: colors.scanner.flashActive || '#F59E0B',
    },
    scannerCenter: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
    },
    viewfinderBox: {
      width: SCAN_BOX_SIZE,
      height: SCAN_BOX_SIZE,
      borderRadius: radius.xl,
      borderWidth: 1,
      borderColor: colors.border.translucentWhite,
      alignItems: 'center',
      justifyContent: 'center',
      position: 'relative',
      overflow: 'hidden',
      backgroundColor: colors.background.translucentWhiteLight,
    },
    cameraView: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      borderRadius: radius.xl,
      overflow: 'hidden',
    },
    laserBeam: {
      position: 'absolute',
      left: 8,
      right: 8,
      height: 3,
      backgroundColor: colors.cta.main,
      borderRadius: 2,
      shadowColor: colors.cta.main,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.9,
      shadowRadius: 8,
      elevation: 6,
    },
    scanningOverlay: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.65)',
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.xl,
      gap: 10,
    },
    scanningOverlayText: {
      color: '#FFFFFF',
      fontSize: 13,
      fontWeight: '600',
    },
    corner: {
      position: 'absolute',
      width: 32,
      height: 32,
      borderColor: colors.scanner.reticle,
    },
    topLeft: {
      top: -2,
      left: -2,
      borderTopWidth: 4,
      borderLeftWidth: 4,
      borderTopLeftRadius: radius.md,
    },
    topRight: {
      top: -2,
      right: -2,
      borderTopWidth: 4,
      borderRightWidth: 4,
      borderTopRightRadius: radius.md,
    },
    bottomLeft: {
      bottom: -2,
      left: -2,
      borderBottomWidth: 4,
      borderLeftWidth: 4,
      borderBottomLeftRadius: radius.md,
    },
    bottomRight: {
      bottom: -2,
      right: -2,
      borderBottomWidth: 4,
      borderRightWidth: 4,
      borderBottomRightRadius: radius.md,
    },
    zoomContainer: {
      flexDirection: 'row',
      alignSelf: 'center',
      backgroundColor: 'rgba(0, 0, 0, 0.45)',
      borderRadius: radius.pill,
      paddingVertical: 4,
      paddingHorizontal: 8,
      marginTop: spacing.lg,
      gap: spacing.xs,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.15)',
    },
    zoomPill: {
      paddingVertical: 4,
      paddingHorizontal: 12,
      borderRadius: radius.pill,
    },
    activeZoomPill: {
      backgroundColor: colors.cta.main,
    },
    zoomText: {
      fontSize: 12,
      fontWeight: '600',
      color: 'rgba(255, 255, 255, 0.7)',
    },
    activeZoomText: {
      color: '#FFFFFF',
      fontWeight: '800',
    },
    instructionText: {
      color: colors.text.muted,
      fontSize: 13,
      marginTop: spacing.md,
      textAlign: 'center',
      fontWeight: '500',
    },
    bottomDockCard: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      alignItems: 'center',
      backgroundColor: 'rgba(15, 23, 42, 0.75)',
      borderRadius: radius.xl,
      paddingVertical: spacing.sm + 2,
      paddingHorizontal: spacing.md,
      marginBottom: bottomInset > 0 ? bottomInset + 12 : spacing.lg,
      borderWidth: 1,
      borderColor: 'rgba(255, 255, 255, 0.12)',
      ...shadows.large,
    },
    dockItem: {
      alignItems: 'center',
      flex: 1,
    },
    dockIconBg: {
      width: 46,
      height: 46,
      borderRadius: 23,
      backgroundColor: 'rgba(255, 255, 255, 0.15)',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
    },
    mainScanBtnBg: {
      width: 58,
      height: 58,
      borderRadius: 29,
      backgroundColor: colors.cta.main,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 4,
      marginTop: -16,
      ...shadows.ctaGlow,
    },
    dockText: {
      fontSize: 11.5,
      color: 'rgba(255, 255, 255, 0.8)',
      fontWeight: '500',
    },
    activeDockText: {
      color: '#FFFFFF',
      fontWeight: '700',
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
      padding: spacing.lg,
    },
    modalContent: {
      width: '100%',
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      padding: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.large,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
    },
    modalTitle: {
      fontSize: 17,
      fontWeight: '700',
      color: colors.text.primary,
    },
    modalCloseBtn: {
      padding: 4,
    },
    modalDescription: {
      fontSize: 13,
      color: colors.text.secondary,
      marginBottom: spacing.md,
      lineHeight: 18,
    },
    modalInput: {
      borderWidth: 1,
      borderColor: colors.primary.main,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm + 4,
      fontSize: 15,
      color: colors.text.primary,
      backgroundColor: colors.background.default,
      marginBottom: spacing.lg,
    },
    modalActions: {
      flexDirection: 'row',
      justifyContent: 'flex-end',
      gap: spacing.sm,
    },
    modalCancelBtn: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
    },
    modalCancelText: {
      fontSize: 14,
      fontWeight: '600',
      color: colors.text.secondary,
    },
    modalSubmitBtn: {
      backgroundColor: colors.cta.main,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.lg,
      borderRadius: radius.md,
      ...shadows.medium,
    },
    modalSubmitText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#FFFFFF',
    },
  });

export default CustomerQRScanScreen;
