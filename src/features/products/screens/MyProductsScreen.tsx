import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Header } from '@shared/components/molecules/Header';
import { ListItemCard } from '@shared/components/molecules/ListItemCard';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, useTheme, getCommonStyles } from '@theme/index';
import { productApi } from '@infrastructure/api/productApi';
import { CustomerProduct } from '@core/types/api';
import { resolveMediaUrl } from '@core/utils/imageUtils';

export type ProductWarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'NO_WARRANTY';

export interface WarrantyDetails {
  status: ProductWarrantyStatus;
  badgeLabel: string;
  badgeVariant: 'success' | 'danger' | 'neutral';
  iconName: string;
  iconColor: string;
  iconBgColor: string;
  footerLabel: string;
  footerValue: string;
  footerValueColorStyle: 'activeText' | 'expiredText' | 'neutralText';
}

export const getProductWarrantyInfo = (item: CustomerProduct, colors: any): WarrantyDetails => {
  if (item.warranty) {
    if (item.warranty.active === false) {
      const expiryStr = item.warranty.endDate
        ? new Date(item.warranty.endDate).toLocaleDateString('en-IN', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        : 'Expired';

      return {
        status: 'EXPIRED',
        badgeLabel: 'EXPIRED',
        badgeVariant: 'danger',
        iconName: 'alert-circle-outline',
        iconColor: colors.status.danger,
        iconBgColor: colors.status.dangerBg,
        footerLabel: 'Warranty Expired On',
        footerValue: expiryStr,
        footerValueColorStyle: 'expiredText',
      };
    }

    if (item.warranty.endDate) {
      const isPast = new Date(item.warranty.endDate) < new Date();
      const expiryStr = new Date(item.warranty.endDate).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });

      if (isPast) {
        return {
          status: 'EXPIRED',
          badgeLabel: 'EXPIRED',
          badgeVariant: 'danger',
          iconName: 'alert-circle-outline',
          iconColor: colors.status.danger,
          iconBgColor: colors.status.dangerBg,
          footerLabel: 'Warranty Expired On',
          footerValue: expiryStr,
          footerValueColorStyle: 'expiredText',
        };
      }

      return {
        status: 'ACTIVE',
        badgeLabel: 'ACTIVE',
        badgeVariant: 'success',
        iconName: 'shield-checkmark-outline',
        iconColor: colors.status.success,
        iconBgColor: colors.status.successBg,
        footerLabel: 'Warranty Valid Till',
        footerValue: expiryStr,
        footerValueColorStyle: 'activeText',
      };
    }
  }

  // When warranty is null/undefined (No active warranty registered)
  return {
    status: 'NO_WARRANTY',
    badgeLabel: 'NO WARRANTY',
    badgeVariant: 'neutral',
    iconName: 'hardware-chip-outline',
    iconColor: colors.neutral[500],
    iconBgColor: colors.neutral[100],
    footerLabel: 'Warranty Status',
    footerValue: 'No Active Warranty',
    footerValueColorStyle: 'neutralText',
  };
};

