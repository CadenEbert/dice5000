const graphql = require('graphql')
const { GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: {type: GraphQLString},
        fname: {type: GraphQLString},
        lname: {type: GraphQLString},
    }
})

const Mutation = new GraphQLObjectType({
    name: 'Mutation',
    fields: {
        addUser: {
            type: UserType,
            args: {
                id: {type: GraphQLString},
                fname: {type: GraphQLString},
                lname: {type: GraphQLString},
            },
            resolve(parentValue, args) {
                return {id: args.id, fname: args.fname, lname: args.lname};
            }
        }
    }
})

const RootQuery = new GraphQLObjectType ({
    name: 'RootQueryType',
    fields: {
        user: {
            type: UserType,
            args: {id: {type: GraphQLString}},
            resolve(parentValue, args) {
                return {id: 1, fname: "Caden", lname: "Ebert"};

            }
        }
    }
})

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})

module.exports = schema