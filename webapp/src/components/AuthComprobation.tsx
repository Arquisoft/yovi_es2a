import {useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function useAuthComprobation(): void {
    const navigate = useNavigate();

    useEffect(() => {
        const user = localStorage.getItem("username");

        if (!user) {
            navigate('/');
        }
    }, [navigate]);
}

export function getLoggedUser(): string | undefined {
    const user = localStorage.getItem("username") ?? undefined;
    return user;
}
