/**
 * @file Select/index.tsx
 * @layer Shared / Molecules
 * @responsibility Production-grade searchable bottom modal dropdown selector.
 *                 Renders rich option rows with primary labels, detailed sublabels (e.g. addresses, specifications),
 *                 selection indicators, and search filtering across both labels and sublabels.
 *                 Adheres strictly to DESIGN_SYSTEM.md typography and styling standards.
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewStyle,
} from 'react-native';
import { AppIcon } from '@shared/components/atoms/Icon';
import { AppText } from '@shared/components/atoms/AppText';
import { Card } from '@shared/components/atoms/Card';
import { Input } from '@shared/components/atoms/Input';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
  badge?: string;
  icon?: string;
}

export interface SelectProps {
  label?: string;
  placeholder?: string;
  value?: string;
  options: SelectOption[];
  onSelect: (option: SelectOption) => void;
  leftIcon?: React.ReactNode;
  searchable?: boolean;
  searchPlaceholder?: string;
  error?: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export const Select: React.FC<SelectProps> = ({
  label,
  placeholder = 'Select option...',
  value,
  options = [],
  onSelect,
  leftIcon,
  searchable = true,
  searchPlaceholder = 'Search...',
  error,
  disabled = false,
  style,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;
  const styles = useMemo(() => makeStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = useMemo(
    () => options.find((opt) => opt.value === value),
    [options, value]
  );

  const filteredOptions = useMemo(() => {
    if (!searchQuery.trim()) return options;
    const q = searchQuery.toLowerCase().trim();
    return options.filter(
      (opt) =>
        opt.label.toLowerCase().includes(q) ||
        (opt.sublabel && opt.sublabel.toLowerCase().includes(q))
    );
  }, [options, searchQuery]);

  const handleSelectOption = (opt: SelectOption) => {
    onSelect(opt);
    setSearchQuery('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label ? (
        <AppText variant="labelSm" color="textSecondary" style={styles.label}>
          {label}
        </AppText>
      ) : null}

      <TouchableOpacity
        style={[
          styles.triggerBox,
          selectedOption?.sublabel ? styles.triggerBoxTall : null,
          error ? styles.triggerBoxError : null,
          disabled ? styles.triggerBoxDisabled : null,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
          <View style={styles.triggerTextColumn}>
            {selectedOption ? (
              <>
                <AppText
                  variant="labelMd"
                  color="textPrimary"
                  numberOfLines={1}
                  style={styles.triggerPrimaryText}
                >
                  {selectedOption.label}
                </AppText>
                {selectedOption.sublabel ? (
                  <AppText
                    variant="caption"
                    color="textSecondary"
                    numberOfLines={1}
                    style={styles.triggerSubText}
                  >
                    {selectedOption.sublabel}
                  </AppText>
                ) : null}
              </>
            ) : (
              <AppText variant="bodyMd" color="textMuted">
                {placeholder}
              </AppText>
            )}
          </View>
        </View>
        <AppIcon name="chevron-down" size="sm" color={colors.text.secondary} />
      </TouchableOpacity>

      {error ? (
        <AppText variant="caption" color="textSecondary" style={styles.errorText}>
          {error}
        </AppText>
      ) : null}

      {/* Filterable Options Modal */}
      <Modal
        visible={modalVisible}
        animationType="fade"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent} padding="lg">
            <View style={styles.modalHeader}>
              <View style={styles.modalTitleRow}>
                <AppText variant="headingSm" color="textPrimary">
                  {label ? label.replace(/\*/g, '').trim() : 'Select Option'}
                </AppText>
                <AppText variant="caption" color="textMuted">
                  {options.length} available
                </AppText>
              </View>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <AppIcon name="close-circle-outline" size="md" color={colors.text.secondary} />
              </TouchableOpacity>
            </View>

            {searchable ? (
              <Input
                placeholder={searchPlaceholder}
                value={searchQuery}
                onChangeText={setSearchQuery}
                leftIcon={<AppIcon name="search-outline" size="sm" color={colors.primary.main} />}
                style={styles.searchInput}
              />
            ) : null}

            <FlatList
              data={filteredOptions}
              keyExtractor={(item, index) => `${item.value}-${index}`}
              style={styles.optionsList}
              contentContainerStyle={styles.optionsListContent}
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, isSelected ? styles.optionRowSelected : null]}
                    onPress={() => handleSelectOption(item)}
                    activeOpacity={0.75}
                  >
                    {item.icon ? (
                      <View style={[styles.optionIconBox, isSelected && styles.optionIconBoxSelected]}>
                        <AppIcon
                          name={item.icon}
                          size="xs"
                          color={isSelected ? colors.primary.main : colors.text.secondary}
                        />
                      </View>
                    ) : null}

                    <View style={styles.optionTextColumn}>
                      <AppText
                        variant="labelMd"
                        style={[styles.optionLabel, isSelected ? styles.optionLabelSelected : null]}
                        numberOfLines={1}
                      >
                        {item.label}
                      </AppText>
                      {item.sublabel ? (
                        <AppText
                          variant="caption"
                          color="textSecondary"
                          numberOfLines={2}
                          style={styles.optionSublabel}
                        >
                          {item.sublabel}
                        </AppText>
                      ) : null}
                    </View>

                    {isSelected ? (
                      <View style={styles.checkWrap}>
                        <AppIcon name="checkmark-circle" size="sm" color={colors.primary.main} />
                      </View>
                    ) : (
                      <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.emptyWrap}>
                  <AppIcon name="search-outline" size="md" color={colors.text.muted} />
                  <AppText variant="bodySm" color="textMuted" style={styles.emptyText}>
                    No matching options found
                  </AppText>
                </View>
              }
            />
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors: any) =>
  StyleSheet.create({
    container: {
      marginBottom: spacing.md,
    },
    label: {
      marginBottom: 6,
      fontWeight: '600',
    },
    triggerBox: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      backgroundColor: colors.background.paper,
      borderWidth: 1,
      borderColor: colors.border.main,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      minHeight: 50,
      paddingVertical: spacing.xs + 2,
    },
    triggerBoxTall: {
      minHeight: 60,
    },
    triggerBoxError: {
      borderColor: colors.status.danger,
    },
    triggerBoxDisabled: {
      backgroundColor: colors.background.default,
      opacity: 0.6,
    },
    triggerLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      flex: 1,
      marginRight: spacing.xs,
    },
    leftIconContainer: {
      marginRight: spacing.sm,
    },
    triggerTextColumn: {
      flex: 1,
    },
    triggerPrimaryText: {
      lineHeight: 18,
    },
    triggerSubText: {
      marginTop: 2,
      lineHeight: 14,
    },
    errorText: {
      color: colors.status.danger,
      marginTop: 4,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(15, 23, 42, 0.6)',
      justifyContent: 'center',
      paddingHorizontal: spacing.md,
    },
    modalContent: {
      borderRadius: radius.xl,
      maxHeight: '82%',
      backgroundColor: colors.background.paper,
      ...shadows.large,
    },
    modalHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
      paddingBottom: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
    },
    modalTitleRow: {
      flex: 1,
    },
    searchInput: {
      marginBottom: spacing.sm,
    },
    optionsList: {
      maxHeight: 380,
    },
    optionsListContent: {
      paddingBottom: spacing.sm,
    },
    optionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm + 4,
      paddingHorizontal: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border.light,
      borderRadius: radius.sm,
      gap: spacing.sm,
    },
    optionRowSelected: {
      backgroundColor: colors.primary.light,
      borderBottomColor: colors.primary.light,
    },
    optionIconBox: {
      width: 32,
      height: 32,
      borderRadius: radius.sm,
      backgroundColor: colors.background.default,
      alignItems: 'center',
      justifyContent: 'center',
    },
    optionIconBoxSelected: {
      backgroundColor: colors.background.paper,
    },
    optionTextColumn: {
      flex: 1,
    },
    optionLabel: {
      color: colors.text.primary,
      fontWeight: '600',
    },
    optionLabelSelected: {
      color: colors.primary.main,
      fontWeight: '700',
    },
    optionSublabel: {
      marginTop: 2,
      lineHeight: 15,
    },
    checkWrap: {
      marginLeft: spacing.xs,
    },
    emptyWrap: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: spacing.xl,
      gap: spacing.xs,
    },
    emptyText: {
      fontWeight: '500',
    },
  });
