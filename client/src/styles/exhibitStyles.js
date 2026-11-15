// Controlled exhibit visual identities. Persisted values select these styles;
// they are never interpreted as CSS supplied by the model.
export const EXHIBIT_STYLE_OPTIONS = {
  palettes: ['warm', 'calm', 'dreamy', 'bright', 'minimal'],
  fonts: ['serif', 'sans-serif', 'handwritten'],
  borders: ['none', 'thin-solid', 'dashed'],
  decorations: ['none', 'stars', 'dots', 'botanical'],
  layouts: ['minimal', 'editorial', 'scrapbook', 'poster']
}

export const DEFAULT_EXHIBIT_STYLE = Object.freeze({
  palette: 'warm',
  font: 'serif',
  border: 'thin-solid',
  decoration: 'none',
  layout: 'minimal'
})

const optionForKey = {
  palette: 'palettes',
  font: 'fonts',
  border: 'borders',
  decoration: 'decorations',
  layout: 'layouts'
}

// Return a complete, known configuration even for old records, malformed JSON,
// or identifiers that are not part of this design system.
export function resolveExhibitStyle(styleConfig) {
  const config = styleConfig && typeof styleConfig === 'object' ? styleConfig : {}

  return Object.fromEntries(
    Object.entries(DEFAULT_EXHIBIT_STYLE).map(([key, fallback]) => [
      key,
      typeof config[key] === 'string' && EXHIBIT_STYLE_OPTIONS[optionForKey[key]].includes(config[key])
        ? config[key]
        : fallback
    ])
  )
}

export function getExhibitStyleClasses(styleConfig) {
  const style = resolveExhibitStyle(styleConfig)
  return `exhibit-card--${style.palette} exhibit-card--font-${style.font} exhibit-card--border-${style.border} exhibit-card--decoration-${style.decoration} exhibit-card--layout-${style.layout}`
}
