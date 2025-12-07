/**
 * React 19 compatibility shim for react-test-renderer
 *
 * React 19 moved `act` from `react-test-renderer` to the `react` package.
 * This shim re-exports the actual react-test-renderer but with React 19's act.
 */

const React = require('react')
const actualRenderer = require.requireActual('react-test-renderer')

module.exports = {
  ...actualRenderer,
  act: React.act,
}
