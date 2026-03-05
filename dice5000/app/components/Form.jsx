'use client';

import { useState } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client/core";

const AddUser = gql`
    mutation($id: String!, $fname: String!, $lname: String!) {
        addUser(id: $id, fname: $fname, lname: $lname) {
            id
            fname
            lname
        }
    }
`;

export default function Form() {
    const [formData, setFormData] = useState({
        id: "",
        fname: "",
        lname: "",
    });
    const [addUser, { data, loading, error }] = useMutation(AddUser);

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value,
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        console.log(formData);
        const res = await addUser({ variables: {id: formData.id, fname: formData.fname, lname: formData.lname} });
        console.log(res);
    }

    return (
        <div>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", width: "200px" }}>
                <input
                    type="text"
                    name="id"
                    placeholder="ID"
                    value={formData.id}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="fname"
                    placeholder="First Name"
                    value={formData.fname}
                    onChange={handleChange}
                />
                <input
                    type="text"
                    name="lname"
                    placeholder="Last Name"
                    value={formData.lname}
                    onChange={handleChange}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Adding..." : "Add User"}
                </button>
            </form>
        </div>
    );
}