import { describe, it, expect } from 'vitest'
import { cn } from '@/core/utils/utils'

describe('cn utility', () => {
    it('merges tailwind classes cleanly', () => {
        const output = cn('px-2 py-1', 'bg-red-500', { 'text-white': true, 'text-black': false })
        expect(output).toContain('px-2')
        expect(output).toContain('bg-red-500')
        expect(output).toContain('text-white')
        expect(output).not.toContain('text-black')
    })

    it('resolves tailwind merge conflicts intelligently', () => {
        const output = cn('px-2 py-1', 'p-4')
        // p-4 overrides px-2 and py-1 in tailwind-merge
        expect(output).toBe('p-4')
    })
})
