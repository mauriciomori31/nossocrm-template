import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

interface Profile {
    id: string;
    email: string;
    company_id: string;
    role: 'admin' | 'vendedor';
    first_name?: string | null;
    last_name?: string | null;
    nickname?: string | null;
    phone?: string | null;
    avatar_url?: string | null;
    created_at?: string;
}

interface AuthContextType {
    session: Session | null;
    user: User | null;
    profile: Profile | null;
    loading: boolean;
    isInitialized: boolean | null;
    checkInitialization: () => Promise<void>;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [session, setSession] = useState<Session | null>(null);
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isInitialized, setIsInitialized] = useState<boolean | null>(null);

    const checkInitialization = async () => {
        try {
            const { data, error } = await supabase.rpc('is_instance_initialized');
            if (error) throw error;
            setIsInitialized(data);
        } catch (error) {
            console.error('Error checking initialization:', error);
            setIsInitialized(true);
        }
    };

    const fetchProfile = async (userId: string) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error fetching profile:', error);
            } else {
                setProfile(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const refreshProfile = async () => {
        if (user?.id) {
            await fetchProfile(user.id);
        }
    };

    useEffect(() => {
        checkInitialization();

        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            if (session?.user) {
                fetchProfile(session.user.id);
            } else {
                setProfile(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const signOut = async () => {
        await supabase.auth.signOut();
        setProfile(null);
        setUser(null);
        setSession(null);
    };

    const value = {
        session,
        user,
        profile,
        loading,
        isInitialized,
        checkInitialization,
        signOut,
        refreshProfile,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
