'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client/core';

const GET_USER_INFO = gql`
    query($id: String!) {
        user(id: $id) {
            id
            fname
            color
            score
        }
    }
`;

export default function GetUsers() {
    const { loading, error, data } = useQuery(GET_USER_INFO, {
        variables: { id: "1" },
    });

    console.log(data)
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error : {error.message}</p>;

    return (
        <div>
            <p>Get Users</p>
            <p>First name: {data.user.fname}</p>
            <p>Favorite color: {data.user.color}</p>
            <p>Score: {data.user.score}</p>
            <p>ID: {data.user.id}</p>
        </div>
    );
}