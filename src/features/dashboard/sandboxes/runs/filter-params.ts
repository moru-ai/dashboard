import {
  createLoader,
  parseAsArrayOf,
  parseAsString,
  parseAsStringEnum,
} from 'nuqs/server'

export const sandboxRunsFilterParams = {
  statuses: parseAsArrayOf(parseAsStringEnum(['running', 'paused', 'stopped'])),
  search: parseAsString,
}

export const loadSandboxRunsFilters = createLoader(sandboxRunsFilterParams)
