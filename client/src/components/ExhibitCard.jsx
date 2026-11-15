import { getExhibitStyleClasses, resolveExhibitStyle } from '../styles/exhibitStyles'
import './ExhibitCard.css'

const decorationMarks = {
  none: '',
  stars: '\u2726  \u00b7  \u2727',
  dots: '\u2022  \u00b7  \u2022',
  botanical: '\u2747'
}

function ExhibitCard({ exhibit, onDeleteRequest, isDeleting = false }) {
  const style = resolveExhibitStyle(exhibit?.styleConfig)
  const tags = Array.isArray(exhibit?.tags) ? exhibit.tags.slice(0, 4) : []

  function handleDeleteClick(event) {
    event.stopPropagation()
    onDeleteRequest(exhibit)
  }

  return (
    <article className={`exhibit-card ${getExhibitStyleClasses(style)}`}>
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
      <p className="exhibit-card__description">{exhibit.description}</p>

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