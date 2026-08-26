# Smart Sales, Service & Transport Ecosystem — Mobile Design System

Version: 2.0 | Updated: July 2026

---

## Purpose

This document is the **single source of truth** for all mobile UI/UX decisions across the ecosystem mobile applications: `SmartSalesService` and `EcoSystemCustomer`.

Every screen, component, color, spacing value, animation, typography choice, and layout pattern **must** follow this document.

- Never invent new design patterns.
- Always reuse existing components from `src/shared/components/`.
- Always consume values from `src/theme/` — never hardcode anything.
- **NO INLINE CSS/STYLES**: Never use inline style objects (`style={{ ... }}`). Use global CSS, `commonStyles`, theme tokens, and `StyleSheet.create`.
- **NO API FALLBACKS**: Never use hardcoded fallback values for API response data (e.g. `?? 'Default'`, `|| 4.8`, `|| 500`). Only use what the API returns in response.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Platform | Android + iOS |
| Framework | React Native CLI |
| Language | TypeScript (strict) |
| State Management | Redux Toolkit + RTK Query |
| Styling | React Native `StyleSheet` (vanilla) |
| Theme | Custom `ThemeContext` with light/dark support |
| Navigation | React Navigation v7 |
| Icons | `react-native-vector-icons/Feather` only |
| Typography | Inter + JetBrains Mono |

---

## Design Philosophy

This application is an **Enterprise ERP + CRM + Field Service Management** platform.

It is **NOT** social media, e-commerce, food delivery, or entertainment.

The design must communicate:

- **Trust** — enterprise-grade visual weight
- **Professionalism** — consistent, structured layouts
- **Productivity** — information-dense but never cluttered
- **Speed** — instant feedback, skeleton states, optimistic UI
- **Readability** — high contrast, clear hierarchy

Think like: **Microsoft**, **Google Workspace**, **Stripe Dashboard**, **Linear**, **SAP Fiori**.

Never over-design. Never use Dribbble-style concepts. Always prioritize usability.

---

## Architecture — Feature Slice Pattern

Every feature follows the same structure. This is mandatory.

```
src/
├── features/
│   └── <feature>/
│       ├── api/           ← RTK Query endpoints ONLY for this feature
│       ├── hooks/         ← Business logic, data derivations, handlers
│       ├── components/    ← Feature-specific UI components
│       ├── screens/       ← Thin presentational layers — minimal logic
│       ├── types/         ← Feature-specific TypeScript types
│       └── index.ts       ← Barrel export (public API of the feature)
│
├── shared/
│   └── components/
│       ├── atoms/         ← AppButton, AppText, AppInput, AppBadge…
│       ├── forms/         ← FormInput, FormSelect, FormCheckbox…
│       ├── layout/        ← Screen wrappers, containers
│       ├── feedback/      ← Loaders, error states, empty states
│       ├── molecules/     ← Composed UI groups
│       └── organisms/     ← Complex reusable sections
│
├── theme/
│   ├── colors.ts          ← Semantic color tokens
│   ├── typography.ts      ← Font sizes, weights, variants
│   ├── spacing.ts         ← All spacing values
│   ├── radius.ts          ← All border radius values
│   ├── commonStyles.ts    ← Global reusable StyleSheet rules
│   ├── lightTheme.ts      ← Light theme composition
│   ├── darkTheme.ts       ← Dark theme composition
│   └── ThemeContext.tsx   ← Theme provider + useTheme hook
│
└── store/
    └── api/
        └── rootApi.ts     ← Single RTK Query base — all features inject into this
```

### Rules

- **Screens are thin** — no inline business logic, no direct API calls, no `useAppSelector` for derived data.
- **Hooks own logic** — all data fetching, fallback derivations, event handlers live in `hooks/`.
- **API files own one feature** — never put Profile endpoints in `authApi.ts`.
- **Every feature exports a barrel `index.ts`** — consumers import from the feature root, never from deep internal paths.

---

## Color System

### Never hardcode colors. Always use `colors.*` from `useTheme()`.

