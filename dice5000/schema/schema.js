const graphql = require('graphql')
const { GraphQLObjectType, GraphQLString, GraphQLSchema } = graphql

const UserType = new GraphQLObjectType({
    name: 'User',
    fields: {
        id: {type: GraphQLString},
        fname: {type: GraphQLString},
        score: {type: GraphQLString},
        color: {type: GraphQLString}
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
                score: {type: GraphQLString},
                color: {type: GraphQLString}
            },
            resolve(parentValue, args) {
                return {id: args.id, fname: args.fname, color: args.color};
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
                return {id: 1, fname: "Caden", color: "blue"};

            }
        }
    }
})

const schema = new GraphQLSchema({
    query: RootQuery,
    mutation: Mutation
})

module.exports = schema