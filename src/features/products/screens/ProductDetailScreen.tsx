/**
 * @file ProductDetailScreen.tsx
 * @feature Products / Screens
 * @responsibility Comprehensive product overview, warranty status, dealer details,
 *                 service history, and digital document vault (invoices, warranty cards, manuals)
 *                 adhering strictly to DESIGN_SYSTEM.md guidelines.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Image,
  Modal,
  Dimensions,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { launchCamera, launchImageLibrary } from 'react-native-image-picker';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Badge } from '@shared/components/atoms/Badge';
import { Button } from '@shared/components/atoms/Button';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { spacing, radius, useTheme } from '@theme/index';
import { CustomerProduct, ProductDocument } from '@core/types/api';
import { productApi } from '@infrastructure/api/productApi';
import { resolveMediaUrl } from '@core/utils/imageUtils';
import { getProductWarrantyInfo } from './MyProductsScreen';
import { ProductDocumentCard } from '../components/ProductDocumentCard';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

const DOC_TYPES = [
  { id: 'INVOICE', label: 'Tax Invoice / Bill', icon: 'receipt-outline' },
  { id: 'WARRANTY_CARD', label: 'Warranty Card', icon: 'shield-checkmark-outline' },
  { id: 'USER_MANUAL', label: 'User Manual', icon: 'book-outline' },
  { id: 'INSTALLATION_RECEIPT', label: 'Installation Slip', icon: 'construct-outline' },
  { id: 'PRODUCT_DOC', label: 'General Document', icon: 'document-text-outline' },
];

/**
 * Robust cross-platform date formatter for React Native (Hermes Engine)
 * Outputs standard "D MMM YYYY" (e.g. "7 Aug 2026", "10 Aug 2024")
 */