```typescript
// ✅ Correct
const {theme} = useTheme();
const {colors} = theme;
<View style={{backgroundColor: colors.primary}} />

// ❌ Wrong
<View style={{backgroundColor: '#2719A3'}} />
<View style={{backgroundColor: 'blue'}} />
```

### Light Theme Palette

| Token | Value | Usage |
|---|---|---|
| `colors.primary` | `#2719A3` | Brand actions, active states, CTAs |
| `colors.primaryDark` | `#1E1380` | Pressed states, avatar backgrounds |
| `colors.primaryLight` | `#EEF0FF` | Backgrounds, icon wrappers, badges |
| `colors.secondary` | `#E78514` | Accent, highlights |
| `colors.background` | `#F8FAFC` | Screen backgrounds |
| `colors.surface` | `#FFFFFF` | Cards, modals, input containers |
| `colors.border` | `#E2E8F0` | Dividers, input borders, row separators |
| `colors.textPrimary` | `#0F172A` | Headings, primary labels |
| `colors.textSecondary` | `#64748B` | Subtitles, placeholders, captions |
| `colors.textOnPrimary` | `#FFFFFF` | Text on primary-colored backgrounds |
| `colors.success` | `#22C55E` | Positive status, confirmations |
| `colors.successLight` | `#DCFCE7` | Success icon wrappers, badges |
| `colors.warning` | `#F59E0B` | Caution states, badges |
| `colors.warningLight` | `#FEF3C7` | Warning icon wrappers |
| `colors.danger` | `#EF4444` | Errors, destructive actions |
| `colors.dangerLight` | `#FEE2E2` | Error banners, danger icon wrappers |
| `colors.info` | `#3B82F6` | Informational elements |
| `colors.infoLight` | `#DBEAFE` | Info icon wrappers |

### Icon Wrapper Pattern

Always use semantic color pairs for icon containers:

```typescript
// Primary action
<View style={{backgroundColor: colors.primaryLight}}>
  <Icon name="home" color={colors.primary} />
</View>

// Danger action
<View style={{backgroundColor: colors.dangerLight}}>
  <Icon name="trash" color={colors.danger} />
</View>
```

---

## Typography

### Never use `<Text>` from react-native directly. Always use `<AppText>`.

```typescript
// ✅ Correct
import {AppText} from '@shared/components/atoms/AppText';
<AppText variant="headingMd" color="textPrimary">Title</AppText>

// ❌ Wrong
import {Text} from 'react-native';
<Text style={{fontSize: 18, fontWeight: '600', color: '#0F172A'}}>Title</Text>
```

### Available `variant` values

| Variant | Font Size | Font Family | Use Case |
|---|---|---|---|
| `displayXl` | 40px | Inter ExtraBold | Splash, hero screens |
| `displayLg` | 32px | Inter Bold | Major page titles |
| `displayMd` | 28px | Inter Bold | Section displays |
| `headingXl` | 24px | Inter Bold | Screen headings |
| `headingLg` | 20px | Inter SemiBold | Card headings |
| `headingMd` | 18px | Inter SemiBold | Sub-headings, names |
| `headingSm` | 16px | Inter SemiBold | List item titles |
| `bodyLg` | 16px | Inter Regular | Primary body text |
| `bodyMd` | 14px | Inter Regular | Standard body |
| `bodySm` | 12px | Inter Regular | Secondary body |
| `labelLg` | 16px | Inter Medium | Form labels |
| `labelMd` | 14px | Inter Medium | Section labels, tags |
| `labelSm` | 12px | Inter Medium | Small labels |
| `caption` | 10px | Inter Regular | Metadata, timestamps |
| `mono` | 12px | JetBrains Mono | IDs, codes, amounts |

### `color` prop — use semantic color key names

```typescript
<AppText variant="bodyMd" color="textSecondary">Supporting text</AppText>
<AppText variant="headingMd" color="textPrimary">Title</AppText>
<AppText variant="labelMd" color="primary">Link text</AppText>
```

---

## Spacing

### Source: `src/theme/spacing.ts`

All spacing values must come from the theme. Use `theme.spacing[N]` or the named `space.*` aliases.

