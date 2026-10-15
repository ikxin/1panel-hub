import { useState } from 'react'
import { getChangedSettings, getSettingValues, saveSettings } from '../lib/settings'
import type { NodeConfig } from '../lib/nodes'
import type { SettingField, SettingValues } from '../types/settings'
import { usePanelMutation } from './usePanelMutation'

export function useSettingsForm(
  node: NodeConfig,
  fields: SettingField[],
  values: Record<string, unknown>,
) {
  const [initialValues] = useState(() => getSettingValues(fields, values))
  const [savedValues, setSavedValues] = useState(initialValues)
  const [draft, setDraft] = useState(initialValues)
  const mutation = usePanelMutation()
  const changed = getChangedSettings(fields, draft, savedValues)

  const save = (nextValues: SettingValues) =>
    mutation.run((signal) =>
      saveSettings(
        node,
        getChangedSettings(fields, nextValues, savedValues),
        nextValues,
        signal,
        (field, value) => {
          setSavedValues((previous) => ({ ...previous, [field.field]: value }))
        },
      ),
    )

  return {
    initialValues,
    savedValues,
    changed,
    busy: mutation.busy,
    error: mutation.error,
    setDraft,
    save,
  }
}
