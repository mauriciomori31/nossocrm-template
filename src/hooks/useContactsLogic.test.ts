import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContactsLogic } from '@/hooks/useContactsLogic';
import { Contact } from '@/types';

// Mock usePersistedState with proper state handling
let mockContactsState: Contact[] = [];

vi.mock('@/hooks/usePersistedState', () => ({
  usePersistedState: vi.fn(() => {
    const setState = (updater: Contact[] | ((prev: Contact[]) => Contact[])) => {
      mockContactsState = typeof updater === 'function' ? updater(mockContactsState) : updater;
    };
    return [mockContactsState, setState];
  }),
}));

describe('useContactsLogic', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockContactsState = [];
  });

  it('should initialize with contacts array', () => {
    const { result } = renderHook(() => useContactsLogic());
    expect(result.current.contacts).toBeDefined();
    expect(Array.isArray(result.current.contacts)).toBe(true);
  });

  it('should expose addContact function', () => {
    const { result } = renderHook(() => useContactsLogic());
    expect(typeof result.current.addContact).toBe('function');
  });

  it('should expose updateContact function', () => {
    const { result } = renderHook(() => useContactsLogic());
    expect(typeof result.current.updateContact).toBe('function');
  });

  it('should expose deleteContact function', () => {
    const { result } = renderHook(() => useContactsLogic());
    expect(typeof result.current.deleteContact).toBe('function');
  });

  it('should expose setContacts function', () => {
    const { result } = renderHook(() => useContactsLogic());
    expect(typeof result.current.setContacts).toBe('function');
  });

  it('should add a new contact via addContact', () => {
    const { result } = renderHook(() => useContactsLogic());

    const newContact: Contact = {
      id: 'test-contact-1',
      companyId: 'company-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      role: 'Developer',
      status: 'ACTIVE',
      stage: 'LEAD',
      createdAt: new Date().toISOString(),
    };

    act(() => {
      result.current.addContact(newContact);
    });

    // Verify state was updated
    expect(mockContactsState).toHaveLength(1);
    expect(mockContactsState[0]).toEqual(newContact);
  });

  it('should update an existing contact', () => {
    const existingContact: Contact = {
      id: 'test-contact-1',
      companyId: 'company-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      role: 'Developer',
      status: 'ACTIVE',
      stage: 'LEAD',
      createdAt: new Date().toISOString(),
    };
    mockContactsState = [existingContact];

    const { result } = renderHook(() => useContactsLogic());

    act(() => {
      result.current.updateContact('test-contact-1', { name: 'Jane Doe', role: 'Manager' });
    });

    expect(mockContactsState[0].name).toBe('Jane Doe');
    expect(mockContactsState[0].role).toBe('Manager');
    expect(mockContactsState[0].email).toBe('john@example.com'); // Unchanged
  });

  it('should delete a contact by id', () => {
    const contact1: Contact = {
      id: 'contact-1',
      companyId: 'company-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      status: 'ACTIVE',
      stage: 'LEAD',
      createdAt: new Date().toISOString(),
    };
    const contact2: Contact = {
      id: 'contact-2',
      companyId: 'company-1',
      name: 'Jane Doe',
      email: 'jane@example.com',
      phone: '987654321',
      status: 'ACTIVE',
      stage: 'CUSTOMER',
      createdAt: new Date().toISOString(),
    };
    mockContactsState = [contact1, contact2];

    const { result } = renderHook(() => useContactsLogic());

    act(() => {
      result.current.deleteContact('contact-1');
    });

    expect(mockContactsState).toHaveLength(1);
    expect(mockContactsState[0].id).toBe('contact-2');
  });

  it('should not delete contact if id does not exist', () => {
    const contact1: Contact = {
      id: 'contact-1',
      companyId: 'company-1',
      name: 'John Doe',
      email: 'john@example.com',
      phone: '123456789',
      status: 'ACTIVE',
      stage: 'LEAD',
      createdAt: new Date().toISOString(),
    };
    mockContactsState = [contact1];

    const { result } = renderHook(() => useContactsLogic());

    act(() => {
      result.current.deleteContact('non-existent-id');
    });

    expect(mockContactsState).toHaveLength(1);
  });
});