```typescript
const {theme} = useTheme();
const {spacing} = theme;

// ✅ Correct
paddingHorizontal: spacing[4]   // 16px
marginBottom: spacing[3]        // 12px

// ❌ Wrong
paddingHorizontal: 16
marginBottom: 13
```

### Named Aliases (`space.*`)

| Alias | Value | Common Use |
|---|---|---|
| `space.none` | 0px | No spacing |
| `space.xxs` | 2px | Icon internal padding |
| `space.xs` | 4px | Tight chip padding |
| `space.sm` | 8px | Small gaps, badge padding |
| `space.md` | 16px | **Standard screen padding** |
| `space.lg` | 24px | Section gaps, submit button top |
| `space.xl` | 32px | Large section separators |
| `space.2xl` | 48px | Hero sections |

### Global Spacing Rules

| Element | Value |
|---|---|
| Screen horizontal padding | `16px` (spacing[4]) |
| Gap between form fields | `16px` (commonStyles.fieldMargin) |
| Card internal padding | `16px` (spacing[4]) |
| Section label top margin | `12px` (spacing[3]) |
| Submit button top margin | `24px` (space.lg) |
| Bottom scroll padding | `40px` |
| Screen header height | `56px` |

---

## Border Radius

### Source: `src/theme/radius.ts`

| Token | Value | Use Case |
|---|---|---|
| `radius.none` | 0px | Flat/flush edges |
| `radius.xs` | 2px | Tiny chips |
| `radius.sm` | 4px | Small badges, error banners |
| `radius.md` | 8px | Buttons, inputs, icon containers |
| `radius.lg` | 12px | Cards, group containers |
| `radius.xl` | 16px | Large cards, modals |
| `radius.2xl` | 20px | Bottom sheets |
| `radius.3xl` | 24px | Hero cards |
| `radius.full` | 9999px | Avatars, circular elements |

---

## Global Component Library

### Import Rules

```typescript
// ✅ Always use path alias
import {AppText}   from '@shared/components/atoms/AppText';
import {AppButton} from '@shared/components/atoms/AppButton';
import {AppInput}  from '@shared/components/atoms/AppInput';
import {FormInput} from '@shared/components/forms/FormInput';
import {FormSelect} from '@shared/components/forms/FormSelect';

// ❌ Never use relative paths from screens
import {AppText} from '../../../shared/components/atoms/AppText';
```

---

### `AppText` — Typography Component

**File:** `src/shared/components/atoms/AppText/index.tsx`

```typescript
<AppText
  variant="headingMd"      // TextVariant — required
  color="textPrimary"      // keyof AppColors — optional, defaults to textPrimary
  align="left"             // 'left' | 'center' | 'right' — optional
  style={styles.custom}    // Extra StyleSheet overrides
>
  Content
</AppText>
```

**Rules:**
- Never use raw `<Text>` from react-native in any screen or component.
- Only pass `fontWeight` via `style` for one-off overrides. Prefer the appropriate `variant` instead.

---

### `AppButton` — Action Button

**File:** `src/shared/components/atoms/AppButton/index.tsx`

```typescript
<AppButton
  label="Submit"
  onPress={handleSubmit}
  variant="primary"        // 'primary' | 'secondary' | 'ghost' | 'danger' | 'link'
  size="md"                // 'sm' | 'md' | 'lg'
  loading={isSubmitting}   // Shows ActivityIndicator
  disabled={!isValid}      // Grays out + disables touch
  fullWidth                // Stretches to container width
  iconLeft={<Icon name="check" size={16} color="#fff" />}
  style={commonStyles.submitButton}
/>
```

**Button Heights:**
| Size | Height |
|---|---|
| `sm` | 36px |
| `md` | 44px |
| `lg` | 52px |

**Rules:**
- Submit / primary CTAs always use `variant="primary"` with `fullWidth`.
- Destructive actions always use `variant="danger"`.
- Navigation/link actions use `variant="ghost"` or `variant="link"`.
- Always apply `commonStyles.submitButton` for correct top spacing above the submit button.

---

### `AppInput` — Text Input

**File:** `src/shared/components/atoms/AppInput/index.tsx`