const formatStandardDate = (dateStr?: string | null): string => {
  if (!dateStr) return 'N/A';
  const str = String(dateStr).trim();

  // Pattern 1: Slash format (M/D/YYYY)
  const slashMatch = str.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (slashMatch) {
    const monthIndex = parseInt(slashMatch[1], 10) - 1;
    const day = parseInt(slashMatch[2], 10);
    const year = slashMatch[3];
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${MONTHS[monthIndex]} ${year}`;
    }
  }

  // Pattern 2: Dash / ISO format (YYYY-MM-DD)
  const dashMatch = str.match(/^(\d{4})-(\d{1,2})-(\d{1,2})/);
  if (dashMatch) {
    const year = dashMatch[1];
    const monthIndex = parseInt(dashMatch[2], 10) - 1;
    const day = parseInt(dashMatch[3], 10);
    if (monthIndex >= 0 && monthIndex < 12) {
      return `${day} ${MONTHS[monthIndex]} ${year}`;
    }
  }

  // Pattern 3: Date Object
  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    return `${parsed.getDate()} ${MONTHS[parsed.getMonth()]} ${parsed.getFullYear()}`;
  }

  return str;
};

/**
 * Deduplicate brand in product name (e.g. "LG • 3 star 1.5 Ton")
 */
const formatApplianceName = (brandName?: string, productName?: string, fallback?: string): string => {
  const brand = (brandName || '').trim();
  const product = (productName || '').trim();
  if (!brand && !product) return fallback || 'Registered Appliance';
  if (!brand) return product;
  if (!product) return brand;
  if (product.toLowerCase().startsWith(brand.toLowerCase())) {
    return product;
  }
  return `${brand} • ${product}`;
};

export const ProductDetailScreen = ({ route, navigation }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const insets = useSafeAreaInsets();
  const styles = React.useMemo(() => makeStyles(colors, insets.bottom), [colors, insets.bottom]);

  const initialProduct: CustomerProduct = route.params?.product || {};
  const productId = route.params?.productId || route.params?.id || initialProduct.id;

  const [product, setProduct] = useState<CustomerProduct>(initialProduct);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [imageError, setImageError] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  // ── Document Vault States ──────────────────────────────────────────────────
  const [documents, setDocuments] = useState<ProductDocument[]>([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [deletingDocId, setDeletingDocId] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [selectedDocType, setSelectedDocType] = useState<string>('INVOICE');
  const [previewDoc, setPreviewDoc] = useState<ProductDocument | null>(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewError, setPreviewError] = useState(false);

  const fetchProductDetails = useCallback(async () => {
    if (!productId) return;
    try {
      setErrorMsg(null);
      const res = await productApi.getProductById(productId);
      if (res?.success && res.data) {
        setProduct(res.data);
        setImageError(false);
      }
    } catch (err: any) {
      setErrorMsg(err?.error?.message || 'Could not refresh product details');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [productId]);

  const fetchDocuments = useCallback(async () => {
    if (!productId) return;
    try {
      setLoadingDocs(true);
      const res = await productApi.getProductDocuments(productId);
      if (res?.success && Array.isArray(res.data)) {
        setDocuments(res.data);
      }
    } catch (_e) {
      // Gracefully maintain state
    } finally {
      setLoadingDocs(false);
    }
  }, [productId]);

  useEffect(() => {
    fetchProductDetails();
    fetchDocuments();
  }, [fetchProductDetails, fetchDocuments]);

  useEffect(() => {
    if (product?.productImage) {
      setImageError(false);
    }
  }, [product?.productImage]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchProductDetails();
    fetchDocuments();
  };

  const handlePickMedia = async (source: 'camera' | 'gallery') => {
    try {
      const options = {
        mediaType: 'photo' as const,
        quality: 0.8 as const,
        includeBase64: false,
      };

      const result =
        source === 'camera'
          ? await launchCamera(options)
          : await launchImageLibrary(options);

      if (result.didCancel || !result.assets || result.assets.length === 0) {
        return;
      }

      const asset = result.assets[0];
      if (!asset.uri) return;

      setShowUploadModal(false);
      setUploadingDoc(true);

      const res = await productApi.uploadProductDocument(
        productId,
        {
          uri: asset.uri,
          name: asset.fileName || `doc_${Date.now()}.jpg`,
          type: asset.type || 'image/jpeg',
        },
        selectedDocType
      );

      if (res?.success && res.data) {
        setDocuments((prev) => [res.data, ...prev]);
        Alert.alert('Upload Successful 🎉', 'Your document has been stored safely.');
      } else {
        const msg = (res as any)?.error?.message || 'Could not upload document. Please try again.';
        Alert.alert('Upload Failed', msg);
      }
    } catch (err: any) {
      Alert.alert('Upload Error', err?.message || 'Failed to upload document.');
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteDoc = (doc: ProductDocument) => {
    Alert.alert(
      'Delete Document',
      'Are you sure you want to remove this document from your appliance vault?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeletingDocId(doc.id);
              const res = await productApi.deleteProductDocument(doc.id);
              if (res?.success) {
                setDocuments((prev) => prev.filter((d) => d.id !== doc.id));
              } else {
                Alert.alert('Error', 'Could not delete document.');
              }
            } catch (_e) {
              Alert.alert('Error', 'Failed to delete document.');
            } finally {
              setDeletingDocId(null);
            }
          },
        },
      ]
    );
  };

  const displayTitle = formatApplianceName(
    product?.brandName,
    product?.productName,
    product?.categoryName || 'Registered Appliance'
  );

  const warrantyInfo = getProductWarrantyInfo(product, colors);
  const purchaseDateStr = formatStandardDate(product?.purchaseDate);
  const productImageUrl = resolveMediaUrl(product?.productImage);

  return (
    <ScreenWrapper style={styles.container}>
      <Header
        title="Product Details"
        subtitle={displayTitle}
        onBackPress={() => navigation.goBack()}
        style={styles.header}
      />

      {errorMsg && (
        <View style={styles.errorBanner}>
          <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
          <AppText variant="bodySm" style={styles.errorText}>
            {errorMsg}
          </AppText>
          <TouchableOpacity onPress={fetchProductDetails} activeOpacity={0.75}>
            <AppText variant="labelSm" style={styles.retryText}>
              Retry
            </AppText>
          </TouchableOpacity>
        </View>
      )}

      {loading && !refreshing ? (
        <View style={styles.loaderCenter}>
          <ActivityIndicator size="large" color={colors.primary.main} />
          <AppText variant="bodyMd" style={styles.loadingText}>
            Loading appliance specifications...
          </AppText>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
        >
          {/* Hero Banner Card */}
          <Card style={styles.heroCard} padding="none">
            {productImageUrl && !imageError ? (
              <View style={styles.heroImageWrapper}>
                <Image
                  source={{ uri: productImageUrl }}
                  style={styles.heroImage}
                  resizeMode="cover"
                  onError={() => setImageError(true)}
                />
                <View style={styles.imageOverlayBadge}>
                  <Badge
                    label={warrantyInfo.badgeLabel}
                    variant={warrantyInfo.status === 'ACTIVE' ? 'success' : 'danger'}
                  />
                </View>
              </View>
            ) : (
              <View style={styles.heroIconFallback}>
                <View style={styles.heroIconBox}>
                  <AppIcon name="cube" size="xl" color={colors.primary.main} />
                </View>
                <View style={styles.badgeRow}>
                  <Badge
                    label={warrantyInfo.badgeLabel}
                    variant={warrantyInfo.status === 'ACTIVE' ? 'success' : 'danger'}
                  />
                </View>
              </View>
            )}

            <View style={styles.heroContentContainer}>
              {product?.brandName ? (
                <AppText variant="labelMd" color="primary" style={styles.brandSubtitle}>
                  {product.brandName.toUpperCase()}
                </AppText>
              ) : null}

              <AppText variant="headingMd" color="textPrimary" style={styles.productName}>
                {displayTitle}
              </AppText>

              <View style={styles.categoryPillRow}>
                {product?.categoryName ? (
                  <View style={styles.categoryPill}>
                    <AppIcon name="pricetag-outline" size="xs" color={colors.text.secondary} />
                    <AppText variant="caption" color="textSecondary" style={styles.categoryText}>
                      {product.categoryName}
                    </AppText>
                  </View>
                ) : null}

                {product?.qrCode ? (
                  <View style={styles.qrTagPill}>
                    <AppIcon name="qr-code-outline" size="xs" color={colors.primary.main} />
                    <AppText variant="caption" color="primary" style={styles.qrTagText}>
                      QR: {product.qrCode}
                    </AppText>
                  </View>
                ) : null}
              </View>
            </View>
          </Card>

          {/* Warranty & Purchase Dates Section */}
          <View style={styles.dateCardsRow}>
            <Card style={styles.dateCard} padding="md">
              <AppText variant="caption" color="textMuted" style={styles.dateLabel}>
                Purchase Date
              </AppText>
              <AppText variant="labelMd" color="textPrimary" style={styles.dateValue}>
                {purchaseDateStr}
              </AppText>
            </Card>

            <Card style={styles.dateCard} padding="md">
              <AppText variant="caption" color="textMuted" style={styles.dateLabel}>
                Warranty Status
              </AppText>
              <AppText
                variant="labelMd"
                style={[
                  styles.dateValue,
                  warrantyInfo.status === 'ACTIVE'
                    ? styles.validDateValue
                    : warrantyInfo.status === 'EXPIRED'
                    ? styles.expiredDateValue
                    : styles.neutralDateValue,
                ]}
              >
                {warrantyInfo.badgeLabel}
              </AppText>
            </Card>
          </View>

          {/* Detailed Specifications & Seller Info Card */}
          <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
            Purchase & Dealer Details
          </AppText>
          <Card style={styles.detailsCard} padding="none">
            {product?.productName ? (
              <View style={styles.detailRow}>
                <AppText variant="bodyMd" color="textSecondary">Model Name</AppText>
                <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                  {product.productName}
                </AppText>
              </View>
            ) : null}

            {product?.modelNumber ? (
              <View style={styles.detailRow}>
                <AppText variant="bodyMd" color="textSecondary">Model Number</AppText>
                <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                  {product.modelNumber}
                </AppText>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <AppText variant="bodyMd" color="textSecondary">Invoice Number</AppText>
              <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                {product?.invoiceNumber || 'INV-DIGITAL'}
              </AppText>
            </View>

            {product?.quantity != null ? (
              <View style={styles.detailRow}>
                <AppText variant="bodyMd" color="textSecondary">Quantity</AppText>
                <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                  {product.quantity} Unit{product.quantity > 1 ? 's' : ''}
                </AppText>
              </View>
            ) : null}

            <View style={styles.detailRow}>
              <AppText variant="bodyMd" color="textSecondary">Unit Price</AppText>
              <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                {product?.unitPrice ? `₹${product.unitPrice.toLocaleString('en-IN')}` : 'N/A'}
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText variant="bodyMd" color="textSecondary">Warranty Term</AppText>
              <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                {product?.warrantyMonths
                  ? `${product.warrantyMonths} Months (${warrantyInfo.status === 'ACTIVE' ? 'Active' : 'Expired'})`
                  : 'No Warranty Term'}
              </AppText>
            </View>

            <View style={styles.detailRow}>
              <AppText variant="bodyMd" color="textSecondary">Dealer / Store</AppText>
              <View style={styles.dealerValueWrap}>
                <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                  {product?.shopkeeperName || 'Authorized Dealer'}
                </AppText>
                {product?.shopkeeperMobile ? (
                  <AppText variant="caption" color="textMuted">
                    📞 {product.shopkeeperMobile}
                  </AppText>
                ) : null}
              </View>
            </View>

            <View style={[styles.detailRow, styles.lastDetailRow]}>
              <AppText variant="bodyMd" color="textSecondary">QR Code Tag</AppText>
              <AppText variant="bodyMd" color="textPrimary" style={styles.detailValue}>
                {product?.qrCode || 'Not Tagged'}
              </AppText>
            </View>
          </Card>

          {/* Active Installation Details (if available) */}
          {product?.installation ? (
            <>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Installation Status
              </AppText>
              <Card style={styles.installationCard} padding="md">
                <View style={styles.installationHeaderRow}>
                  <View style={styles.installationIconThumb}>
                    <AppIcon name="construct-outline" size="sm" color={colors.primary.main} />
                  </View>
                  <View style={styles.installationTitleGroup}>
                    <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                      Appliance Installation
                    </AppText>
                    {product.installation.scheduledAt ? (
                      <AppText variant="caption" color="textMuted">
                        Scheduled: {formatStandardDate(product.installation.scheduledAt)}
                      </AppText>
                    ) : (
                      <AppText variant="caption" color="textMuted">
                        {product.installation.status === 'COMPLETED'
                          ? 'Installation Completed'
                          : 'Service Request Active'}
                      </AppText>
                    )}
                  </View>
                  <Badge
                    label={product.installation.status || 'SCHEDULED'}
                    variant={product.installation.status === 'COMPLETED' ? 'success' : 'info'}
                  />
                </View>
                {product.installation.mechanicName ? (
                  <View style={styles.techRow}>
                    <AppIcon name="person-outline" size="xs" color={colors.text.secondary} />
                    <AppText variant="bodySm" color="textSecondary" style={styles.techText}>
                      Assigned Field Technician:{' '}
                      <AppText variant="bodySm" color="textPrimary" style={styles.boldText}>
                        {product.installation.mechanicName}
                      </AppText>
                    </AppText>
                  </View>
                ) : null}
              </Card>
            </>
          ) : null}

          {/* ── Document & Invoices Vault Section ───────────────────────────── */}
          <View style={styles.docsHeaderRow}>
            <View style={styles.docsTitleGroup}>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Documents & Warranty Cards
              </AppText>
              {documents.length > 0 && (
                <View style={styles.countBadge}>
                  <AppText variant="caption" color="textInverse" style={styles.countBadgeText}>
                    {documents.length}
                  </AppText>
                </View>
              )}
            </View>
            <TouchableOpacity
              style={styles.uploadTriggerBtn}
              onPress={() => setShowUploadModal(true)}
              activeOpacity={0.8}
              disabled={uploadingDoc}
              accessibilityRole="button"
              accessibilityLabel="Upload product document"
            >
              {uploadingDoc ? (
                <ActivityIndicator size="small" color={colors.primary.main} />
              ) : (
                <>
                  <AppIcon name="cloud-upload-outline" size="xs" color={colors.primary.main} />
                  <AppText variant="labelSm" color="primary" style={styles.uploadTriggerText}>
                    + Upload
                  </AppText>
                </>
              )}
            </TouchableOpacity>
          </View>

          {loadingDocs ? (
            <View style={styles.docsLoaderBox}>
              <ActivityIndicator size="small" color={colors.primary.main} />
              <AppText variant="caption" color="textMuted" style={styles.loadingDocsText}>
                Loading stored documents...
              </AppText>
            </View>
          ) : documents.length === 0 ? (
            <Card style={styles.emptyDocsCard} padding="md" variant="outlined">
              <View style={styles.emptyDocsIconWrap}>
                <AppIcon name="document-attach-outline" size="md" color={colors.primary.main} />
              </View>
              <AppText variant="labelMd" color="textPrimary" style={styles.emptyDocsTitle}>
                No Documents Uploaded Yet
              </AppText>
              <AppText variant="caption" color="textMuted" style={styles.emptyDocsSubtitle}>
                Store digital invoices, warranty cards, and manuals securely for this appliance.
              </AppText>
              <TouchableOpacity
                style={styles.emptyUploadActionBtn}
                onPress={() => setShowUploadModal(true)}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Upload First Document"
              >
                <AppIcon name="cloud-upload-outline" size="xs" color={colors.primary.main} />
                <AppText variant="labelSm" color="primary" style={styles.emptyUploadBtnText}>
                  Upload First Document
                </AppText>
              </TouchableOpacity>
            </Card>
          ) : (
            documents.map((doc) => (
              <ProductDocumentCard
                key={doc.id}
                document={doc}
                onPress={(d) => {
                  setPreviewError(false);
                  setPreviewLoading(true);
                  setPreviewDoc(d);
                }}
                onDelete={handleDeleteDoc}
                isDeleting={deletingDocId === doc.id}
              />
            ))
          )}

          {/* Service & Repair History Header */}
          <View style={styles.historyHeader}>
            <View style={styles.historyTitleRow}>
              <AppText variant="headingMd" color="textPrimary" style={styles.sectionTitle}>
                Service & Maintenance History
              </AppText>
              {product?.serviceHistory && product.serviceHistory.length > 0 && (
                <View style={styles.countBadge}>
                  <AppText variant="caption" color="textInverse" style={styles.countBadgeText}>
                    {product.serviceHistory.length}
                  </AppText>
                </View>
              )}
            </View>
            <TouchableOpacity onPress={() => navigation.navigate('MainTab', { screen: 'BookingsScreenTab' })}>
              <AppText variant="labelMd" style={styles.viewAllText}>
                View All
              </AppText>
            </TouchableOpacity>
          </View>

          {product?.serviceHistory && product.serviceHistory.length > 0 ? (
            product.serviceHistory.map((service, idx) => (
              <Card key={service.id || idx} style={styles.historyCard} padding="md">
                <View style={styles.historyItem}>
                  <View style={styles.historyLeftIcon}>
                    <AppIcon name="construct-outline" size="md" color={colors.secondary.main} />
                  </View>
                  <View style={styles.historyMain}>
                    <AppText variant="headingSm" color="textPrimary">
                      {service.serviceType || 'Service & Maintenance Visit'}
                    </AppText>
                    <AppText variant="caption" color="textMuted" style={styles.historyDate}>
                      {formatStandardDate(service.createdAt)}
                      {service.mechanicName ? ` • Tech: ${service.mechanicName}` : ''}
                    </AppText>
                  </View>
                  <Badge
                    label={service.status}
                    variant={service.status === 'RESOLVED' || service.status === 'COMPLETED' ? 'success' : 'warning'}
                  />
                </View>
              </Card>
            ))
          ) : (
            <Card style={styles.emptyHistoryCard} padding="lg">
              <AppIcon name="shield-checkmark-outline" size="lg" color={colors.status.success} />
              <AppText variant="headingSm" color="textPrimary" style={styles.emptyTitle}>
                No Service Issues Logged
              </AppText>
              <AppText variant="caption" color="textMuted" style={styles.emptySubtitle}>
                This appliance has no registered repair requests or breakdown tickets.
              </AppText>
            </Card>
          )}
        </ScrollView>
      )}

      {/* Enhanced Elevated Bottom Action Dock */}
      <View style={styles.fixedBottomBar}>
        {/* Micro Status Hint Line */}
        {warrantyInfo.status === 'ACTIVE' ? (
          <View style={styles.warrantyHintBar}>
            <AppIcon name="shield-checkmark" size="xs" color={colors.status.success} />
            <AppText variant="caption" style={styles.warrantyHintText}>
              100% Free Labor & Spare Parts under Active Warranty
            </AppText>
          </View>
        ) : (
          <View style={styles.outOfWarrantyHintBar}>
            <AppIcon name="shield-outline" size="xs" color={colors.status.warning} />
            <AppText variant="caption" style={styles.outOfWarrantyHintText}>
              Standard Diagnostics & Repair • Certified Specialists
            </AppText>
          </View>
        )}

        {/* Action Buttons Row */}
        <View style={styles.actionsRow}>
          {/* Quick Invoice Action Button */}
          <TouchableOpacity
            style={styles.invoiceBtn}
            onPress={() => setShowInvoiceModal(true)}
            activeOpacity={0.8}
            accessibilityRole="button"
            accessibilityLabel="View Digital Invoice"
          >
            <AppIcon name="receipt-outline" size="sm" color={colors.primary.main} />
            <AppText variant="caption" style={styles.invoiceBtnText}>Invoice</AppText>
          </TouchableOpacity>

          {/* Prominent Primary CTA Button */}
          <TouchableOpacity
            style={styles.primaryCtaBtn}
            onPress={() => navigation.navigate('BookServiceScreen', { product })}
            activeOpacity={0.85}
            accessibilityRole="button"
            accessibilityLabel="Book Service Visit"
          >
            <View style={styles.primaryCtaIconWrap}>
              <AppIcon
                name={warrantyInfo.status === 'ACTIVE' ? 'shield-checkmark' : 'construct'}
                size="sm"
                color={colors.text.inverse}
              />
            </View>
            <View style={styles.primaryCtaTextCol}>
              <AppText variant="labelLg" style={styles.primaryCtaTitle}>
                {warrantyInfo.status === 'ACTIVE' ? 'Book Free Service' : 'Book Service Visit'}
              </AppText>
              <AppText variant="caption" style={styles.primaryCtaSubtitle}>
                {warrantyInfo.status === 'ACTIVE' ? '₹0 Warranty Claim' : 'Instant Provider Booking'}
              </AppText>
            </View>
            <AppIcon name="chevron-forward" size="sm" color={colors.text.inverse} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Digital Invoice Bottom Sheet Modal */}
      <Modal
        visible={showInvoiceModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowInvoiceModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <View style={styles.modalIconCircle}>
                  <AppIcon name="receipt" size="sm" color={colors.primary.main} />
                </View>
                <View style={styles.flex1}>
                  <AppText variant="headingSm" color="textPrimary">Digital Invoice</AppText>
                  <AppText variant="caption" color="textSecondary">Official Proof of Purchase</AppText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowInvoiceModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Invoice Modal"
              >
                <AppIcon name="close" size="sm" color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} style={styles.modalBody}>
              <View style={styles.invoiceSummaryBox}>
                <View style={styles.invoiceMetaRow}>
                  <AppText variant="caption" color="textSecondary">Invoice Number</AppText>
                  <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                    {product?.invoiceNumber || 'INV-DIGITAL'}
                  </AppText>
                </View>
                <View style={styles.invoiceMetaRow}>
                  <AppText variant="caption" color="textSecondary">Purchase Date</AppText>
                  <AppText variant="bodySm" color="textPrimary">{purchaseDateStr}</AppText>
                </View>
                <View style={styles.invoiceMetaRow}>
                  <AppText variant="caption" color="textSecondary">Appliance</AppText>
                  <AppText variant="bodySm" color="textPrimary">{displayTitle}</AppText>
                </View>
                {product?.categoryName ? (
                  <View style={styles.invoiceMetaRow}>
                    <AppText variant="caption" color="textSecondary">Category</AppText>
                    <AppText variant="bodySm" color="textPrimary">{product.categoryName}</AppText>
                  </View>
                ) : null}
                {product?.qrCode ? (
                  <View style={styles.invoiceMetaRow}>
                    <AppText variant="caption" color="textSecondary">QR Serial Number</AppText>
                    <AppText variant="caption" color="primary" style={styles.boldText}>{product.qrCode}</AppText>
                  </View>
                ) : null}
                <View style={styles.invoiceDivider} />
                <View style={styles.invoiceMetaRow}>
                  <AppText variant="caption" color="textSecondary">Issued By (Seller)</AppText>
                  <AppText variant="bodySm" color="textPrimary">{product?.shopkeeperName || 'Authorized Store'}</AppText>
                </View>
                {product?.shopkeeperMobile ? (
                  <View style={styles.invoiceMetaRow}>
                    <AppText variant="caption" color="textSecondary">Seller Contact</AppText>
                    <AppText variant="bodySm" color="textPrimary">{product.shopkeeperMobile}</AppText>
                  </View>
                ) : null}
                <View style={styles.invoiceDivider} />
                <View style={styles.invoiceTotalRow}>
                  <AppText variant="labelLg" color="textPrimary">Total Paid</AppText>
                  <AppText variant="headingMd" color="primary">
                    {product?.unitPrice ? `₹${product.unitPrice.toLocaleString('en-IN')}` : 'Paid'}
                  </AppText>
                </View>
              </View>
            </ScrollView>

            <Button
              title="Done"
              variant="primary"
              onPress={() => setShowInvoiceModal(false)}
              style={styles.modalDoneBtn}
            />
          </View>
        </View>
      </Modal>

      {/* ── Upload Document Modal Sheet ─────────────────────────────────── */}
      <Modal
        visible={showUploadModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowUploadModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={styles.modalHeaderTitleGroup}>
                <View style={styles.modalIconCircle}>
                  <AppIcon name="cloud-upload" size="sm" color={colors.primary.main} />
                </View>
                <View style={styles.flex1}>
                  <AppText variant="headingSm" color="textPrimary">Upload Document</AppText>
                  <AppText variant="caption" color="textSecondary">Choose category & upload source</AppText>
                </View>
              </View>
              <TouchableOpacity
                onPress={() => setShowUploadModal(false)}
                style={styles.modalCloseBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel="Close Upload Modal"
              >
                <AppIcon name="close" size="sm" color={colors.text.primary} />
              </TouchableOpacity>
            </View>

            {/* Document Category Selection */}
            <AppText variant="labelMd" color="textPrimary" style={styles.uploadStepLabel}>
              1. Document Category:
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.docTypeChipsContainer}
            >
              {DOC_TYPES.map((typeItem) => {
                const isSelected = selectedDocType === typeItem.id;
                return (
                  <TouchableOpacity
                    key={typeItem.id}
                    onPress={() => setSelectedDocType(typeItem.id)}
                    style={[styles.docTypeChip, isSelected && styles.docTypeChipSelected]}
                    activeOpacity={0.8}
                  >
                    <AppIcon
                      name={typeItem.icon}
                      size="xs"
                      color={isSelected ? colors.text.inverse : colors.text.primary}
                    />
                    <AppText
                      variant="caption"
                      style={isSelected ? styles.docTypeChipTextSelected : styles.docTypeChipText}
                    >
                      {typeItem.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Source Selection Buttons */}
            <AppText variant="labelMd" color="textPrimary" style={styles.uploadStepLabel}>
              2. Select Upload Source:
            </AppText>
            <View style={styles.uploadSourceRow}>
              <TouchableOpacity
                style={styles.sourceBtn}
                onPress={() => handlePickMedia('camera')}
                activeOpacity={0.8}
              >
                <View style={styles.sourceIconBox}>
                  <AppIcon name="camera-outline" size="md" color={colors.primary.main} />
                </View>
                <AppText variant="labelMd" color="textPrimary" style={styles.sourceBtnTitle}>
                  Take Photo
                </AppText>
                <AppText variant="caption" color="textMuted">
                  Snap picture via camera
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sourceBtn}
                onPress={() => handlePickMedia('gallery')}
                activeOpacity={0.8}
              >
                <View style={styles.sourceIconBox}>
                  <AppIcon name="images-outline" size="md" color={colors.cta.main} />
                </View>
                <AppText variant="labelMd" color="textPrimary" style={styles.sourceBtnTitle}>
                  Choose Gallery
                </AppText>
                <AppText variant="caption" color="textMuted">
                  Select image file
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ── Full-Screen Document Preview Modal ──────────────────────────── */}
      <Modal
        visible={Boolean(previewDoc)}
        transparent={false}
        animationType="fade"
        onRequestClose={() => setPreviewDoc(null)}
      >
        <View style={[styles.previewModalBackdrop, { backgroundColor: colors.background.default }]}>
          {/* Top Bar Header */}
          <View style={[styles.previewHeader, { paddingTop: insets.top > 0 ? insets.top + spacing.xs : spacing.lg }]}>
            <View style={styles.previewTitleWrap}>
              <AppText variant="headingSm" color="textPrimary" numberOfLines={1}>
                {previewDoc?.type ? previewDoc.type.replace(/_/g, ' ') : 'Document Preview'}
              </AppText>
              <AppText variant="caption" color="textMuted" numberOfLines={1}>
                {previewDoc?.url ? previewDoc.url.split('/').pop() : ''}
              </AppText>
            </View>
            <TouchableOpacity
              style={styles.previewCloseBtn}
              onPress={() => setPreviewDoc(null)}
              activeOpacity={0.8}
              accessibilityRole="button"
              accessibilityLabel="Close Preview"
            >
              <AppIcon name="close" size="sm" color={colors.text.primary} />
            </TouchableOpacity>
          </View>

          {/* Main Image Body */}
          <View style={styles.previewBody}>
            {previewDoc ? (
              <>
                {previewLoading && (
                  <View style={styles.previewLoadingBox}>
                    <ActivityIndicator size="large" color={colors.primary.main} />
                    <AppText variant="caption" color="textMuted" style={styles.previewLoadingText}>
                      Loading document...
                    </AppText>
                  </View>
                )}

                {previewError ? (
                  <View style={styles.previewErrorBox}>
                    <AppIcon name="alert-circle-outline" size="xl" color={colors.status.danger} />
                    <AppText variant="labelMd" color="textPrimary" style={styles.previewErrorTitle}>
                      Failed to Load Image
                    </AppText>
                    <AppText variant="caption" color="textMuted" style={styles.previewErrorSubtitle}>
                      {resolveMediaUrl(previewDoc.url) || previewDoc.url}
                    </AppText>
                    <TouchableOpacity
                      style={styles.previewRetryBtn}
                      onPress={() => {
                        setPreviewError(false);
                        setPreviewLoading(true);
                      }}
                      activeOpacity={0.8}
                    >
                      <AppText variant="labelSm" color="primary">Retry Loading</AppText>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Image
                    source={{ uri: resolveMediaUrl(previewDoc.url)! }}
                    style={styles.previewImage}
                    resizeMode="contain"
                    onLoadStart={() => setPreviewLoading(true)}
                    onLoadEnd={() => setPreviewLoading(false)}
                    onError={() => {
                      setPreviewLoading(false);
                      setPreviewError(true);
                    }}
                  />
                )}
              </>
            ) : null}
          </View>

          {/* Full URL & Browser Action Bar Footer */}
          {previewDoc ? (
            <View style={[styles.previewUrlFooter, { paddingBottom: insets.bottom > 0 ? insets.bottom + spacing.xs : spacing.md }]}>
              <View style={styles.previewUrlRow}>
                <AppIcon name="link-outline" size="xs" color={colors.primary.main} />
                <AppText
                  variant="caption"
                  color="textSecondary"
                  numberOfLines={2}
                  style={styles.previewFullUrlText}
                  selectable
                >
                  {resolveMediaUrl(previewDoc.url) || previewDoc.url}
                </AppText>
              </View>
              <TouchableOpacity
                style={styles.openBrowserBtn}
                onPress={() => {
                  const url = resolveMediaUrl(previewDoc.url);
                  if (url) {
                    Linking.openURL(url).catch(() => {
                      Alert.alert('Open URL', url);
                    });
                  }
                }}
                activeOpacity={0.8}
                accessibilityRole="button"
                accessibilityLabel="Open document in browser"
              >
                <AppIcon name="open-outline" size="xs" color={colors.text.inverse} />
                <AppText variant="labelSm" color="textInverse" style={styles.openBrowserText}>
                  Open in Browser
                </AppText>
              </TouchableOpacity>
            </View>
          ) : null}
        </View>
      </Modal>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any, bottomInset: number) => {
  const safeBottom = bottomInset > 0 ? bottomInset : 16;
  return StyleSheet.create({
    container: {
      flex: 1,
    },
    header: {
      paddingHorizontal: spacing.lg,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm + 2,
      borderRadius: radius.sm,
      marginBottom: spacing.sm,
      marginHorizontal: spacing.lg,
      gap: spacing.xs,
    },
    errorText: {
      flex: 1,
      color: colors.status.danger,
    },
    retryText: {
      color: colors.status.danger,
      fontWeight: '700',
    },
    loaderCenter: {
      paddingVertical: spacing.xxl,
      alignItems: 'center',
    },
    loadingText: {
      color: colors.text.muted,
      marginTop: spacing.sm,
    },
    scrollContent: {
      paddingHorizontal: spacing.lg,
      paddingTop: 0,
      paddingBottom: safeBottom + 95,
    },
    heroCard: {
      overflow: 'hidden',
      marginBottom: spacing.md,
    },
    heroImageWrapper: {
      width: '100%',
      height: 200,
      backgroundColor: colors.background.paper,
      position: 'relative',
    },
    heroImage: {
      width: '100%',
      height: '100%',
    },
    imageOverlayBadge: {
      position: 'absolute',
      top: spacing.sm,
      right: spacing.sm,
    },
    heroIconFallback: {
      alignItems: 'center',
      paddingTop: spacing.lg,
      paddingBottom: spacing.sm,
    },
    heroIconBox: {
      width: 72,
      height: 72,
      borderRadius: 36,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.sm,
    },
    badgeRow: {
      marginBottom: spacing.xs,
    },
    heroContentContainer: {
      padding: spacing.md,
      alignItems: 'center',
    },
    brandSubtitle: {
      letterSpacing: 1.2,
      fontWeight: '700',
      marginBottom: 2,
    },
    productName: {
      textAlign: 'center',
    },
    categoryPillRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      marginTop: spacing.xs + 2,
    },
    categoryPill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.neutral[100],
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
    },
    categoryText: {
      fontWeight: '500',
      fontSize: 12,
    },
    qrTagPill: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.sm,
      paddingVertical: 3,
      borderRadius: radius.pill,
      gap: 4,
    },
    qrTagText: {
      fontSize: 11,
      fontWeight: '600',
    },
    dateCardsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    dateCard: {
      flex: 1,
    },
    dateLabel: {
      marginBottom: 4,
    },
    dateValue: {
      fontWeight: '700',
    },
    validDateValue: {
      color: colors.status.success,
    },
    expiredDateValue: {
      color: colors.status.danger,
    },
    neutralDateValue: {
      color: colors.text.muted,
    },
    sectionTitle: {
      marginBottom: spacing.xs + 2,
      marginTop: spacing.xs,
    },
    detailsCard: {
      paddingHorizontal: spacing.md,
      marginBottom: spacing.md,
    },
    detailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.sm + 2,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    lastDetailRow: {
      borderBottomWidth: 0,
    },
    detailValue: {
      fontWeight: '600',
      textAlign: 'right',
    },
    dealerValueWrap: {
      alignItems: 'flex-end',
    },
    boldText: {
      fontWeight: '700',
    },
    installationCard: {
      marginBottom: spacing.md,
    },
    installationHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
    },
    installationIconThumb: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.xs + 2,
    },
    installationTitleGroup: {
      flex: 1,
    },
    techRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: spacing.sm,
      paddingTop: spacing.xs + 2,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
    },
    techText: {
      fontSize: 12,
    },
    // Document Vault Styles
    docsHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    docsTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    uploadTriggerBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: 6,
      borderRadius: radius.pill,
    },
    uploadTriggerText: {
      fontWeight: '700',
    },
    docsLoaderBox: {
      paddingVertical: spacing.md,
      alignItems: 'center',
      gap: 6,
    },
    loadingDocsText: {
      fontSize: 12,
    },
    emptyDocsCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md + 4,
      marginBottom: spacing.md,
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    emptyDocsIconWrap: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
    },
    emptyDocsTitle: {
      fontWeight: '700',
      marginBottom: 2,
    },
    emptyDocsSubtitle: {
      textAlign: 'center',
      maxWidth: '85%',
      marginBottom: spacing.sm,
    },
    emptyUploadActionBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.primary.light,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.primary.main,
    },
    emptyUploadBtnText: {
      fontWeight: '700',
    },
    uploadStepLabel: {
      fontWeight: '700',
      marginBottom: spacing.xs + 2,
      marginTop: spacing.xs,
    },
    docTypeChipsContainer: {
      gap: spacing.xs,
      paddingBottom: spacing.sm,
    },
    docTypeChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.background.default,
      borderWidth: 1,
      borderColor: colors.border.light,
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
    },
    docTypeChipSelected: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    docTypeChipText: {
      color: colors.text.primary,
      fontWeight: '500',
    },
    docTypeChipTextSelected: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    uploadSourceRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    sourceBtn: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.sm,
      backgroundColor: colors.background.default,
      borderRadius: radius.lg,
      borderWidth: 1.5,
      borderColor: colors.border.light,
    },
    sourceIconBox: {
      width: 48,
      height: 48,
      borderRadius: 24,
      backgroundColor: colors.background.paper,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: spacing.xs,
      elevation: 1,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    sourceBtnTitle: {
      fontWeight: '700',
      marginBottom: 2,
    },
    // Preview Modal Styles
    previewModalBackdrop: {
      flex: 1,
    },
    previewHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      backgroundColor: colors.background.paper,
    },
    previewTitleWrap: {
      flex: 1,
      marginRight: spacing.sm,
    },
    previewCloseBtn: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    previewBody: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.md,
      backgroundColor: colors.background.default,
    },
    previewImage: {
      width: SCREEN_WIDTH - spacing.lg * 2,
      height: SCREEN_HEIGHT * 0.65,
    },
    previewLoadingBox: {
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
    },
    previewLoadingText: {
      marginTop: spacing.xs,
    },
    previewErrorBox: {
      alignItems: 'center',
      justifyContent: 'center',
      padding: spacing.lg,
      gap: spacing.xs,
    },
    previewErrorTitle: {
      fontWeight: '700',
      marginTop: spacing.xs,
    },
    previewErrorSubtitle: {
      textAlign: 'center',
      maxWidth: '85%',
      marginBottom: spacing.sm,
    },
    previewRetryBtn: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      borderWidth: 1,
      borderColor: colors.primary.main,
    },
    previewUrlFooter: {
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.sm,
      backgroundColor: colors.background.paper,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      gap: spacing.xs + 2,
    },
    previewUrlRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    previewFullUrlText: {
      flex: 1,
      fontSize: 11,
      color: colors.text.secondary,
      fontFamily: 'monospace',
    },
    openBrowserBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 6,
      backgroundColor: colors.primary.main,
      borderRadius: radius.md,
      paddingVertical: spacing.xs + 4,
      paddingHorizontal: spacing.md,
      alignSelf: 'stretch',
    },
    openBrowserText: {
      fontWeight: '700',
    },
    // History Styles
    historyHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.xs,
      marginTop: spacing.sm,
    },
    historyTitleRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
    },
    countBadge: {
      backgroundColor: colors.primary.main,
      paddingHorizontal: 6,
      paddingVertical: 1,
      borderRadius: radius.pill,
    },
    countBadgeText: {
      fontSize: 10,
      fontWeight: '700',
    },
    viewAllText: {
      color: colors.cta.main,
      fontWeight: '700',
    },
    historyCard: {
      marginBottom: spacing.sm,
    },
    historyItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    historyLeftIcon: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.secondary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    historyMain: {
      flex: 1,
    },
    historyDate: {
      marginTop: 2,
    },
    emptyHistoryCard: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.lg,
      marginBottom: spacing.md,
    },
    emptyTitle: {
      marginTop: spacing.xs,
    },
    emptySubtitle: {
      textAlign: 'center',
      marginTop: 2,
      maxWidth: '80%',
    },
    fixedBottomBar: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      paddingTop: spacing.xs + 2,
      paddingBottom: safeBottom,
      paddingHorizontal: spacing.lg,
      backgroundColor: colors.background.paper,
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      elevation: 12,
      shadowColor: colors.neutral[900],
      shadowOffset: { width: 0, height: -3 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
    },
    warrantyHintBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.status.successBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginBottom: spacing.xs + 2,
      alignSelf: 'center',
    },
    warrantyHintText: {
      color: colors.status.success,
      fontWeight: '600',
      fontSize: 11,
    },
    outOfWarrantyHintBar: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      backgroundColor: colors.status.warningBg,
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      marginBottom: spacing.xs + 2,
      alignSelf: 'center',
    },
    outOfWarrantyHintText: {
      color: colors.status.warning,
      fontWeight: '600',
      fontSize: 11,
    },
    actionsRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    invoiceBtn: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.lg,
      backgroundColor: colors.primary.light,
      borderWidth: 1.5,
      borderColor: colors.primary.main,
      minHeight: 48,
      minWidth: 64,
    },
    invoiceBtnText: {
      color: colors.primary.main,
      fontWeight: '700',
      fontSize: 11,
      marginTop: 2,
    },
    primaryCtaBtn: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.cta.main,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs + 4,
      minHeight: 48,
      elevation: 4,
      shadowColor: colors.cta.main,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 6,
    },
    primaryCtaIconWrap: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: 'rgba(255, 255, 255, 0.2)',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    primaryCtaTextCol: {
      flex: 1,
    },
    primaryCtaTitle: {
      color: colors.text.inverse,
      fontWeight: '700',
      fontSize: 14,
    },
    primaryCtaSubtitle: {
      color: 'rgba(255, 255, 255, 0.85)',
      fontSize: 10,
      marginTop: 1,
    },
    modalBackdrop: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      justifyContent: 'flex-end',
    },
    modalCard: {
      backgroundColor: colors.background.paper,
      borderTopLeftRadius: radius.xl,
      borderTopRightRadius: radius.xl,
      paddingHorizontal: spacing.lg,
      paddingTop: spacing.lg,
      paddingBottom: safeBottom + spacing.md,
      maxHeight: '80%',
    },
    modalHeaderRow: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    modalHeaderTitleGroup: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
    },
    modalIconCircle: {
      width: 40,
      height: 40,
      borderRadius: 20,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalCloseBtn: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.neutral[100],
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBody: {
      marginBottom: spacing.md,
    },
    invoiceSummaryBox: {
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    invoiceMetaRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: spacing.xs + 2,
    },
    invoiceDivider: {
      height: 1,
      backgroundColor: colors.border.light,
      marginVertical: spacing.xs + 2,
    },
    invoiceTotalRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingTop: spacing.xs,
    },
    modalDoneBtn: {
      borderRadius: radius.lg,
    },
    flex1: {
      flex: 1,
    },
  });
};
