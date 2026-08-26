import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  FlatList,
  ViewStyle,
} from 'react-native';
import { AppIcon } from '@shared/components/atoms/Icon';
import { Card } from '@shared/components/atoms/Card';
import { Input } from '@shared/components/atoms/Input';
import { spacing, radius, shadows, useTheme } from '@theme/index';

export interface SelectOption {
  label: string;
  value: string;
  sublabel?: string;
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
  const styles = React.useMemo(() => makeStyles(colors), [colors]);
  const [modalVisible, setModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const selectedOption = options.find((opt) => opt.value === value);

  const filteredOptions = options.filter((opt) =>
    opt.label.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOption = (opt: SelectOption) => {
    onSelect(opt);
    setSearchQuery('');
    setModalVisible(false);
  };

  return (
    <View style={[styles.container, style]}>
      {label ? <Text style={styles.label}>{label}</Text> : null}

      <TouchableOpacity
        style={[
          styles.triggerBox,
          error ? styles.triggerBoxError : null,
          disabled ? styles.triggerBoxDisabled : null,
        ]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <View style={styles.triggerLeft}>
          {leftIcon ? <View style={styles.leftIconContainer}>{leftIcon}</View> : null}
          <Text style={[styles.triggerText, !selectedOption ? styles.placeholderText : null]}>
            {selectedOption ? selectedOption.label : placeholder}
          </Text>
        </View>
        <AppIcon name="chevron-down" size="sm" color={colors.text.secondary} />
      </TouchableOpacity>

      {error ? <Text style={styles.errorText}>{error}</Text> : null}

      {/* Filterable Options Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <Card style={styles.modalContent} padding="lg">
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
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
              showsVerticalScrollIndicator={false}
              renderItem={({ item }) => {
                const isSelected = item.value === value;
                return (
                  <TouchableOpacity
                    style={[styles.optionRow, isSelected ? styles.optionRowSelected : null]}
                    onPress={() => handleSelectOption(item)}
                  >
                    <Text
                      style={[styles.optionText, isSelected ? styles.optionTextSelected : null]}
                    >
                      {item.label}
                    </Text>
                    {isSelected ? (
                      <AppIcon name="checkmark" size="sm" color={colors.primary.main} />
                    ) : (
                      <AppIcon name="chevron-forward" size="xs" color={colors.text.muted} />
                    )}
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No matching options found</Text>
              }
            />
          </Card>
        </View>
      </Modal>
    </View>
  );
};

const makeStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: spacing.md,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text.secondary,
    marginBottom: 4,
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
    height: 48,
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
  },
  leftIconContainer: {
    marginRight: spacing.xs + 2,
  },
  triggerText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text.primary,
  },
  placeholderText: {
    color: colors.text.muted,
    fontWeight: '400',
  },
  errorText: {
    fontSize: 12,
    color: colors.status.danger,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalContent: {
    borderRadius: radius.xl,
    ...shadows.large,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text.primary,
  },
  searchInput: {
    marginBottom: spacing.sm,
  },
  optionsList: {
    maxHeight: 320,
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.light,
  },
  optionRowSelected: {
    backgroundColor: colors.primary.light + '40',
  },
  optionText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.text.primary,
  },
  optionTextSelected: {
    color: colors.primary.main,
    fontWeight: '800',
  },
  emptyText: {
    fontSize: 13,
    color: colors.text.muted,
    textAlign: 'center',
    paddingVertical: spacing.lg,
  },
});