```typescript
<AppInput
  label="Mobile Number"
  placeholder="Enter mobile"
  value={value}
  onChangeText={onChange}
  keyboardType="phone-pad"
  prefix={<Icon name="phone" size={16} color={colors.textSecondary} />}
  suffix={<Icon name="x" size={16} color={colors.textSecondary} />}
  error="Invalid number"
  hint="10-digit Indian mobile"
  style={commonStyles.fieldMargin}   // ← Always apply this for consistent field gaps
/>
```

**Rules:**
- The `style` prop applies to the **outer wrapper** — use it only for margin/spacing.
- Never apply `marginTop` directly to the input's internal container.
- Always use `commonStyles.fieldMargin` for gaps between fields in a form.
- Height is fixed at `52px` via the design system.

---

### `FormInput` — React Hook Form + AppInput

**File:** `src/shared/components/forms/FormInput/index.tsx`

```typescript
<FormInput
  control={control}
  name="mobile"
  label="Mobile Number"
  placeholder="Enter mobile"
  rules={{required: 'Mobile is required'}}
  keyboardType="phone-pad"
  prefix={<Icon name="phone" size={16} color={colors.textSecondary} />}
  inputStyle={commonStyles.fieldMargin}
/>
```

**Rules:**
- Always use `FormInput` inside React Hook Form screens — never use `AppInput` directly with `useState`.
- The `inputStyle` prop maps to `AppInput`'s `style` — always pass `commonStyles.fieldMargin`.

---

### `FormSelect` — Dropdown Selector

**File:** `src/shared/components/forms/FormSelect/index.tsx`

```typescript
<FormSelect
  control={control}
  name="state"
  label="State"
  placeholder="Select state"
  options={states.map(s => ({label: s.name, value: s.id}))}
  rules={{required: 'State is required'}}
  style={commonStyles.fieldMargin}
/>
```

**Rules:**
- Never render a custom modal or picker. Always use `FormSelect`.
- Options must be `{label: string; value: string}[]`.

---

## Global Styles — `commonStyles`

**File:** `src/theme/commonStyles.ts`

These are pre-defined, globally shared `StyleSheet` rules. Import and use them directly — never re-define equivalent styles locally.

```typescript
import {commonStyles} from '@theme/commonStyles';
```

| Key | Value | Use |
|---|---|---|
| `commonStyles.safeArea` | `{flex: 1}` | Root `SafeAreaView` wrapper |
| `commonStyles.flex` | `{flex: 1}` | Full-height `View` |
| `commonStyles.formScrollContent` | `{flexGrow:1, paddingH:16, paddingV:32, justifyContent:'center'}` | `ScrollView` content in auth forms |
| `commonStyles.formHeader` | `{alignItems:'center', marginBottom:32}` | Logo + title block at top of forms |
| `commonStyles.formTitle` | `{fontWeight:'800', marginBottom:8}` | Main heading inside form header |
| `commonStyles.formCard` | `{padding:16, borderRadius:16, elevation:4, shadowOpacity:0.05}` | White card wrapping form fields |
| `commonStyles.fieldMargin` | `{marginTop:16}` | Vertical gap between form fields |
| `commonStyles.submitButton` | `{marginTop:24}` | Top spacing above primary CTA button |
| `commonStyles.formFooterLinks` | `{alignItems:'center', marginTop:24}` | Footer link area below forms |
| `commonStyles.underlineLink` | `{textDecorationLine:'underline'}` | Inline text links |

### Form Layout Pattern — Always Follow This