export const MyProductsScreen = ({ navigation }: any) => {
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('all');

  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const { styles, common } = React.useMemo(() => {
    return {
      styles: makeStyles(colors, insets.bottom),
      common: getCommonStyles(colors),
    };
  }, [colors, insets.bottom]);

  const fetchProducts = useCallback(async () => {
    try {
      setErrorMsg(null);
      const res = await productApi.getMyProducts();
      if (res?.success && Array.isArray(res.data)) {
        setProducts(res.data);
      } else {
        setProducts([]);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || 'Could not load products');
      setProducts([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProducts();
  };

  const activeCount = products.filter((p) => getProductWarrantyInfo(p, colors).status === 'ACTIVE').length;
  const expiredCount = products.filter((p) => getProductWarrantyInfo(p, colors).status === 'EXPIRED').length;
  const noWarrantyCount = products.filter((p) => getProductWarrantyInfo(p, colors).status === 'NO_WARRANTY').length;

  const filteredProducts = products.filter((item) => {
    const info = getProductWarrantyInfo(item, colors);
    if (activeTab === 'active') return info.status === 'ACTIVE';
    if (activeTab === 'expired') return info.status === 'EXPIRED';
    if (activeTab === 'no_warranty') return info.status === 'NO_WARRANTY';
    return true;
  });

  const renderProductItem = useCallback(
    ({ item }: { item: CustomerProduct }) => {
      const warrantyInfo = getProductWarrantyInfo(item, colors);

      const displayTitle = [item.brandName, item.productName]
        .filter(Boolean)
        .join(' ');

      const subtitleText = [
        item.categoryName,
        item.invoiceNumber ? `Invoice: ${item.invoiceNumber}` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      const metaText = [
        item.qrCode ? `QR: ${item.qrCode}` : null,
        item.shopkeeperName ? `Shop: ${item.shopkeeperName}` : null,
      ]
        .filter(Boolean)
        .join(' • ');

      const resolvedImageUrl = resolveMediaUrl(item.productImage);

      return (
        <ListItemCard
          imageUrl={resolvedImageUrl}
          iconName={warrantyInfo.iconName}
          iconColor={warrantyInfo.iconColor}
          iconBgColor={warrantyInfo.iconBgColor}
          title={displayTitle || item.id}
          subtitle={subtitleText}
          metaText={metaText}
          statusLabel={warrantyInfo.badgeLabel}
          statusVariant={warrantyInfo.badgeVariant}
          onPress={() => navigation.navigate('ProductDetailScreen', { product: item })}
          footerContent={
            <>
              <AppText variant="caption" color="textMuted">
                {warrantyInfo.footerLabel}
              </AppText>
              <AppText
                variant="labelSm"
                style={[
                  styles.warrantyValue,
                  warrantyInfo.footerValueColorStyle === 'activeText' && styles.activeText,
                  warrantyInfo.footerValueColorStyle === 'expiredText' && styles.expiredText,
                  warrantyInfo.footerValueColorStyle === 'neutralText' && styles.neutralText,
                ]}
              >
                {warrantyInfo.footerValue}
              </AppText>
            </>
          }
        />
      );
    },
    [colors, styles, navigation]
  );

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="My Products"
        subtitle="Manage registered home appliances"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      <View style={styles.tabWrapper}>
        <SegmentedTabs
          tabs={[
            { id: 'all', label: 'All', count: products.length },
            { id: 'active', label: 'Active', count: activeCount },
            { id: 'expired', label: 'Expired', count: expiredCount },
            { id: 'no_warranty', label: 'No Warranty', count: noWarrantyCount },
          ]}
          activeTab={activeTab}
          onSelectTab={setActiveTab}
        />
      </View>

      {errorMsg && (
        <View style={common.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <AppText variant="bodySm" style={common.errorText}>
            {errorMsg}
          </AppText>
          <TouchableOpacity onPress={fetchProducts} activeOpacity={0.75}>
            <AppText variant="labelSm" style={common.retryText}>
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={common.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <AppText variant="bodyMd" style={common.loadingText}>
            Loading registered appliances...
          </AppText>
        </View>
      ) : (
        <FlatList
          data={filteredProducts}
          keyExtractor={(item, index) => (item.id ? `${item.id}-${index}` : `product-${index}`)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
          renderItem={renderProductItem}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          ListEmptyComponent={
            <EmptyState
              iconName="cube-outline"
              title="No Products Found"
              description="You don't have any registered products yet. You can scan a QR code to register or book a repair service directly."
              actionTitle="Book Service for Any Appliance"
              onActionPress={() => navigation.navigate('ExternalProductBookingScreen')}
            />
          }
        />
      )}

      {/* Modern Circular Floating Action Button (FAB) */}
      <TouchableOpacity
        style={styles.floatingFab}
        activeOpacity={0.85}
        onPress={() => navigation.navigate('CustomerQRScanScreen')}
        accessibilityLabel="Register New Product"
      >
        <AppIcon name="add" size="lg" color={colors.text.inverse} />
      </TouchableOpacity>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any, bottomInset: number) => {
  const safeBottom = bottomInset > 0 ? bottomInset : 16;
  return StyleSheet.create({
    container: {
      paddingHorizontal: spacing.lg,
      flex: 1,
    },
    tabWrapper: {
      marginVertical: spacing.xs,
    },
    listContent: {
      paddingBottom: safeBottom,
    },
    warrantyValue: {
      fontWeight: '700',
    },
    activeText: {
      color: colors.status.success,
    },
    expiredText: {
      color: colors.status.danger,
    },
    neutralText: {
      color: colors.text.muted,
    },
    floatingFab: {
      position: 'absolute',
      bottom: safeBottom + 16,
      right: spacing.lg,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.cta.main,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.cta.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
    },
  });
};




