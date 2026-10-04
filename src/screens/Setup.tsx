import { useId, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { AnimatePresence, Reorder, motion, useDragControls } from 'motion/react'
import { useGame } from '../app/useGame'
import { Button, ScreenLayout } from '../components'
import { canStart, validatePlayerName } from '../game/engine'
import { MAX_NAME_LENGTH, MAX_PLAYERS, MIN_PLAYERS, type Player } from '../game/types'
import { springUi } from '../theme/motion'
import './Setup.css'

export function Setup() {
  const { state, dispatch } = useGame()
  const { players } = state
  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const draggingId = useRef<string | null>(null)
  const inputId = useId()
  const errorId = useId()
  const full = players.length >= MAX_PLAYERS
  const missing = Math.max(0, MIN_PLAYERS - players.length)

  const add = (event: FormEvent) => {
    event.preventDefault()
    if (full) return
    const problem = validatePlayerName(players, name)
    setError(problem)
    if (problem) return
    dispatch({ type: 'addPlayer', name })
    setName('')
  }

  const move = (id: string, toIndex: number) => dispatch({ type: 'movePlayer', id, toIndex })

  const onReorder = (next: Player[]) => {
    const id = draggingId.current
    if (id) move(id, next.findIndex((p) => p.id === id))
  }

  return (
    <ScreenLayout
      className="setup"
      header={
        <>
          <span className="eyebrow">Tonight's contestants</span>
          <h1 className="title">Who's playing?</h1>
        </>
      }
      actions={
        <>
          <p className="setup__status small center" aria-live="polite">
            {missing > 0 ? `Add ${missing} more ${missing === 1 ? 'player' : 'players'} to start.` : 'The stage is set.'}
          </p>
          <Button block disabled={!canStart(players)} onClick={() => dispatch({ type: 'startGame' })}>
            Start the show
          </Button>
          <Button variant="ghost" size="md" onClick={() => dispatch({ type: 'goHome' })}>
            Back
          </Button>
        </>
      }
    >
      <form className="setup__form" onSubmit={add} noValidate>
        <label htmlFor={inputId} className="visually-hidden">
          Player name
        </label>
        <div className="setup__field">
          <input
            id={inputId}
            className="setup__input"
            value={name}
            onChange={(event) => {
              setName(event.target.value)
              setError(null)
            }}
            placeholder={full ? 'Full house' : 'Add a name'}
            maxLength={MAX_NAME_LENGTH}
            autoComplete="off"
            autoCapitalize="words"
            enterKeyHint="done"
            disabled={full}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
          />
          <Button type="submit" size="md" variant="secondary" disabled={full} className="setup__add">
            Add
          </Button>
        </div>
        {error && (
          <motion.p
            id={errorId}
            role="alert"
            className="setup__error"
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={springUi}
          >
            {error}
          </motion.p>
        )}
      </form>

      <div className="setup__count" aria-label={`${players.length} of ${MAX_PLAYERS} players`}>
        <span className="setup__count-text">
          <strong>{players.length}</strong> / {MAX_PLAYERS} players
        </span>
        <span className="setup__pips" aria-hidden="true">
          {Array.from({ length: MAX_PLAYERS }, (_, i) => (
            <span
              key={i}
              className={`setup__pip${i < players.length ? ' setup__pip--on' : ''}${i === MIN_PLAYERS - 1 ? ' setup__pip--min' : ''}`}
            />
          ))}
        </span>
      </div>

      {players.length > 0 ? (
        <Reorder.Group axis="y" as="ol" values={players} onReorder={onReorder} className="setup__list">
          <AnimatePresence initial={false}>
            {players.map((player, index) => (
              <PlayerRow
                key={player.id}
                player={player}
                index={index}
                last={index === players.length - 1}
                onMove={move}
                onRemove={() => dispatch({ type: 'removePlayer', id: player.id })}
                onDragStart={() => (draggingId.current = player.id)}
                onDragEnd={() => (draggingId.current = null)}
              />
            ))}
          </AnimatePresence>
        </Reorder.Group>
      ) : (
        <p className="setup__empty faint center">No contestants yet. Add at least {MIN_PLAYERS}.</p>
      )}
    </ScreenLayout>
  )
}

interface PlayerRowProps {
  player: Player
  index: number
  last: boolean
  onMove: (id: string, toIndex: number) => void
  onRemove: () => void
  onDragStart: () => void
  onDragEnd: () => void
}

function PlayerRow({ player, index, last, onMove, onRemove, onDragStart, onDragEnd }: PlayerRowProps) {
  const controls = useDragControls()
  return (
    <Reorder.Item
      value={player}
      dragListener={false}
      dragControls={controls}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="setup__row"
      initial={{ opacity: 0, y: -8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -40, transition: { duration: 0.16 } }}
      whileDrag={{ scale: 1.03, boxShadow: 'var(--shadow-lift), var(--glow-gold)' }}
      transition={springUi}
    >
      <span className="setup__grip" aria-hidden="true" onPointerDown={(event) => controls.start(event)}>
        <svg viewBox="0 0 12 20">
          {[3, 10, 17].map((y) => (
            <g key={y}>
              <circle cx="3" cy={y} r="1.6" />
              <circle cx="9" cy={y} r="1.6" />
            </g>
          ))}
        </svg>
      </span>
      <span className="setup__number">{index + 1}</span>
      <span className="setup__name">{player.name}</span>
      <span className="setup__row-actions">
        <IconButton label={`Move ${player.name} up`} disabled={index === 0} onClick={() => onMove(player.id, index - 1)}>
          <path d="M6 15l6-6 6 6" />
        </IconButton>
        <IconButton label={`Move ${player.name} down`} disabled={last} onClick={() => onMove(player.id, index + 1)}>
          <path d="M6 9l6 6 6-6" />
        </IconButton>
        <IconButton label={`Remove ${player.name}`} tone="danger" onClick={onRemove}>
          <path d="M7 7l10 10M17 7L7 17" />
        </IconButton>
      </span>
    </Reorder.Item>
  )
}

interface IconButtonProps {
  label: string
  disabled?: boolean
  tone?: 'danger'
  onClick: () => void
  children: ReactNode
}

function IconButton({ label, disabled, tone, onClick, children }: IconButtonProps) {
  return (
    <button
      type="button"
      className={`setup__icon-btn${tone ? ` setup__icon-btn--${tone}` : ''}`}
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true">
        {children}
      </svg>
    </button>
  )
}