```tsx
<SafeAreaView style={[commonStyles.safeArea, {backgroundColor: colors.background}]}>
  <KeyboardAvoidingView style={commonStyles.flex} behavior="padding">
    <ScrollView contentContainerStyle={commonStyles.formScrollContent}>

      {/* Header */}
      <View style={commonStyles.formHeader}>
        <AppText variant="headingXl" color="textPrimary" style={commonStyles.formTitle}>
          Screen Title
        </AppText>
        <AppText variant="bodyMd" color="textSecondary" align="center">
          Subtitle description
        </AppText>
      </View>

      {/* Card */}
      <View style={[commonStyles.formCard, {backgroundColor: colors.surface}]}>

        {/* First field — no fieldMargin */}
        <FormInput control={control} name="field1" label="Field 1" placeholder="..." />

        {/* Subsequent fields — always fieldMargin */}
        <FormInput control={control} name="field2" label="Field 2" placeholder="..."
          inputStyle={commonStyles.fieldMargin} />

        <FormSelect control={control} name="select1" label="Select" placeholder="..."
          options={[]} style={commonStyles.fieldMargin} />

        {/* Submit */}
        <AppButton label="Continue" onPress={handleSubmit(onSubmit)}
          fullWidth loading={isSubmitting} style={commonStyles.submitButton} />
      </View>

    </ScrollView>
  </KeyboardAvoidingView>
</SafeAreaView>
```

---

## Icons

### Library: `react-native-vector-icons/Feather` — the only icon library used.

```typescript
// @ts-ignore
import Icon from 'react-native-vector-icons/Feather';

<Icon name="home" size={20} color={colors.primary} />
```

**Rules:**
- Never import from any other icon library (Material, FontAwesome, Ionicons, etc.).
- Always pass `color` from theme tokens — never hardcode hex values.
- Always pair icons with a semantic-colored background wrapper.
- Standard icon sizes: `10`, `12`, `14`, `16`, `18`, `20`, `22`, `24`.

---

## Screen Layout Pattern

Every screen must follow this structure:

```tsx
export const MyScreen: React.FC = () => {
  const {theme}  = useTheme();
  const {colors} = theme;

  // All business logic from a dedicated hook
  const {data, isLoading, handleAction} = useMyFeatureHook();

  return (
    <View style={[styles.container, {backgroundColor: colors.background}]}>

      {/* Header — 56px height, horizontal padding 16 */}
      <View style={[styles.header, {backgroundColor: colors.background}]}>
        <AppText variant="headingLg" color="textPrimary">Screen Title</AppText>
        <TouchableOpacity onPress={() => handleAction('Settings')}>
          <Icon name="settings" size={22} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      {/* Scrollable body */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Content sections */}
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container:     {flex: 1},
  header:        {flexDirection: 'row', height: 56, alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 12},
  scrollContent: {paddingHorizontal: 16, paddingTop: 12, paddingBottom: 40},
});
```

---

## Navigation — Bottom Tab Bar

### Role-Based Tab Configuration

Navigation is dynamically generated from `auth.user.role`. Never hardcode tabs.

| Role | Tab 1 | Tab 2 | Tab 3 (Center) | Tab 4 | Tab 5 |
|---|---|---|---|---|---|
| `SHOPKEEPER` | Dashboard | Sales | Scan | Finance | Account |
| `MECHANIC` | Dashboard | Jobs | QRScanner | History | Account |
| `delivery_agent` | Dashboard | Trips | Transport | History | Profile |
| `customer` | Home | Scan | QR | Wallet | Profile |

**Custom Tab Bar Rules:**
- Active tab shows icon inside a rounded `primaryLight` background pill.
- Center tab (index 2) is always a floating elevated circle in `primary` color.
- Inactive tabs show icon only, no background, `textSecondary` color.
- Tab bar background: `colors.surface`, elevation: `8`, borderTopWidth: `1`, borderTopColor: `colors.border`.

---

## State Management — RTK Query

### Every feature owns its API slice

```typescript
// ✅ Correct — in features/profile/api/profileApi.ts
export const profileApi = rootApi.injectEndpoints({
  endpoints: builder => ({
    getShopkeeperProfile: builder.query<ApiResponse<ShopkeeperProfileResponse>, void>({
      query:        () => ({url: '/v1/shopkeepers/profile'}),
      providesTags: ['Profile'],
    }),
  }),
  overrideExisting: true,
});

// ❌ Wrong — putting profile endpoint inside authApi.ts
```

### API Response Pattern

All endpoints return `ApiResponse<T>`:

```typescript
interface ApiResponse<T> {
  success: boolean;
  data:    T;
  message: string;
}
```

Access data via:
```typescript
const {data: profileData} = useGetShopkeeperProfileQuery();
const profile = profileData?.data; // T
```

