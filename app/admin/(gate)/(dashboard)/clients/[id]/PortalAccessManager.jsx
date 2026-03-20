'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

import {
    setClientPortalAccessStatusAction,
    upsertClientPortalAccessAction,
} from './portal-actions';

function Badge({ children, tone = 'neutral' }) {
    const toneClass = {
        neutral: 'bg-white/[0.06] text-white/55 border-white/10',
        active: 'bg-emerald-400/10 text-emerald-300 border-emerald-400/20',
        revoked: 'bg-red-400/10 text-red-300 border-red-400/20',
        accent: 'bg-[#5b73ff]/10 text-[#a7b5ff] border-[#5b73ff]/20',
    };

    return (
        <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneClass[tone] || toneClass.neutral}`}>
            {children}
        </span>
    );
}

export default function PortalAccessManager({ clientId, initialMembers = [] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [contactEmail, setContactEmail] = useState('');
    const [portalRole, setPortalRole] = useState('viewer');
    const [memberType, setMemberType] = useState('client_contact');
    const [feedback, setFeedback] = useState(null);

    const members = useMemo(
        () => [...(initialMembers || [])].sort((a, b) => String(a.contact_email).localeCompare(String(b.contact_email))),
        [initialMembers]
    );

    const handleSubmit = (event) => {
        event.preventDefault();
        setFeedback(null);

        startTransition(async () => {
            const result = await upsertClientPortalAccessAction({
                clientId,
                contactEmail,
                portalRole,
                memberType,
            });

            if (result?.error) {
                setFeedback({ type: 'error', message: result.error });
                return;
            }

            setContactEmail('');
            setPortalRole('viewer');
            setMemberType('client_contact');
            setFeedback({ type: 'success', message: 'Acces portail enregistre.' });
            router.refresh();
        });
    };

    const handleStatusChange = (accessId, status) => {
        setFeedback(null);

        startTransition(async () => {
            const result = await setClientPortalAccessStatusAction({
                clientId,
                accessId,
                status,
            });

            if (result?.error) {
                setFeedback({ type: 'error', message: result.error });
                return;
            }

            setFeedback({
                type: 'success',
                message: status === 'active' ? 'Acces reactive.' : 'Acces revoque.',
            });
            router.refresh();
        });
    };

    const inputClass = 'w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-[#5b73ff] focus:ring-1 focus:ring-[#5b73ff]';
    const selectClass = 'w-full rounded-xl border border-white/10 bg-[#161616] px-3 py-2.5 text-sm text-white outline-none transition focus:border-[#5b73ff] focus:ring-1 focus:ring-[#5b73ff]';

    return (
        <section className="rounded-2xl border border-white/10 bg-[#0f0f0f] p-6">
            <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-white">Acces portail client</h2>
                    <p className="mt-1 text-sm text-white/40">
                        Gestion centralisee des viewers du portail lite pour ce client.
                    </p>
                </div>
                <Badge tone="accent">{members.length} acces</Badge>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 grid gap-3 lg:grid-cols-[minmax(0,1.7fr)_minmax(180px,0.7fr)_minmax(190px,0.9fr)_auto]">
                <input
                    type="email"
                    value={contactEmail}
                    onChange={(event) => setContactEmail(event.target.value)}
                    placeholder="client@exemple.com"
                    className={inputClass}
                    required
                />
                <select
                    value={portalRole}
                    onChange={(event) => setPortalRole(event.target.value)}
                    className={selectClass}
                >
                    <option value="viewer">Viewer</option>
                    <option value="owner">Owner</option>
                </select>
                <select
                    value={memberType}
                    onChange={(event) => setMemberType(event.target.value)}
                    className={selectClass}
                >
                    <option value="client_contact">Client contact</option>
                    <option value="client_staff">Client staff</option>
                    <option value="internal_staff">Internal staff</option>
                </select>
                <button
                    type="submit"
                    disabled={isPending}
                    className="rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-black transition hover:bg-[#d6d6d6] disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {isPending ? 'Sauvegarde...' : 'Ajouter'}
                </button>
            </form>

            {feedback && (
                <div
                    className={`mt-4 rounded-xl border px-4 py-3 text-sm ${
                        feedback.type === 'error'
                            ? 'border-red-400/20 bg-red-400/10 text-red-300'
                            : 'border-emerald-400/20 bg-emerald-400/10 text-emerald-300'
                    }`}
                >
                    {feedback.message}
                </div>
            )}

            <div className="mt-6 space-y-3">
                {members.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-black/20 p-5 text-sm text-white/40">
                        Aucun acces portail n est encore configure pour ce client.
                    </div>
                ) : (
                    members.map((member) => (
                        <div
                            key={member.id}
                            className="flex flex-col gap-4 rounded-2xl border border-white/8 bg-white/[0.03] p-4 lg:flex-row lg:items-center lg:justify-between"
                        >
                            <div className="space-y-2">
                                <div className="text-sm font-semibold text-white">{member.contact_email}</div>
                                <div className="flex flex-wrap gap-2">
                                    <Badge tone={member.status === 'active' ? 'active' : 'revoked'}>
                                        {member.status}
                                    </Badge>
                                    <Badge>{member.portal_role}</Badge>
                                    <Badge>{member.member_type}</Badge>
                                    <Badge tone={member.clerk_user_id ? 'accent' : 'neutral'}>
                                        {member.clerk_user_id ? 'Clerk lie' : 'Clerk en attente'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {member.status === 'active' ? (
                                    <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => handleStatusChange(member.id, 'revoked')}
                                        className="rounded-xl border border-red-400/20 bg-red-400/10 px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Revoquer
                                    </button>
                                ) : (
                                    <button
                                        type="button"
                                        disabled={isPending}
                                        onClick={() => handleStatusChange(member.id, 'active')}
                                        className="rounded-xl border border-emerald-400/20 bg-emerald-400/10 px-4 py-2 text-sm font-semibold text-emerald-300 transition hover:bg-emerald-400/15 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        Reactiver
                                    </button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </section>
    );
}
