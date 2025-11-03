import React, { useState, InputHTMLAttributes, useEffect, useRef } from 'react'
import Hangul from 'hangul-js'
import { convertEngToKor } from '../lib/en2kr'
import { Kbd } from './kbd'

interface HangulInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string
    onChange: (newValue: string) => void
}
export default function HangulInput({ value, onChange, ...props }: HangulInputProps) {
    const [inputMode, setInputMode] = useState<'ko' | 'en'>('ko')
    const inputRef = useRef<HTMLInputElement>(null)

    useEffect(() => {
        if (props.autoFocus && inputRef.current) {
            inputRef.current.focus()
        }
    }, [props.autoFocus])

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'HangulMode' || (e.shiftKey && e.code === 'Space')) {
            e.preventDefault()
            setInputMode((prev) => (prev === 'ko' ? 'en' : 'ko'))
            return
        }

        if (e.ctrlKey || e.altKey || e.metaKey) {
            return
        }

        if (e.key === 'Backspace') {
            e.preventDefault()
            let newValue = ''
            if (inputMode === 'ko' && value.length > 0) {
                const disassembled = Hangul.disassemble(value)
                newValue = Hangul.assemble(disassembled.slice(0, -1))
            } else if (inputMode === 'en' && value.length > 0) {
                newValue = value.slice(0, -1)
            }
            onChange(newValue)
            return
        }

        if (e.key.length === 1) {
            e.preventDefault()
            let newValue = value

            // 기본적으로 lower로 처리, shift키가 입력되었을때 대문자로 처리
            if (inputMode === 'ko' && e.key.match(/[a-zA-Z]/)) {
                const isShift = e.shiftKey
                const word = e.key.toLowerCase()
                let korChar = convertEngToKor(word)
                if (isShift) {
                    const upperCase = e.key.toUpperCase()
                    korChar = convertEngToKor(upperCase)
                }

                newValue = Hangul.assemble([...Hangul.disassemble(value), korChar])
            } else {
                newValue = value + e.key
            }
            onChange(newValue)
            return
        }
    }

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault()
        const pastedText = e.clipboardData.getData('text')
        onChange(value + pastedText)
    }

    return (
        <div className="relative w-full">
            <input spellCheck={false} ref={inputRef} {...props} value={value} onKeyDown={handleKeyDown} onPaste={handlePaste} onChange={(e) => onChange(e.target.value)} autoComplete="off" />
            <Kbd className="absolute top-1/2 right-4 -translate-y-1/2 bg-transparent">Ctrl + ⏎</Kbd>
        </div>
    )
}