### Strict API Response Data Handling — No Fallback Values

Do NOT use default mock fallbacks or hardcoded default strings/numbers/objects when API data is loading, missing, or undefined:

```typescript
// ❌ WRONG — Do NOT use fallback default values or chains
const ownerName = profile?.ownerName ?? authUser?.name ?? 'User';
const rating = item?.rating || 4.8;
const price = item?.offeredPrice || 500;

// ✅ CORRECT — Use exact response payload directly
const ownerName = profile?.ownerName;
const rating = item?.rating;
const price = item?.offeredPrice;
```

Only use what the API returns in the response. If data is absent, render the field cleanly or handle non-blocking state without inventing mock values.

---

## Coding Standards

### TypeScript

- Strict mode enabled — no `any` types except for third-party `@ts-ignore` shims.
- All component props must have an explicit `interface` or `type`.
- All hook return values must have an explicit `interface`.
- Never use `useState` for server data — use RTK Query.

### Component Structure Order

```typescript
// 1. JSDoc block
// 2. Imports (React → RN → navigation → store → theme → shared → local)
// 3. Types / Interfaces
// 4. Component function
//    4a. Theme destructuring
//    4b. Hook calls
//    4c. Derived display values
//    4d. Handlers (if not in hook)
//    4e. Render data arrays
//    4f. return JSX
// 5. StyleSheet.create({}) — all rules as single-line entries
```

### StyleSheet Rules

```typescript
// ✅ Single-line compact style — project standard
const styles = StyleSheet.create({
  container:    {flex: 1},
  header:       {flexDirection: 'row', height: 56, alignItems: 'center'},
  rowItem:      {flexDirection: 'row', alignItems: 'center', paddingVertical: 14},
});

// ❌ Multi-line per style — too verbose, inconsistent
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
```

### Naming Conventions

| Type | Convention | Example |
|---|---|---|
| Components | PascalCase | `AppButton`, `ProfileHeaderCard` |
| Hooks | camelCase with `use` prefix | `useShopkeeperProfile` |
| API files | camelCase + `Api` suffix | `profileApi`, `dashboardApi` |
| Screen files | PascalCase + `Screen` suffix | `ShopkeeperProfileScreen` |
| Types/Interfaces | PascalCase | `ShopkeeperProfileResponse` |
| Style objects | camelCase keys | `headerTitle`, `rowIconWrap` |
| Constants | SCREAMING_SNAKE_CASE | `STAT_CARDS`, `QUICK_ACTIONS` |

### File Docblock — Required on every file

```typescript
/**
 * @file MyScreen.tsx
 * @feature Profile / Screens
 * @responsibility One-line description of what this file owns.
 */
```

### Import Aliases — Always use, never relative

```typescript
// ✅ Correct
import {AppText}   from '@shared/components/atoms/AppText';
import {useTheme}  from '@theme/ThemeContext';
import {rootApi}   from '@store/api/rootApi';

// ❌ Wrong
import {AppText} from '../../../shared/components/atoms/AppText';
```

---

## Shadows

Use soft, subtle shadows. Never use heavy drop shadows.

```typescript
// Standard card shadow
{
  elevation:    4,
  shadowColor:  '#000',
  shadowOffset: {width: 0, height: 4},
  shadowOpacity: 0.05,
  shadowRadius: 12,
}

// Subtle row/item shadow
{
  elevation:    1,
  shadowColor:  '#000',
  shadowOffset: {width: 0, height: 1},
  shadowOpacity: 0.02,
  shadowRadius: 4,
}
```

---

## Empty / Error / Loading States

Every screen that fetches data must implement all three states.

### Non-blocking Error (preferred)

Show a slim inline banner — do not replace the whole screen:

```tsx
{hasError && (
  <View style={[styles.errorBanner, {backgroundColor: colors.dangerLight, borderRadius: radius.sm}]}>
    <Icon name="alert-circle" size={14} color={colors.danger} />
    <AppText variant="caption" style={{color: colors.danger, flex: 1}}>
      Could not load data.
    </AppText>
    <TouchableOpacity onPress={refetch}>
      <AppText variant="caption" style={{color: colors.danger, fontWeight: '700'}}>Retry</AppText>
    </TouchableOpacity>
  </View>
)}
```

