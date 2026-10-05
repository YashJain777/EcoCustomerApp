/**
 * @file AppCalendarView.tsx
 * @feature Shared / Molecules
 * @responsibility Interactive monthly calendar grid for selecting dates.
 *   Adheres strictly to DESIGN_SYSTEM.md standards.
 */

import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import dayjs, { Dayjs } from 'dayjs';
import { useTheme, spacing, radius } from '@theme/index';
import { AppText } from '../atoms/AppText';
import { AppIcon } from '../atoms/Icon';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface AppCalendarViewProps {
  selectedDate: string; // "YYYY-MM-DD"
  onSelectDate: (dateStr: string) => void;
  minDate?: string; // defaults to "2024-01-01"
  maxDate?: string;
}

export const AppCalendarView: React.FC<AppCalendarViewProps> = ({
  selectedDate,
  onSelectDate,
  minDate = '2024-01-01',
  maxDate,
}) => {
  const { theme } = useTheme();
  const colors = theme.colors;

  const todayStr = useMemo(() => dayjs().format('YYYY-MM-DD'), []);

  const [currentMonth, setCurrentMonth] = useState<Dayjs>(() => {
    return selectedDate && dayjs(selectedDate).isValid()
      ? dayjs(selectedDate).startOf('month')
      : dayjs().startOf('month');
  });

  useEffect(() => {
    if (selectedDate && dayjs(selectedDate).isValid()) {
      const selectedMonth = dayjs(selectedDate).startOf('month');
      setCurrentMonth(prev => (prev.isSame(selectedMonth, 'month') ? prev : selectedMonth));
    }
  }, [selectedDate]);

  const handlePrevMonth = useCallback(() => {
    const prev = currentMonth.subtract(1, 'month');
    if (minDate) {
      const minMonth = dayjs(minDate).startOf('month');
      if (prev.isBefore(minMonth, 'month')) return;
    }
    setCurrentMonth(prev);
  }, [currentMonth, minDate]);

  const handleNextMonth = useCallback(() => {
    const next = currentMonth.add(1, 'month');
    if (maxDate) {
      const maxMonth = dayjs(maxDate).endOf('month');
      if (next.isAfter(maxMonth, 'month')) return;
    }
    setCurrentMonth(next);
  }, [currentMonth, maxDate]);

  const canGoPrev = useMemo(() => {
    if (!minDate) return true;
    const prev = currentMonth.subtract(1, 'month');
    const minMonth = dayjs(minDate).startOf('month');
    return !prev.isBefore(minMonth, 'month');
  }, [currentMonth, minDate]);

  const canGoNext = useMemo(() => {
    if (!maxDate) return true;
    const next = currentMonth.add(1, 'month');
    const maxMonth = dayjs(maxDate).endOf('month');
    return !next.isAfter(maxMonth, 'month');
  }, [currentMonth, maxDate]);

  const calendarCells = useMemo(() => {
    const startOfMonth = currentMonth.startOf('month');
    const daysInMonth = currentMonth.daysInMonth();
    const startDayOfWeek = startOfMonth.day();

    const cells: Array<{
      key: string;
      isBlank?: boolean;
      dayNumber?: number;
      dateStr?: string;
      isToday?: boolean;
      isSelected?: boolean;
    }> = [];

    for (let i = 0; i < startDayOfWeek; i++) {
      cells.push({ key: `blank-${i}`, isBlank: true });
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const cellDate = currentMonth.date(day);
      const dateStr = cellDate.format('YYYY-MM-DD');
      const isToday = dateStr === todayStr;
      const isSelected = dateStr === selectedDate;

      cells.push({
        key: dateStr,
        isBlank: false,
        dayNumber: day,
        dateStr,
        isToday,
        isSelected,
      });
    }

    return cells;
  }, [currentMonth, todayStr, selectedDate]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          padding: spacing.md,
          backgroundColor: colors.background.paper,
          borderRadius: radius.lg,
          borderWidth: 1,
          borderColor: colors.border.light,
        },
        header: {
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: spacing.md,
        },
        headerTitle: {
          fontWeight: '700',
        },
        navBtn: {
          width: 34,
          height: 34,
          borderRadius: 17,
          backgroundColor: colors.background.default,
          alignItems: 'center',
          justifyContent: 'center',
          borderWidth: 1,
          borderColor: colors.border.light,
        },
        navBtnDisabled: {
          opacity: 0.4,
        },
        weekdaysRow: {
          flexDirection: 'row',
          marginBottom: spacing.xs,
        },
        weekdayCell: {
          flex: 1,
          alignItems: 'center',
          paddingVertical: 4,
        },
        grid: {
          flexDirection: 'row',
          flexWrap: 'wrap',
        },
        dayCell: {
          width: '14.28%',
          aspectRatio: 1,
          alignItems: 'center',
          justifyContent: 'center',
          padding: 2,
        },
        dayButton: {
          width: 32,
          height: 32,
          borderRadius: 16,
          alignItems: 'center',
          justifyContent: 'center',
        },
        dayButtonSelected: {
          backgroundColor: colors.primary.main,
        },
        dayButtonToday: {
          borderWidth: 1.5,
          borderColor: colors.primary.main,
        },
        dayTextSelected: {
          color: colors.text.inverse,
          fontWeight: '700',
        },
        dayTextToday: {
          color: colors.primary.main,
          fontWeight: '700',
        },
      }),
    [colors]
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handlePrevMonth}
          disabled={!canGoPrev}
          style={[styles.navBtn, !canGoPrev && styles.navBtnDisabled]}
          activeOpacity={0.7}
        >
          <AppIcon name="chevron-back" size="sm" color={colors.text.primary} />
        </TouchableOpacity>

        <AppText variant="headingSm" color="textPrimary" style={styles.headerTitle}>
          {currentMonth.format('MMMM YYYY')}
        </AppText>

        <TouchableOpacity
          onPress={handleNextMonth}
          disabled={!canGoNext}
          style={[styles.navBtn, !canGoNext && styles.navBtnDisabled]}
          activeOpacity={0.7}
        >
          <AppIcon name="chevron-forward" size="sm" color={colors.text.primary} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map(w => (
          <View key={w} style={styles.weekdayCell}>
            <AppText variant="caption" color="textMuted" style={{ fontWeight: '600' }}>
              {w}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.grid}>
        {calendarCells.map(cell => {
          if (cell.isBlank) {
            return <View key={cell.key} style={styles.dayCell} />;
          }

          return (
            <View key={cell.key} style={styles.dayCell}>
              <TouchableOpacity
                onPress={() => cell.dateStr && onSelectDate(cell.dateStr)}
                style={[
                  styles.dayButton,
                  cell.isToday && styles.dayButtonToday,
                  cell.isSelected && styles.dayButtonSelected,
                ]}
                activeOpacity={0.75}
              >
                <AppText
                  variant="bodySm"
                  style={[
                    cell.isToday && styles.dayTextToday,
                    cell.isSelected && styles.dayTextSelected,
                    !cell.isToday && !cell.isSelected && { color: colors.text.primary },
                  ]}
                >
                  {cell.dayNumber}
                </AppText>
              </TouchableOpacity>
            </View>
          );
        })}
      </View>
    </View>
  );
};
