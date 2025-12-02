import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { usePersistedState } from '@/hooks/usePersistedState';

const localStorageMock = (() => {
    let store: Record<string, string> = {};
    return {
        getItem: vi.fn((key: string) => store[key] || null),
        setItem: vi.fn((key: string, value: string) => {
            store[key] = value.toString();
        }),
        clear: vi.fn(() => {
            store = {};
        }),
        removeItem: vi.fn((key: string) => {
            delete store[key];
        }),
    };
})();

Object.defineProperty(window, 'localStorage', {
    value: localStorageMock,
});

describe('usePersistedState', () => {
    beforeEach(() => {
        window.localStorage.clear();
        vi.clearAllMocks();
    });

    it('should initialize with default value if localStorage is empty', () => {
        const { result } = renderHook(() => usePersistedState('test-key', 'default'));
        expect(result.current[0]).toBe('default');
        expect(window.localStorage.getItem).toHaveBeenCalledWith('test-key');
    });

    it('should initialize with value from localStorage', () => {
        window.localStorage.setItem('test-key', JSON.stringify('stored-value'));
        const { result } = renderHook(() => usePersistedState('test-key', 'default'));
        expect(result.current[0]).toBe('stored-value');
    });

    it('should update localStorage when state changes', () => {
        const { result } = renderHook(() => usePersistedState('test-key', 'default'));

        act(() => {
            result.current[1]('new-value');
        });

        expect(result.current[0]).toBe('new-value');
        expect(window.localStorage.setItem).toHaveBeenCalledWith('test-key', JSON.stringify('new-value'));
    });

    it('should handle complex objects', () => {
        const initialValue = { foo: 'bar' };
        const { result } = renderHook(() => usePersistedState('test-obj', initialValue));

        expect(result.current[0]).toEqual(initialValue);

        const newValue = { foo: 'baz', num: 123 };
        act(() => {
            result.current[1](newValue);
        });

        expect(result.current[0]).toEqual(newValue);
        expect(window.localStorage.setItem).toHaveBeenCalledWith('test-obj', JSON.stringify(newValue));
    });
});
