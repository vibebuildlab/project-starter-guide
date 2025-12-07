# Mobile App Template - Claude Guide

> React Native Expo starter with TypeScript and file-based routing.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | React Native 0.81, Expo 54 |
| Language | TypeScript |
| Navigation | Expo Router (file-based) |
| Testing | Jest + jest-expo |

## Key Commands

```bash
npm start             # Expo dev server
npm run ios           # iOS simulator
npm run android       # Android emulator
npm test              # All tests
npm run test:watch    # Watch mode
```

## Project Structure

```
mobile-app/
├── app/              # Expo Router pages (file-based)
│   ├── (tabs)/      # Tab navigator
│   └── _layout.tsx  # Root layout
├── components/       # Reusable components
├── hooks/            # Custom hooks
├── constants/        # Colors, config
└── __tests__/        # Unit, integration, smoke
```

## Navigation

```typescript
import { router } from 'expo-router'

router.push('/profile')
router.push({ pathname: '/user/[id]', params: { id: '123' } })
router.back()
```

## Theming

```typescript
import { Colors } from '@/constants/Colors'
import { useColorScheme } from '@/hooks/useColorScheme'

const colorScheme = useColorScheme()
const bg = Colors[colorScheme ?? 'light'].background
```

## Platform-Specific Code

```typescript
import { Platform } from 'react-native'
{Platform.OS === 'ios' ? <IOSComponent /> : <AndroidComponent />}
```

Or use file extensions: `Component.ios.tsx`, `Component.android.tsx`

---
*Use ThemedView/ThemedText for consistency. Global rules in `~/.claude/CLAUDE.md`.*
