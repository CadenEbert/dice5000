'use client';

import { useQuery } from '@apollo/client/react';
import { gql } from '@apollo/client/core';

const GET_USERS = gql`
    query($id: String!) {
        user(id: $id) {
            id
            fname
            lname
        }
    }
`;

export default function Test() {
    const { loading, error, data } = useQuery(GET_USERS, {
        variables: { id: "1" },
    });

    console.log(data)
    if (loading) return <p>Loading...</p>;
    if (error) return <p>Error : {error.message}</p>;

    return (
        <div>
            <p>Test</p>
            <p>First name: {data.user.fname}</p>
            <p>Last name: {data.user.lname}</p>
            <p>ID: {data.user.id}</p>
        </div>
    );
}