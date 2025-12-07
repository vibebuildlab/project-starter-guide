import '@testing-library/jest-dom'
import { vi } from 'vitest'

/**
 * React 19 compatibility fix for @testing-library/react
 *
 * The react-dom/test-utils module is redirected via vitest.config.ts alias
 * to our test-utils-shim.ts which re-exports React 19's act.
 */
;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true

vi.mock('next/link', () => {
  return {
    default: ({ children, href, ...rest }: React.PropsWithChildren<{ href: string }>) => (
      <a href={href} {...rest}>
        {children}
      </a>
    ),
  }
})

vi.mock('next/router', () => ({
  useRouter: () => ({
    push: vi.fn(),
    prefetch: vi.fn(),
  }),
}))