### Loading — use `AppSkeleton` or `ActivityIndicator`

```tsx
{isLoading && <ActivityIndicator size="small" color={colors.primary} />}
```

### Full-screen error (only for completely empty states)

```tsx
<View style={[styles.center, {backgroundColor: colors.background, padding: 24}]}>
  <Icon name="alert-triangle" size={48} color={colors.danger} />
  <AppText variant="headingMd" color="textPrimary">Something went wrong</AppText>
  <AppButton label="Retry" onPress={refetch} variant="primary" style={{marginTop: 16}} />
</View>
```

---

## Dark Mode

- Always consume colors from `useTheme()` — they automatically switch in dark mode.
- Never hardcode `#FFFFFF` or `#000000` except for text on colored backgrounds (e.g. `initialsText` on a primary circle).
- Use `isDark` from `useTheme()` only for conditional icons (e.g. `sun` vs `moon`).
- Theme toggle must use a `Switch` component connected to `setThemeMode('light' | 'dark')`.

---

## Performance

- Screens use `ScrollView` with `showsVerticalScrollIndicator={false}`.
- Long lists use `FlatList` with `keyExtractor` — never `map()` inside `ScrollView` for > 20 items.
- Memoize expensive derived data with `useMemo`.
- Static data arrays (quick actions, menu rows) are declared **outside** the component function to avoid re-allocation on every render.
- All static constants are typed with explicit interfaces.

---

## Accessibility

- All touchable elements: minimum touch target `44×44px`.
- All `TouchableOpacity` must have an `activeOpacity` of `0.75` or `0.8`.
- Icon-only buttons must have an `accessibilityLabel`.
- Input fields must have a `label` prop — never placeholder-only inputs.

---

## Anti-Patterns — Never Do These

| ❌ Anti-Pattern | ✅ Correct Approach |
|---|---|
| Hardcode colors (`#2719A3`) | Use `colors.primary` from theme |
| Use `<Text>` from react-native | Use `<AppText variant="...">` |
| Put API endpoints in wrong feature | Each feature owns its own `api/` file |
| Business logic in screen component | Extract to `hooks/` |
| `useState` for server data | Use RTK Query |
| `marginTop: 13` | Use `spacing[3]` = 12 or `spacing[3.5]` = 14 |
| Mixed icon libraries | Only `react-native-vector-icons/Feather` |
| Deep relative import `../../../shared` | Use `@shared/...` alias |
| Duplicate StyleSheet rules | Extract to `commonStyles` |
| Duplicate form field logic | Use `FormInput` / `FormSelect` |
| Blocking screen on API error | Show inline non-blocking banner |
| No barrel `index.ts` in feature | Every feature needs `index.ts` |

---

## AI Code Generation Instructions

When generating any UI screen or component:

1. **Check this document first** — every token, component, and pattern is defined here.
2. **Use `<AppText>` always** — never `<Text>`.
3. **Use `colors.*` always** — never hex strings.
4. **Use `commonStyles.*` for form layouts** — never reinvent spacing.
5. **Use `FormInput` + `FormSelect`** inside React Hook Form screens.
6. **Screens must be thin** — extract all logic to `hooks/`.
7. **Each feature owns its API** — inject into `rootApi`, never cross-feature.
8. **Every feature needs `index.ts`** — barrel exports only from the feature root.
9. **StyleSheet rules are single-line** — compact format, no multi-line style objects.
10. **Think like a Senior Engineer at Stripe** — consistent, readable, maintainable.

The goal is **one consistent enterprise design language** across every screen in the application.

---

## Role Identity System

Version: 2.1 — Added July 2026

### Problem

When a single app serves multiple roles (SHOPKEEPER, MECHANIC, etc.) users cannot
determine which interface they are in at a glance. This violates enterprise UX standards.

### Solution — 3-Layer Role Identity

**Layer 1 — Role Color Palette (Global, automatic)**
Each role has its own primary color injected at the theme level. Every screen that
consumes `colors.primary` from `useTheme()` automatically reflects the role color —
no per-screen code required.

