/**
 * React 19 compatibility shim for react-dom/test-utils
 *
 * React 19 moved `act` from `react-dom/test-utils` to the `react` package.
 * This shim re-exports React's act to ensure @testing-library/react works correctly.
 */

export { act } from 'react'
