import React, { useState, TextareaHTMLAttributes, useEffect, useRef } from 'react';
import Hangul from 'hangul-js';
import { convertEngToKor } from '../lib/en2kr';

interface HangulTextAreaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange'> {
    value: string;
    onChange: (newValue: string) => void;
}

export function HangulTextArea({ value, onChange, ...props }: HangulTextAreaProps) {
    const [inputMode, setInputMode] = useState<'ko' | 'en'>('ko');
    const textAreaRef = useRef<HTMLTextAreaElement>(null);
    const cursorRef = useRef<number | null>(null);

    useEffect(() => {
        if (cursorRef.current !== null && textAreaRef.current) {
            textAreaRef.current.setSelectionRange(cursorRef.current, cursorRef.current);
            cursorRef.current = null;
        }
    }, [value]);

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'HangulMode' || (e.shiftKey && e.code === 'Space')) {
            e.preventDefault();
            setInputMode((prev) => (prev === 'ko' ? 'en' : 'ko'));
            return;
        }

        if (e.ctrlKey && (e.key === 'a' || e.key === 'A')) {
            return;
        }

        const input = textAreaRef.current;
        if (!input) {
            return;
        }

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;
        const isSelected = start !== end;

        if (e.key === 'Backspace') {
            if (isSelected) {
                e.preventDefault();
                const newValue = value.substring(0, start) + value.substring(end);
                onChange(newValue);
                cursorRef.current = start;
                return;
            }

            if (inputMode === 'ko' && value.substring(0, start).length > 0) {
                e.preventDefault();
                const textBefore = value.substring(0, start);
                const textAfter = value.substring(end);
                const lastChar = textBefore.slice(-1);
                const prefix = textBefore.slice(0, -1);
                const disassembled = Hangul.disassemble(lastChar);

                let newTextBefore = prefix;
                if (disassembled.length > 1) {
                    disassembled.pop();
                    newTextBefore += Hangul.assemble(disassembled);
                }

                onChange(newTextBefore + textAfter);
                cursorRef.current = newTextBefore.length;
                return;
            }
        }

        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey) {
            e.preventDefault();

            let newValue = '';
            let nextCursorPos = 0;

            const textBefore = isSelected ? value.substring(0, start) : value.substring(0, start);
            const textAfter = isSelected ? value.substring(end) : value.substring(end);

            if (inputMode === 'ko' && /[a-zA-Z]/.test(e.key)) {
                const korJamo = convertEngToKor(e.shiftKey ? e.key.toUpperCase() : e.key.toLowerCase());

                const lastChar = textBefore.slice(-1);
                const prefix = textBefore.slice(0, -1);

                if (!isSelected && (Hangul.isComplete(lastChar) || Hangul.isConsonant(lastChar) || Hangul.isVowel(lastChar))) {
                    const disassembled = Hangul.disassemble(lastChar);
                    const assembled = Hangul.assemble([...disassembled, korJamo]);
                    newValue = prefix + assembled + textAfter;
                    nextCursorPos = prefix.length + assembled.length;
                } else {
                    newValue = textBefore + korJamo + textAfter;
                    nextCursorPos = textBefore.length + 1;
                }
            } else {
                newValue = textBefore + e.key + textAfter;
                nextCursorPos = textBefore.length + 1;
            }

            onChange(newValue);
            cursorRef.current = nextCursorPos;
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
        e.preventDefault();
        const pastedText = e.clipboardData.getData('text');
        const input = textAreaRef.current;
        if (!input) {
            return;
        }

        const start = input.selectionStart || 0;
        const end = input.selectionEnd || 0;

        const newValue = value.substring(0, start) + pastedText + value.substring(end);
        onChange(newValue);
        cursorRef.current = start + pastedText.length;
    };

    return (
        <div className="relative w-full">
            <textarea
                spellCheck={false}
                ref={textAreaRef}
                {...props}
                value={value}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                autoComplete="off"
                className={`w-full resize-none focus:outline-none ${props.className}`}
            />
            <div className="pointer-events-none absolute right-3 bottom-3 flex items-center gap-2 select-none">
                <div className="rounded border border-zinc-200 bg-white px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">{inputMode === 'ko' ? '한' : 'A'}</div>
            </div>
        </div>
    );
}
