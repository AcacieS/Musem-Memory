import { useState } from 'react'
import { getExhibitStyleClasses, resolveExhibitStyle } from '../styles/exhibitStyles'
import './ExhibitCard.css'

const decorationMarks = {
  none: '',
  stars: '\u2726  \u00b7  \u2727',
  dots: '\u2022  \u00b7  \u2022',
  botanical: '\u2747'
}

function ExhibitCard({ exhibit, onDeleteRequest, isDeleting = false }) {
  const [showOriginalMemory, setShowOriginalMemory] = useState(false)
  const hasOriginalText = typeof exhibit?.originalText === 'string' && exhibit.originalText.length > 0
  const style = resolveExhibitStyle(exhibit?.styleConfig)
  const tags = Array.isArray(exhibit?.tags) ? exhibit.tags.slice(0, 4) : []

  function handleDeleteClick(event) {
    event.stopPropagation()
    onDeleteRequest(exhibit)
  }

  function handleMemoryToggle(event) {
    event.stopPropagation()
    setShowOriginalMemory(current => !current)
  }
  return (
    <article className={`exhibit-card ${getExhibitStyleClasses(style)} ${showOriginalMemory ? 'exhibit-card--showing-original' : ''}`}>
      <span className="exhibit-card__decoration" aria-hidden="true">
        {decorationMarks[style.decoration]}
      </span>
      {onDeleteRequest && (
        <button
          type="button"
          className="exhibit-card__delete"
          aria-label={`Delete exhibit: ${exhibit.title}`}
          onClick={handleDeleteClick}
          disabled={isDeleting}
        >
          Delete
        </button>
      )}
      <p className="exhibit-card__eyebrow">EXHIBIT #{exhibit.id}</p>
      <h3 className="exhibit-card__title">{exhibit.title}</h3>
      {exhibit.subtitle && <h4 className="exhibit-card__subtitle">{exhibit.subtitle}</h4>}
      {showOriginalMemory && (
        <span className="exhibit-card__original-marker" role="status">
          ORIGINAL
        </span>
      )}
      <p className={`exhibit-card__description ${showOriginalMemory ? 'exhibit-card__description--original' : ''}`}>
        {showOriginalMemory ? exhibit.originalText : exhibit.description}
      </p>
      <button
        type="button"
        className="exhibit-card__memory-toggle"
        aria-label={showOriginalMemory ? 'Show AI-generated description' : 'Read original memory'}
        aria-pressed={showOriginalMemory}
        onClick={handleMemoryToggle}
        disabled={!hasOriginalText}
      >
        {!hasOriginalText
          ? 'Original memory unavailable'
          : showOriginalMemory
            ? 'Show AI Description'
            : 'Read Original Memory'}
      </button>

      {tags.length > 0 && (
        <div className="exhibit-card__tags" aria-label="Exhibit tags">
          {tags.map((tag, index) => (
            <span key={`${tag}-${index}`}>#{tag}</span>
          ))}
        </div>
      )}

      <small className="exhibit-card__date">
        {exhibit.createdAt ? new Date(exhibit.createdAt).toLocaleDateString() : ''}
      </small>
    </article>
  )
}

export default ExhibitCard