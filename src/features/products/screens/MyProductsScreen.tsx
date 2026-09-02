/**
 * @file MyProductsScreen.tsx
 * @feature Products / Screens
 * @responsibility Enterprise registered appliance vault, live warranty tracker, digital invoices, and QR-bound equipment management adhering to DESIGN_SYSTEM.md.
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
  TextInput,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { SegmentedTabs } from '@shared/components/molecules/SegmentedTabs';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { Badge, type BadgeVariant } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import { spacing, radius, shadows, useTheme, getCommonStyles } from '@theme/index';
import { productApi } from '@infrastructure/api/productApi';
import { CustomerProduct } from '@core/types/api';
import { resolveMediaUrl } from '@core/utils/imageUtils';

export type ProductWarrantyStatus = 'ACTIVE' | 'EXPIRED' | 'NO_WARRANTY';

export interface WarrantyDetails {
  status: ProductWarrantyStatus;
  badgeLabel: string;
  badgeVariant: BadgeVariant;
  iconName: string;
  iconColor: string;
  iconBgColor: string;
  footerLabel: string;
  footerValue: string;
  footerValueColorStyle: 'activeText' | 'expiredText' | 'neutralText';
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const formatStandardDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return String(dateStr);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
};

export const formatCurrency = (amount?: number | null): string => {
  if (amount === undefined || amount === null || isNaN(amount)) return '';
  return `₹${Math.round(amount).toLocaleString('en-IN')}`;
};

export const resolveDisplayTitle = (item: CustomerProduct): string => {
  const brand = (item.brandName || item.brand || '').trim();
  const name = (item.productName || item.modelNumber || '').trim();

  if (!brand) return name || 'Registered Appliance';
  if (!name) return brand;

  // Prevent duplicate prefix like "MSI MSI DESTOP ZS series" or "Sony sony washing machine"
  if (name.toLowerCase().startsWith(brand.toLowerCase())) {
    return name;
  }
  return `${brand} ${name}`;
};

export const getProductWarrantyInfo = (item: CustomerProduct, colors: any): WarrantyDetails => {
  if (item.warranty) {
    if (item.warranty.active === false) {
      const expiryStr = item.warranty.endDate ? formatStandardDate(item.warranty.endDate) : 'Expired';

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
      const expiryStr = formatStandardDate(item.warranty.endDate);

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
    iconName: 'shield-outline',
    iconColor: colors.text.muted,
    iconBgColor: colors.background.surfaceHover || colors.border.light,
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
  const [searchQuery, setSearchQuery] = useState('');

  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();

  const { styles, common } = useMemo(() => {
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
      setErrorMsg(err?.error?.message || 'Could not load registered appliances');
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

  const activeCount = useMemo(
    () => products.filter((p) => getProductWarrantyInfo(p, colors).status === 'ACTIVE').length,
    [products, colors]
  );
  const expiredCount = useMemo(
    () => products.filter((p) => getProductWarrantyInfo(p, colors).status === 'EXPIRED').length,
    [products, colors]
  );
  const noWarrantyCount = useMemo(
    () => products.filter((p) => getProductWarrantyInfo(p, colors).status === 'NO_WARRANTY').length,
    [products, colors]
  );

  const filteredProducts = useMemo(() => {
    return products.filter((item) => {
      const info = getProductWarrantyInfo(item, colors);
      if (activeTab === 'active' && info.status !== 'ACTIVE') return false;
      if (activeTab === 'expired' && info.status !== 'EXPIRED') return false;
      if (activeTab === 'no_warranty' && info.status !== 'NO_WARRANTY') return false;

      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase().trim();
        const title = resolveDisplayTitle(item).toLowerCase();
        const category = (item.categoryName || '').toLowerCase();
        const invoice = (item.invoiceNumber || '').toLowerCase();
        const qr = (item.qrCode || '').toLowerCase();
        const shop = (item.shopkeeperName || '').toLowerCase();
        return (
          title.includes(query) ||
          category.includes(query) ||
          invoice.includes(query) ||
          qr.includes(query) ||
          shop.includes(query)
        );
      }

      return true;
    });
  }, [products, activeTab, searchQuery, colors]);

  const renderProductItem = useCallback(
    ({ item }: { item: CustomerProduct }) => {
      const warrantyInfo = getProductWarrantyInfo(item, colors);
      const displayTitle = resolveDisplayTitle(item);
      const resolvedImageUrl = resolveMediaUrl(item.productImage);
      const priceFormatted = formatCurrency(item.unitPrice);
      const purchaseDateFormatted = item.purchaseDate ? formatStandardDate(item.purchaseDate) : null;

      return (
        <Card
          style={styles.productCard}
          padding="md"
          variant="elevated"
          onPress={() => navigation.navigate('ProductDetailScreen', { productId: item.id, product: item })}
          activeOpacity={0.85}
        >
          {/* Header Row: Thumbnail + Main Specs + Warranty Badge */}
          <View style={styles.cardHeaderRow}>
            {resolvedImageUrl ? (
              <View style={styles.imageWrapper}>
                <Image source={{ uri: resolvedImageUrl }} style={styles.productImg} resizeMode="cover" />
              </View>
            ) : (
              <View style={[styles.iconWrapper, { backgroundColor: warrantyInfo.iconBgColor }]}>
                <AppIcon name="cube-outline" size="md" color={warrantyInfo.iconColor} />
              </View>
            )}

            <View style={styles.titleCol}>
              <View style={styles.titleTopRow}>
                <AppText variant="headingSm" color="textPrimary" numberOfLines={1} style={styles.productTitle}>
                  {displayTitle}
                </AppText>
                <Badge label={warrantyInfo.badgeLabel} variant={warrantyInfo.badgeVariant} />
              </View>

              {/* Category & QR Tags */}
              <View style={styles.tagsRow}>
                {item.categoryName ? (
                  <View style={styles.categoryTag}>
                    <AppText variant="caption" color="textSecondary" style={styles.categoryTagText}>
                      {item.categoryName}
                    </AppText>
                  </View>
                ) : null}

                {item.qrCode ? (
                  <View style={styles.qrTag}>
                    <AppIcon name="qr-code-outline" size="xs" color={colors.primary.main} />
                    <AppText variant="caption" color="primary" style={styles.qrTagText}>
                      {item.qrCode}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </View>

          {/* Meta Info Row: Purchase Date & Price & Dealer */}
          <View style={styles.metaRow}>
            {purchaseDateFormatted ? (
              <View style={styles.metaItem}>
                <AppIcon name="calendar-outline" size="xs" color={colors.text.muted} />
                <AppText variant="caption" color="textSecondary">
                  {purchaseDateFormatted}
                </AppText>
              </View>
            ) : null}

            {priceFormatted ? (
              <View style={styles.metaItem}>
                <AppIcon name="pricetag-outline" size="xs" color={colors.text.muted} />
                <AppText variant="caption" color="textSecondary" style={styles.boldText}>
                  {priceFormatted}
                </AppText>
              </View>
            ) : null}

            {item.shopkeeperName ? (
              <View style={styles.metaItem}>
                <AppIcon name="storefront-outline" size="xs" color={colors.text.muted} />
                <AppText variant="caption" color="textSecondary" numberOfLines={1} style={styles.dealerText}>
                  {item.shopkeeperName}
                </AppText>
              </View>
            ) : null}
          </View>

          {/* Card Footer: Warranty Status & Quick Action Arrow */}
          <View style={styles.cardFooter}>
            <View style={styles.footerWarrantyCol}>
              <View style={styles.footerWarrantyLabelRow}>
                <AppIcon name={warrantyInfo.iconName} size="xs" color={warrantyInfo.iconColor} />
                <AppText variant="caption" color="textMuted">
                  {warrantyInfo.footerLabel}:
                </AppText>
              </View>
              <AppText
                variant="labelSm"
                style={[
                  styles.warrantyValueText,
                  warrantyInfo.footerValueColorStyle === 'activeText' && styles.activeText,
                  warrantyInfo.footerValueColorStyle === 'expiredText' && styles.expiredText,
                  warrantyInfo.footerValueColorStyle === 'neutralText' && styles.neutralText,
                ]}
              >
                {warrantyInfo.footerValue}
              </AppText>
            </View>

            <View style={styles.viewActionBtn}>
              <AppText variant="labelSm" color="primary" style={styles.viewActionText}>
                Details
              </AppText>
              <AppIcon name="chevron-forward" size="xs" color={colors.primary.main} />
            </View>
          </View>
        </Card>
      );
    },
    [colors, styles, navigation]
  );

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="My Products"
        subtitle="Manage registered home appliances & warranties"
        onBackPress={navigation.canGoBack() ? () => navigation.goBack() : undefined}
      />

      {/* Live Search Bar */}
      <View style={styles.searchContainer}>
        <AppIcon name="search-outline" size="sm" color={colors.text.muted} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by appliance, brand, invoice or QR..."
          placeholderTextColor={colors.text.muted}
          value={searchQuery}
          onChangeText={setSearchQuery}
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery('')} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <AppIcon name="close-circle" size="sm" color={colors.text.muted} />
          </TouchableOpacity>
        )}
      </View>

      {/* Segmented Status Tabs */}
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
              title={searchQuery ? 'No Matching Appliances' : 'No Appliances Found'}
              description={
                searchQuery
                  ? `No registered equipment matches "${searchQuery}". Try a different search keyword.`
                  : "You don't have any registered appliances yet. You can scan a QR code to register or book an instant repair service."
              }
              actionTitle="Book Service for Any Appliance"
              onActionPress={() => navigation.navigate('ExternalProductBookingScreen')}
            />
          }
        />
      )}

      {/* Floating Action Button (FAB) to Scan & Register */}
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
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderColor: colors.border.light,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      height: 44,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
      gap: spacing.xs + 2,
      ...shadows.small,
    },
    searchInput: {
      flex: 1,
      fontSize: 13,
      color: colors.text.primary,
      paddingVertical: 0,
    },
    tabWrapper: {
      marginVertical: spacing.xs,
    },
    listContent: {
      paddingBottom: safeBottom + 64,
      paddingTop: spacing.xs,
    },
    productCard: {
      marginBottom: spacing.sm + 4,
      backgroundColor: colors.background.paper,
      borderColor: colors.border.light,
      borderWidth: 1,
      borderRadius: radius.lg,
    },
    cardHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm + 2,
    },
    imageWrapper: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      overflow: 'hidden',
      backgroundColor: colors.background.surfaceHover || colors.border.light,
      borderWidth: 1,
      borderColor: colors.border.light,
      flexShrink: 0,
    },
    productImg: {
      width: '100%',
      height: '100%',
    },
    iconWrapper: {
      width: 52,
      height: 52,
      borderRadius: radius.md,
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0,
    },
    titleCol: {
      flex: 1,
      minWidth: 0,
    },
    titleTopRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: spacing.xs,
      marginBottom: 3,
    },
    productTitle: {
      flex: 1,
      fontWeight: '700',
    },
    tagsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginTop: 2,
    },
    categoryTag: {
      backgroundColor: colors.category.indigoBg || colors.primary.light,
      paddingHorizontal: spacing.xs + 3,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    categoryTagText: {
      fontWeight: '600',
      fontSize: 10,
      color: colors.primary.main,
    },
    qrTag: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 3,
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.xs + 3,
      paddingVertical: 2,
      borderRadius: radius.xs,
    },
    qrTagText: {
      fontWeight: '700',
      fontSize: 10,
    },
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      flexWrap: 'wrap',
      gap: spacing.md,
      marginTop: spacing.sm,
      paddingTop: spacing.xs + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    metaItem: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    dealerText: {
      maxWidth: 120,
    },
    boldText: {
      fontWeight: '700',
    },
    cardFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
      paddingTop: spacing.xs + 4,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    footerWarrantyCol: {
      flex: 1,
      minWidth: 0,
    },
    footerWarrantyLabelRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginBottom: 2,
    },
    warrantyValueText: {
      fontWeight: '700',
      fontSize: 12,
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
    viewActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 2,
      paddingVertical: 4,
      paddingHorizontal: spacing.xs,
    },
    viewActionText: {
      fontWeight: '700',
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
