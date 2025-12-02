import React from 'react';
import { Building2, Mail, Phone, Plus, Calendar, Pencil, Trash2, Globe, MoreHorizontal } from 'lucide-react';
import { Contact, Company } from '@/types';
import { StageBadge } from './ContactsStageTabs';

interface ContactsListProps {
    viewMode: 'people' | 'companies';
    filteredContacts: Contact[];
    filteredCompanies: Company[];
    contacts: Contact[]; // Needed for company view avatar grouping
    selectedIds: Set<string>;
    toggleSelect: (id: string) => void;
    toggleSelectAll: () => void;
    getCompanyName: (id: string) => string;
    updateContact: (id: string, data: Partial<Contact>) => void;
    convertContactToDeal: (id: string) => void;
    openEditModal: (contact: Contact) => void;
    setDeleteId: (id: string) => void;
    addToast: (message: string, type: 'success' | 'error' | 'info' | 'warning') => void;
}

export const ContactsList: React.FC<ContactsListProps> = ({
    viewMode,
    filteredContacts,
    filteredCompanies,
    contacts,
    selectedIds,
    toggleSelect,
    toggleSelectAll,
    getCompanyName,
    updateContact,
    convertContactToDeal,
    openEditModal,
    setDeleteId,
    addToast
}) => {
    const allSelected = filteredContacts.length > 0 && selectedIds.size === filteredContacts.length;
    const someSelected = selectedIds.size > 0 && selectedIds.size < filteredContacts.length;
    
    return (
        <div className="glass rounded-xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
                {viewMode === 'people' ? (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="w-12 px-6 py-4">
                                    <input 
                                        type="checkbox" 
                                        checked={allSelected}
                                        ref={(el) => { if (el) el.indeterminate = someSelected; }}
                                        onChange={toggleSelectAll}
                                        className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:bg-white/5 dark:border-white/10" 
                                    />
                                </th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Nome</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Estágio</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Cargo / Empresa</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Contato</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Última Interação</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredContacts.map((contact) => (
                                <tr key={contact.id} className={`hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group ${selectedIds.has(contact.id) ? 'bg-primary-50/50 dark:bg-primary-900/10' : ''}`}>
                                    <td className="px-6 py-4">
                                        <input 
                                            type="checkbox" 
                                            checked={selectedIds.has(contact.id)}
                                            onChange={() => toggleSelect(contact.id)}
                                            className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:bg-white/5 dark:border-white/10" 
                                        />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-900 dark:to-primary-800 text-primary-700 dark:text-primary-200 flex items-center justify-center font-bold text-sm shadow-sm ring-2 ring-white dark:ring-white/5">
                                                {contact.name.charAt(0)}
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-900 dark:text-white block">{contact.name}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StageBadge stage={contact.stage} />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <span className="text-slate-900 dark:text-white font-medium block">{contact.role || 'Cargo não inf.'}</span>
                                            <div className="flex items-center gap-1 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                                                <Building2 size={10} />
                                                <span>{getCompanyName(contact.companyId)}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                                <Mail size={12} /> {contact.email || '---'}
                                            </div>
                                            <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                                <Phone size={12} /> {contact.phone || '---'}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => {
                                                    const nextStatus = contact.status === 'ACTIVE' ? 'INACTIVE' : contact.status === 'INACTIVE' ? 'CHURNED' : 'ACTIVE';
                                                    updateContact(contact.id, { status: nextStatus });
                                                }}
                                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border transition-all ${contact.status === 'ACTIVE' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400 dark:border-green-500/20' :
                                                    contact.status === 'INACTIVE' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20' :
                                                        'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20'
                                                    }`}
                                            >
                                                {contact.status === 'ACTIVE' ? 'ATIVO' : contact.status === 'INACTIVE' ? 'INATIVO' : 'PERDIDO'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    convertContactToDeal(contact.id);
                                                    addToast(`Oportunidade criada para ${contact.name}`, 'success');
                                                }}
                                                className="p-1 text-slate-400 hover:text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition-colors"
                                                title="Criar oportunidade"
                                            >
                                                <Plus size={14} />
                                            </button>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400 text-xs">
                                            <Calendar size={14} className="text-slate-400" />
                                            <span>Hoje</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                                            <button
                                                onClick={() => openEditModal(contact)}
                                                className="p-1.5 text-slate-400 hover:text-primary-500 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded transition-colors"
                                                title="Editar"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => setDeleteId(contact.id)}
                                                className="p-1 hover:bg-red-50 dark:hover:bg-red-900/20 rounded text-slate-400 hover:text-red-500 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50/80 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                            <tr>
                                <th className="w-12 px-6 py-4">
                                    <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:bg-white/5 dark:border-white/10" />
                                </th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Empresa</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Setor</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Criado em</th>
                                <th className="px-6 py-4 font-bold text-slate-700 dark:text-slate-200 font-display text-xs uppercase tracking-wider">Pessoas Vinc.</th>
                                <th className="px-6 py-4"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                            {filteredCompanies.map((company) => (
                                <tr key={company.id} className="hover:bg-slate-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4">
                                        <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500 dark:bg-white/5 dark:border-white/10" />
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-9 h-9 rounded-lg bg-slate-100 dark:bg-white/10 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm">
                                                <Building2 size={18} />
                                            </div>
                                            <div>
                                                <span className="font-semibold text-slate-900 dark:text-white block">{company.name}</span>
                                                {company.website && (
                                                    <a href={`https://${company.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline flex items-center gap-1">
                                                        <Globe size={10} /> {company.website}
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-xs font-medium">
                                            {company.industry || 'Indefinido'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-slate-600 dark:text-slate-400 text-xs">
                                            {new Date(company.createdAt).toLocaleDateString('pt-BR')}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex -space-x-2 overflow-hidden">
                                            {contacts.filter(c => c.companyId === company.id).map(c => (
                                                <div key={c.id} className="h-6 w-6 rounded-full ring-2 ring-white dark:ring-dark-card bg-primary-100 dark:bg-primary-900 flex items-center justify-center text-[10px] font-bold text-primary-700 dark:text-primary-300" title={c.name}>
                                                    {c.name.charAt(0)}
                                                </div>
                                            ))}
                                            {contacts.filter(c => c.companyId === company.id).length === 0 && (
                                                <span className="text-slate-400 text-xs italic">Ninguém</span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <button className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white opacity-0 group-hover:opacity-100 transition-all">
                                            <MoreHorizontal size={16} />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
