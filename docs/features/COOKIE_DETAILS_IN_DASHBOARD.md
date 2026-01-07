# Cookie Details Feature in Dashboard Preview

## Overview
The "View Cookies" feature has been integrated into both the live widget and the dashboard preview sections. This ensures that users can see exactly how the feature will appear on their website before deploying.

## Dashboard Integration

### 1. Cookie Widget Preview
**File**: `/app/dashboard/cookies/widget/page.tsx`

- Added "View Cookies" section in the live preview
- Located below the "Manage Preferences" section
- Styled to match the actual widget appearance
- Shows the button with proper theming (uses widget's primary color)

### 2. DPDPA Widget Preview
**File**: `/app/dashboard/dpdpa/widget/page.tsx`

- Added "View Cookies" section in the preview
- Consistent styling with the DPDPA widget design
- Includes icon and proper button styling
- Positioned between "Manage Preferences" and "Secure This Consent" sections

## Preview Features

### Visual Elements
- **Gray background**: Distinguishes it from other sections
- **Cookie icon**: Visual indicator for the feature
- **"View Cookies" button**: Interactive button styled with theme colors
- **Descriptive text**: "See all cookies used on this website"

### Styling
- Uses the widget's primary color for the button
- Responsive design that works on all screen sizes
- Consistent with the overall widget design language
- Hover effects and transitions for better UX

## Implementation Details

### Cookie Widget Preview Code
```tsx
{/* View Cookies Section - New Feature */}
<div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
  <div className="flex items-center justify-between gap-3">
    <div className="flex-1">
      <p className="text-xs font-medium text-gray-700">
        View Cookie Details
      </p>
      <p className="text-xs text-gray-500">
        See all cookies used on this website
      </p>
    </div>
    <button 
      className="px-3 py-1.5 text-xs font-medium transition-all hover:opacity-90 border-2"
      style={{
        backgroundColor: 'white',
        color: config.theme?.primaryColor || '#3b82f6',
        borderColor: config.theme?.primaryColor || '#3b82f6',
        borderRadius: `${config.theme?.borderRadius || 8}px`
      }}
    >
      View Cookies
    </button>
  </div>
</div>
```

### DPDPA Widget Preview Code
```tsx
{/* View Cookies Section - New Feature */}
<div className="p-3.5 bg-gradient-to-r from-gray-50 to-slate-50 rounded-xl mb-3 border border-gray-300 shadow-sm">
  <div className="flex items-center justify-between gap-3">
    <div className="flex-1">
      <p className="text-[11px] text-gray-700 m-0 mb-1 leading-tight font-bold">
        View Cookie Details
      </p>
      <p className="text-[10px] text-gray-600 m-0 leading-tight">
        See all cookies used on this website
      </p>
    </div>
    <button
      className="px-3.5 py-2 text-[11px] font-bold rounded-lg border-2 transition-all hover:shadow-lg flex items-center gap-1.5"
      style={{
        backgroundColor: 'white',
        color: config.theme.primaryColor,
        borderColor: config.theme.primaryColor
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
      </svg>
      View Cookies
    </button>
  </div>
</div>
```

## Benefits

1. **Visual Consistency**: The preview matches the actual widget exactly
2. **Real-time Updates**: Changes to theme colors are reflected immediately
3. **User Confidence**: Users know exactly what they're getting
4. **Better UX**: No surprises when deploying the widget

## Testing

To test the preview updates:

1. Navigate to the Cookie Widget configuration page
2. Click "Show Preview" 
3. The "View Cookies" section will be visible in the preview
4. Change theme colors to see the button update in real-time
5. Repeat for the DPDPA widget configuration page

## Future Enhancements

1. **Interactive Preview**: Make the "View Cookies" button functional in preview
2. **Mock Data**: Show sample cookie data in the preview modal
3. **Animation Preview**: Show the modal animation in the preview
4. **Responsive Testing**: Add device size switcher to preview
