'use server';

import { createSession, deleteSession } from '@/lib/session';
import { redirect } from 'next/navigation';

export async function loginAction(prevState, formData) {
    const password = formData.get('password');
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminPassword) {
        return { error: "ADMIN_PASSWORD n'est pas configuré sur le serveur." };
    }

    if (password !== adminPassword) {
        // Optionnel : on pourrait ajouter un délai ici pour ralentir le bruteforce
        await new Promise(resolve => setTimeout(resolve, 500));
        return { error: 'Mot de passe incorrect.' };
    }

    // Créer la session JWT sécurisée (HttpOnly)
    await createSession('admin');

    // Rediriger vers l'accueil admin
    redirect('/admin');
}

export async function logoutAction() {
    await deleteSession();
    redirect('/admin/login');
}
