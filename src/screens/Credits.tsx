import { useGame } from '../app/useGame'
import { Button, ScreenLayout } from '../components'
import './Credits.css'

export function Credits() {
  const { stages, dispatch } = useGame()

  return (
    <ScreenLayout
      className="credits"
      header={
        <>
          <span className="eyebrow">Behind the velvet rope</span>
          <h1 className="title">Credits &amp; sources</h1>
        </>
      }
      actions={
        <Button variant="secondary" block onClick={() => dispatch({ type: 'goHome' })}>
          Back to the show
        </Button>
      }
    >
      <section className="card stack-sm">
        <p>
          This is a comedy game with real science. The premise is ridiculous. The facts are not: every one comes from
          the sources below.
        </p>
        <p className="muted small">Portraits are AI-generated artistic reconstructions.</p>
      </section>

      <div className="rule" aria-hidden="true">
        ✦
      </div>

      <section className="stack-lg" aria-label="Science sources">
        {stages.map((stage, index) => (
          <article key={stage.id} className="credits__stage">
            <header className="credits__stage-head">
              <span className="credits__number">{String(index + 1).padStart(2, '0')}</span>
              <div>
                <h2 className="credits__species">{stage.species}</h2>
                {stage.nickname && <p className="credits__nickname rose">“{stage.nickname}”</p>}
              </div>
            </header>
            <ul className="credits__sources">
              {stage.sources.map((source) => (
                <li key={source.url + source.claim}>
                  <span className="credits__claim">{source.claim}</span>
                  <a href={source.url} target="_blank" rel="noopener noreferrer" className="credits__link">
                    {hostOf(source.url)}
                  </a>
                </li>
              ))}
            </ul>
            <p className="faint small">Last checked {stage.lastChecked}</p>
          </article>
        ))}
      </section>

      <p className="faint small center">
        Type set in Fraunces and Inter. No hominins were harmed. Several egos may be.
      </p>
    </ScreenLayout>
  )
}

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '')
  } catch {
    return url
  }
}
