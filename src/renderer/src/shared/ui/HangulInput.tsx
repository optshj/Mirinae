import React, { useState, InputHTMLAttributes, useEffect, useRef } from 'react';
import Hangul from 'hangul-js';
import { convertEngToKor } from '../lib/en2kr';
import { Kbd } from './kbd';

interface HangulInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'> {
    value: string;
    onChange: (newValue: string) => void;
}
export default function HangulInput({ value, onChange, ...props }: HangulInputProps) {
    const [inputMode, setInputMode] = useState<'ko' | 'en'>('ko');
    const inputRef = useRef<HTMLInputElement>(null);
    const cursorRef = useRef<number | null>(null);

    useEffect(() => {
        if (cursorRef.current !== null && inputRef.current) {
            inputRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
            cursorRef.current = null;
        }
    }, [value]);

    useEffect(() => {
        if (props.autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [props.autoFocus]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'HangulMode' || (e.shiftKey && e.code === 'Space')) {
            e.preventDefault();
            setInputMode((prev) => (prev === 'ko' ? 'en' : 'ko'));
            return;
        }
        if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
            e.preventDefault();
            inputRef.current?.select();
            return;
        }
        if (e.ctrlKey || e.altKey || e.metaKey || e.key === 'Tab' || e.key === 'Enter' || e.key === 'Escape') {
            return;
        }

        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        // 현재 커서 기준 앞/뒤 문자열 분리
        const textBefore = value.substring(0, start);
        const textAfter = value.substring(end);

        if (e.key === 'Backspace') {
            e.preventDefault();

            if (start !== end) {
                const newValue = value.substring(0, start) + value.substring(end);
                onChange(newValue);
                cursorRef.current = start;
                return;
            }

            if (textBefore.length === 0) return;

            if (inputMode === 'ko') {
                const lastChar = textBefore.slice(-1);
                const prefix = textBefore.slice(0, -1);

                const disassembled = Hangul.disassemble(lastChar);

                let newTextBefore = prefix;

                if (disassembled.length > 1) {
                    disassembled.pop();
                    newTextBefore += Hangul.assemble(disassembled);
                }

                const newValue = newTextBefore + textAfter;
                onChange(newValue);
                cursorRef.current = newTextBefore.length;
            } else {
                const newValue = textBefore.slice(0, -1) + textAfter;
                onChange(newValue);
                cursorRef.current = start - 1;
            }
            return;
        }

        if (e.key.length === 1) {
            e.preventDefault();

            let charToInsert = e.key;
            let newValue = '';
            let nextCursorPos = 0;

            if (inputMode === 'ko' && /[a-zA-Z]/.test(e.key)) {
                const isShift = e.shiftKey;
                const inputChar = isShift ? e.key.toUpperCase() : e.key.toLowerCase();
                const korJamo = convertEngToKor(inputChar);

                const lastChar = textBefore.slice(-1);
                const prefix = textBefore.slice(0, -1);

                if (Hangul.isComplete(lastChar) || Hangul.isConsonant(lastChar) || Hangul.isVowel(lastChar)) {
                    const disassembled = Hangul.disassemble(lastChar);
                    const newJamos = [...disassembled, korJamo];
                    const assembled = Hangul.assemble(newJamos);

                    newValue = prefix + assembled + textAfter;

                    nextCursorPos = prefix.length + assembled.length;
                } else {
                    newValue = textBefore + korJamo + textAfter;
                    nextCursorPos = start + 1;
                }
            } else {
                newValue = textBefore + charToInsert + textAfter;
                nextCursorPos = start + 1;
            }

            onChange(newValue);
            cursorRef.current = nextCursorPos;
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const input = inputRef.current;
        if (!input) return;

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        const newValue = value.substring(0, start) + pastedText + value.substring(end);
        onChange(newValue);
        cursorRef.current = start + pastedText.length;
    };

    return (
        <div className="relative w-full">
            <input spellCheck={false} ref={inputRef} {...props} value={value} onKeyDown={handleKeyDown} onPaste={handlePaste} autoComplete="off" />
            <Kbd className="absolute top-1/2 right-12 -translate-y-1/2 bg-transparent">Ctrl + ⏎</Kbd>
            <div className="absolute top-1/2 right-4 -translate-y-1/2 rounded border px-1 text-xs text-gray-400">{inputMode === 'ko' ? '한' : 'A'}</div>
        </div>
    );
}
