/**
 * @file BookServiceScreen.tsx
 * @feature Bookings / Screens
 * @responsibility Dynamic Service Booking screen with fully scrollable form UI adhering strictly to
 *                 DESIGN_SYSTEM.md form layout standard. ScreenWrapper scrollable & keyboardAvoiding containers
 *                 allow continuous smooth scrolling of header, dropdowns, calendar, input box, and submit CTA button
 *                 when the soft keyboard is open.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { ScreenWrapper } from '@shared/components/organisms/ScreenWrapper';
import { Button } from '@shared/components/atoms/Button';
import { Header } from '@shared/components/molecules/Header';
import { Card } from '@shared/components/atoms/Card';
import { Badge } from '@shared/components/atoms/Badge';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Select, SelectOption } from '@shared/components/molecules/Select';
import { spacing, radius, shadows, useTheme } from '@theme/index';
import { bookingApi } from '@infrastructure/api/bookingApi';
import { productApi } from '@infrastructure/api/productApi';
import { customerApi, CustomerAddress } from '@infrastructure/api/customerApi';
import { CustomerProduct, AvailableShop, AvailableMechanic } from '@core/types/api';

interface ComplaintTypeItem {
  id: string;
  label: string;
  serviceTypeId?: string;
}

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

export const BookServiceScreen = ({ navigation, route }: any) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Mode state: SHOPKEEPER or FREELANCER
  const [bookingMode, setBookingMode] = useState<'SHOPKEEPER' | 'FREELANCER'>('SHOPKEEPER');
  
  // Data list states
  const [products, setProducts] = useState<CustomerProduct[]>([]);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [shops, setShops] = useState<AvailableShop[]>([]);
  const [freelancers, setFreelancers] = useState<AvailableMechanic[]>([]);
  const [complaintTypes, setComplaintTypes] = useState<ComplaintTypeItem[]>([]);
  const [serviceTypes, setServiceTypes] = useState<Array<{ id: string; name: string; description?: string; image?: string; categoryId?: string; active?: boolean }>>([]);

  // Selected IDs
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [selectedAddressId, setSelectedAddressId] = useState<string>('');
  const [selectedShopId, setSelectedShopId] = useState<string>('');
  const [selectedFreelancerId, setSelectedFreelancerId] = useState<string>('');
  const [selectedComplaintId, setSelectedComplaintId] = useState<string>('');
  const [selectedServiceTypeId, setSelectedServiceTypeId] = useState<string>('');

  // Calendar & Date states
  const [selectedDate, setSelectedDate] = useState<Date>(today);
  const [currentMonthView, setCurrentMonthView] = useState<Date>(new Date(today.getFullYear(), today.getMonth(), 1));
  const [selectedTimeSlotIndex, setSelectedTimeSlotIndex] = useState<number>(0);
  const [showFullCalendarModal, setShowFullCalendarModal] = useState<boolean>(false);

  // Form states
  const [description, setDescription] = useState<string>('');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [validationError, setValidationError] = useState<string | null>(null);

  // Initial Data Fetching
  useEffect(() => {
    let isMounted = true;
    const fetchAllData = async () => {
      try {
        setLoadingData(true);
        const [prodRes, shopRes, compRes, servRes, addrRes] = await Promise.allSettled([
          productApi.getMyProducts(),
          bookingApi.getAvailableShops(),
          bookingApi.getComplaintTypes(),
          bookingApi.getServiceTypes(),
          customerApi.getAddresses(),
        ]);

        if (!isMounted) return;

        let initialCategoryId: string | undefined;
        let initialServiceTypeId: string | undefined;
        let initialAddress: CustomerAddress | undefined;

        // Addresses
        if (addrRes.status === 'fulfilled' && addrRes.value?.success && Array.isArray(addrRes.value.data) && addrRes.value.data.length > 0) {
          const addrList = addrRes.value.data;
          setAddresses(addrList);
          initialAddress = addrList.find((a) => a.isDefault) || addrList[0];
          if (initialAddress?.id) {
            setSelectedAddressId(initialAddress.id);
          }
        }

        // Products
        if (prodRes.status === 'fulfilled' && prodRes.value?.success && Array.isArray(prodRes.value.data) && prodRes.value.data.length > 0) {
          const productList = prodRes.value.data;
          setProducts(productList);
          const initialProd = route?.params?.product
            ? (productList.find((p: any) => p.id === route.params.product.id) || productList[0])
            : route?.params?.productId
            ? (productList.find((p: any) => p.id === route.params.productId) || productList[0])
            : productList[0];
          setSelectedProductId(initialProd.id);
          initialCategoryId = initialProd.categoryId;
        }

        // Shops
        if (shopRes.status === 'fulfilled' && shopRes.value?.success && Array.isArray(shopRes.value.data) && shopRes.value.data.length > 0) {
          setShops(shopRes.value.data);
          setSelectedShopId(shopRes.value.data[0].id);
        }

        // Complaint Types
        if (compRes.status === 'fulfilled' && compRes.value?.success && Array.isArray(compRes.value.data) && compRes.value.data.length > 0) {
          setComplaintTypes(compRes.value.data);
        }

        // Service Types
        let loadedServiceTypes: Array<{ id: string; name: string; categoryId?: string }> = [];
        if (servRes.status === 'fulfilled' && servRes.value?.success && Array.isArray(servRes.value.data)) {
          loadedServiceTypes = servRes.value.data;
          setServiceTypes(loadedServiceTypes);
          if (!initialServiceTypeId) {
            const matchingSt = initialCategoryId
              ? loadedServiceTypes.find((st) => st.categoryId === initialCategoryId)
              : loadedServiceTypes[0];
            if (matchingSt) {
              setSelectedServiceTypeId(matchingSt.id);
              initialServiceTypeId = matchingSt.id;
            }
          }
        }

        // Available Freelancers with categoryId, serviceTypeId & initial address coordinates
        if (initialCategoryId || initialServiceTypeId) {
          const freeRes = await bookingApi.getAvailableFreelancers({
            categoryId: initialCategoryId,
            serviceTypeId: initialServiceTypeId,
            latitude: initialAddress?.latitude,
            longitude: initialAddress?.longitude,
          });
          if (isMounted && freeRes?.success && Array.isArray(freeRes.data) && freeRes.data.length > 0) {
            setFreelancers(freeRes.data);
            setSelectedFreelancerId(freeRes.data[0].id);
          }
        }
      } catch (err) {
        console.error('Error fetching service metadata:', err);
      } finally {
        if (isMounted) setLoadingData(false);
      }
    };

    fetchAllData();
    return () => {
      isMounted = false;
    };
  }, []);

  // Derived Active Product, Complaint & Selected Address
  const selectedProduct = useMemo(() => products.find((p) => p.id === selectedProductId), [products, selectedProductId]);
  const selectedComplaint = useMemo(() => complaintTypes.find((c) => c.id === selectedComplaintId), [complaintTypes, selectedComplaintId]);
  const selectedAddress = useMemo(() => addresses.find((a) => a.id === selectedAddressId), [addresses, selectedAddressId]);

  // 1. Refetch Service Types when selected product / category changes
  useEffect(() => {
    let isSubscribed = true;
    const categoryId = selectedProduct?.categoryId;

    if (categoryId) {
      bookingApi.getServiceTypes({ categoryId })
        .then((servRes) => {
          if (isSubscribed && servRes?.success && Array.isArray(servRes.data) && servRes.data.length > 0) {
            setServiceTypes(servRes.data);
            setSelectedServiceTypeId((prev) => {
              const exists = servRes.data.some((st) => st.id === prev);
              return exists ? prev : servRes.data[0].id;
            });
          }
        })
        .catch(() => {});
    }

    return () => {
      isSubscribed = false;
    };
  }, [selectedProduct?.categoryId, selectedProductId]);

  // 2. Refetch Freelancers dynamically according to categoryId, selected serviceTypeId & selected address coordinates
  useEffect(() => {
    let isSubscribed = true;
    const categoryId = selectedProduct?.categoryId;
    const serviceTypeId = selectedServiceTypeId;

    if (!categoryId && !serviceTypeId) return;

    bookingApi.getAvailableFreelancers({
      categoryId: categoryId || undefined,
      serviceTypeId: serviceTypeId || undefined,
      cityId: selectedAddress?.cityId || undefined,
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
    })
      .then((freeRes) => {
        if (isSubscribed && freeRes?.success && Array.isArray(freeRes.data)) {
          setFreelancers(freeRes.data);
          if (freeRes.data.length > 0) {
            setSelectedFreelancerId((prev) => {
              const exists = freeRes.data.some((f) => f.id === prev);
              return exists ? prev : freeRes.data[0].id;
            });
          } else {
            setSelectedFreelancerId('');
          }
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [
    selectedProduct?.categoryId,
    selectedServiceTypeId,
    selectedAddressId,
    selectedAddress?.latitude,
    selectedAddress?.longitude,
    selectedAddress?.cityId,
  ]);

  // 3. Refetch Shops dynamically according to categoryId, selected serviceTypeId & selected address coordinates
  useEffect(() => {
    let isSubscribed = true;
    const categoryId = selectedProduct?.categoryId;
    const serviceTypeId = selectedServiceTypeId;
    const saleItemId = selectedProductId || selectedProduct?.id;

    bookingApi.getAvailableShops({
      categoryId: categoryId || undefined,
      serviceTypeId: serviceTypeId || undefined,
      saleItemId: saleItemId || undefined,
      cityId: selectedAddress?.cityId || undefined,
      latitude: selectedAddress?.latitude,
      longitude: selectedAddress?.longitude,
    })
      .then((shopRes) => {
        if (isSubscribed && shopRes?.success && Array.isArray(shopRes.data)) {
          setShops(shopRes.data);
          if (shopRes.data.length > 0) {
            setSelectedShopId((prev) => {
              const exists = shopRes.data.some((s) => s.id === prev);
              return exists ? prev : shopRes.data[0].id;
            });
          } else {
            setSelectedShopId('');
          }
        }
      })
      .catch(() => {});

    return () => {
      isSubscribed = false;
    };
  }, [
    selectedProduct?.categoryId,
    selectedServiceTypeId,
    selectedProductId,
    selectedAddressId,
    selectedAddress?.latitude,
    selectedAddress?.longitude,
    selectedAddress?.cityId,
  ]);

  // Warranty Check Logic
  const isUnderWarranty = useMemo(() => {
    if (!selectedProduct) return false;
    return Boolean(
      selectedProduct.warranty?.active ||
      selectedProduct.status === 'ACTIVE' ||
      (selectedProduct.warrantyExpiryDate && new Date(selectedProduct.warrantyExpiryDate) > new Date())
    );
  }, [selectedProduct]);

  // Architectural Enforcement: If product is under active warranty, lock mode to SHOPKEEPER & match selling shopkeeper
  useEffect(() => {
    if (isUnderWarranty) {
      setBookingMode('SHOPKEEPER');
      if (selectedProduct?.shopkeeperName && shops.length > 0) {
        const matchingShop = shops.find((s) => s.shopName.toLowerCase().includes(selectedProduct.shopkeeperName!.toLowerCase()));
        if (matchingShop) {
          setSelectedShopId(matchingShop.id);
        }
      }
    }
  }, [isUnderWarranty, selectedProduct, shops]);

  // Derived Provider Objects
  const selectedShop = useMemo(() => shops.find((s) => s.id === selectedShopId), [shops, selectedShopId]);
  const selectedFreelancer = useMemo(() => freelancers.find((f) => f.id === selectedFreelancerId), [freelancers, selectedFreelancerId]);

  const agreedPrice = useMemo(() => {
    if (isUnderWarranty) return 0;
    if (bookingMode === 'SHOPKEEPER') {
      return selectedShop?.offeredPrice;
    }
    return selectedFreelancer?.offeredPrice;
  }, [isUnderWarranty, bookingMode, selectedShop, selectedFreelancer]);

  // Handle Tab Switching with Warranty Protection Guard
  const handleSelectMode = (mode: 'SHOPKEEPER' | 'FREELANCER') => {
    if (mode === 'FREELANCER' && isUnderWarranty) {
      Alert.alert(
        'Warranty Routing Rule 🛡️',
        'Appliances under active warranty must be serviced by their authorized selling shopkeeper to claim free ₹0 warranty coverage and original spare parts.'
      );
      return;
    }
    setBookingMode(mode);
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

  // Available Time Slots for Selected Date (filters past times if date is Today)
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

  const productOptions: SelectOption[] = useMemo(() => {
    return products.map((p) => {
      const brand = (p.brandName || p.brand || '').trim();
      const modelOrName = (p.productName || p.modelNumber || '').trim();
      const category = (p.categoryName || '').trim();
      const qr = (p.qrCode || '').trim();

      const displayTitle =
        [brand, modelOrName].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i).join(' ') ||
        modelOrName ||
        p.id;

      const subDetails = [
        category ? `Category: ${category}` : null,
        qr ? `QR: ${qr}` : null,
      ].filter(Boolean).join(' • ');

      return {
        label: displayTitle,
        value: p.id,
        sublabel: subDetails || undefined,
        icon: 'cube-outline',
      };
    });
  }, [products]);

  const addressOptions: SelectOption[] = useMemo(() => {
    return addresses.map((addr) => {
      const type = (addr.addressType || 'HOME').toUpperCase();
      const typeIcon =
        type === 'WORK'
          ? 'briefcase-outline'
          : type === 'OFFICE'
          ? 'business-outline'
          : type === 'OTHER'
          ? 'location-outline'
          : 'home-outline';

      const title = addr.label ? `${addr.label} (${type})` : `${type} Address`;
      const isDef = addr.isDefault ? ' • Default ⭐' : '';

      const detailComponents = [
        addr.houseNo,
        addr.street,
        addr.landmark ? `Near ${addr.landmark}` : null,
        addr.cityName || addr.cityId,
        addr.pinCode ? `PIN: ${addr.pinCode}` : null,
      ].filter(Boolean);

      const addressDetails =
        detailComponents.length > 0
          ? detailComponents.join(', ')
          : addr.address || 'Saved delivery location';

      return {
        label: `${title}${isDef}`,
        value: addr.id || '',
        sublabel: addressDetails,
        icon: typeIcon,
      };
    });
  }, [addresses]);

  const shopOptions: SelectOption[] = useMemo(() => {
    return shops.map((s) => {
      const distText = s.distanceKm !== undefined ? ` • 📍 ${s.distanceKm} km` : '';
      return {
        label: s.shopName,
        value: s.id,
        sublabel: isUnderWarranty
          ? `Authorized Selling Shopkeeper • ₹0 (Warranty Claim)${distText}`
          : s.offeredPrice !== undefined
          ? `Standard Visit Fee: ₹${s.offeredPrice}${distText}`
          : undefined,
        icon: 'storefront-outline',
      };
    });
  }, [shops, isUnderWarranty]);

  const freelancerOptions: SelectOption[] = useMemo(() => {
    return freelancers.map((f) => {
      const ratingLabel = f.rating !== undefined && f.rating > 0 ? `⭐ ${f.rating}` : '⭐ New';
      const specText = f.specialization ? f.specialization : 'Freelance Specialist';
      const priceText = f.offeredPrice !== undefined ? ` • Visit Fee: ₹${f.offeredPrice}` : '';
      const distText = f.distanceKm !== undefined ? ` • 📍 ${f.distanceKm} km away` : '';

      return {
        label: `${f.name} (${ratingLabel})`,
        value: f.id,
        sublabel: `${specText}${priceText}${distText}`,
        icon: 'person-outline',
      };
    });
  }, [freelancers]);

  const serviceTypeOptions: SelectOption[] = useMemo(() => {
    return serviceTypes.map((st) => ({
      label: st.name,
      value: st.id,
      sublabel: st.description || undefined,
      icon: 'construct-outline',
    }));
  }, [serviceTypes]);



  // Month Navigation Handlers
  const handlePrevMonth = () => {
    const prevMonth = new Date(currentMonthView.getFullYear(), currentMonthView.getMonth() - 1, 1);
    if (prevMonth.getFullYear() < today.getFullYear() || (prevMonth.getFullYear() === today.getFullYear() && prevMonth.getMonth() < today.getMonth())) {
      return;
    }
    setCurrentMonthView(prevMonth);
  };

  const handleNextMonth = () => {
    const nextMonth = new Date(currentMonthView.getFullYear(), currentMonthView.getMonth() + 1, 1);
    setCurrentMonthView(nextMonth);
  };

  // Full Month Days Grid
  const monthGridDays = useMemo(() => {
    const year = currentMonthView.getFullYear();
    const month = currentMonthView.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysList: Array<{
      date: Date;
      dayNum: number;
      isCurrentMonth: boolean;
      isPast: boolean;
      isToday: boolean;
      isSelected: boolean;
    }> = [];

    const startDayOfWeek = firstDay.getDay();
    const prevMonthLastDate = new Date(year, month, 0).getDate();
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, prevMonthLastDate - i);
      d.setHours(0, 0, 0, 0);
      daysList.push({
        date: d,
        dayNum: d.getDate(),
        isCurrentMonth: false,
        isPast: d < today,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selectedDate.getTime(),
      });
    }

    for (let i = 1; i <= lastDay.getDate(); i++) {
      const d = new Date(year, month, i);
      d.setHours(0, 0, 0, 0);
      daysList.push({
        date: d,
        dayNum: i,
        isCurrentMonth: true,
        isPast: d < today,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selectedDate.getTime(),
      });
    }

    const remaining = (7 - (daysList.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      d.setHours(0, 0, 0, 0);
      daysList.push({
        date: d,
        dayNum: i,
        isCurrentMonth: false,
        isPast: d < today,
        isToday: d.getTime() === today.getTime(),
        isSelected: d.getTime() === selectedDate.getTime(),
      });
    }

    return daysList;
  }, [currentMonthView, today, selectedDate]);

  // Submit Handler
  const handleSubmit = async () => {
    setValidationError(null);

    if (!description.trim()) {
      setValidationError('Please describe the service issue or requirement.');
      return;
    }

    if (description.trim().length < 10) {
      setValidationError('Description must be at least 10 characters long.');
      return;
    }

    if (description.length > 250) {
      setValidationError('Description cannot exceed 250 characters.');
      return;
    }

    const chosenSlot = availableTimeSlots[selectedTimeSlotIndex] || BASE_TIME_SLOTS[0];
    const scheduledDateTime = new Date(selectedDate);
    scheduledDateTime.setHours(chosenSlot.hours, chosenSlot.minutes, 0, 0);
    const scheduledIso = scheduledDateTime.toISOString();

    setSubmitting(true);
    try {
      const saleItemId = selectedProductId || selectedProduct?.id;
      let res;

      const categoryId = selectedProduct?.categoryId;
      let effectiveServiceTypeId = selectedComplaint?.serviceTypeId || selectedServiceTypeId;
      if (!effectiveServiceTypeId && categoryId && serviceTypes.length > 0) {
        const matchingSt = serviceTypes.find((st) => st.categoryId === categoryId);
        if (matchingSt) {
          effectiveServiceTypeId = matchingSt.id;
        }
      }
      if (!effectiveServiceTypeId && serviceTypes.length > 0) {
        effectiveServiceTypeId = serviceTypes[0].id;
      }

      if (bookingMode === 'FREELANCER') {
        res = await bookingApi.bookDirectFreelancer({
          mechanicId: selectedFreelancerId || selectedFreelancer?.id || '',
          serviceTypeId: effectiveServiceTypeId || '',
          complaintTypeId: selectedComplaintId || undefined,
          description: description.trim(),
          scheduledAt: scheduledIso,
          saleItemId: saleItemId || undefined,
          categoryId: categoryId || undefined,
          preferredTimeSlot: chosenSlot.label,
        });
      } else {
        const validShopkeeperId = selectedShopId || selectedShop?.id;
        res = await bookingApi.createBooking({
          shopkeeperId: validShopkeeperId || '',
          serviceTypeId: effectiveServiceTypeId || undefined,
          complaintTypeId: selectedComplaintId || undefined,
          saleItemId: saleItemId || undefined,
          description: description.trim(),
          agreedPrice: agreedPrice ?? 0,
          scheduledAt: scheduledIso,
        });
      }

      if (res?.success || res?.data) {
        Alert.alert(
          'Service Booking Created! 🛠️',
          isUnderWarranty
            ? `Your warranty claim visit has been scheduled for ${selectedDate.toDateString()} at ${chosenSlot.label}. Fee is ₹0.`
            : bookingMode === 'FREELANCER'
            ? `Direct freelancer booking request submitted for ${selectedDate.toDateString()} at ${chosenSlot.label}. Awaiting freelancer acceptance.`
            : `Your service visit is scheduled for ${selectedDate.toDateString()} at ${chosenSlot.label}.`,
          [
            {
              text: 'View My Services',
              onPress: () => navigation.navigate('MainTab', { screen: 'BookingsScreenTab' }),
            },
          ]
        );
      } else {
        const errMsg = res?.error?.message || 'Failed to submit service booking request';
        if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('conflict') || errMsg.toLowerCase().includes('double') || errMsg.toLowerCase().includes('busy')) {
          Alert.alert(
            'Schedule Conflict ⚠️',
            'This freelancer already has an active job scheduled within +/- 2 hours of this slot. Please choose another time slot or freelancer.'
          );
        } else {
          Alert.alert('Booking Error', errMsg);
        }
      }
    } catch (err: any) {
      const errMsg = err?.error?.message || err?.message || '';
      if (errMsg.toLowerCase().includes('already') || errMsg.toLowerCase().includes('conflict') || errMsg.toLowerCase().includes('double') || errMsg.toLowerCase().includes('busy')) {
        Alert.alert(
          'Schedule Conflict ⚠️',
          'This freelancer already has an active job scheduled within +/- 2 hours of this slot. Please choose another time slot or freelancer.'
        );
      } else {
        Alert.alert('Booking Failed', errMsg || 'Unable to connect to service platform');
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ScreenWrapper style={styles.container} keyboardAvoiding>
      <Header
        title="Book a Service"
        subtitle="Schedule authorized shopkeeper or freelancer visit"
        onBackPress={() => navigation.goBack()}
      />

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* External Appliance Service Banner */}
        <TouchableOpacity
          style={styles.externalPromoBanner}
          activeOpacity={0.8}
          onPress={() => navigation.navigate('ExternalProductBookingScreen')}
        >
          <View style={styles.externalPromoIconWrap}>
            <AppIcon name="grid-outline" size="sm" color={colors.primary.main} />
          </View>
          <View style={styles.externalPromoTextWrap}>
            <AppText variant="labelMd" color="textPrimary">
              Booking for an unlisted appliance?
            </AppText>
            <AppText variant="caption" color="primary" style={styles.externalPromoLink}>
              Book by Appliance Category (4-step flow) →
            </AppText>
          </View>
        </TouchableOpacity>

        {/* Provider Switch Mode Tabs (Design System Standard Segmented Layout) */}
        <View style={styles.modeSwitchContainer}>
        <TouchableOpacity
          style={[styles.modeTab, bookingMode === 'SHOPKEEPER' && styles.activeModeTab]}
          onPress={() => handleSelectMode('SHOPKEEPER')}
          activeOpacity={0.8}
        >
          <AppIcon
            name="storefront-outline"
            size="sm"
            color={bookingMode === 'SHOPKEEPER' ? colors.text.inverse : colors.text.primary}
          />
          <AppText
            variant="labelMd"
            numberOfLines={1}
            style={bookingMode === 'SHOPKEEPER' ? styles.shopkeeperModeTextActive : styles.shopkeeperModeText}
          >
            Shopkeeper
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.modeTab,
            bookingMode === 'FREELANCER' && styles.activeModeTab,
            isUnderWarranty && styles.disabledModeTab,
          ]}
          onPress={() => handleSelectMode('FREELANCER')}
          activeOpacity={0.8}
        >
          <AppIcon
            name={isUnderWarranty ? 'lock-closed-outline' : 'person-outline'}
            size="sm"
            color={isUnderWarranty ? colors.text.muted : bookingMode === 'FREELANCER' ? colors.text.inverse : colors.text.primary}
          />
          <AppText
            variant="labelMd"
            numberOfLines={1}
            style={isUnderWarranty ? styles.freelancerModeTextDisabled : bookingMode === 'FREELANCER' ? styles.freelancerModeTextActive : styles.freelancerModeText}
          >
            {isUnderWarranty ? 'Freelancer 🔒' : 'Direct Freelancer'}
          </AppText>
        </TouchableOpacity>
      </View>

      <Card style={styles.formCard} padding="lg">
        {loadingData ? (
          <View style={styles.loaderBox}>
            <ActivityIndicator size="small" color={colors.primary.main} />
            <AppText variant="bodySm" color="textSecondary" style={styles.loadingText}>
              Loading live products & service providers...
            </AppText>
          </View>
        ) : (
          <>
            {/* 1. Registered Product Dropdown */}
            <Select
              label="Registered Appliance / Product *"
              placeholder="Select registered appliance"
              value={selectedProductId}
              options={productOptions}
              onSelect={(opt) => setSelectedProductId(opt.value)}
              leftIcon={<AppIcon name="cube-outline" size="sm" color={colors.primary.main} />}
              searchable
              searchPlaceholder="Search registered products..."
            />

            {/* Warranty Status Banner */}
            {isUnderWarranty ? (
              <View style={styles.warrantyBadgeCard}>
                <View style={styles.warrantyIconCircle}>
                  <AppIcon name="shield-checkmark" size="sm" color={colors.category.emeraldIcon} />
                </View>
                <View style={styles.flex1}>
                  <AppText variant="labelMd" color="textPrimary" style={styles.boldText}>
                    Active Warranty Claim (Free Service)
                  </AppText>
                  <AppText variant="caption" color="textSecondary">
                    Visit & Labor Fee: ₹0 • Mandatory routing to original selling dealer per warranty policy.
                  </AppText>
                </View>
                <Badge label="₹0 FREE" variant="success" />
              </View>
            ) : (
              <View style={styles.outOfWarrantyBanner}>
                <AppIcon name="alert-circle-outline" size="xs" color={colors.status.warning} />
                <AppText variant="caption" color="textSecondary" style={styles.flexMl6}>
                  Out of Warranty Booking: Standard visit charge applies (₹{agreedPrice}).
                </AppText>
              </View>
            )}

            {/* 2. Service Delivery Address Dropdown */}
            {addresses.length > 0 ? (
              <View style={styles.marginTopMd}>
                <Select
                  label="Service Delivery Address *"
                  placeholder="Select service delivery address"
                  value={selectedAddressId}
                  options={addressOptions}
                  onSelect={(opt) => setSelectedAddressId(opt.value)}
                  leftIcon={<AppIcon name="location-outline" size="sm" color={colors.primary.main} />}
                  searchable
                  searchPlaceholder="Search saved addresses..."
                />
                <TouchableOpacity
                  style={styles.manageAddressRow}
                  onPress={() => navigation.navigate('SavedAddressesScreen')}
                  activeOpacity={0.7}
                >
                  <AppIcon name="add-circle-outline" size="xs" color={colors.primary.main} />
                  <AppText variant="caption" color="primary" style={styles.manageAddressText}>
                    Add / Manage Saved Addresses
                  </AppText>
                </TouchableOpacity>
              </View>
            ) : (
              <Card style={styles.noAddressCard} padding="md" variant="outlined">
                <View style={styles.noAddressRow}>
                  <AppIcon name="location-outline" size="sm" color={colors.status.warning} />
                  <View style={styles.flex1Ml8}>
                    <AppText variant="labelMd" color="textPrimary">No Saved Address Found</AppText>
                    <AppText variant="caption" color="textSecondary">
                      Please add a service address to discover nearby mechanics.
                    </AppText>
                  </View>
                  <TouchableOpacity
                    onPress={() => navigation.navigate('SavedAddressesScreen')}
                    activeOpacity={0.7}
                  >
                    <AppText variant="caption" color="primary" style={styles.boldText}>
                      + Add
                    </AppText>
                  </TouchableOpacity>
                </View>
              </Card>
            )}

            {/* 3. Provider Dropdown (Shopkeeper or Freelancer) */}
            {bookingMode === 'SHOPKEEPER' ? (
              <Select
                label={isUnderWarranty ? "Authorized Selling Shopkeeper (Locked by Warranty Policy) *" : "Service Provider Shopkeeper *"}
                placeholder="Select authorized shopkeeper"
                value={selectedShopId}
                options={shopOptions}
                onSelect={(opt) => setSelectedShopId(opt.value)}
                disabled={isUnderWarranty}
                leftIcon={<AppIcon name="storefront-outline" size="sm" color={colors.category.indigoIcon} />}
                searchable
                searchPlaceholder="Search shopkeepers..."
                style={styles.marginTopMd}
              />
            ) : (
              <>
                <Select
                  label="Direct Freelance Mechanic *"
                  placeholder="Select freelance mechanic"
                  value={selectedFreelancerId}
                  options={freelancerOptions}
                  onSelect={(opt) => setSelectedFreelancerId(opt.value)}
                  leftIcon={<AppIcon name="person-outline" size="sm" color={colors.category.orangeIcon} />}
                  searchable
                  searchPlaceholder="Search certified mechanics..."
                  style={styles.marginTopMd}
                />
                {freelancers.length === 0 && (
                  <View style={styles.outOfWarrantyBanner}>
                    <AppIcon name="info-outline" size="xs" color={colors.status.warning} />
                    <AppText variant="caption" color="textSecondary" style={styles.flexMl6}>
                      No direct freelancers registered for this category currently. Try selecting another service or Shopkeeper mode.
                    </AppText>
                  </View>
                )}
              </>
            )}


            {/* 3. Service Type Dropdown */}
            {serviceTypes.length > 0 && (
              <Select
                label="Select Service Type *"
                placeholder="Choose required service"
                value={selectedServiceTypeId}
                options={serviceTypeOptions}
                onSelect={(opt) => setSelectedServiceTypeId(opt.value)}
                leftIcon={<AppIcon name="construct-outline" size="sm" color={colors.category.orangeIcon} />}
                searchable
                searchPlaceholder="Search service types..."
                style={styles.marginTopMd}
              />
            )}

            {/* 4. Interactive Date Calendar & Time Slots */}
            <View style={styles.sectionHeaderRow}>
              <AppText variant="labelLg" color="textPrimary" style={styles.sectionLabel}>
                Select Appointment Date *
              </AppText>
              <TouchableOpacity
                onPress={() => setShowFullCalendarModal(!showFullCalendarModal)}
                activeOpacity={0.7}
              >
                <AppText variant="labelSm" color="primary" style={styles.boldText}>
                  {showFullCalendarModal ? 'Hide Month Grid' : '📅 Month View'}
                </AppText>
              </TouchableOpacity>
            </View>

            {/* Horizontal Date Selection Strip */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.dateStripContainer}
            >
              {quickDateStrip.map((item, idx) => {
                const isSelected = isSameDay(item.date, selectedDate);
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[styles.dateChip, isSelected && styles.selectedDateChip]}
                    onPress={() => {
                      setSelectedDate(item.date);
                      setSelectedTimeSlotIndex(0);
                    }}
                    activeOpacity={0.75}
                  >
                    <AppText
                      variant="caption"
                      style={isSelected ? styles.dateSublabelSelected : styles.dateSublabel}
                    >
                      {item.sublabel}
                    </AppText>
                    <AppText
                      variant="labelMd"
                      style={isSelected ? styles.dateNumSelected : styles.dateNum}
                    >
                      {item.date.getDate()}
                    </AppText>
                    <AppText
                      variant="caption"
                      style={isSelected ? styles.dateMonthSelected : styles.dateMonth}
                    >
                      {MONTH_NAMES[item.date.getMonth()].slice(0, 3)}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Expandable Month Calendar Grid */}
            {showFullCalendarModal && (
              <View style={styles.calendarCard}>
                {/* Calendar Header with Month Navigation */}
                <View style={styles.calendarMonthHeader}>
                  <TouchableOpacity
                    onPress={handlePrevMonth}
                    style={styles.monthNavBtn}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="chevron-back" size="sm" color={colors.text.primary} />
                  </TouchableOpacity>

                  <AppText variant="headingSm" color="textPrimary" style={styles.boldText}>
                    {MONTH_NAMES[currentMonthView.getMonth()]} {currentMonthView.getFullYear()}
                  </AppText>

                  <TouchableOpacity
                    onPress={handleNextMonth}
                    style={styles.monthNavBtn}
                    activeOpacity={0.7}
                  >
                    <AppIcon name="chevron-forward" size="sm" color={colors.text.primary} />
                  </TouchableOpacity>
                </View>

                {/* Weekday Names */}
                <View style={styles.weekdaysRow}>
                  {WEEKDAYS.map((wd) => (
                    <AppText key={wd} variant="caption" color="textMuted" style={styles.weekdayText}>
                      {wd}
                    </AppText>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {monthGridDays.map((dayItem, index) => {
                    const isDisabled = dayItem.isPast || !dayItem.isCurrentMonth;
                    return (
                      <TouchableOpacity
                        key={index}
                        disabled={isDisabled}
                        style={[
                          styles.dayCell,
                          dayItem.isToday && styles.todayCell,
                          dayItem.isSelected && styles.selectedDayCell,
                          isDisabled && styles.disabledDayCell,
                        ]}
                        onPress={() => {
                          setSelectedDate(dayItem.date);
                          setSelectedTimeSlotIndex(0);
                        }}
                      >
                        <AppText
                          variant="labelSm"
                          style={[
                            styles.dayNumText,
                            {
                              color: dayItem.isSelected
                                ? colors.text.inverse
                                : isDisabled
                                ? colors.text.muted
                                : dayItem.isToday
                                ? colors.primary.main
                                : colors.text.primary,
                              fontWeight: dayItem.isSelected || dayItem.isToday ? '800' : '500',
                            },
                          ]}
                        >
                          {dayItem.dayNum}
                        </AppText>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <AppText variant="caption" color="textSecondary" style={styles.policyText}>
                  🚫 Past dates are disabled per service appointment policy.
                </AppText>
              </View>
            )}

            {/* Time Slots for Selected Date */}
            <AppText variant="labelLg" color="textPrimary" style={styles.sectionLabel}>
              Preferred Appointment Slot ({selectedDate.toDateString()})
            </AppText>
            {availableTimeSlots.length === 0 ? (
              <View style={styles.noSlotsBanner}>
                <AppIcon name="time-outline" size="xs" color={colors.status.warning} />
                <AppText variant="caption" color="textSecondary" style={styles.marginLeft6}>
                  No remaining slots for today. Please pick a future date above.
                </AppText>
              </View>
            ) : (
              <View style={styles.slotsRow}>
                {availableTimeSlots.map((slot, index) => {
                  const isSelected = selectedTimeSlotIndex === index;
                  return (
                    <TouchableOpacity
                      key={index}
                      style={[styles.slotChip, isSelected && styles.selectedSlotChip]}
                      onPress={() => setSelectedTimeSlotIndex(index)}
                      activeOpacity={0.7}
                    >
                      <AppIcon
                        name="time-outline"
                        size="xs"
                        color={isSelected ? colors.text.inverse : colors.text.secondary}
                      />
                      <AppText
                        variant="caption"
                        style={isSelected ? styles.slotTextSelected : styles.slotText}
                      >
                        {slot.label}
                      </AppText>
                    </TouchableOpacity>
                  );
                })}
              </View>
            )}

            {/* 5. Issue Description Textarea */}
            <View style={styles.descLabelRow}>
              <AppText variant="labelLg" color="textPrimary" style={styles.sectionLabel}>
                Problem Description *
              </AppText>
              <AppText
                variant="caption"
                style={[styles.charCount, description.length > 250 ? styles.errorCharCount : undefined]}
              >
                {description.length}/250
              </AppText>
            </View>

            <View style={[styles.textAreaBox, validationError ? styles.errorBorder : null]}>
              <TextInput
                style={styles.textArea}
                placeholder="Describe the issue in detail (e.g., Water leak from bottom filter valve)..."
                placeholderTextColor={colors.text.muted}
                multiline
                numberOfLines={4}
                maxLength={250}
                value={description}
                onChangeText={(val) => {
                  setDescription(val);
                  if (validationError) setValidationError(null);
                }}
              />
            </View>
            {validationError && <AppText variant="caption" style={styles.errorBannerText}>{validationError}</AppText>}

            {/* Confirm & Submit CTA Button */}
            <Button
              title={
                submitting
                  ? 'Creating Service Booking...'
                  : `Confirm Booking (${isUnderWarranty ? '₹0 Free' : `₹${agreedPrice}`})`
              }
              variant="cta"
              size="large"
              onPress={handleSubmit}
              loading={submitting}
              disabled={submitting || availableTimeSlots.length === 0}
              style={styles.submitBtn}
            />
          </>
        )}
      </Card>
      </ScrollView>
    </ScreenWrapper>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: spacing.lg,
    },
    scrollContent: {
      flexGrow: 1,
      paddingTop: 0, 
    },
    modeSwitchContainer: {
      flexDirection: 'row',
      backgroundColor: colors.surface || colors.background?.paper || '#FFFFFF',
      borderRadius: radius.xl,
      padding: 4,
      marginBottom: spacing.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      ...shadows.small,
    },
    modeTab: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.md - 2,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.lg,
    },
    activeModeTab: {
      backgroundColor: colors.primary.main,
      ...shadows.small,
    },
    disabledModeTab: {
      opacity: 0.65,
      backgroundColor: colors.background.default,
    },
    formCard: {
      marginBottom: spacing.xl,
      borderRadius: radius.xl,
      ...shadows.medium,
    },
    loaderBox: {
      paddingVertical: spacing.xl,
      alignItems: 'center',
    },
    loadingText: {
      marginTop: spacing.xs,
    },
    warrantyBadgeCard: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.category.emeraldBg,
      borderColor: colors.category.emeraldIcon,
      borderWidth: 1,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    warrantyIconCircle: {
      width: 36,
      height: 36,
      borderRadius: 18,
      backgroundColor: colors.surface || '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm,
    },
    outOfWarrantyBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.warningBg,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginTop: spacing.sm,
      marginBottom: spacing.md,
    },
    sectionHeaderRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.lg,
      marginBottom: spacing.xs,
    },
    sectionLabel: {
      fontSize: 15,
      fontWeight: '700',
      color: colors.primary.main,
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    dateStripContainer: {
      flexDirection: 'row',
      gap: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dateChip: {
      width: 68,
      paddingVertical: spacing.sm,
      borderRadius: radius.lg,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.surface || colors.background?.paper || '#FFFFFF',
      alignItems: 'center',
      justifyContent: 'center',
      ...shadows.small,
    },
    selectedDateChip: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    calendarCard: {
      backgroundColor: colors.background.default,
      borderRadius: radius.lg,
      padding: spacing.md,
      marginVertical: spacing.sm,
      borderWidth: 1,
      borderColor: colors.border.light,
    },
    calendarMonthHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    monthNavBtn: {
      padding: spacing.xs,
    },
    weekdaysRow: {
      flexDirection: 'row',
      marginBottom: spacing.xs,
    },
    daysGrid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    dayCell: {
      width: '14.28%',
      aspectRatio: 1,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: radius.md,
      marginVertical: 2,
    },
    todayCell: {
      borderWidth: 1.5,
      borderColor: colors.primary.main,
    },
    selectedDayCell: {
      backgroundColor: colors.primary.main,
    },
    disabledDayCell: {
      opacity: 0.25,
      backgroundColor: colors.background.default,
    },
    noSlotsBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.status.warningBg,
      padding: spacing.sm,
      borderRadius: radius.md,
      marginVertical: spacing.xs,
    },
    slotsRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.md,
    },
    slotChip: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.pill,
      borderWidth: 1,
      borderColor: colors.border.light,
      backgroundColor: colors.surface || colors.background?.paper || '#FFFFFF',
      ...shadows.small,
    },
    selectedSlotChip: {
      backgroundColor: colors.primary.main,
      borderColor: colors.primary.main,
    },
    descLabelRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginTop: spacing.md,
    },
    charCount: {
      color: colors.text.muted,
      fontSize: 12,
    },
    errorCharCount: {
      color: colors.status.danger,
      fontWeight: '700',
    },
    textAreaBox: {
      backgroundColor: colors.background.default,
      borderRadius: radius.md,
      padding: spacing.sm + 2,
      borderWidth: 1,
      borderColor: colors.border.light,
      height: 105,
      marginTop: spacing.xs,
    },
    textArea: {
      flex: 1,
      fontSize: 14,
      color: colors.text.primary,
      textAlignVertical: 'top',
    },
    errorBorder: {
      borderColor: colors.status.danger,
    },
    errorBannerText: {
      color: colors.status.danger,
      marginTop: 4,
      fontWeight: '600',
    },
    applianceDetailsBox: {
      backgroundColor: colors.primary.light || '#EEF0FF',
      paddingHorizontal: spacing.sm + 2,
      paddingVertical: spacing.xs + 2,
      borderRadius: radius.sm,
      marginTop: spacing.xs,
      marginBottom: spacing.xs,
    },
    submitBtn: {
      marginTop: spacing.xl,
    },
    flex1: { flex: 1 },
    boldText: { fontWeight: '700' },
    flexMl6: { flex: 1, marginLeft: 6 },
    marginTopMd: { marginTop: spacing.md },
    marginTopXs: { marginTop: spacing.xs },
    weekdayText: { flex: 1, fontWeight: '700', textAlign: 'center' },
    shopkeeperModeText: { color: colors.text.primary, marginLeft: 6, fontWeight: '700' },
    shopkeeperModeTextActive: { color: colors.text.inverse, marginLeft: 6, fontWeight: '700' },
    freelancerModeText: { color: colors.text.primary, marginLeft: 6, fontWeight: '700' },
    freelancerModeTextActive: { color: colors.text.inverse, marginLeft: 6, fontWeight: '700' },
    freelancerModeTextDisabled: { color: colors.text.muted, marginLeft: 6, fontWeight: '700' },
    dateSublabel: { color: colors.text.secondary, fontWeight: '600', fontSize: 10 },
    dateSublabelSelected: { color: colors.text.inverse, fontWeight: '600', fontSize: 10 },
    dateNum: { color: colors.text.primary, fontWeight: '800', marginTop: 2 },
    dateNumSelected: { color: colors.text.inverse, fontWeight: '800', marginTop: 2 },
    dateMonth: { color: colors.text.muted, fontSize: 10, marginTop: 1 },
    dateMonthSelected: { color: colors.text.inverse, fontSize: 10, marginTop: 1 },
    dayNumText: {},
    policyText: { marginTop: 8, textAlign: 'center' },
    marginLeft6: { marginLeft: 6 },
    slotText: { color: colors.text.primary, fontWeight: '500', marginLeft: 4 },
    slotTextSelected: { color: colors.text.inverse, fontWeight: '700', marginLeft: 4 },
    externalPromoBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background.paper,
      borderRadius: radius.lg,
      padding: spacing.sm + 2,
      borderWidth: 1.5,
      borderColor: colors.primary.light,
      marginBottom: spacing.md,
    },
    externalPromoIconWrap: {
      width: 38,
      height: 38,
      borderRadius: radius.pill,
      backgroundColor: colors.primary.light,
      alignItems: 'center',
      justifyContent: 'center',
      marginRight: spacing.sm + 2,
    },
    externalPromoTextWrap: {
      flex: 1,
    },
    externalPromoLink: {
      fontWeight: '700',
      marginTop: 2,
    },
    manageAddressRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
      marginTop: 6,
      alignSelf: 'flex-end',
      paddingHorizontal: 2,
    },
    manageAddressText: {
      fontWeight: '600',
    },
    noAddressCard: {
      marginTop: spacing.md,
      borderColor: colors.status.warning,
      backgroundColor: colors.status.warningBg,
    },
    noAddressRow: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    flex1Ml8: {
      flex: 1,
      marginLeft: spacing.sm,
    },
  });
