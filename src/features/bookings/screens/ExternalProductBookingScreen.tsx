/**
 * @file ExternalProductBookingScreen.tsx
 * @feature Bookings / Screens
 * @responsibility Progressive 4-step wizard for booking services on external/unlisted appliances.
 *                 Adheres strictly to DESIGN_SYSTEM.md enterprise mobile standards.
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  FlatList,
  Image,
  RefreshControl,
} from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Header } from '@shared/components/molecules/Header';
import { Button } from '@shared/components/atoms/Button';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { EmptyState } from '@shared/components/molecules/EmptyState';
import {
  StepProgressBar,
  CategoryCard,
  ServiceTypeCard,
  SpecialistCard,
} from '../components';
import { spacing, radius, useTheme } from '@theme/index';
import { bookingApi } from '@infrastructure/api/bookingApi';
import { customerApi, CustomerAddress } from '@infrastructure/api/customerApi';
import { resolveMediaUrl } from '@core/utils/imageUtils';
import {
  ProductCategory,
  ServiceTypeItem,
  AvailableMechanic,
  AvailableShop,
} from '@core/types/api';

interface TimeSlot {
  label: string;
  hours: number;
  minutes: number;
}

const BASE_TIME_SLOTS: TimeSlot[] = [
  { label: '09:30 AM', hours: 9, minutes: 30 },
  { label: '11:30 AM', hours: 11, minutes: 30 },
  { label: '02:00 PM', hours: 14, minutes: 0 },
  { label: '04:30 PM', hours: 16, minutes: 30 },
  { label: '06:30 PM', hours: 18, minutes: 30 },
];

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const isSameDay = (d1: Date, d2: Date) => {
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
};

export const ExternalProductBookingScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Wizard Step State (1: Category -> 2: Service -> 3: Specialist -> 4: Schedule)
  const [currentStep, setCurrentStep] = useState<number>(1);

  // Data Collections
  const [categories, setCategories] = useState<ProductCategory[]>([]);
  const [serviceTypes, setServiceTypes] = useState<ServiceTypeItem[]>([]);
  const [freelancers, setFreelancers] = useState<AvailableMechanic[]>([]);
  const [shops, setShops] = useState<AvailableShop[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);

  // Selected State
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory | null>(null);
  const [selectedServiceType, setSelectedServiceType] = useState<ServiceTypeItem | null>(null);
  const [specialistType, setSpecialistType] = useState<'FREELANCER' | 'SHOPKEEPER'>('FREELANCER');
  const [selectedSpecialist, setSelectedSpecialist] = useState<AvailableMechanic | AvailableShop | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<CustomerAddress | null>(null);

  // Category Pagination & Search State
  const [categoryPage, setCategoryPage] = useState<number>(1);
  const [hasMoreCategories, setHasMoreCategories] = useState<boolean>(true);
  const [loadingCategories, setLoadingCategories] = useState<boolean>(true);
  const [loadingMoreCategories, setLoadingMoreCategories] = useState<boolean>(false);
  const [refreshingCategories, setRefreshingCategories] = useState<boolean>(false);
  const [categorySearchQuery, setCategorySearchQuery] = useState<string>('');

  // Schedule & Form State
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [selectedTimeSlotIndex, setSelectedTimeSlotIndex] = useState<number>(0);
  const [description, setDescription] = useState<string>('');

  // UI Loaders & Errors
  const [loadingServiceTypes, setLoadingServiceTypes] = useState<boolean>(false);
  const [loadingSpecialists, setLoadingSpecialists] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  // 1. Category Data Loader with Pagination & Server Search
  const loadCategories = useCallback(
    async (page: number, isRefresh: boolean, query: string) => {
      if (page === 1 && !isRefresh) {
        setLoadingCategories(true);
      } else if (page > 1) {
        setLoadingMoreCategories(true);
      }
      setErrorMessage(null);

      try {
        const res = await bookingApi.getCategories({
          page,
          limit: 10,
          q: query ? query.trim() : undefined,
        });

        if (res?.success && res.data) {
          const newItems = res.data.items || [];
          setCategories((prev) => (page === 1 || isRefresh ? newItems : [...prev, ...newItems]));
          setCategoryPage(page);
          setHasMoreCategories(Boolean(res.data.hasMore));

          // If initialCategoryId was passed in navigation params
          if (route?.params?.initialCategoryId && (page === 1 || isRefresh)) {
            const found = newItems.find((c) => c.id === route.params.initialCategoryId);
            if (found) {
              setSelectedCategory(found);
            }
          }
        }
      } catch (err: any) {
        setErrorMessage('Unable to load service categories. Please try again.');
      } finally {
        setLoadingCategories(false);
        setLoadingMoreCategories(false);
        setRefreshingCategories(false);
      }
    },
    [route?.params?.initialCategoryId]
  );

  // Initial Load (Categories & Saved Addresses)
  useEffect(() => {
    loadCategories(1, false, '');

    customerApi
      .getAddresses()
      .then((addrRes) => {
        if (addrRes?.success && Array.isArray(addrRes.data)) {
          setAddresses(addrRes.data);
          const defaultAddr = addrRes.data.find((a) => a.isDefault) || addrRes.data[0];
          if (defaultAddr) {
            setSelectedAddress(defaultAddr);
          }
        }
      })
      .catch(() => {});
  }, [loadCategories]);

  // Debounced Search Effect
  useEffect(() => {
    const timer = setTimeout(() => {
      loadCategories(1, true, categorySearchQuery);
    }, 350);
    return () => clearTimeout(timer);
  }, [categorySearchQuery, loadCategories]);

  const handleRefreshCategories = useCallback(() => {
    setRefreshingCategories(true);
    loadCategories(1, true, categorySearchQuery);
  }, [categorySearchQuery, loadCategories]);

  const handleLoadMoreCategories = useCallback(() => {
    if (!loadingMoreCategories && !loadingCategories && hasMoreCategories) {
      loadCategories(categoryPage + 1, false, categorySearchQuery);
    }
  }, [categoryPage, hasMoreCategories, loadingCategories, loadingMoreCategories, categorySearchQuery, loadCategories]);

  // 2. Fetch Service Types when Category is selected
  const fetchServiceTypesForCategory = useCallback(async (category: ProductCategory) => {
    setLoadingServiceTypes(true);
    setErrorMessage(null);
    try {
      const res = await bookingApi.getServiceTypes({ categoryId: category.id });
      if (res?.success && Array.isArray(res.data)) {
        setServiceTypes(res.data);
        if (res.data.length > 0) {
          setSelectedServiceType(res.data[0]);
        } else {
          setSelectedServiceType(null);
        }
      }
    } catch (err) {
      setErrorMessage('Could not load services for this category.');
    } finally {
      setLoadingServiceTypes(false);
    }
  }, []);

  // 3. Fetch Specialists (Freelancers & Shops) when Category & ServiceType are selected
  const fetchSpecialists = useCallback(async (categoryId: string, serviceTypeId?: string) => {
    setLoadingSpecialists(true);
    setErrorMessage(null);
    try {
      const [freeRes, shopRes] = await Promise.allSettled([
        bookingApi.getAvailableFreelancers({ categoryId, serviceTypeId }),
        bookingApi.getAvailableShops({ categoryId, serviceTypeId }),
      ]);

      if (freeRes.status === 'fulfilled' && freeRes.value?.success && Array.isArray(freeRes.value.data)) {
        setFreelancers(freeRes.value.data);
        if (specialistType === 'FREELANCER' && freeRes.value.data.length > 0) {
          setSelectedSpecialist(freeRes.value.data[0]);
        }
      }

      if (shopRes.status === 'fulfilled' && shopRes.value?.success && Array.isArray(shopRes.value.data)) {
        setShops(shopRes.value.data);
        if (specialistType === 'SHOPKEEPER' && shopRes.value.data.length > 0) {
          setSelectedSpecialist(shopRes.value.data[0]);
        }
      }
    } catch (err) {
      setErrorMessage('Could not find specialists in your area.');
    } finally {
      setLoadingSpecialists(false);
    }
  }, [specialistType]);

  // Step 1: User Selects Category
  const handleSelectCategory = (cat: ProductCategory) => {
    setSelectedCategory(cat);
    fetchServiceTypesForCategory(cat);
    setCurrentStep(2);
  };

  // Step 2: User Selects Service Type
  const handleSelectServiceType = (st: ServiceTypeItem) => {
    setSelectedServiceType(st);
    if (selectedCategory) {
      fetchSpecialists(selectedCategory.id, st.id);
    }
    setCurrentStep(3);
  };

  // Step 3: User Selects Specialist
  const handleSelectSpecialist = (spec: AvailableMechanic | AvailableShop) => {
    setSelectedSpecialist(spec);
  };

  const handleSwitchSpecialistType = (type: 'FREELANCER' | 'SHOPKEEPER') => {
    setSpecialistType(type);
    if (type === 'FREELANCER') {
      setSelectedSpecialist(freelancers[0] || null);
    } else {
      setSelectedSpecialist(shops[0] || null);
    }
  };

  const handleProceedToSchedule = () => {
    if (!selectedSpecialist) {
      Alert.alert('Selection Required', 'Please select a technician or service center to continue.');
      return;
    }
    setCurrentStep(4);
  };

  // Quick 14-day horizontal strip
  const quickDateStrip = useMemo(() => {
    const list: Array<{ date: Date; label: string; sublabel: string; isToday: boolean }> = [];
    for (let i = 0; i < 14; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() + i);

      let label = `${d.getDate()} ${MONTH_NAMES[d.getMonth()].slice(0, 3)}`;
      if (i === 0) label = 'Today';
      else if (i === 1) label = 'Tomorrow';

      const sublabel = WEEKDAYS[d.getDay()];
      list.push({ date: d, label, sublabel, isToday: i === 0 });
    }
    return list;
  }, [today]);

  // Available Time Slots for Selected Date
  const availableTimeSlots = useMemo(() => {
    const isSelectedToday = isSameDay(selectedDate, today);
    if (!isSelectedToday) return BASE_TIME_SLOTS;

    const now = new Date();
    const nowMinutes = now.getHours() * 60 + now.getMinutes();

    return BASE_TIME_SLOTS.filter((slot) => {
      const slotMinutes = slot.hours * 60 + slot.minutes;
      return slotMinutes > nowMinutes + 30; // 30 mins lead time
    });
  }, [selectedDate, today]);

  // Final Submit Handler (Strictly omitting saleItemId)
  const handleSubmitBooking = async () => {
    setValidationError(null);

    if (!selectedCategory) {
      setValidationError('Please select an appliance category.');
      setCurrentStep(1);
      return;
    }

    if (!selectedServiceType) {
      setValidationError('Please select a service type.');
      setCurrentStep(2);
      return;
    }

    if (!selectedSpecialist) {
      setValidationError('Please select a technician or service center.');
      setCurrentStep(3);
      return;
    }

    if (!description.trim()) {
      setValidationError('Please describe the problem or requirement (min 10 characters).');
      return;
    }

    if (description.trim().length < 10) {
      setValidationError('Description must be at least 10 characters long.');
      return;
    }

    const chosenSlot = availableTimeSlots[selectedTimeSlotIndex] || BASE_TIME_SLOTS[0];
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(chosenSlot.hours, chosenSlot.minutes, 0, 0);
    const scheduledIso = scheduledDateTime.toISOString();

    setSubmitting(true);
    try {
      let res;
      if (specialistType === 'FREELANCER') {
        res = await bookingApi.bookDirectFreelancer({
          categoryId: selectedCategory.id,
          serviceTypeId: selectedServiceType.id,
          mechanicId: selectedSpecialist.id,
          description: description.trim(),
          scheduledAt: scheduledIso,
          preferredTimeSlot: chosenSlot.label,
        });
      } else {
        res = await bookingApi.createBooking({
          categoryId: selectedCategory.id,
          serviceTypeId: selectedServiceType.id,
          shopkeeperId: selectedSpecialist.id,
          description: description.trim(),
          scheduledAt: scheduledIso,
          agreedPrice: selectedSpecialist.offeredPrice,
        });
      }

      if (res?.success || res?.data) {
        Alert.alert(
          'Service Scheduled! 🛠️',
          `Your appointment for ${selectedCategory.name} (${selectedServiceType.name}) is booked for ${selectedDate.toDateString()} at ${chosenSlot.label}.`,
          [
            {
              text: 'View My Bookings',
              onPress: () => navigation.navigate('MainTab', { screen: 'BookingsScreenTab' }),
            },
          ]
        );
      } else {
        const errMsg = res?.error?.message || 'Failed to submit service booking.';
        Alert.alert('Booking Error', errMsg);
      }
    } catch (err: any) {
      const errMsg = err?.error?.message || err?.message || 'Unable to complete service booking.';
      Alert.alert('Booking Failed', errMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container} keyboardAvoiding>
      {/* Header */}
      <Header
        title="Book Any Appliance"
        subtitle={
          currentStep === 1
            ? 'Step 1 of 4: Select Appliance Category'
            : currentStep === 2
            ? `Step 2 of 4: ${selectedCategory?.name || 'Service'} Options`
            : currentStep === 3
            ? 'Step 3 of 4: Choose Specialist'
            : 'Step 4 of 4: Schedule & Confirm'
        }
        onBackPress={() => {
          if (currentStep > 1) {
            setCurrentStep(currentStep - 1);
          } else {
            navigation.goBack();
          }
        }}
      />

      {currentStep === 1 ? (
        <FlatList
          data={categories}
          keyExtractor={(item) => item.id}
          numColumns={2}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.flatListContent}
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          windowSize={5}
          initialNumToRender={8}
          onEndReached={handleLoadMoreCategories}
          onEndReachedThreshold={0.4}
          refreshControl={
            <RefreshControl
              refreshing={refreshingCategories}
              onRefresh={handleRefreshCategories}
              colors={[colors.primary.main]}
              tintColor={colors.primary.main}
            />
          }
          ListHeaderComponent={
            <View>
              {/* Step Progress Bar */}
              <StepProgressBar
                currentStep={currentStep}
                onStepPress={(step) => {
                  if (step < currentStep) {
                    setCurrentStep(step);
                  }
                }}
              />

              {/* Error Banner */}
              {errorMessage && (
                <View style={styles.errorBanner}>
                  <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
                  <AppText variant="caption" style={styles.errorBannerText}>
                    {errorMessage}
                  </AppText>
                </View>
              )}

              <View style={styles.stepHeaderRow}>
                <View>
                  <AppText variant="headingMd" color="textPrimary">
                    Select Appliance
                  </AppText>
                  <AppText variant="bodySm" color="textSecondary">
                    Choose the appliance you need repaired or serviced
                  </AppText>
                </View>
              </View>

              {/* Search Input Bar */}
              <View style={styles.searchBarWrapper}>
                <AppIcon name="search-outline" size="sm" color={colors.text.muted} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search appliance (e.g. AC, TV, Laptop...)"
                  placeholderTextColor={colors.text.muted}
                  value={categorySearchQuery}
                  onChangeText={setCategorySearchQuery}
                />
                {categorySearchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setCategorySearchQuery('')} activeOpacity={0.7}>
                    <AppIcon name="close-circle" size="xs" color={colors.text.muted} />
                  </TouchableOpacity>
                )}
              </View>

              {loadingCategories && !refreshingCategories && (
                <View style={styles.loaderCenter}>
                  <ActivityIndicator size="large" color={colors.primary.main} />
                  <AppText variant="bodyMd" style={styles.loaderText}>
                    Loading appliance categories...
                  </AppText>
                </View>
              )}
            </View>
          }
          renderItem={({ item }) => (
            <CategoryCard
              category={item}
              isSelected={selectedCategory?.id === item.id}
              onSelect={handleSelectCategory}
            />
          )}
          ListEmptyComponent={
            !loadingCategories ? (
              <EmptyState
                iconName="search-outline"
                title="No Appliances Found"
                description={
                  categorySearchQuery
                    ? `No category matching "${categorySearchQuery}".`
                    : 'Please check back later or contact customer support.'
                }
              />
            ) : null
          }
          ListFooterComponent={
            loadingMoreCategories ? (
              <View style={styles.footerLoader}>
                <ActivityIndicator size="small" color={colors.primary.main} />
                <AppText variant="caption" style={styles.loadingMoreText}>
                  Loading more appliances...
                </AppText>
              </View>
            ) : null
          }
        />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Step Progress Bar */}
          <StepProgressBar
            currentStep={currentStep}
            onStepPress={(step) => {
              if (step < currentStep) {
                setCurrentStep(step);
              }
            }}
          />

          {/* Error Banner */}
          {errorMessage && (
            <View style={styles.errorBanner}>
              <AppIcon name="alert-circle-outline" size="sm" color={colors.status.danger} />
              <AppText variant="caption" style={styles.errorBannerText}>
                {errorMessage}
              </AppText>
            </View>
          )}

          {/* =========================================================================
              STEP 2: SERVICE TYPE SELECTION
             ========================================================================= */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
            {/* Selected Category Pill Header */}
            <View style={styles.selectedPillCard}>
              <View style={styles.pillIconWrap}>
                {selectedCategory?.image ? (
                  <Image
                    source={{ uri: resolveMediaUrl(selectedCategory.image)! }}
                    style={styles.pillThumbImg}
                    resizeMode="contain"
                  />
                ) : (
                  <AppIcon name="construct-outline" size="sm" color={colors.primary.main} />
                )}
              </View>
              <View style={styles.pillTextWrap}>
                <AppText variant="caption" color="textSecondary">Selected Category</AppText>
                <AppText variant="headingSm" color="textPrimary">{selectedCategory?.name}</AppText>
              </View>
              <TouchableOpacity
                onPress={() => setCurrentStep(1)}
                activeOpacity={0.7}
                style={styles.changePillBtn}
              >
                <AppText variant="caption" style={styles.changePillText}>Change</AppText>
              </TouchableOpacity>
            </View>

            <AppText variant="headingMd" color="textPrimary" style={styles.sectionHeader}>
              Available Services
            </AppText>
            <AppText variant="bodySm" color="textSecondary" style={styles.sectionSubtitle}>
              Select the service required for your {selectedCategory?.name}
            </AppText>

            {loadingServiceTypes ? (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                <AppText variant="bodyMd" style={styles.loaderText}>
                  Loading services...
                </AppText>
              </View>
            ) : serviceTypes.length === 0 ? (
              <EmptyState
                iconName="construct-outline"
                title="No Services Found"
                description="No specific services listed for this category. Contact support for assistance."
              />
            ) : (
              serviceTypes.map((st) => (
                <ServiceTypeCard
                  key={st.id}
                  serviceType={st}
                  isSelected={selectedServiceType?.id === st.id}
                  onSelect={handleSelectServiceType}
                />
              ))
            )}
          </View>
        )}

        {/* =========================================================================
            STEP 3: SPECIALIST DISCOVERY
           ========================================================================= */}
        {currentStep === 3 && (
          <View style={styles.stepContainer}>
            {/* Summary Strip */}
            <View style={styles.summaryStrip}>
              <View style={styles.summaryItem}>
                <AppText variant="caption" color="textSecondary">Appliance</AppText>
                <AppText variant="labelMd" color="textPrimary">{selectedCategory?.name}</AppText>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <AppText variant="caption" color="textSecondary">Service</AppText>
                <AppText variant="labelMd" color="textPrimary">{selectedServiceType?.name}</AppText>
              </View>
            </View>

            {/* Provider Mode Tabs */}
            <View style={styles.modeTabs}>
              <TouchableOpacity
                style={[
                  styles.modeTab,
                  specialistType === 'FREELANCER' && styles.modeTabActive,
                ]}
                onPress={() => handleSwitchSpecialistType('FREELANCER')}
                activeOpacity={0.8}
              >
                <AppIcon
                  name="person-outline"
                  size="sm"
                  color={specialistType === 'FREELANCER' ? colors.text.inverse : colors.text.primary}
                />
                <AppText
                  variant="labelMd"
                  style={[
                    styles.modeTabText,
                    specialistType === 'FREELANCER' && styles.modeTabTextActive,
                  ]}
                >
                  Freelance Specialists ({freelancers.length})
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.modeTab,
                  specialistType === 'SHOPKEEPER' && styles.modeTabActive,
                ]}
                onPress={() => handleSwitchSpecialistType('SHOPKEEPER')}
                activeOpacity={0.8}
              >
                <AppIcon
                  name="storefront-outline"
                  size="sm"
                  color={specialistType === 'SHOPKEEPER' ? colors.text.inverse : colors.text.primary}
                />
                <AppText
                  variant="labelMd"
                  style={[
                    styles.modeTabText,
                    specialistType === 'SHOPKEEPER' && styles.modeTabTextActive,
                  ]}
                >
                  Service Centers ({shops.length})
                </AppText>
              </TouchableOpacity>
            </View>

            {loadingSpecialists ? (
              <View style={styles.loaderCenter}>
                <ActivityIndicator size="large" color={colors.primary.main} />
                <AppText variant="bodyMd" style={styles.loaderText}>
                  Finding specialists near you...
                </AppText>
              </View>
            ) : specialistType === 'FREELANCER' ? (
              freelancers.length === 0 ? (
                <EmptyState
                  iconName="person-outline"
                  title="No Freelancers Available"
                  description="Try switching to Authorized Service Centers for this service."
                />
              ) : (
                freelancers.map((m) => (
                  <SpecialistCard
                    key={m.id}
                    specialist={m}
                    type="FREELANCER"
                    isSelected={selectedSpecialist?.id === m.id}
                    onSelect={handleSelectSpecialist}
                  />
                ))
              )
            ) : shops.length === 0 ? (
              <EmptyState
                iconName="storefront-outline"
                title="No Service Centers Found"
                description="Try selecting Freelance Specialists for direct booking."
              />
            ) : (
              shops.map((s) => (
                <SpecialistCard
                  key={s.id}
                  specialist={s}
                  type="SHOPKEEPER"
                  isSelected={selectedSpecialist?.id === s.id}
                  onSelect={handleSelectSpecialist}
                />
              ))
            )}

            {/* Next Step CTA */}
            {selectedSpecialist && (
              <Button
                title="Proceed to Schedule & Address"
                onPress={handleProceedToSchedule}
                variant="primary"
                size="large"
                style={styles.proceedButton}
              />
            )}
          </View>
        )}

        {/* =========================================================================
            STEP 4: SCHEDULE, ADDRESS & DESCRIPTION
           ========================================================================= */}
        {currentStep === 4 && (
          <View style={styles.stepContainer}>
            {/* Booking Summary Card */}
            <Card style={styles.summaryCard} padding="md" variant="elevated">
              <View style={styles.summaryCardHeader}>
                <AppText variant="headingSm" color="textPrimary">Booking Summary</AppText>
                <Badge label="Direct Booking" variant="primary" />
              </View>

              <View style={styles.summaryDetailRow}>
                <AppText variant="bodySm" color="textSecondary">Appliance:</AppText>
                <View style={styles.summaryApplianceWrap}>
                  {selectedCategory?.image && (
                    <Image
                      source={{ uri: resolveMediaUrl(selectedCategory.image)! }}
                      style={styles.summaryThumbImg}
                      resizeMode="contain"
                    />
                  )}
                  <AppText variant="labelMd" color="textPrimary">{selectedCategory?.name}</AppText>
                </View>
              </View>

              <View style={styles.summaryDetailRow}>
                <AppText variant="bodySm" color="textSecondary">Service Type:</AppText>
                <View style={styles.summaryApplianceWrap}>
                  {selectedServiceType?.image && (
                    <Image
                      source={{ uri: resolveMediaUrl(selectedServiceType.image)! }}
                      style={styles.summaryThumbImg}
                      resizeMode="contain"
                    />
                  )}
                  <AppText variant="labelMd" color="textPrimary">{selectedServiceType?.name}</AppText>
                </View>
              </View>

              <View style={styles.summaryDetailRow}>
                <AppText variant="bodySm" color="textSecondary">Specialist:</AppText>
                <AppText variant="labelMd" color="textPrimary">
                  {(selectedSpecialist as any)?.name || (selectedSpecialist as any)?.shopName}
                </AppText>
              </View>

              {selectedSpecialist?.offeredPrice !== undefined && (
                <View style={[styles.summaryDetailRow, styles.priceRow]}>
                  <AppText variant="labelMd" color="textPrimary">Inspection / Visit Fee:</AppText>
                  <AppText variant="headingSm" color="primary">₹{selectedSpecialist.offeredPrice}</AppText>
                </View>
              )}
            </Card>

            {/* 1. Date Selection Strip */}
            <AppText variant="headingSm" color="textPrimary" style={styles.sectionTitle}>
              Select Date
            </AppText>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStripContainer}
            >
              {quickDateStrip.map((item, index) => {
                const isSelected = isSameDay(item.date, selectedDate);
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => setSelectedDate(item.date)}
                    style={[styles.dateChip, isSelected && styles.dateChipSelected]}
                  >
                    <AppText
                      variant="caption"
                      style={[styles.dateChipSub, isSelected && styles.dateChipSubSelected]}
                    >
                      {item.sublabel}
                    </AppText>
                    <AppText
                      variant="labelMd"
                      style={[styles.dateChipLabel, isSelected && styles.dateChipLabelSelected]}
                    >
                      {item.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* 2. Time Slot Selection */}
            <AppText variant="headingSm" color="textPrimary" style={styles.sectionTitle}>
              Select Time Slot
            </AppText>
            <View style={styles.slotGrid}>
              {availableTimeSlots.map((slot, index) => {
                const isSelected = selectedTimeSlotIndex === index;
                return (
                  <TouchableOpacity
                    key={index}
                    activeOpacity={0.8}
                    onPress={() => setSelectedTimeSlotIndex(index)}
                    style={[styles.slotChip, isSelected && styles.slotChipSelected]}
                  >
                    <AppIcon
                      name="time-outline"
                      size="xs"
                      color={isSelected ? colors.text.inverse : colors.text.secondary}
                    />
                    <AppText
                      variant="caption"
                      style={[styles.slotLabel, isSelected && styles.slotLabelSelected]}
                    >
                      {slot.label}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            {/* 3. Service Address Card */}
            <AppText variant="headingSm" color="textPrimary" style={styles.sectionTitle}>
              Service Location
            </AppText>
            <Card style={styles.addressCard} padding="md" variant="outlined">
              <View style={styles.addressRow}>
                <View style={styles.addressIconWrap}>
                  <AppIcon name="location-outline" size="sm" color={colors.primary.main} />
                </View>
                <View style={styles.addressInfo}>
                  <AppText variant="labelMd" color="textPrimary">
                    {selectedAddress?.label || 'Home Address'}
                  </AppText>
                  <AppText variant="caption" color="textSecondary" numberOfLines={2}>
                    {[
                      selectedAddress?.houseNo,
                      selectedAddress?.street,
                      selectedAddress?.landmark,
                      selectedAddress?.cityName,
                      selectedAddress?.pinCode,
                    ]
                      .filter(Boolean)
                      .join(', ') || 'Primary registered service address'}
                  </AppText>
                </View>
                <TouchableOpacity
                  onPress={() => navigation.navigate('SavedAddressesScreen')}
                  activeOpacity={0.7}
                >
                  <AppText variant="caption" color="primary" style={styles.changeAddressText}>
                    Change
                  </AppText>
                </TouchableOpacity>
              </View>
            </Card>

            {/* 4. Problem Description */}
            <AppText variant="headingSm" color="textPrimary" style={styles.sectionTitle}>
              Describe Issue / Requirement
            </AppText>
            <View style={styles.inputCard}>
              <TextInput
                style={styles.textArea}
                multiline
                numberOfLines={4}
                maxLength={250}
                placeholder="e.g. AC is not cooling properly and making vibrating noise..."
                placeholderTextColor={colors.text.muted}
                value={description}
                onChangeText={setDescription}
              />
              <View style={styles.charCounterRow}>
                <AppText variant="caption" color="textSecondary">
                  {description.length}/250 characters
                </AppText>
              </View>
            </View>

            {/* Validation Error Banner */}
            {validationError && (
              <View style={styles.validationErrorBox}>
                <AppIcon name="alert-circle" size="xs" color={colors.status.danger} />
                <AppText variant="caption" style={styles.validationErrorText}>
                  {validationError}
                </AppText>
              </View>
            )}

            {/* Submit Button */}
            <Button
              title="Confirm & Book Service"
              onPress={handleSubmitBooking}
              variant="cta"
              size="large"
              loading={submitting}
              style={styles.submitButton}
            />
          </View>
        )}
      </ScrollView>
      )}
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background.default,
      paddingHorizontal: spacing.md,
    },
    scrollContent: {
      paddingBottom: 48,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: colors.status.dangerBg,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginBottom: spacing.md,
    },
    errorBannerText: {
      color: colors.status.danger,
      flex: 1,
    },
    stepContainer: {
      marginTop: spacing.xs,
    },
    stepHeaderRow: {
      marginBottom: spacing.md,
    },
    gridContent: {
      paddingBottom: spacing.sm,
    },
    loaderCenter: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.sm,
    },
    loaderText: {
      color: colors.text.secondary,
    },
    selectedPillCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      padding: spacing.sm + 2,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    pillIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    pillTextWrap: {
      flex: 1,
    },
    changePillBtn: {
      paddingHorizontal: spacing.sm,
      paddingVertical: 4,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
    },
    changePillText: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    sectionHeader: {
      marginBottom: 2,
    },
    sectionSubtitle: {
      marginBottom: spacing.md,
    },
    summaryStrip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      padding: spacing.sm,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    summaryItem: {
      flex: 1,
      paddingHorizontal: spacing.xs,
    },
    summaryDivider: {
      width: 1,
      height: 24,
      backgroundColor: colors.border.main,
    },
    modeTabs: {
      flexDirection: 'row',
      backgroundColor: colors.background.paper,
      borderRadius: radius.pill,
      padding: 4,
      marginBottom: spacing.md,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    modeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.pill,
      gap: 6,
    },
    modeTabActive: {
      backgroundColor: colors.primary.main,
    },
    modeTabText: {
      color: colors.text.secondary,
      fontSize: 12,
    },
    modeTabTextActive: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    proceedButton: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
    },
    summaryCard: {
      marginBottom: spacing.md,
    },
    summaryCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      paddingBottom: spacing.xs,
    },
    summaryDetailRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingVertical: 4,
    },
    priceRow: {
      borderTopWidth: 1,
      borderTopColor: colors.border.light,
      marginTop: spacing.xs,
      paddingTop: spacing.xs + 2,
    },
    sectionTitle: {
      marginTop: spacing.sm,
      marginBottom: spacing.xs + 2,
    },
    dateStripContainer: {
      gap: spacing.xs,
      paddingVertical: 4,
      marginBottom: spacing.sm,
    },
    dateChip: {
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.background.paper,
      borderWidth: 1.5,
      borderColor: colors.border.light,
      alignItems: 'center',
      minWidth: 72,
    },
    dateChipSelected: {
      borderColor: colors.primary.main,
      backgroundColor: colors.primary.main,
    },
    dateChipSub: {
      fontSize: 11,
      color: colors.text.muted,
      marginBottom: 2,
    },
    dateChipSubSelected: {
      color: colors.text.inverse,
    },
    dateChipLabel: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    dateChipLabelSelected: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    slotGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.xs,
      marginBottom: spacing.sm,
    },
    slotChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingVertical: spacing.xs + 2,
      paddingHorizontal: spacing.sm + 4,
      borderRadius: radius.pill,
      backgroundColor: colors.background.paper,
      borderWidth: 1.5,
      borderColor: colors.border.light,
    },
    slotChipSelected: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    slotLabel: {
      fontSize: 12,
      fontWeight: '600',
      color: colors.text.primary,
    },
    slotLabelSelected: {
      color: colors.text.inverse,
      fontWeight: '700',
    },
    addressCard: {
      marginBottom: spacing.sm,
    },
    addressRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    addressIconWrap: {
      width: 36,
      height: 36,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    addressInfo: {
      flex: 1,
      marginRight: spacing.xs,
    },
    changeAddressText: {
      fontWeight: '700',
    },
    inputCard: {
      backgroundColor: colors.background.paper,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border.main,
      padding: spacing.sm,
      marginBottom: spacing.sm,
    },
    textArea: {
      fontSize: 14,
      color: colors.text.primary,
      minHeight: 80,
      textAlignVertical: 'top',
      padding: 0,
    },
    charCounterRow: {
      alignItems: 'flex-end',
      marginTop: 4,
    },
    validationErrorBox: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      backgroundColor: colors.status.dangerBg,
      padding: spacing.xs + 2,
      borderRadius: radius.xs,
      marginBottom: spacing.sm,
    },
    validationErrorText: {
      color: colors.status.danger,
      fontSize: 12,
    },
    submitButton: {
      marginTop: spacing.md,
      borderRadius: radius.lg,
    },
    searchBarWrapper: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border.main,
      paddingHorizontal: spacing.sm + 4,
      height: 44,
      marginBottom: spacing.md,
      gap: spacing.xs,
    },
    searchInput: {
      flex: 1,
      fontSize: 14,
      color: colors.text.primary,
      paddingVertical: 0,
    },
    pillThumbImg: {
      width: 28,
      height: 28,
      borderRadius: 4,
    },
    summaryApplianceWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    summaryThumbImg: {
      width: 22,
      height: 22,
      borderRadius: 4,
    },
    flatListContent: {
      paddingBottom: 48,
    },
    footerLoader: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md,
      gap: 4,
    },
    loadingMoreText: {
      color: colors.text.secondary,
      fontSize: 11,
    },
  });