**Layer 2 — Role Identity Badge (Dashboard headers)**
A persistent frosted-glass pill chip in every dashboard header showing the role label
and icon. Always the first visual element under the status bar.

**Layer 3 — Tab Bar Role Accent**
The floating center button and active tab pill already consume `colors.primary` from the
`CustomTabBar` — they change automatically when the role palette is applied.

---

### Role Color Tokens

| Role | Primary | PrimaryLight | PrimaryDark | Rationale |
|---|---|---|---|---|
| `SHOPKEEPER` | `#2719A3` | `#EEF0FF` | `#1E1380` | Commerce, trust, royal indigo |
| `MECHANIC` | `#047857` | `#D1FAE5` | `#065F46` | Field service, emerald energy |
| _(default)_ | `#6366F1` | `#E0E7FF` | `#4338CA` | Fallback brand indigo |

Dark mode variants are defined in `src/theme/roleTheme.ts` and applied automatically.

---

### Files — Role Identity Architecture

| File | Role |
|---|---|
| `src/theme/roleTheme.ts` | Defines `getRoleColors()` and `getRoleIdentity()` |
| `src/theme/ThemeContext.tsx` | Reads `auth.user.role` from Redux; merges role colors into resolved theme |
| `src/theme/index.ts` | Barrel-exports `getRoleColors` and `getRoleIdentity` |

---

### `getRoleColors(role, isDark)` — Usage

Returns `Partial<AppColors>` merged on top of the base theme inside `ThemeContext`.
**Never call this from screens.** It is automatically applied when `ThemeProvider` renders.

```typescript
// src/theme/roleTheme.ts
export function getRoleColors(role: UserRole | undefined, isDark: boolean): Partial<AppColors>;
```

### `getRoleIdentity(role)` — Usage

Returns `{label: string; icon: string}` for use in Role Identity Badge components.

```typescript
import {getRoleIdentity} from '@theme/index';

const {label, icon} = getRoleIdentity('SHOPKEEPER');
// → {label: 'Shopkeeper Portal', icon: 'shopping-bag'}

const {label, icon} = getRoleIdentity('MECHANIC');
// → {label: 'Mechanic App', icon: 'tool'}
```

---

### Role Identity Badge — Pattern

Add this to any role-specific dashboard header. Always place it as the **first child**
of the header left column, above the greeting text.

```tsx
import {getRoleIdentity} from '@theme/index';

{/* Role Identity Badge */}
<View style={styles.roleBadge}>
  <Icon name={getRoleIdentity(role).icon} size={10} color={colors.textOnPrimary} />
  <AppText variant="caption" style={[styles.roleBadgeText, {color: colors.textOnPrimary}]}>
    {getRoleIdentity(role).label}
  </AppText>
</View>
```

```typescript
// StyleSheet entries — always single-line, always in this exact shape
roleBadge:     {flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,0.18)', alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 20, marginBottom: 6},
roleBadgeText: {fontWeight: '600', opacity: 0.95},
```

---

### Adding a New Role

1. Open `src/theme/roleTheme.ts`
2. Add a palette constant for the new role (light + dark variants)
3. Add a `case 'NEW_ROLE':` block in `getRoleColors()` returning the palette
4. Add a `case 'NEW_ROLE':` block in `getRoleIdentity()` returning `{label, icon}`
5. Add the Role Identity Badge to the new role's dashboard header
6. Update this section of DESIGN_SYSTEM.md with the new role's color row

**Never** add role-specific colors anywhere outside `roleTheme.ts`.
**Never** hardcode role check logic in screens — use `getRoleIdentity(role)` always.

---

### Rules

| ❌ Anti-Pattern | ✅ Correct Approach |
|---|---|
| `role === 'MECHANIC' ? '#047857' : '#2719A3'` in a screen | Use `colors.primary` from `useTheme()` |
| Hardcode role label string in dashboard header | Use `getRoleIdentity(role).label` |
| Put role color in a feature's local file | All role colors live in `src/theme/roleTheme.ts` |
| Add a new role color without updating DESIGN_SYSTEM.md | Always update this doc when adding roles |