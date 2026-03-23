import {useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function AuthComprobation(): JSX.Element {
    const user = localStorage.getItem("username") ?? undefined;
    const navigate = useNavigate();
    useEffect(() => {
            if (user == null) {
                navigate('/');
            } else {
                navigate('/lobby');
            }
        }, [user, navigate]);
    return <></>;
}
