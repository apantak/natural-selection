import { useId } from 'react'
import type { Vote } from '../game/types'
import { nameFit } from './nameFit'
import './VoteChoice.css'

export interface VoteChoiceProps {
  name: string
  value?: Vote
  onChange: (vote: Vote) => void
}

const OPTIONS = [
  { vote: 'accept', icon: '🦴', label: 'Accept' },
  { vote: 'cutoff', icon: '✂️', label: 'Cut off' },
] as const

export function VoteChoice({ name, value, onChange }: VoteChoiceProps) {
  const id = useId()
  return (
    <div className="vote-choice" data-vote={value} role="radiogroup" aria-labelledby={`${id}-name`}>
      <div className="vote-choice__who">
        <span id={`${id}-name`} className="vote-choice__name" style={nameFit(name)}>
          {name}
        </span>
      </div>
      <div className="vote-choice__options">
        {OPTIONS.map((option) => (
          <label
            key={option.vote}
            className={`vote-choice__option vote-choice__option--${option.vote}`}
            data-checked={value === option.vote || undefined}
          >
            <input
              type="radio"
              name={id}
              value={option.vote}
              checked={value === option.vote}
              onChange={() => onChange(option.vote)}
            />
            <span className="vote-choice__icon" aria-hidden="true">
              {option.icon}
            </span>
            <span className="vote-choice__label">{option.label}</span>
          </label>
        ))}
      </div>
    </div>
  )
}
