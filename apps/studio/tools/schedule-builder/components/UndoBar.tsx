import {useEffect} from 'react'
import {Card, Flex, Text, Button} from '@sanity/ui'
import {UndoIcon} from '@sanity/icons'

export interface UndoEntry {
  label: string
  run: () => void
}

interface UndoBarProps {
  undo: UndoEntry
  onUndo: () => void
  onDismiss: () => void
}

const AUTO_DISMISS_MS = 8000

/** Floating bar offering to undo the last schedule mutation */
export function UndoBar({undo, onUndo, onDismiss}: UndoBarProps) {
  useEffect(() => {
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS)
    return () => clearTimeout(timer)
  }, [undo, onDismiss])

  return (
    <Card
      padding={2}
      paddingLeft={3}
      radius={3}
      shadow={3}
      style={{
        position: 'absolute',
        bottom: 16,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 20,
      }}
    >
      <Flex align="center" gap={3}>
        <Text size={1} textOverflow="ellipsis" style={{maxWidth: 'min(320px, 55vw)'}}>
          {undo.label}
        </Text>
        <Button
          icon={UndoIcon}
          text="Undo"
          mode="ghost"
          fontSize={1}
          padding={2}
          onClick={onUndo}
        />
      </Flex>
    </Card>
  )
}
